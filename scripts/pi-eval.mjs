/**
 * Banc d'essai du prompt « personal-insights » (3 blocs perso) contre le VRAI
 * LLM (gpt-4o-mini). Itère le prompt jusqu'à passer tous les scénarios.
 *
 *   node scripts/pi-eval.mjs
 *
 * Lit OPENAI_API_KEY depuis .env. N'écrit rien : juste un rapport PASS/FAIL.
 */
import { readFileSync } from "node:fs";

// ── charge la clé depuis .env ────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      let v = l.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      return [l.slice(0, i).trim(), v];
    }),
);
const OPENAI_API_KEY = env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY manquant dans .env");
const MODEL = "gpt-4o-mini";

// ═══════════════════════════════════════════════════════════════════════════
//  PROMPT v4 (on itère ICI)
// ═══════════════════════════════════════════════════════════════════════════
function buildPrompt(s) {
  const greens = s.items.filter((r) => r.color === "Vert");
  const oranges = s.items.filter((r) => r.color === "Orange");
  const reds = s.items.filter((r) => r.color === "Rouge");
  const counts = { Vert: 0, Jaune: 0, Orange: 0, Rouge: 0 };
  for (const it of s.items) if (counts[it.color] != null) counts[it.color]++;
  const fmt = (r) => `- ${r.name}${r.fn ? ` (${r.fn})` : ""}${r.restriction ? ` [restriction: ${r.restriction}]` : ""}`;
  const hasProfile = Boolean(s.profileBlock && s.profileBlock.trim());

  const system = [
    "Tu es l'expert beauté de l'app : une référence qui SAIT et qui TRANCHE. Tu t'adresses à UNE personne (tutoiement). Tu génères 3 encarts courts et factuels à partir d'une analyse INCI, du TYPE de produit et du profil.",
    "Réponds UNIQUEMENT en JSON strict, sans texte autour :",
    `{"goals":{"title":"","description":"","tone":""},"skin":{"title":"","description":"","tone":""},"watch":{"title":"","description":"","tone":""}}`,
    "Chaque bloc DOIT avoir les 3 champs NON VIDES : title (<= 42 caractères), description (<= 150 caractères, 1 phrase nette) ET tone (parmi \"vert\"|\"ambre\"|\"rouge\"|\"neutre\"). Ne jamais omettre tone ni description, même pour \"Rien à surveiller\" (alors tone=\"vert\").",
    "",
    "ÉTAPE 1 - PERTINENCE (décide AVANT d'écrire). Le produit concerne-t-il RÉELLEMENT un élément du profil (un objectif, une préoccupation, le type de peau, une allergie/restriction, ou les cheveux SI le profil en parle) ?",
    "- Un après-shampooing / soin cheveux n'est PERTINENT que si le profil parle de cheveux.",
    "- Un produit bucco-dentaire (dentifrice, bain de bouche) n'est PERTINENT que si le profil parle de bouche/dents.",
    "- Un soin visage/corps n'est PERTINENT que s'il touche un objectif, une préoccupation ou le type de peau du profil.",
    "- Une allergie/restriction qui matche un ingrédient est TOUJOURS un lien pertinent (bloc watch).",
    "Si AUCUN lien, ou si le profil est VIDE → le produit est NON PERTINENT pour la personnalisation.",
    "",
    "MODE A - PERTINENT : personnalise UNIQUEMENT sur les éléments réellement concernés.",
    "- goals : répond-il à un objectif/une préoccupation du profil ? Cite l'actif ou le fait précis. AFFIRME (\"Répond à ton objectif hydratation\" / \"Ne cible pas tes imperfections\").",
    "- skin : convient-il à ton type de peau / tes préoccupations ? Fonde-toi sur les ingrédients (doux vs irritants).",
    "- N'invente AUCUN lien sur un objectif/une zone que le profil ne mentionne pas.",
    "",
    "MODE B - NON PERTINENT (aucun lien, ou profil vide) : tu NE RAMÈNES RIEN à la personne, dans AUCUN des 3 blocs. INTERDIT ABSOLU : les mots \"ton\", \"ta\", \"tes\", \"toi\", \"objectif(s)\", \"ta peau\", \"tes imperfections\", \"ne cible pas\", \"ne convient pas\", \"répond à ton\". Si tu écris l'un d'eux dans goals ou skin, c'est FAUX. Tu analyses le PRODUIT EN LUI-MÊME, objectivement :",
    "- goals -> QUALITÉ DE LA FORMULE, RIEN d'autre : juge la formule sur ses ingrédients réels (actifs notables, douceur, simplicité, défauts). Titre 100% centré PRODUIT, ex : \"Bonne formule lavante\", \"Formule correcte\", \"Formule très basique\". Ne mentionne JAMAIS un objectif/une préoccupation/la peau. tone vert si bonne, ambre si moyenne, rouge si pauvre.",
    "  IMPORTANT (profil vide) : tu ne connais AUCUN objectif de la personne. Décris l'ACTION de la formule comme une PROPRIÉTÉ DU PRODUIT (ex : \"Régule le sébum\", \"Hydrate intensément\", \"Nettoie en douceur\"), JAMAIS comme \"répond à ton objectif\". Le mot \"objectif\" est interdit ici. Ex sérum séborégulateur + profil vide -> goals title \"Formule séborégulatrice\", desc \"Régule le sébum et purifie la peau.\" (jamais \"ton objectif\").",
    "- skin -> NATURE & USAGE du produit : décris factuellement ce qu'est le produit et son intérêt réel (ex après-shampooing : \"Démêle et adoucit la fibre capillaire\" ; ex savon : \"Nettoie les mains en douceur\"). tone neutre ou vert. JAMAIS de jugement \"peau\" ni de \"toi\".",
    "- Présente les POINTS FORTS réels ET les POINTS FAIBLES réels (honnête : ni survente, ni dénigrement gratuit). S'il n'y a que des points forts, ne liste que les points forts.",
    "",
    "BLOC watch (TOUJOURS, mode A ou B) : ingrédients à surveiller. REGARDE les Comptes (Orange=, Rouge=) fournis.",
    "- Si Orange >= 1 OU Rouge >= 1 OU une restriction matche, tu DOIS le signaler en nommant la CATÉGORIE concernée (ex : « parfum », « conservateurs », « alcool », « agents lavants »). INTERDIT ABSOLU d'écrire « Rien à surveiller » dans ce cas, c'est une FAUTE.",
    "- tone du watch : ROUGE dès qu'il y a au moins un Rouge OU une restriction de la personne dans « À SIGNALER » (une restriction = alerte rouge, MÊME si l'ingrédient n'est qu'orange) ; AMBRE seulement s'il n'y a QUE des oranges et AUCUNE restriction ; vert UNIQUEMENT si Orange=0, Rouge=0 ET 0 restriction (alors title « Rien à surveiller »).",
    "",
    "COHÉRENCE COULEURS (impératif, EN MODE A COMME EN MODE B) : le tone du bloc goals DOIT refléter les pastilles, jamais les contredire.",
    "- 0 orange et 0 rouge : goals peut être positif (tone vert).",
    "- 1 ou 2 oranges (0 rouge) : tone AMBRE maximum. INTERDIT « bonne/correcte/très bonne formule ». Dis « Formule moyenne ».",
    "- 3 oranges et plus, OU au moins 1 rouge : tone ROUGE.",
    "- EN MODE A : même si le produit cible ton objectif, le tone de goals NE PEUT PAS être vert s'il y a des oranges/rouges. Dis le double constat, ex : « Cible l'hydratation mais formule pénalisée par un conservateur à risque » (tone rouge).",
    "- Ne dis JAMAIS « correcte/bonne » ni « rien à surveiller » pour une formule contenant des oranges/rouges.",
    "",
    "RÈGLES GLOBALES :",
    "- LANGAGE GRAND PUBLIC (impératif, TOUS les blocs) : n'écris JAMAIS de nom INCI/scientifique. INTERDITS (exemples) : « Glyceryl Oleate », « PCA », « Cetearyl Alcohol », « Behentrimonium », « Phenoxyethanol », « Methylparaben », « Methylisothiazolinone », « Sodium Laureth Sulfate », « Panthenol », « Tocopherol », « Dimethicone ». À la place, CATÉGORIES simples : « émollients », « agents adoucissants », « conservateur » (et « (parabène) » si c'en est un), « parfum », « agents lavants », « alcool », « huiles végétales », « agent réparateur ». RÉÉCRIS systématiquement : un parabène -> « un conservateur (parabène) » ; un sulfate (…Sulfate) -> « un agent lavant sulfaté » ; panthénol -> « agent apaisant » ; tocophérol -> « vitamine E » ; diméthicone -> « silicone ». Tu peux nommer un ingrédient SEULEMENT s'il est connu du grand public (Aloe Vera, beurre de karité, huile d'argan, glycérine, acide hyaluronique, niacinamide). Décris les fonctions en mots simples (adoucit, hydrate, nettoie, conserve, parfume).",
    "- AFFIRMATIF : tu donnes le verdict, tu ne renvoies JAMAIS la décision à l'utilisateur. INTERDIT : \"à tester\", \"teste\", \"à voir\", \"vois par toi-même\", \"peut-être\", \"il se pourrait\", \"il faudrait essayer\".",
    "- PAS DE SURVENTE : INTERDIT les mots \"idéal\", \"idéale\", \"parfait\", \"parfaite\", \"incontournable\", \"le meilleur\", \"la meilleure\", et toute flatterie vague. Dis plutôt \"adapté\", \"correct\", \"bon pour\". Chaque phrase s'appuie sur un ingrédient/fait réel.",
    "- Pas d'emoji, pas de jargon médical, pas de promesse de soin (\"soigne/traite/guérit/répare\" interdits -> \"hydrate/adoucit/nettoie/protège\"). AUCUN tiret cadratin (—) ni demi-cadratin (–) : virgule ou deux-points.",
    hasProfile ? `PROFIL DE LA PERSONNE :\n${s.profileBlock}` : "PROFIL : vide / non renseigné -> MODE B obligatoire.",
    s.restrictionsBlock ? `RESTRICTIONS DÉCLARÉES : ${s.restrictionsBlock}` : "",
  ].filter(Boolean).join("\n");

  const watchHints = [...new Set([...oranges, ...reds].map((r) => r.fn).filter(Boolean))];
  const restrictionHints = [...new Set(s.items.filter((i) => i.restriction).map((i) => i.restriction))];
  const toSignal = [...restrictionHints, ...watchHints];

  const user = [
    `Produit : ${s.product}`,
    `Type de produit : ${s.type}`,
    `Note globale : ${s.score.toFixed(1)}/20.`,
    `Comptes : Vert=${counts.Vert}, Jaune=${counts.Jaune}, Orange=${counts.Orange}, Rouge=${counts.Rouge}.`,
    `À SIGNALER OBLIGATOIREMENT dans le bloc watch (en CATÉGORIES grand public, jamais de nom scientifique) : ${toSignal.length ? toSignal.join(", ") : "RIEN (0 orange, 0 rouge, 0 restriction) -> watch vert « Rien à surveiller »"}`,
    "Les noms d'ingrédients ci-dessous sont en INCI : NE LES RECOPIE JAMAIS, traduis-les en catégorie grand public.",
    "Actifs VERTS notables :",
    greens.length ? greens.slice(0, 10).map(fmt).join("\n") : "(aucun)",
    "ORANGES :",
    oranges.length ? oranges.map(fmt).join("\n") : "(aucun)",
    "ROUGES :",
    reds.length ? reds.map(fmt).join("\n") : "(aucun)",
    "Génère les 3 blocs en JSON strict (goals, skin, watch).",
  ].join("\n");

  return { system, user };
}

// ═══════════════════════════════════════════════════════════════════════════
//  SCÉNARIOS
// ═══════════════════════════════════════════════════════════════════════════
const G = (name, fn) => ({ name, fn, color: "Vert" });
const O = (name, fn, restriction) => ({ name, fn, color: "Orange", restriction });
const R = (name, fn, restriction) => ({ name, fn, color: "Rouge", restriction });

const scenarios = [
  {
    id: "1-skin-match-full",
    relevant: true,
    profileBlock: "Objectifs : hydratation, anti-âge. Type de peau : sèche. Préoccupations : ridules, tiraillements.",
    restrictionsBlock: "",
    product: "Crème Hydratante Riche", type: "crème visage", score: 17,
    items: [G("Glycerin", "humectant"), G("Hyaluronic Acid", "hydratant"), G("Panthenol", "apaisant"), { name: "Aqua", color: "Vert" }],
  },
  {
    id: "2-hair-profile-skin-only",
    relevant: false, // après-shampooing, profil ne parle que de peau
    profileBlock: "Objectifs : réduire l'acné. Type de peau : grasse. Préoccupations : boutons, imperfections.",
    restrictionsBlock: "",
    product: "Cream Conditioner Après-shampooing", type: "après-shampooing", score: 12,
    items: [G("Cetearyl Alcohol", "émollient"), { name: "Aqua", color: "Vert" }, O("Behentrimonium Chloride", "agent adoucissant"), O("Parfum", "parfum")],
  },
  {
    id: "3-toothpaste-profile-skin",
    relevant: false,
    profileBlock: "Objectifs : anti-âge. Type de peau : mixte. Préoccupations : taches.",
    restrictionsBlock: "",
    product: "Dentifrice Blancheur", type: "dentifrice", score: 14,
    items: [G("Sodium Fluoride", "anticarie"), { name: "Aqua", color: "Vert" }, { name: "Silica", color: "Jaune" }],
  },
  {
    id: "4-empty-profile-good-product",
    relevant: false, // profil vide
    profileBlock: "",
    restrictionsBlock: "",
    product: "Sérum Niacinamide 10%", type: "sérum visage", score: 18,
    items: [G("Niacinamide", "séborégulateur"), G("Zinc PCA", "purifiant"), { name: "Aqua", color: "Vert" }],
  },
  {
    id: "5-match-one-allergy-only",
    relevant: true, // matche UNE restriction, rien d'autre
    profileBlock: "Objectifs : volume cheveux. Type de peau : normale.",
    restrictionsBlock: "parfum",
    product: "Gel Douche Fraîcheur", type: "gel douche", score: 11,
    items: [{ name: "Sodium Laureth Sulfate", color: "Jaune" }, O("Parfum", "parfum", "Parfum"), { name: "Aqua", color: "Vert" }],
  },
  {
    id: "6-match-one-objective-only",
    relevant: true,
    profileBlock: "Objectifs : anti-acné. Type de peau : normale. Préoccupations : (aucune autre).",
    restrictionsBlock: "",
    product: "Gel Nettoyant Purifiant", type: "nettoyant visage", score: 15,
    items: [G("Salicylic Acid", "kératolytique anti-imperfections"), { name: "Aqua", color: "Vert" }, { name: "Coco-Glucoside", color: "Vert" }],
  },
  {
    id: "7-match-skintype-only",
    relevant: true,
    profileBlock: "Objectifs : (aucun précis). Type de peau : sensible. Préoccupations : rougeurs.",
    restrictionsBlock: "",
    product: "Crème Apaisante", type: "crème visage", score: 16,
    items: [G("Centella Asiatica", "apaisant"), G("Panthenol", "réparateur"), { name: "Aqua", color: "Vert" }],
  },
  {
    id: "8-irrelevant-bad-formula",
    relevant: false, // produit cheveux, profil peau ; ET formule moyenne/mauvaise
    profileBlock: "Objectifs : anti-taches. Type de peau : mixte.",
    restrictionsBlock: "",
    product: "Laque Fixation Forte", type: "laque cheveux", score: 7,
    items: [O("Alcohol Denat", "solvant"), R("Butane", "propulseur"), O("Parfum", "parfum"), { name: "Aqua", color: "Vert" }],
  },
  {
    id: "9-relevant-with-restriction-hit",
    relevant: true, // soin visage qui matche objectif ET contient une restriction
    profileBlock: "Objectifs : hydratation. Type de peau : sèche.",
    restrictionsBlock: "parabens",
    product: "Crème Mains Nourrissante", type: "crème mains", score: 13,
    items: [G("Glycerin", "humectant"), G("Shea Butter", "nourrissant"), R("Methylparaben", "conservateur", "Parabens")],
  },
  {
    id: "10-empty-profile-bad-product",
    relevant: false,
    profileBlock: "",
    restrictionsBlock: "",
    product: "Lingettes Nettoyantes", type: "lingettes visage", score: 6,
    items: [O("Phenoxyethanol", "conservateur"), R("Methylisothiazolinone", "conservateur allergène"), O("Parfum", "parfum")],
  },
  {
    id: "11-mouthwash-empty-profile",
    relevant: false,
    profileBlock: "",
    restrictionsBlock: "alcool",
    product: "Bain de Bouche", type: "bain de bouche", score: 10,
    items: [O("Alcohol", "antiseptique", "Alcool"), { name: "Aqua", color: "Vert" }, G("Sodium Fluoride", "anticarie")],
  },
  {
    id: "12-skin-match-but-product-mediocre",
    relevant: true,
    profileBlock: "Objectifs : matifier. Type de peau : grasse. Préoccupations : brillance, pores.",
    restrictionsBlock: "",
    product: "Crème Hydratante Basique", type: "crème visage", score: 11,
    items: [{ name: "Aqua", color: "Vert" }, { name: "Mineral Oil", color: "Orange" }, O("Parfum", "parfum"), G("Glycerin", "humectant")],
  },
  {
    id: "13-hair-product-hair-profile",
    relevant: true, // profil parle de cheveux -> pertinent
    profileBlock: "Objectifs : cheveux moins secs, brillance. Type de cheveux : secs, bouclés.",
    restrictionsBlock: "",
    product: "Masque Capillaire Nutrition", type: "masque cheveux", score: 16,
    items: [G("Cetearyl Alcohol", "émollient"), G("Argan Oil", "nutrition"), G("Shea Butter", "nourrissant"), { name: "Aqua", color: "Vert" }],
  },
  {
    id: "14-clean-irrelevant-good",
    relevant: false, // savon mains, profil peau visage acné
    profileBlock: "Objectifs : anti-acné visage. Type de peau : grasse.",
    restrictionsBlock: "",
    product: "Savon de Marseille", type: "savon mains", score: 18,
    items: [G("Sodium Olivate", "tensioactif doux"), { name: "Aqua", color: "Vert" }, G("Glycerin", "humectant")],
  },
  {
    id: "15-parabens-detected",
    relevant: true, // soin visage qui matche objectif + restriction parabènes détectée
    profileBlock: "Objectifs : hydratation. Type de peau : sèche.",
    restrictionsBlock: "parabènes",
    product: "Crème Visage Confort", type: "crème visage", score: 9,
    items: [G("Glycerin", "humectant"), R("Methylparaben", "conservateur", "Parabènes"), R("Propylparaben", "conservateur", "Parabènes"), { name: "Aqua", color: "Vert" }],
  },
  {
    id: "16-sulfates-detected",
    relevant: true, // restriction sulfates détectée
    profileBlock: "Objectifs : cuir chevelu sain. Type de cheveux : normaux.",
    restrictionsBlock: "sulfates",
    product: "Shampooing Quotidien", type: "shampooing", score: 8,
    items: [O("Sodium Laureth Sulfate", "agent lavant", "Sulfates"), O("Cocamidopropyl Betaine", "tensioactif"), O("Parfum", "parfum"), { name: "Aqua", color: "Vert" }],
  },
  {
    id: "17-hair-product-3-orange-relevant",
    relevant: true, // profil cheveux + formule chargée (3 orange) -> rouge
    profileBlock: "Objectifs : discipliner les cheveux. Type de cheveux : épais.",
    restrictionsBlock: "",
    product: "Gel Coiffant Fixation", type: "gel cheveux", score: 6,
    items: [O("Alcohol Denat", "solvant"), O("PEG-40", "émulsifiant"), O("Parfum", "parfum"), { name: "Aqua", color: "Vert" }],
  },
  {
    id: "18-clean-relevant-green",
    relevant: true, // 0 orange/rouge -> goals vert + watch "rien à surveiller"
    profileBlock: "Objectifs : hydratation. Type de peau : normale.",
    restrictionsBlock: "",
    product: "Gel Hydratant Léger", type: "crème visage", score: 19,
    items: [G("Glycerin", "humectant"), G("Aloe Vera", "apaisant"), G("Hyaluronic Acid", "hydratant"), { name: "Aqua", color: "Vert" }],
  },
  {
    id: "19-jaune-only-relevant",
    relevant: true, // que du jaune (pénalité faible) -> goals peut rester vert, watch vert
    profileBlock: "Objectifs : hydratation. Type de peau : normale.",
    restrictionsBlock: "",
    product: "Lait Corps Hydratant", type: "lait corps", score: 15,
    items: [G("Glycerin", "humectant"), { name: "Cetyl Alcohol", color: "Jaune" }, { name: "Aqua", color: "Vert" }, { name: "Parfum doux", color: "Jaune" }],
  },
  {
    id: "20-one-red-empty-profile",
    relevant: false, // 1 rouge, profil vide -> MODE B, goals rouge, watch rouge
    profileBlock: "",
    restrictionsBlock: "",
    product: "Crème Anti-Rides", type: "crème visage", score: 7,
    items: [G("Glycerin", "humectant"), R("BHA (Butylated Hydroxyanisole)", "antioxydant controversé"), { name: "Aqua", color: "Vert" }],
  },
  {
    id: "21-rich-profile-multimatch",
    relevant: true, // profil riche, matche objectif + peau, 0 orange/rouge
    profileBlock: "Objectifs : anti-âge, hydratation, éclat. Type de peau : sèche, sensible. Préoccupations : ridules, manque d'éclat.",
    restrictionsBlock: "",
    product: "Sérum Éclat Hydratant", type: "sérum visage", score: 18,
    items: [G("Niacinamide", "éclat"), G("Hyaluronic Acid", "hydratant"), G("Panthenol", "apaisant"), { name: "Aqua", color: "Vert" }],
  },
  {
    id: "22-multi-restriction-detected",
    relevant: true, // 2 restrictions matchent (sulfates + parfum)
    profileBlock: "Objectifs : cheveux doux. Type de cheveux : fins.",
    restrictionsBlock: "sulfates, parfum",
    product: "Shampooing Volumateur", type: "shampooing", score: 7,
    items: [O("Sodium Lauryl Sulfate", "agent lavant", "Sulfates"), O("Parfum", "parfum", "Parfum"), { name: "Aqua", color: "Vert" }],
  },
  {
    id: "23-very-loaded-relevant",
    relevant: true, // 5 oranges -> rouge, watch rouge/ambre
    profileBlock: "Objectifs : tenue maquillage. Type de peau : mixte.",
    restrictionsBlock: "",
    product: "Fond de Teint Longue Tenue", type: "maquillage teint", score: 5,
    items: [O("Alcohol Denat", "solvant"), O("Cyclopentasiloxane", "silicone volatil"), O("Phenoxyethanol", "conservateur"), O("Parfum", "parfum"), O("Synthetic Wax", "agent texturant"), { name: "Aqua", color: "Vert" }],
  },
  {
    id: "24-allergen-limonene-restriction",
    relevant: true, // allergène limonène en restriction
    profileBlock: "Objectifs : fraîcheur. Type de peau : normale.",
    restrictionsBlock: "limonène",
    product: "Déodorant Spray", type: "déodorant", score: 10,
    items: [O("Limonene", "allergène parfum", "Limonène"), { name: "Aqua", color: "Vert" }, G("Glycerin", "humectant")],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
//  ÉVALUATEUR
// ═══════════════════════════════════════════════════════════════════════════
const DEFER = /(à\s+tester|teste[rz]?\b|à\s+voir\b|vois\s+par|peut-être|il\s+se\s+pourrait|il\s+faudrait\s+essayer)/i;
const SURVENTE = /(idéal[e]?|idéaux|parfait[e]?|incontournable|le\s+meilleur|la\s+meilleure)/i;
// Framing "toi" interdit en MODE B (produit hors-sujet) : ton/ta/tes + cible
const PROFILE_FRAMING = /(\b(ton|ta|tes)\s+(objectif|objectifs|peau|préoccupation|préoccupations|imperfection|imperfections)|pour\s+toi|à\s+tes\b|ne\s+cible\s+pas|ne\s+convient\s+pas\s+à\s+(ta|ton)|répond\s+à\s+ton)/i;
const DASH = /[—–]/;
// Noms INCI/scientifiques interdits (langage grand public exigé). "alcool"/"parfum"
// /"sulfates"/"parabènes" (catégories FR) sont autorisés ; on cible les tokens INCI.
const SCI_NAME = /\b(glyceryl|cetearyl|ceteareth|cetyl|stearyl|behentrimonium|cocamidopropyl|laureth|lauryl\s+sulfate|oleate|phenoxyethanol|methylisothiazolinone|methylparaben|propylparaben|butylparaben|alcohol\s+denat|sodium\s+(laureth|lauryl|olivate|fluoride|chloride|benzoate)|disodium|peg-?\d|\bpca\b|tocopherol|dimethicone|panthenol)\b/i;

// ── Filet déterministe (miroir du code de production) ───────────────────────
function plainify(s) {
  return (s || "")
    .replace(/sodium\s+(laureth|lauryl)\s+sulfate/gi, "agent lavant sulfaté")
    .replace(/\b(methyl|propyl|butyl|ethyl)paraben\b/gi, "conservateur (parabène)")
    .replace(/(methylchloroiso|methyliso)thiazolinone|phenoxyethanol/gi, "conservateur")
    .replace(/cetearyl\s+alcohol|behentrimonium\s*\w*/gi, "agent adoucissant")
    .replace(/zinc\s+pca/gi, "zinc").replace(/\bpca\b/gi, "")
    .replace(/panthenol/gi, "agent apaisant").replace(/tocopherol/gi, "vitamine E")
    .replace(/dimethicone/gi, "silicone").replace(/glyceryl\s+\w+/gi, "émollient")
    // anti-survente déterministe
    .replace(/\bidéales\b/gi, "adaptées").replace(/\bidéaux\b/gi, "adaptés")
    .replace(/\bidéale\b/gi, "adaptée").replace(/\bidéal\b/gi, "adapté")
    .replace(/\bparfaites\b/gi, "très bonnes").replace(/\bparfaits\b/gi, "très bons")
    .replace(/\bparfaite\b/gi, "très bonne").replace(/\bparfait\b/gi, "très bon")
    .replace(/\s{2,}/g, " ").replace(/\s+([.,;:])/g, "$1").trim();
}
function applyNet(blocks, s) {
  for (const k of ["goals", "skin", "watch"]) {
    if (blocks[k]) { blocks[k].title = plainify(blocks[k].title); blocks[k].description = plainify(blocks[k].description); }
  }
  const orange = s.items.filter((i) => i.color === "Orange").length;
  const red = s.items.filter((i) => i.color === "Rouge").length;
  const restrictionHit = s.items.some((i) => i.restriction);
  const cats = [...new Set([...s.items.filter((i) => i.restriction).map((i) => i.restriction), ...s.items.filter((i) => i.color === "Orange" || i.color === "Rouge").map((i) => i.fn).filter(Boolean)])];
  const concerns = red > 0 || orange > 0 || restrictionHit;
  blocks.watch.tone = red > 0 || restrictionHit ? "rouge" : orange > 0 ? "ambre" : "vert";
  if (concerns && /rien\s+à\s+surveiller|aucun\s+ingrédient|rien\s+à\s+signaler/i.test(`${blocks.watch.title} ${blocks.watch.description}`)) {
    blocks.watch.title = "Ingrédients à surveiller";
    blocks.watch.description = cats.length ? `À surveiller : ${cats.join(", ")}.` : `Contient ${orange + red} ingrédient(s) à surveiller.`;
  }
  if (red > 0 || orange >= 3) blocks.goals.tone = "rouge";
  else if (orange > 0 && blocks.goals.tone === "vert") blocks.goals.tone = "ambre";
  // description watch jamais vide
  if (!blocks.watch.description || !blocks.watch.description.trim()) {
    blocks.watch.description = concerns
      ? (cats.length ? `À surveiller : ${cats.join(", ")}.` : "Ingrédients à surveiller dans la formule.")
      : "Aucun ingrédient à risque dans la formule.";
  }
  return blocks;
}

function allText(b) {
  return [b.goals?.title, b.goals?.description, b.skin?.title, b.skin?.description, b.watch?.title, b.watch?.description]
    .filter(Boolean).join(" · ");
}
function nonWatchText(b) {
  return [b.goals?.title, b.goals?.description, b.skin?.title, b.skin?.description].filter(Boolean).join(" · ");
}

function evaluate(s, blocks) {
  const fails = [];
  if (!blocks?.goals || !blocks?.skin || !blocks?.watch) return ["JSON incomplet (goals/skin/watch manquant)"];
  for (const k of ["goals", "skin", "watch"]) {
    const b = blocks[k];
    if (!["vert", "ambre", "rouge", "neutre"].includes(b.tone)) fails.push(`${k}: tone invalide "${b.tone}"`);
    if ((b.title || "").length > 48) fails.push(`${k}: title trop long`);
  }
  const txt = allText(blocks);
  if (DEFER.test(txt)) fails.push(`langage "à tester/teste/peut-être" présent`);
  if (SURVENTE.test(txt)) fails.push(`survente (idéal/parfait/…) présente`);
  if (DASH.test(txt)) fails.push(`tiret cadratin/demi-cadratin présent`);

  const restrictionHit = s.items.some((i) => i.restriction);
  const orange = s.items.filter((i) => i.color === "Orange").length;
  const red = s.items.filter((i) => i.color === "Rouge").length;

  if (!s.relevant) {
    if (PROFILE_FRAMING.test(nonWatchText(blocks))) {
      fails.push(`MODE B violé : framing profil dans goals|skin`);
    }
  }

  // ── noms scientifiques INCI interdits (partout) ──
  if (SCI_NAME.test(txt)) fails.push(`nom scientifique/INCI présent (ex: ${txt.match(SCI_NAME)[0]})`);

  // ── watch DOIT alerter dès 1 orange/rouge/restriction ──
  const watchTxt = `${blocks.watch.title} ${blocks.watch.description}`;
  if (orange > 0 || red > 0 || restrictionHit) {
    if (blocks.watch.tone === "vert") fails.push(`watch tone vert alors qu'il y a orange/rouge/restriction`);
    if (/rien\s+à\s+surveiller/i.test(watchTxt)) fails.push(`watch dit "rien à surveiller" avec orange/rouge/restriction`);
    if ((red > 0 || restrictionHit) && blocks.watch.tone !== "rouge") fails.push(`watch devrait être rouge (rouge/restriction présent)`);
  } else {
    if (blocks.watch.tone === "rouge") fails.push(`watch rouge alors que rien de problématique`);
  }

  // ── cohérence couleurs sur goals (qualité de formule) ──
  const goalsTxt = `${blocks.goals.title} ${blocks.goals.description}`;
  if (orange > 0 || red > 0) {
    if (blocks.goals.tone === "vert") fails.push(`goals tone vert alors que la formule a ${orange} orange / ${red} rouge`);
    if (/(bonne|correcte|très\s+bonne|excellente)\s+formule|formule\s+(correcte|bonne|excellente)/i.test(goalsTxt)) {
      fails.push(`goals qualifie "bonne/correcte" une formule avec orange/rouge`);
    }
  }
  if (red > 0 || orange >= 3) {
    if (blocks.goals.tone !== "rouge") fails.push(`goals devrait être rouge (${orange} orange / ${red} rouge)`);
  }
  return fails;
}

// ═══════════════════════════════════════════════════════════════════════════
//  RUN
// ═══════════════════════════════════════════════════════════════════════════
async function callLLM({ system, user }) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return JSON.parse(j.choices[0].message.content);
}

const runs = await Promise.all(
  scenarios.map(async (s) => {
    try {
      const raw = await callLLM(buildPrompt(s));
      const blocks = applyNet(raw, s); // miroir du pipeline réel (prompt + filet)
      const fails = evaluate(s, blocks);
      return { s, blocks, fails };
    } catch (e) {
      return { s, blocks: null, fails: [`ERREUR appel: ${e.message}`] };
    }
  }),
);

let passed = 0;
for (const { s, blocks, fails } of runs) {
  const ok = fails.length === 0;
  if (ok) passed++;
  console.log(`\n${ok ? "✅" : "❌"} [${s.id}] (${s.relevant ? "PERTINENT" : "NON PERTINENT"}) ${s.product}`);
  if (blocks) {
    console.log(`   goals[${blocks.goals?.tone}] ${blocks.goals?.title} :: ${blocks.goals?.description}`);
    console.log(`   skin [${blocks.skin?.tone}] ${blocks.skin?.title} :: ${blocks.skin?.description}`);
    console.log(`   watch[${blocks.watch?.tone}] ${blocks.watch?.title} :: ${blocks.watch?.description}`);
  }
  if (!ok) for (const f of fails) console.log(`     -> ${f}`);
}
console.log(`\n=== ${passed}/${runs.length} scénarios OK ===`);
