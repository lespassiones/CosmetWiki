/**
 * lib/ai/personalInsights.ts — 3 encarts PERSONNALISÉS (objectifs / peau / à
 * surveiller) à partir d'une analyse INCI + du profil de l'utilisateur.
 * Port web de supabase/functions/personal-insights/lib.ts (mobile) — MÊME
 * prompt (version partagée) pour une parité de contenu mobile/web.
 *
 * Sortie : JSON STRICT { goals, skin, watch }, chaque bloc =
 *   { title: string, description: string, tone: "vert"|"ambre"|"rouge"|"neutre" }
 * Dégrade gracieusement : sans clé IA → renvoie null.
 *
 * RÈGLE DE CONCENTRATION (juil 2026, parité mobile) : l'ordre INCI reflète la
 * dose. Le bloc goals recevait la liste des verts SANS position → il couronnait
 * l'ingrédient le plus CÉLÈBRE (ex. huile de coco) au lieu du plus DOSÉ. On
 * passe désormais le rang [#N INCI] et on impose de privilégier / regrouper les
 * actifs les plus concentrés.
 */
import crypto from "node:crypto";
import { AI_MODEL, callWithFallback, getCached, hasMistral, hasOpenAI, openai, setCached } from "./client";
import { stripLongDashes } from "./sanitize";
import {
  AGAINST_MAX,
  buildCompatLines,
  composeCompatScore,
  majorityByIngredient,
  negativeSubtitle,
  type CompatBreakdown,
  type CompatTone,
} from "./compat";
import type { ColorRating } from "@/lib/supabase";

export type Tone = "vert" | "ambre" | "rouge" | "neutre";
export type Block = { title: string; description: string; tone: Tone };
export type PersonalBlocks = { goals: Block; skin: Block; watch: Block };

// Score de compatibilité (juil 2026) — logique PURE dans ./compat.
export type CompatibilityRelevance = "personal" | "product_only";
export type Compatibility = {
  score: number; // 0-100, entier
  label: string; // 1 des 10 paliers (dérivé du score → déterministe)
  tone: CompatTone;
  subtitle: string;
  relevance: CompatibilityRelevance;
  /** Détail affichable (base qualité + lignes signées). Absent sur l'ancien persisté. */
  breakdown?: CompatBreakdown;
};
export type PersonalResult = { blocks: PersonalBlocks; compatibility: Compatibility | null };

// Sortie IA v21 : des CONTRIBUTEURS (ingrédients verts OU jaunes qui servent le
// profil, sans distinction de couleur : un jaune bénéfique compte comme un vert)
// et des contre-indications ; aucun chiffre (le code calcule tout).
type RawContributor = { ingredient: string; need: string };
type RawAgainst = { ingredient: string; need: string };
type RawCompat = {
  contributors: RawContributor[];
  against: RawAgainst[];
  subtitle: string;
  relevance: CompatibilityRelevance;
};

/** MÊME numéro que le mobile. v21 : bonus tout actif utile (vert OU jaune), plus
 *  de malus « jaune sans lien », concept neutralYellows supprimé.
 *  v22 : fix affichage « Plafond : 0 orange » (clamp 100% ≠ plafond couleur).
 *  v23 : fix score — plafond 100 AVANT restrictions (le bonus > 100 n'absorbe
 *  plus le malus : 100% + 1 restriction = 92, plus 100).
 *  v24 : against 2 -> 7 + balayage profil + base de connaissances risques ;
 *  suppression du plancher qualité (les contre-indications font baisser).
 *  v25 : filets déterministes étendus (allergènes parfum/comédogènes/sulfates),
 *  prioritaires sur l'IA + anti-contradiction actif/à-éviter. */
/** v26 : tout produit personnalisé dès que le profil est rempli ; product_only = profil vide uniquement.
 *  v27 : « sensibilités probables » injectées comme indices against (jamais -8). */
// v28 : fix calcul anti-double-comptage insensible aux accents (Diméthicone
// silicone n'est plus pénalisé -5 ET -8). Cache-buster → régénération gratuite.
// v29 : produits HORS PROFIL (dentifrice, déo… axe "none") → le score redevient
// la QUALITÉ de la formule (0 bonus/malus IA), MAIS le détail du calcul liste
// quand même les bons actifs (utiles de manière GLOBALE) et les points à
// surveiller, à 0 point (informatif). Demande user 16 juil 2026.
// v30 : sensibilités DÉDUITES du profil détectées dans le produit → MÊME -8
// qu'une restriction cochée (« X : sensibilité de ton profil »), dédoublonnées
// par slug (jamais -8 deux fois). Demande user 16 juil 2026.
// v31 : produits HORS PROFIL → le POSITIF est porté par les 3 blocs IA, PAS par
// une liste d'actifs dans le calcul du score (décision user 16 juil 2026 après
// discussion : filet déterministe trop crude, l'IA juge mieux). Le bloc goals
// NOMME les vrais atouts d'une bonne formule (4-5★) ; contributors/against
// ignorés en product_only (le calcul du score reste = qualité).
export const PERSONAL_PROMPT_VERSION = 31;

export type RestrictionMatchLite = {
  inciName: string;
  label: string;
  position?: number;
  kind?: string;
  slug?: string;
};

export type PersonalInput = {
  enriched: {
    input_raw: string;
    name: string | null;
    color_rating: ColorRating | null;
    primary_function: string | null;
    tags: string[] | null;
    /** Index 0-based dans la liste INCI (position - 1). #N = position_idx + 1. */
    position_idx: number;
    restriction_reason?: string | null;
  }[];
  counts: Record<string, number>;
  score: number;
  scoreLabel: string;
  /** Ton de la note globale ("green" | "orange" | "red") — empêche un goals
   *  « moyenne » sur un produit pourtant bien noté. */
  scoreTone?: string | null;
  productLabel: string | null;
  category?: string | null;
  userId?: string | null;
  profileBlock?: string | null;
  restrictionsBlock?: string | null;
  restrictionMatches: RestrictionMatchLite[];
  /** Familles DÉDUITES du profil (worker d'inférence) détectées dans le produit.
   *  N'entrent PAS dans le prompt : servent au SCORING (-8 comme une restriction
   *  cochée, dédoublonnées par slug). Cf. enforceCompatibility. */
  inferredRestrictionMatches?: RestrictionMatchLite[];
  /** Produit HORS PROFIL (axe "none" : dentifrice, déo…) OU profil vide —
   *  déterminé serveur. Score = qualité de la formule ; les contributors/
   *  against restent listés par l'IA mais valent 0 point (informatif, v29). */
  productOnly?: boolean;
  /** Contre-indications GARANTIES par le code (alcool asséchant, allergie
   *  texte libre) — fusionnées avec celles de l'IA, mêmes -5. */
  forcedAgainst?: { name: string; need: string }[];
};

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export function makePersonalCacheKey(input: PersonalInput): string {
  const list = input.enriched
    .map((r) => `${(r.name ?? r.input_raw).trim().toUpperCase()}:${r.color_rating ?? "?"}${r.restriction_reason ? ":R" : ""}`)
    .join("|");
  const profileKey = input.profileBlock ? `|prof=${sha(input.profileBlock).slice(0, 12)}` : "";
  const resKey = input.restrictionsBlock ? `|res=${sha(input.restrictionsBlock).slice(0, 12)}` : "";
  return `personal-insights:${sha(`${list}${profileKey}${resKey}|v=${PERSONAL_PROMPT_VERSION}`).slice(0, 32)}`;
}

/** Clé profil persistée sur la ligne (régénère si le profil change). */
export function profileSignature(profileBlock: string | null, restrictionsBlock: string | null): string {
  const p = profileBlock ? sha(profileBlock) : "noprofile";
  const r = restrictionsBlock ? sha(restrictionsBlock) : "norestr";
  return `v${PERSONAL_PROMPT_VERSION}:${p.slice(0, 12)}:${r.slice(0, 12)}`;
}

export function buildPrompt(input: PersonalInput): { system: string; user: string } {
  // Verts triés par ordre INCI (position croissante = dose décroissante).
  const greens = input.enriched
    .filter((r) => r.color_rating === "Vert" && r.name && r.primary_function)
    .slice()
    .sort((a, b) => a.position_idx - b.position_idx);
  // Les JAUNES portent une pénalité LÉGÈRE mais sont SOUVENT les actifs clés
  // (ex : acide salicylique). Ils étaient absents du prompt → l'IA ne pouvait
  // pas les citer ni les relier au profil. On les expose désormais.
  const yellows = input.enriched.filter((r) => r.color_rating === "Jaune" && r.name);
  const oranges = input.enriched.filter((r) => r.color_rating === "Orange");
  const reds = input.enriched.filter((r) => r.color_rating === "Rouge");
  const hasProfile = Boolean(input.profileBlock);
  const matched = input.restrictionMatches;

  const fmt = (r: PersonalInput["enriched"][number]) =>
    `- ${r.name ?? r.input_raw}${r.primary_function ? ` (${r.primary_function})` : ""}`
    + `${typeof r.position_idx === "number" ? ` [#${r.position_idx + 1} INCI]` : ""}`
    + `${r.restriction_reason ? ` [restriction: ${r.restriction_reason}]` : ""}`;

  const system = [
    "Tu es l'expert beauté de l'app : une référence qui SAIT et qui TRANCHE. Tu PARLES DIRECTEMENT à UNE personne en la TUTOYANT, comme un conseiller en face d'elle. Tu génères 3 encarts courts et factuels à partir d'une analyse INCI, du TYPE de produit et du profil.",
    "Réponds UNIQUEMENT en JSON strict, sans texte autour :",
    `{"compatibility":{"contributors":[{"ingredient":"","need":""}],"against":[{"ingredient":"","need":""}],"subtitle":"","relevance":"personal|product_only"},"goals":{"title":"","description":"","tone":""},"skin":{"title":"","description":"","tone":""},"watch":{"title":"","description":"","tone":""}}`,
    "Chaque bloc goals/skin/watch DOIT avoir les 3 champs NON VIDES : title (≤ 42 caractères), description (≤ 150 caractères, 1 phrase nette) ET tone (parmi \"vert\"|\"ambre\"|\"rouge\"|\"neutre\"). Ne jamais omettre tone ni description, même pour \"Rien à surveiller\" (alors tone=\"vert\").",
    "Le bloc compatibility DOIT avoir : contributors (tableau), against (tableau), relevance (\"personal\" ou \"product_only\") ET subtitle NON VIDE.",
    "",
    "ÉTAPE 1 - PERTINENCE (décide AVANT d'écrire). Le produit concerne-t-il RÉELLEMENT un élément du profil (un objectif, une préoccupation, le type de peau, une allergie/restriction, ou les cheveux SI le profil en parle) ?",
    "- Un après-shampooing / soin cheveux n'est PERTINENT que si le profil parle de cheveux.",
    "- Un produit bucco-dentaire (dentifrice, bain de bouche) n'est PERTINENT que si le profil parle de bouche/dents.",
    "- Un soin visage/corps n'est PERTINENT que s'il touche un objectif, une préoccupation ou le type de peau du profil.",
    "- Une allergie/restriction qui matche un ingrédient est TOUJOURS un lien pertinent (bloc watch).",
    "Si AUCUN lien, ou si le profil est VIDE → le produit est NON PERTINENT pour la personnalisation.",
    "",
    "CONCENTRATION (ordre INCI) - RÈGLE IMPÉRATIVE quand tu choisis quel ingrédient mettre en avant :",
    "- Chaque ingrédient porte son rang [#N INCI] : 1 = le plus concentré. L'ordre légal INCI va du plus dosé au moins dosé (au moins jusqu'aux ingrédients à ~1%).",
    "- Quand PLUSIEURS actifs verts servent le MÊME besoin (ex : plusieurs huiles ou beurres végétaux nourrissants pour des cheveux secs, plusieurs agents hydratants), METS EN AVANT le(s) plus concentré(s) (plus petit #N) OU REGROUPE-les en une formulation collective (ex : « un cocktail d'huiles végétales nourrissantes : tournesol, avocat, coco »).",
    "- N'ÉLÈVE JAMAIS au rang de héros un ingrédient à #N élevé (bas de liste, donc peu dosé) juste parce qu'il est célèbre (ex : huile de coco) alors que des ingrédients au bénéfice ÉQUIVALENT sont placés plus haut dans la liste. Un nom connu ne remplace pas la concentration.",
    "- Si tu ne cites qu'UN seul ingrédient d'une même famille, prends celui au plus petit #N.",
    "",
    "IMPORTANT : les 2 premiers blocs ont des RÔLES DIFFÉRENTS, ne raconte JAMAIS la même chose dans les deux.",
    "- goals = LE BLOC « POUR TOI » : est-ce que ce produit correspond à TA situation (tes objectifs, tes préoccupations, ta peau) ? C'est le SEUL bloc personnalisé.",
    "- skin = LE BLOC « À QUOI ÇA SERT » : bloc PÉDAGOGIQUE qui S'ADRESSE À TOI (tutoiement) mais parle du PRODUIT et de son usage réel, SANS prétendre connaître ton profil (voir sa section dédiée plus bas).",
    "",
    "MODE A - PERTINENT : personnalise le bloc goals (le bloc skin, lui, reste TOUJOURS objectif).",
    "- goals = TON BLOC VEDETTE : personnalisé, VALORISANT et ENGAGEANT. Relie un ACTIF RÉEL de la formule à CE QUE LA PERSONNE VEUT (son objectif, sa préoccupation, son type de peau) et dis-lui clairement que le produit lui correspond. Cite l'actif par son nom grand public.",
    "- PRIORITÉ : si un actif présent À DOSE RÉELLE (petit #N, pas en fin de liste, pas tagué « conservateur ») adresse DIRECTEMENT une préoccupation/un objectif déclaré (ex : niacinamide -> teint terne/pores ; acide hyaluronique -> hydratation ; rétinol -> rides), METS CET ACTIF-LÀ EN AVANT, même si l'ingrédient vedette marketing (ex : « chanvre », « superfood ») met autre chose en avant. La préoccupation de la personne prime sur le storytelling, MAIS l'honnêteté prime sur tout : ne relie un actif à un besoin que s'il est vraiment là pour ça, et à une dose crédible (cf. règle CONCENTRATION).",
    "- MODÈLE À SUIVRE (ton, structure, chaleur) : « Ce sérum cible tes boutons et tes imperfections grâce à l'acide salicylique, adapté à ta peau grasse. » -> [actif] + [objectif/préoccupation EXACT du profil] + [type de peau si pertinent], le tout en te tutoyant.",
    "- Nomme l'objectif/la préoccupation EXACTS tels qu'ils sont dans le profil (si le profil parle d'acné/boutons, dis « tes boutons » ; s'il parle d'hydratation, dis « ton objectif hydratation »). Si un objectif n'est PAS servi, tu peux le dire aussi (« ne cible pas tes rides »), mais PRIVILÉGIE ce que le produit APPORTE.",
    "- N'invente AUCUN lien : un actif ne se relie à un objectif que si le lien est RÉEL et connu (ex : acide salicylique -> imperfections/boutons/peau grasse ; acide hyaluronique -> hydratation ; niacinamide -> teint/pores).",
    "- N'ATTRIBUE À LA PERSONNE QUE les caractéristiques EXACTES de son profil (type de peau visage/corps, préoccupations, objectifs DÉCLARÉS). INTERDIT d'inventer un attribut non déclaré : ne dis pas « peau sensible », « peau sèche », « peau mature » si ce n'est pas écrit. Recopie les termes du profil, ne les enrichis pas.",
    "- Ne survends PAS un ingrédient présent à dose de conservateur/trace comme s'il était l'actif principal : si un actif connu (ex : acide salicylique) est en FIN de liste INCI (grand #N) ou tagué « conservateur », NE le présente PAS comme un traitement (« cible tes boutons ») ; privilégie le/les vrai(s) actif(s) vedette(s) de la formule.",
    "",
    "MODE B - NON PERTINENT (aucun lien, ou profil vide) : dans le bloc goals, tu TUTOIES la personne MAIS tu ne PRÉTENDS PAS connaître son profil. INTERDIT de prétendre qu'un objectif/une peau la concerne (« répond à ton objectif », « adapté à ta peau grasse », « cible tes imperfections » alors que RIEN n'est déclaré = FAUX). Tu juges le PRODUIT EN LUI-MÊME, mais tu peux t'adresser à elle :",
    "- goals → QUALITÉ DE LA FORMULE, RIEN d'autre : juge la formule sur ses ingrédients réels (actifs notables, douceur, simplicité, défauts). Titre 100% centré PRODUIT, ex : « Bonne formule lavante », « Formule correcte », « Formule très basique ». Ne mentionne JAMAIS un objectif/une préoccupation/la peau qui ne serait pas déclaré. tone vert si bonne, ambre si moyenne, rouge si pauvre.",
    "  IMPORTANT (profil vide) : tu ne connais AUCUN objectif de la personne. Le TITRE décrit l'ACTION comme une PROPRIÉTÉ DU PRODUIT (ex : « Régule le sébum », « Nettoie en douceur »). La DESCRIPTION, elle, TE parle (ex : « Tu profites d'agents absorbants qui aident à contrôler l'excès de sébum », « Compte sur ses agents lavants doux pour nettoyer sans décaper »). Jamais « répond à ton objectif ».",
    "  NOMME LES VRAIS ATOUTS (impératif pour une BONNE formule, note verte / 4-5 étoiles) : ne te contente JAMAIS de « bonne qualité avec des agents naturels » (vague, sans valeur). CITE concrètement ce qui rend CE produit bon : les 1-3 ingrédients/actifs REMARQUABLES réellement présents (par leur nom grand public s'il est connu — argile, menthe, aloe vera, huile de coco, glycérine, zinc… — sinon par leur fonction — agent nettoyant doux, agent apaisant, antiplaque), et ce qu'ils apportent. Ex dentifrice : « Compte sur son argile et sa menthe pour un nettoyage doux et une haleine fraîche. » Ex gel douche : « Ses agents lavants doux et sa glycérine nettoient sans dessécher ta peau. » Reste factuel, sans survente, respecte la règle CONCENTRATION (privilégie les plus dosés).",
    "",
    "BLOC skin - « À QUOI SERT CE PRODUIT » (bloc PÉDAGOGIQUE, TOUJOURS objectif, mode A comme mode B) :",
    "- Ce bloc n'est PAS de la personnalisation, MAIS il TE parle (tutoiement, registre CONSEIL/USAGE) : « Utilise-la pour… », « Sers-t'en si tu veux… », « Garde à l'esprit que… », « Compte sur … pour… ». Tu NE PRÉTENDS PAS que ça correspond à TON profil (pas de « répond à ton objectif », pas d'attribut de peau non déclaré) : tu dis à quoi ça sert EN GÉNÉRAL, en t'adressant à la personne.",
    "- Fais-lui APPRENDRE quelque chose d'UTILE et de CONCRET : à QUOI ce produit sert vraiment et ce qu'il est RECONNU pour aider ou réduire, à partir de sa nature (type de produit) et de ses actifs notables (respecte la règle CONCENTRATION : cite d'abord les plus dosés, ou parle des actifs collectivement).",
    "- Vise un fait que l'utilisateur n'aurait pas deviné seul (l'usage réel, ce que l'actif phare adresse), PAS une paraphrase de la note ou du bloc goals.",
    "- Ex crème corps riche : « Utilise-la pour apaiser les tiraillements et les démangeaisons des peaux très sèches ». Ex après-shampooing : « Sers-t'en pour démêler et adoucir la fibre capillaire ». Ex sérum niacinamide : « Compte sur elle pour resserrer l'aspect des pores et unifier le teint ».",
    "- Reste FACTUEL et documenté (pas de promesse de soin type « soigne/guérit », pas de survente). tone neutre ou vert.",
    "- NE RÉPÈTE PAS le bloc goals : goals répond à « est-ce que ça ME correspond », skin répond à « à quoi ça sert en général ». Angle ET phrase OBLIGATOIREMENT différents des deux blocs.",
    "",
    "BLOC watch (TOUJOURS, mode A ou B) : ingrédients à surveiller. REGARDE les Comptes (Orange=, Rouge=) fournis.",
    "- Si Orange >= 1 OU Rouge >= 1 OU une restriction matche, tu DOIS le signaler en nommant la CATÉGORIE concernée (ex : « parfum », « conservateurs », « alcool », « agents lavants »). INTERDIT ABSOLU d'écrire « Rien à surveiller » dans ce cas, c'est une FAUTE.",
    "- tone du watch : ROUGE dès qu'il y a au moins un Rouge OU une restriction de la personne dans « À SIGNALER » (une restriction = alerte rouge, MÊME si l'ingrédient n'est qu'orange) ; AMBRE seulement s'il n'y a QUE des oranges et AUCUNE restriction ; vert UNIQUEMENT si Orange=0, Rouge=0 ET 0 restriction (alors title « Rien à surveiller »).",
    "",
    "BLOC compatibility - CONTRIBUTEURS PROFIL (tu ne donnes AUCUN chiffre : le système compte +2 par ingrédient UTILE listé, VERT OU JAUNE, et -5 par contre-indication). IMPORTANT : un ingrédient neutre/technique SANS lien avec le profil n'est PLUS pénalisé, ne le liste NULLE PART.",
    "- relevance : \"personal\" si le produit est PERTINENT pour le profil (MODE A) ; \"product_only\" s'il ne l'est pas OU si le profil est vide (MODE B).",
    "- contributors (0 à 10) : les ingrédients (VERTS OU JAUNES) de la formule qui APPORTENT réellement quelque chose au profil déclaré (objectif, préoccupation, type de peau/cheveux). La COULEUR n'a pas d'importance : un JAUNE bénéfique (ex : acide salicylique pour l'acné, un agent apaisant, un antipelliculaire) compte EXACTEMENT comme un vert et reçoit le même bonus. Sois GÉNÉREUX mais honnête : un humectant sert « ton objectif hydratation », un agent apaisant sert « ta peau sensible », un antipelliculaire sert « tes pellicules », un agent lavant doux sert « ton cuir chevelu sensible »… Ne laisse pas la liste vide si des ingrédients servent VRAIMENT le profil.",
    "  · ingredient : nom GRAND PUBLIC (jamais INCI). need : le besoin EXACT du profil servi, tutoyé et court.",
    "  · N'y mets QUE des ingrédients réellement UTILES au profil. Un ingrédient purement TECHNIQUE et sans lien (conservateur, régulateur de pH, épaississant, sel, émulsifiant… qui ne sert AUCUN besoin déclaré) n'est NI un contributeur NI une contre-indication : ne le liste pas du tout, il n'aura ni bonus ni malus.",
    "  · PRIORITÉ DE ZONE : cite d'abord les besoins de la MÊME zone que le produit (produit capillaire -> besoins CHEVEUX du profil en premier ; soin visage -> besoins VISAGE ; soin corps -> besoins CORPS). Le subtitle reflète le besoin le plus fort de CETTE zone (ex : shampooing antipelliculaire + pellicules déclarées -> parle des pellicules, pas d'hydratation).",
    "- against (0 à 7) : C'EST LE CŒUR DE TON RÔLE. Beaucoup d'utilisateurs connaissent leur problème ou leur objectif mais PAS la cause : à toi de faire le lien. Liste les ingrédients de la formule (n'importe quelle couleur) qui NE CONVIENNENT PAS à CETTE personne, l'AGGRAVENT, ou CONTREDISENT un élément de son profil.",
    "  · MÉTHODE OBLIGATOIRE (BALAYAGE) : passe en revue CHAQUE élément du profil un par un (type de peau visage, type de peau corps, CHAQUE préoccupation, CHAQUE objectif, cheveux si renseignés). Pour chacun, demande-toi : « quel(s) ingrédient(s) présent(s) dans CETTE formule aggrave(nt) ou contredi(sen)t cet élément ? ». Chaque ingrédient trouvé va dans against.",
    "  · {ingredient, need} : need = l'élément EXACT du profil concerné, tutoyé (ex « ta peau sensible », « tes boutons », « ton objectif hydratation »). JAMAIS une action (pas de « éviter les irritations »), JAMAIS le mot « restriction ».",
    "  · N'EN INVENTE AUCUN pour remplir : un ingrédient n'entre QUE si le lien de nuisance est RÉEL et reconnu. 1 vrai vaut mieux que 5 douteux. Le maximum est 7 mais ce N'EST PAS un quota : n'atteins jamais 7 artificiellement, mets-en 0 si rien ne pose problème.",
    "  · BASE DE CONNAISSANCES (cas fréquents, complète avec ta connaissance dermato) :",
    "    · Peau grasse / acné / imperfections / points noirs / objectif anti-boutons -> COMÉDOGÈNES : huile de coco, beurre de cacao, myristate d'isopropyle, palmitate d'isopropyle, huile de germe de blé, huile de lin, lanoline, huiles minérales occlusives, cires épaisses, laurate de sorbitane.",
    "    · Peau sensible / réactive / rougeurs / couperose -> ALLERGÈNES DE PARFUM (parfum/fragrance, limonène, linalool, citronellol, géraniol, coumarine, eugénol, cinnamal, hexyl cinnamal, benzyl salicylate, alpha-isomethyl ionone), HUILES ESSENTIELLES (menthe, agrumes, eucalyptus, lavande, cannelle, girofle), ALCOOL dénaturé, menthol, camphre.",
    "    · Peau sèche / très sèche / tiraillements -> ALCOOL asséchant (alcohol denat, SD alcohol), SULFATES agressifs (sodium lauryl sulfate, sodium laureth sulfate), astringents.",
    "    · Eczéma / dermatite / peau atopique -> parfum et allergènes, SULFATES (SLS), conservateurs sensibilisants (méthylisothiazolinone, méthylchloroisothiazolinone), huiles essentielles.",
    "    · Cuir chevelu sensible / pellicules -> SULFATES, parfum, alcool asséchant.",
    "    · Cheveux colorés / objectif tenue de couleur -> SULFATES (délavent la couleur).",
    "    · Objectif hydratation ou peau qui tiraille -> ALCOOL asséchant et SULFATES (effet inverse de l'objectif).",
    "    · Objectif apaiser / réduire les rougeurs -> parfum, alcool, huiles essentielles (les aggravent).",
    "  · DEUX CAS TOUJOURS OBLIGATOIRES : (a) une ALLERGIE déclarée (même en texte libre, ex « allergique au parfum ») à un ingrédient PRÉSENT -> against (need = « ton allergie à … ») ; (b) un ALCOOL asséchant (Alcohol, Alcohol Denat) avec peau sèche OU sensible déclarée -> against.",
    "  · Si le profil liste des « Sensibilités probables » (déduites automatiquement, non confirmées) : utilise-les comme INDICES SUPPLÉMENTAIRES pour against quand l'ingrédient correspondant est PRÉSENT dans la formule. Ce ne sont PAS des restrictions cochées : ne les mentionne jamais comme « ta restriction ».",
    "- Ne mets JAMAIS une restriction déclarée dans against : le système la pénalise séparément (-8 chacune) ; toi tu la mentionnes dans watch et éventuellement subtitle.",
    input.productOnly
      ? "- MODE HORS PROFIL (décision SYSTÈME : ce produit ne relève pas des axes du profil, ou le profil est vide). Le score = la QUALITÉ de la formule et ne bouge pas ; contributors et against NE SONT PAS utilisés (laisse-les vides []). Le positif comme le négatif du produit se disent dans les 3 BLOCS goals/skin/watch : le bloc goals NOMME concrètement les vrais atouts d'une bonne formule (cf. sa consigne « NOMME LES VRAIS ATOUTS ») et le bloc watch signale ce qu'il y a à surveiller."
      : "- IMPORTANT : contributors et against couvrent TOUT le profil (le MODE A/B ci-dessus ne gouverne que les blocs goals/skin/watch) : BALAYE chaque élément du profil et liste les liens RÉELS trouvés dans la formule.",
    "- subtitle : phrase COURTE (≤ 60 caractères) affichée sous le score. Tutoiement, langage grand public, AUCUN nom INCI, commence en MINUSCULE, sans point final. MODE personal : dis le lien le PLUS FORT de la zone du produit (ex « répond à tes pellicules ») ou l'alerte dominante (ex « contient un parfum que tu évites »). MODE product_only : décris la formule OBJECTIVEMENT (ex « bonne formule lavante douce ») ; INTERDIT d'utiliser « ton/ta/tes » (aucun besoin personnel : le profil ne s'applique pas à ce produit).",
    "",
    "COHÉRENCE COULEURS (impératif, EN MODE A COMME EN MODE B) : le tone du bloc goals DOIT refléter les pastilles, jamais les contredire.",
    "- 0 orange et 0 rouge : goals peut être positif (tone vert).",
    "- 1 ou 2 oranges (0 rouge) : tone AMBRE maximum. INTERDIT « bonne/correcte/très bonne formule ». Dis « Formule moyenne ».",
    "- 3 oranges et plus, OU au moins 1 rouge : tone ROUGE.",
    "- EN MODE A : même si le produit cible ton objectif, le tone de goals NE PEUT PAS être vert s'il y a des oranges/rouges. Dis le double constat, ex : « Cible l'hydratation mais formule pénalisée par un conservateur à risque » (tone rouge).",
    "- Ne dis JAMAIS « correcte/bonne » ni « rien à surveiller » pour une formule contenant des oranges/rouges.",
    "- INVERSEMENT (impératif) : si la NOTE GLOBALE est BONNE (verte) ET qu'il n'y a NI orange NI rouge, n'écris JAMAIS « formule moyenne / correcte sans plus / basique / décevante » dans goals. C'est une BONNE formule : valorise-la (tone vert). Un simple ingrédient JAUNE (pénalité légère) ne rend PAS une formule « moyenne ».",
    "",
    "RÈGLES GLOBALES :",
    "- TON VALORISANT (impératif goals) : quand le produit correspond vraiment à la personne, sois POSITIF, chaleureux et ENGAGEANT ; mets en avant ce qu'il lui APPORTE. La valorisation s'appuie TOUJOURS sur un actif/fait RÉEL (jamais de flatterie vide, jamais de superlatif interdit).",
    "- TUTOIEMENT VIVANT (les 3 DESCRIPTIONS, impératif) : chaque description S'ADRESSE à la personne en la tutoyant (impératif « utilise-la », « retiens », « compte sur », « garde à l'esprit », « sers-t'en », ou « tu »). BANNIS le ton fiche produit qui ne parle à personne (« Contient… », « Formule qui… », « Adaptée pour… » sans sujet) : reformule en t'adressant à elle. Le TITRE peut rester un label court ; la DESCRIPTION, elle, TE parle. Attention : tutoyer n'autorise PAS à inventer un attribut du profil (voir MODE B / bloc skin).",
    "- LANGAGE GRAND PUBLIC (impératif, TOUS les blocs) : n'écris JAMAIS de nom INCI/scientifique. INTERDITS (exemples) : « Glyceryl Oleate », « PCA », « Cetearyl Alcohol », « Behentrimonium », « Phenoxyethanol », « Methylparaben », « Methylisothiazolinone », « Sodium Laureth Sulfate », « Panthenol », « Tocopherol », « Dimethicone ». À la place, CATÉGORIES simples : « émollients », « agents adoucissants », « conservateur » (et « (parabène) » si c'en est un), « parfum », « agents lavants », « alcool », « huiles végétales », « agent réparateur ». RÉÉCRIS systématiquement : un parabène → « un conservateur (parabène) » ; un sulfate (…Sulfate) → « un agent lavant sulfaté » ; panthénol → « agent apaisant » ; tocophérol → « vitamine E » ; diméthicone → « silicone ». Tu peux nommer un ingrédient SEULEMENT s'il est connu du grand public (Aloe Vera, beurre de karité, huile d'argan, huile de tournesol, huile d'avocat, huile de coco, huile de ricin, beurre de mangue, beurre de cacao, glycérine, acide hyaluronique, niacinamide, acide salicylique, rétinol, vitamine C, vitamine E, caféine, zinc, acide glycolique). Décris les fonctions en mots simples (adoucit, hydrate, nettoie, conserve, parfume).",
    "- AFFIRMATIF : tu donnes le verdict, tu ne renvoies JAMAIS la décision à l'utilisateur. INTERDIT : « à tester », « teste », « à voir », « vois par toi-même », « peut-être », « il se pourrait », « il faudrait essayer ».",
    "- PAS DE SURVENTE : INTERDIT les mots « idéal », « idéale », « parfait », « parfaite », « incontournable », « le meilleur », « la meilleure », et toute flatterie vague. Dis plutôt « adapté », « correct », « bon pour ». Chaque phrase s'appuie sur un ingrédient/fait réel.",
    "- Pas d'emoji, pas de jargon médical, pas de promesse de soin (« soigne/traite/guérit/répare » interdits → « hydrate/adoucit/nettoie/protège »). AUCUN tiret cadratin (—) ni demi-cadratin (–) : virgule ou deux-points.",
    hasProfile ? `PROFIL DE LA PERSONNE :\n${input.profileBlock}` : "PROFIL : vide / non renseigné → MODE B obligatoire.",
    input.restrictionsBlock ? `RESTRICTIONS DÉCLARÉES : ${input.restrictionsBlock}` : "",
  ].filter(Boolean).join("\n");

  const watchHints = [...new Set([...oranges, ...reds].map((r) => r.primary_function).filter(Boolean))];
  const restrictionHints = [...new Set(matched.map((m) => m.label).filter(Boolean))];
  const toSignal = [...restrictionHints, ...watchHints];

  const user = [
    `Produit : ${input.productLabel ?? "(liste collée, sans nom)"}`,
    `Type de produit : ${input.category ?? "non précisé"} (sers-t'en pour juger la PERTINENCE peau).`,
    `Note globale : ${input.score.toFixed(1)}/20 (${input.scoreLabel})${input.scoreTone ? `, ton ${input.scoreTone === "green" ? "VERT (bonne formule)" : input.scoreTone === "orange" ? "ORANGE (moyenne)" : input.scoreTone === "red" ? "ROUGE (faible)" : input.scoreTone}` : ""}.`,
    `Comptes : Vert=${input.counts.Vert ?? 0}, Jaune=${input.counts.Jaune ?? 0}, Orange=${input.counts.Orange ?? 0}, Rouge=${input.counts.Rouge ?? 0}.`,
    `À SIGNALER OBLIGATOIREMENT dans le bloc watch (en CATÉGORIES grand public, jamais de nom scientifique) : ${toSignal.length ? toSignal.join(", ") : "RIEN (0 orange, 0 rouge, 0 restriction) → watch vert « Rien à surveiller »"}`,
    "Les noms d'ingrédients ci-dessous sont en INCI : NE LES RECOPIE JAMAIS, traduis-les en catégorie grand public. Le [#N INCI] indique la position (1 = le plus concentré) : sers-t'en pour appliquer la règle CONCENTRATION.",
    "",
    `Ingrédients de TES restrictions présents dans la formule : ${matched.length ? matched.map((m) => `${m.inciName} (${m.label})`).join(", ") : "AUCUN"}`,
    "",
    "Actifs VERTS notables, triés par concentration (plus petit #N = plus dosé) :",
    greens.length ? greens.slice(0, 10).map(fmt).join("\n") : "(aucun avec fonction connue)",
    "",
    "Actifs JAUNES (pénalité LÉGÈRE, mais souvent des ACTIFS CLÉS - CITE-les dans goals s'ils touchent le profil) :",
    yellows.length ? yellows.slice(0, 8).map(fmt).join("\n") : "(aucun)",
    "",
    "ORANGES :",
    oranges.length ? oranges.slice(0, 8).map(fmt).join("\n") : "(aucun)",
    "",
    "ROUGES :",
    reds.length ? reds.slice(0, 8).map(fmt).join("\n") : "(aucun)",
    "",
    "Génère maintenant le tout en JSON strict (compatibility, goals, skin, watch).",
  ].join("\n");

  return { system, user };
}

const TONES: Tone[] = ["vert", "ambre", "rouge", "neutre"];

/** Filet « langage grand public » : remplace les noms INCI courants par des
 *  catégories compréhensibles (best-effort). */
function plainifyIngredientNames(s: string): string {
  return s
    .replace(/\bglycerine?\b/gi, "glycérine")
    .replace(/\baqua\b/gi, "eau")
    .replace(/salix\s+alba(\s+bark)?(\s+extract)?/gi, "extrait de saule")
    .replace(/butyrospermum\s+parkii(\s+butter)?/gi, "beurre de karité")
    .replace(/sodium\s+hyaluronate|hyaluronic\s+acid/gi, "acide hyaluronique")
    .replace(/aloe\s+barbadensis(\s+leaf)?(\s+juice|\s+extract)?/gi, "aloe vera")
    .replace(/sodium\s+(laureth|lauryl)\s+sulfate/gi, "agent lavant sulfaté")
    .replace(/\b(methyl|propyl|butyl|ethyl)paraben\b/gi, "conservateur (parabène)")
    .replace(/(methylchloroiso|methyliso)thiazolinone|phenoxyethanol/gi, "conservateur")
    .replace(/cetearyl\s+alcohol|behentrimonium\s*\w*/gi, "agent adoucissant")
    .replace(/zinc\s+pca/gi, "zinc")
    .replace(/\bpca\b/gi, "")
    .replace(/panthenol/gi, "agent apaisant")
    .replace(/tocopherol/gi, "vitamine E")
    .replace(/dimethicone/gi, "silicone")
    .replace(/glyceryl\s+\w+/gi, "émollient")
    .replace(/\bidéales\b/gi, "adaptées")
    .replace(/\bidéaux\b/gi, "adaptés")
    .replace(/\bidéale\b/gi, "adaptée")
    .replace(/\bidéal\b/gi, "adapté")
    .replace(/\bparfaites\b/gi, "très bonnes")
    .replace(/\bparfaits\b/gi, "très bons")
    .replace(/\bparfaite\b/gi, "très bonne")
    .replace(/\bparfait\b/gi, "très bon")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
}

function coerceBlock(raw: unknown, fallbackTitle: string): Block | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = typeof o.title === "string" ? plainifyIngredientNames(stripLongDashes(o.title)).slice(0, 60) : "";
  const description = typeof o.description === "string" ? plainifyIngredientNames(stripLongDashes(o.description)).slice(0, 200) : "";
  let tone = typeof o.tone === "string" ? (o.tone.trim().toLowerCase() as Tone) : "neutre";
  if (!TONES.includes(tone)) tone = "neutre";
  if (!title && !description) return null;
  return { title: title || fallbackTitle, description, tone };
}

/** Invariants DURS (le LLM est stochastique) — voir l'équivalent Edge. */
export function enforceInvariants(
  blocks: PersonalBlocks,
  ctx: {
    orange: number;
    red: number;
    restrictionHit: boolean;
    signalCats: string[];
    scoreTone?: string | null;
  },
): PersonalBlocks {
  const { orange, red, restrictionHit, signalCats, scoreTone } = ctx;
  const concerns = red > 0 || orange > 0 || restrictionHit;
  blocks.watch.tone = red > 0 || restrictionHit ? "rouge" : orange > 0 ? "ambre" : "vert";
  if (
    concerns &&
    /rien\s+à\s+surveiller|aucun\s+ingrédient|rien\s+à\s+signaler/i.test(
      `${blocks.watch.title} ${blocks.watch.description}`,
    )
  ) {
    blocks.watch.title = "Ingrédients à surveiller";
    blocks.watch.description = signalCats.length
      ? `Surveille : ${signalCats.join(", ")}.`
      : `Surveille ${orange + red} ingrédient(s) de cette formule.`;
  }
  if (red > 0 || orange >= 3) blocks.goals.tone = "rouge";
  else if (orange > 0 && blocks.goals.tone === "vert") blocks.goals.tone = "ambre";
  // Ancrage note globale : produit BIEN noté (vert) sans orange ni rouge -> goals
  // ne peut pas rester gris/ambre (contredirait la pastille verte). Un jaune seul
  // ne dégrade pas. Le prompt garantit déjà un TEXTE positif dans ce cas.
  else if (scoreTone === "green" && orange === 0 && red === 0 && blocks.goals.tone !== "vert") {
    blocks.goals.tone = "vert";
  }
  if (!blocks.watch.description || !blocks.watch.description.trim()) {
    blocks.watch.description = concerns
      ? signalCats.length
        ? `Surveille : ${signalCats.join(", ")}.`
        : "Garde un œil sur certains ingrédients de cette formule."
      : "Rien d'inquiétant pour toi dans cette formule.";
  }
  return blocks;
}

/** Valide/normalise l'objet compatibility renvoyé par le LLM (contributeurs v16). */
function coerceCompatibility(raw: unknown): RawCompat | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const relevance: CompatibilityRelevance = o.relevance === "product_only" ? "product_only" : "personal";
  const subtitle = typeof o.subtitle === "string"
    ? plainifyIngredientNames(stripLongDashes(o.subtitle)).replace(/[.\s]+$/, "").slice(0, 90)
    : "";
  const cleanShort = (s: unknown, max: number): string =>
    typeof s === "string" ? plainifyIngredientNames(stripLongDashes(s)).trim().slice(0, max) : "";
  const contributors: RawContributor[] = Array.isArray(o.contributors)
    ? (o.contributors as unknown[])
      .map((m): RawContributor | null => {
        if (!m || typeof m !== "object") return null;
        const mm = m as Record<string, unknown>;
        const ingredient = cleanShort(mm.ingredient, 40);
        const need = cleanShort(mm.need, 60);
        if (!ingredient || !need) return null;
        return { ingredient, need };
      })
      .filter((m): m is RawContributor => m !== null)
      .slice(0, 10)
    : [];
  const against: RawAgainst[] = Array.isArray(o.against)
    ? (o.against as unknown[])
      .map((m): RawAgainst | null => {
        if (!m || typeof m !== "object") return null;
        const mm = m as Record<string, unknown>;
        const ingredient = cleanShort(mm.ingredient, 40);
        const need = cleanShort(mm.need, 60);
        if (!ingredient || !need) return null;
        return { ingredient, need };
      })
      .filter((m): m is RawAgainst => m !== null)
      .slice(0, 15) // borne large : le cap final (AGAINST_MAX) est appliqué dans enforce
    : [];
  return { contributors, against, subtitle, relevance };
}

/** Garde-fous déterministes (compat.finalizeCompatScore) + sous-titre. */
function enforceCompatibility(
  compat: RawCompat | null,
  ctx: {
    orange: number;
    red: number;
    matches: RestrictionMatchLite[];
    /** Familles DÉDUITES du profil détectées dans le produit (mêmes -8 que les
     *  restrictions cochées, dédoublonnées par slug contre les cochées). */
    inferredMatches?: RestrictionMatchLite[];
    productOnly?: boolean;
    scoreOver20?: number;
    forcedAgainst?: { name: string; need: string }[];
  },
): Compatibility | null {
  if (!compat) return null;
  // ANTI-DOUBLE-COMPTAGE : un ingrédient déjà pénalisé comme RESTRICTION (-8)
  // ne peut pas être re-pénalisé en contre-indication (-5).
  // INSENSIBLE AUX ACCENTS : le match restriction porte l'INCI brut
  // (« Dimethicone »), l'IA écrit le nom en français (« Diméthicone ») → sans
  // dé-accentuation l'inclusion échouait et le silicone était compté 2×
  // (-5 contre-indication ET -8 restriction famille). Fix calcul juil 2026.
  const norm = (s: string | null | undefined) =>
    (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  const restrictedNames = [...ctx.matches, ...(ctx.inferredMatches ?? [])]
    .flatMap((m) => [m.inciName, m.label])
    .map(norm)
    .filter(Boolean);
  const isRestricted = (n: string) => {
    const nn = norm(n);
    return nn.length > 0 && restrictedNames.some((r) => r.includes(nn) || nn.includes(r));
  };
  // Contre-indications GARANTIES (filets code) : PRIORITAIRES et fiables. On
  // écarte celles déjà couvertes par une restriction (pénalisée -8 séparément).
  const forced = (ctx.forcedAgainst ?? [])
    .map((f) => ({ name: f.name, need: f.need }))
    .filter((f) => !isRestricted(f.name.toLowerCase().trim()));
  // Contre-indications IA : on retire une éventuelle RESTRICTION (double-comptage
  // -5/-8, trahie par le mot « restriction » dans le besoin) et les doublons d'un forced.
  const aiAgainst = compat.against
    .filter((a) => !/restriction/i.test(a.need))
    .map((a) => ({ name: a.ingredient, need: a.need }))
    .filter((a) => {
      const n = a.name.toLowerCase().trim();
      if (isRestricted(n)) return false;
      return !forced.some((f) => { const fn = f.name.toLowerCase().trim(); return fn.includes(n) || n.includes(fn); });
    });
  const againstInputs = [...forced, ...aiAgainst].slice(0, AGAINST_MAX);
  // ANTI-CONTRADICTION : un ingrédient « à éviter » ne peut PAS être aussi un
  // « actif utile » (vu E2E : huile de coco comptée en bonus ET comédogène acné).
  const contributors = compat.contributors
    .map((c) => ({ name: c.ingredient }))
    .filter((c) => {
      const n = c.name.toLowerCase().trim();
      return !againstInputs.some((a) => { const an = a.name.toLowerCase().trim(); return an.includes(n) || n.includes(an); });
    });
  const iaLines = buildCompatLines({ contributors, against: againstInputs });
  // Restrictions COCHÉES distinctes présentes → libellés (une ligne -8 chacune).
  // On retient les slugs de famille cochés pour ne PAS re-pénaliser via l'inférence.
  const seen = new Set<string>();
  const checkedFamilySlugs = new Set<string>();
  const restrictionLabels: string[] = [];
  for (const m of ctx.matches) {
    const key = `${m.kind ?? ""}:${m.slug ?? m.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (m.kind === "family" && m.slug) checkedFamilySlugs.add(m.slug);
    restrictionLabels.push(m.label);
  }
  // Sensibilités DÉDUITES détectées dans le produit → MÊME -8, MAIS seulement
  // pour les familles NON déjà cochées (sinon double -8). Dédup par slug.
  const inferredSeen = new Set<string>();
  const inferredRestrictionLabels: string[] = [];
  for (const m of ctx.inferredMatches ?? []) {
    if (!m.slug || checkedFamilySlugs.has(m.slug) || inferredSeen.has(m.slug)) continue;
    inferredSeen.add(m.slug);
    inferredRestrictionLabels.push(m.label);
  }
  const { score, label, tone, breakdown } = composeCompatScore({
    scoreOver20: ctx.scoreOver20 ?? 0,
    orange: ctx.orange,
    red: ctx.red,
    iaLines,
    restrictionLabels,
    inferredRestrictionLabels,
    productOnly: ctx.productOnly,
  });
  // La relevance AFFICHÉE suit le verdict DÉTERMINISTE (productOnly), pas le
  // champ IA : le header (« Pour toi » / « Qualité ») reste cohérent.
  const relevance = typeof ctx.productOnly === "boolean"
    ? (ctx.productOnly ? "product_only" : "personal")
    : compat.relevance;
  // Score < 60 → sous-titre NÉGATIF déterministe (jamais un bénéfice sous un
  // score faible). Sinon : sous-titre IA (avec repli neutre).
  const negative = negativeSubtitle({
    score,
    restrictionLabels,
    inferredCount: inferredRestrictionLabels.length,
    against: againstInputs,
    orange: ctx.orange,
    red: ctx.red,
    productOnly: ctx.productOnly,
  });
  let subtitle = negative
    ?? (compat.subtitle && compat.subtitle.trim()
      ? compat.subtitle
      : relevance === "personal"
        ? "d'après ton profil"
        : "d'après la qualité de la formule");
  // FILET product_only : pas de besoin personnel inventé sur un produit hors
  // profil (vu en campagne E2E). Le sous-titre négatif (<60) reste prioritaire.
  if (!negative && relevance === "product_only" && /\b(ton|ta|tes)\b/i.test(subtitle)) {
    subtitle = "d'après la qualité de la formule";
  }
  // FILET allergie : une contre-indication forcée d'allergie PRIME sur un
  // sous-titre IA positif (même à score ≥ 60).
  const allergyHit = againstInputs.find((a) => a.need.startsWith("ton allergie"));
  if (!negative && allergyHit) {
    subtitle = `${allergyHit.name.toLowerCase()} présent malgré ${allergyHit.need}`;
  }
  return { score, label, tone, subtitle, relevance, breakdown };
}

function parsePersonal(raw: string | null): { blocks: PersonalBlocks; compat: RawCompat | null } | null {
  if (!raw) return null;
  let jsonText = raw.trim();
  const first = jsonText.indexOf("{");
  const last = jsonText.lastIndexOf("}");
  if (first >= 0 && last > first) jsonText = jsonText.slice(first, last + 1);
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    return null;
  }
  const goals = coerceBlock(obj.goals, "Tes objectifs");
  const skin = coerceBlock(obj.skin, "À quoi ça sert");
  const watch = coerceBlock(obj.watch, "À surveiller pour toi");
  if (!goals || !skin || !watch) return null;
  return { blocks: { goals, skin, watch }, compat: coerceCompatibility(obj.compatibility) };
}

async function callMistralFallback(system: string, user: string): Promise<string | null> {
  if (!hasMistral()) return null;
  try {
    const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${system}\n\nRéponds UNIQUEMENT avec l'objet JSON, rien d'autre.` },
          { role: "user", content: user },
        ],
      }),
    });
    if (!r.ok) return null;
    const json = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    return json?.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function generatePersonalBlocks(input: PersonalInput): Promise<PersonalResult | null> {
  const cacheKey = makePersonalCacheKey(input);
  const cached = await getCached<PersonalResult>(cacheKey);
  if (cached?.blocks?.goals && cached.blocks.skin && cached.blocks.watch) return cached;

  if (!hasOpenAI() && !hasMistral()) return null;

  const { system, user } = buildPrompt(input);

  try {
    const parsed = await callWithFallback<{ blocks: PersonalBlocks; compat: RawCompat | null } | null>({
      feature: "personal-insights",
      userId: input.userId ?? null,
      timeoutMs: 25_000,
      primary: async () => {
        if (!hasOpenAI()) throw new Error("openai disabled");
        // SELF-CONSISTENCY : 3 appels parallèles (seeds distincts, temp basse),
        // consensus majoritaire 2/3 — parité exacte avec l'edge mobile.
        const callOnce = (seed: number) =>
          openai().chat.completions.create({
            model: AI_MODEL,
            temperature: 0.2,
            seed,
            max_tokens: 700,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
          });
        const settled = await Promise.allSettled([callOnce(11), callOnce(23), callOnce(37)]);
        let tokensIn = 0;
        let tokensOut = 0;
        const runs: { blocks: PersonalBlocks; compat: RawCompat | null }[] = [];
        for (const s of settled) {
          if (s.status !== "fulfilled") continue;
          tokensIn += s.value.usage?.prompt_tokens ?? 0;
          tokensOut += s.value.usage?.completion_tokens ?? 0;
          const p = parsePersonal(s.value.choices?.[0]?.message?.content ?? null);
          if (p) runs.push(p);
        }
        if (!runs.length) return { value: null, tokensIn, tokensOut };
        const compats = runs.map((r) => r.compat).filter((c): c is RawCompat => c !== null);
        const compat: RawCompat | null = compats.length
          ? {
            contributors: majorityByIngredient(compats.map((c) => c.contributors)).slice(0, 10),
            against: majorityByIngredient(compats.map((c) => c.against)).slice(0, 15),
            subtitle: compats[0].subtitle,
            relevance: compats[0].relevance,
          }
          : null;
        return { value: { blocks: runs[0].blocks, compat }, tokensIn, tokensOut };
      },
      fallback: async () => ({
        value: parsePersonal(await callMistralFallback(system, user)),
        provider: "mistral" as const,
      }),
    });

    if (!parsed) return null;
    const orange = input.counts.Orange ?? 0;
    const red = input.counts.Rouge ?? 0;
    const blocks = enforceInvariants(parsed.blocks, {
      orange,
      red,
      scoreTone: input.scoreTone ?? null,
      restrictionHit: input.restrictionMatches.length > 0 || (input.inferredRestrictionMatches?.length ?? 0) > 0,
      signalCats: [
        ...new Set(input.restrictionMatches.map((m) => m.label).filter(Boolean)),
        ...new Set((input.inferredRestrictionMatches ?? []).map((m) => m.label).filter(Boolean)),
        ...new Set(
          input.enriched
            .filter((r) => r.color_rating === "Orange" || r.color_rating === "Rouge")
            .map((r) => r.primary_function)
            .filter((f): f is string => Boolean(f)),
        ),
      ],
    });
    const compatibility = enforceCompatibility(parsed.compat, {
      orange,
      red,
      matches: input.restrictionMatches,
      inferredMatches: input.inferredRestrictionMatches,
      productOnly: input.productOnly,
      scoreOver20: input.score,
      forcedAgainst: input.forcedAgainst,
    });
    const result: PersonalResult = { blocks, compatibility };
    void setCached(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}
