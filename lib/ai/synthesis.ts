/**
 * Synthesis generation. Primary: OpenAI gpt-4o-mini. Fallback: Mistral.
 * Cached by hash of the normalized INCI list.
 *
 * The output is a personalised "good friend" advisory that:
 *   - Opens with a profile/restriction-aware line (or a product hook).
 *   - Calls out matched restrictions IN the relevant bullet (the route
 *     pre-computes the match and attaches `restriction_reason` to the
 *     enriched item).
 *   - Groups oranges of the same family (or 3+) into one bullet so the
 *     reader gets the common-cause warning instead of three repeats.
 *   - Closes with a soft, personalised recommendation when the user has
 *     filled their profile / restrictions, or a gentle nudge to fill them
 *     when they haven't.
 */
import crypto from "node:crypto";
import { AI_MODEL, callWithFallback, getCached, hasMistral, hasOpenAI, openai, setCached } from "./client";
import { NO_LONG_DASHES_RULE, stripLongDashes } from "./sanitize";
import type { ColorRating } from "@/lib/supabase";

export type SynthesisInput = {
  enriched: {
    input_raw: string;
    name: string | null;
    color_rating: ColorRating | null;
    primary_function: string | null;
    tags: string[] | null;
    position_idx: number;
    /** Short human label like "avant parfum" / "après conservateur" - null when not applicable. */
    threshold_label?: string | null;
    /** When set, the route detected that this ingredient matches one of the
     *  user's restrictions. The string is the human label (family name or
     *  ingredient name) to surface in the bullet. */
    restriction_reason?: string | null;
  }[];
  counts: Record<string, number>;
  score: number;
  scoreLabel: string;
  observations: { label: string; status: "present" | "absent" | "info" | "warn"; count: number }[];
  productLabel: string | null;
  userId?: string | null;
  /** Pre-formatted skin profile block (from loadProfileForPrompt). When
   *  present, the LLM is asked to tailor the synthèse to this profile. The
   *  cache key includes its hash so two users with different profiles don't
   *  collide on the same cached output. */
  profileBlock?: string | null;
  /** Pre-formatted restrictions block (from loadRestrictionsForPrompt).
   *  Same contract as profileBlock. */
  restrictionsBlock?: string | null;
};

// Bump this any time `buildPrompt()` changes meaningfully - old cached
// outputs keyed on the previous version will no longer be served.
// v11 (2026-05-23): removed the "Sans parabens, sans sulfates..." absences
// bullet — it duplicates the dedicated Observations panel.
const PROMPT_VERSION = 11;

function makeCacheKey(input: SynthesisInput): string {
  const list = input.enriched
    .map((r) => `${(r.name ?? r.input_raw).trim().toUpperCase()}:${r.color_rating ?? "?"}${r.restriction_reason ? `:R(${r.restriction_reason})` : ""}`)
    .join("|");
  const productKey = input.productLabel ? `|p=${input.productLabel.toLowerCase()}` : "";
  const profileKey = input.profileBlock
    ? `|prof=${crypto.createHash("sha256").update(input.profileBlock).digest("hex").slice(0, 12)}`
    : "";
  const restrictionsKey = input.restrictionsBlock
    ? `|res=${crypto.createHash("sha256").update(input.restrictionsBlock).digest("hex").slice(0, 12)}`
    : "";
  const versionKey = `|v=${PROMPT_VERSION}`;
  const hash = crypto.createHash("sha256").update(list + productKey + profileKey + restrictionsKey + versionKey).digest("hex").slice(0, 32);
  return `synthesis:${hash}`;
}

function buildPrompt(input: SynthesisInput): { system: string; user: string } {
  const red = input.enriched.filter((r) => r.color_rating === "Rouge");
  const orange = input.enriched.filter((r) => r.color_rating === "Orange");
  const yellow = input.enriched.filter((r) => r.color_rating === "Jaune");
  const green = input.enriched.filter((r) => r.color_rating === "Vert");
  const positives = input.observations.filter((o) => o.status === "absent").map((o) => o.label);
  const total =
    (input.counts.Vert ?? 0) +
    (input.counts.Jaune ?? 0) +
    (input.counts.Orange ?? 0) +
    (input.counts.Rouge ?? 0);

  // Top 3 ingredients by position - they define the "character" of the
  // formula (water-based, oil-based, alcohol-heavy, etc.).
  const top3 = input.enriched
    .slice()
    .sort((a, b) => a.position_idx - b.position_idx)
    .slice(0, 3)
    .map((r) => `${r.name ?? r.input_raw}${r.primary_function ? ` (${r.primary_function})` : ""}`);

  const greenWithFunction = green
    .filter((r) => r.primary_function && r.name)
    .slice(0, 6)
    .map((r) => `- ${r.name} : ${r.primary_function}`);

  // Per-ingredient row. Includes [tags], [position] and [restriction] flags
  // when present. The LLM uses [restriction] to surface the match inside
  // the relevant bullet.
  const fmt = (r: SynthesisInput["enriched"][number]) =>
    `- ${r.name ?? r.input_raw} : ${r.primary_function ?? "fonction inconnue"}`
    + `${r.tags && r.tags.length ? ` [tags: ${r.tags.slice(0, 3).join(", ")}]` : ""}`
    + `${r.threshold_label ? ` [position: ${r.threshold_label}]` : ""}`
    + `${r.restriction_reason ? ` [restriction: ${r.restriction_reason}]` : ""}`;

  const restrictedIngredients = input.enriched.filter((r) => r.restriction_reason);
  const hasProfile = Boolean(input.profileBlock);
  const hasRestrictions = Boolean(input.restrictionsBlock);
  const hasMatches = restrictedIngredients.length > 0;

  const baseSystem =
    "Tu écris la synthèse d'une analyse cosmétique INCI pour un consommateur français.\n\n"
    + "TON & STYLE : comme un pote bien informé qui te parle franchement, sans tourner autour du pot. Phrases courtes, vocabulaire simple mais jamais enfantin. Tu peux dire \"franchement\", \"honnêtement\", \"au final\", \"bonne nouvelle\", \"là, attention\", \"tu peux respirer\", \"ya pas de mystère\". Tu utilises \"tu\" et la 2e personne. Pas d'emoji, pas de marketing (\"idéal\", \"généreux\", \"rassurant\", \"agréable\"), pas de description sensorielle (texture, odeur, fini), pas de conseil médical.\n\n"
    + "MISE EN FORME : **gras** UNIQUEMENT pour les noms INCI. Pas de titre, pas de préambule, pas de signature.\n\n"
    + NO_LONG_DASHES_RULE + "\n\n"
    + "RESTRICTIONS : quand une ligne d'ingrédient porte [restriction: X], cet ingrédient est dans les restrictions de l'utilisateur (X est le libellé). DANS la puce concernée, mentionne-le clairement, par exemple en glissant \"(..., dans tes restrictions)\" juste après le nom + rôle. Pas de paragraphe dédié.\n\n"
    + "ROUGES ET ORANGES : pour chaque rouge, fais 1 puce avec un DANGER CONCRET BREF (1 phrase, exemples : \"peut provoquer des bronchospasmes chez l'asthmatique\", \"soupçonné de favoriser des kystes\", \"lié à des cas d'irritation sévère documentés\", \"libère du formaldéhyde, classé cancérigène\"). Pour les oranges :\n"
    + "- 1 à 2 oranges isolés → 1 puce par ingrédient avec un effet concret bref.\n"
    + "- 3 oranges OU plusieurs oranges de la MÊME famille (même tag) → 1 SEULE puce groupée qui les cite tous en **gras** et donne le mécanisme/danger commun en une phrase. Exemple : \"- **Dimethicone**, **Cyclopentasiloxane**, **Cyclomethicone** (trois silicones) : ils donnent l'effet peau lisse à l'application, mais peuvent étouffer la peau et favoriser les points noirs sur la durée.\"\n\n"
    + "JAUNES : 1 à 3 jaunes notables = 1 puce courte chacun. Plus de 3 = regroupés en 1 puce \"À surveiller selon les peaux sensibles : NOM1, NOM2...\".";

  let system = baseSystem;
  if (input.profileBlock) {
    system += `\n\n${input.profileBlock}\n\nQuand un ingrédient touche directement ce profil (peau sèche + alcool dénaturé, peau sensible + parfum chargé, etc.), souligne-le dans la puce concernée et adapte le closing.`;
  }
  if (input.restrictionsBlock) {
    system += `\n\n${input.restrictionsBlock}\n\nC'est la liste de référence pour les ingrédients à signaler comme restreints (voir aussi le flag [restriction: X] sur les lignes d'ingrédients).`;
  }

  // Build the opening rule dynamically so the LLM knows exactly which
  // template to instantiate based on context.
  const openingRule = (() => {
    if (hasMatches) {
      const first = restrictedIngredients[0];
      const firstName = first.name ?? first.input_raw;
      const firstReason = first.restriction_reason;
      return `Le produit contient au moins un ingrédient des restrictions de l'utilisateur (${firstName} → ${firstReason}). OUVERTURE OBLIGATOIRE : commence par "Pour toi" et signale CE point en premier. Exemple : "Pour toi : ce produit contient **${firstName}** que tu as choisi d'éviter." (adapte la formulation, mais cite l'ingrédient ET sa restriction).`;
    }
    if (hasRestrictions) {
      return `L'utilisateur a défini des restrictions mais AUCUNE ne match dans cette formule. OUVERTURE OBLIGATOIRE : rassure d'entrée. Exemple : "Bonne nouvelle d'entrée : aucune de tes restrictions ici." (varie la formulation).`;
    }
    if (hasProfile) {
      return `L'utilisateur a un profil rempli mais pas de restrictions. OUVERTURE OBLIGATOIRE : pose le contexte personnel en 1 phrase d'accroche reliée à son profil. Exemple : "Pour ta peau sèche et sensible, voici ce qu'il faut savoir." (adapte au profil exact, ne sois pas générique).`;
    }
    return `L'utilisateur n'a renseigné ni profil ni restrictions. OUVERTURE OBLIGATOIRE : un hook factuel et concret sur le type de produit ou son caractère, basé sur les 3 premiers ingrédients. Exemple : "Un déo en spray bien classique." OU "Une formule légère dominée par l'eau et la glycérine." (pas générique, pas marketing).`;
  })();

  const closingRule = (() => {
    if (hasMatches) {
      return `CLOSING (DERNIÈRE PUCE, obligatoire) : recommandation franche personnalisée qui s'appuie sur la/les restriction(s) matchée(s) et sur le profil si présent. Tu PEUX dire "vise plutôt", "à utiliser de temps en temps", "pour toi, ya mieux ailleurs", "à éviter au quotidien", "à toi de voir si tu veux quelque chose de plus sobre". Commence la puce par "- Pour toi" ou "- Au final" ou "- Franchement".`;
    }
    if (hasRestrictions || hasProfile) {
      return `CLOSING (DERNIÈRE PUCE, obligatoire) : recommandation douce personnalisée qui relie le verdict de la formule au profil/restrictions de l'utilisateur. Tu PEUX dire "pour toi", "vise plutôt", "à toi de voir", "au final pour ton profil". Commence par "- Pour toi" ou "- Au final".`;
    }
    return `CLOSING (DERNIÈRE PUCE, obligatoire) : 1 phrase de prise de recul factuelle SUIVIE d'un soft nudge à compléter le profil. Exemple : "- Au final, c'est un anti-transpirant efficace mais chargé en parfum. Tu peux remplir ton profil ou tes restrictions dans l'app si tu veux qu'on te dise précisément si ce produit te va."`;
  })();

  const user = `Rédige la synthèse de l'analyse INCI ci-dessous en suivant la STRUCTURE imposée.

CONTEXTE :
- Profil utilisateur : ${hasProfile ? "REMPLI (voir bloc dans le system prompt)" : "VIDE"}
- Restrictions utilisateur : ${hasRestrictions ? "DÉFINIES (voir bloc dans le system prompt)" : "AUCUNE"}
- Ingrédients de cette formule en restriction : ${hasMatches ? restrictedIngredients.map((r) => `${r.name ?? r.input_raw} (${r.restriction_reason})`).join(", ") : "AUCUN"}

STRUCTURE OBLIGATOIRE (deux blocs séparés par une ligne vide) :

BLOC 1 (prose, 2 à 3 phrases, pas de puce) :
- Phrase 1 (OUVERTURE) — règle :
  ${openingRule}
- Phrase 2 (CONSTAT CHIFFRÉ, naturel) : ${total === 0 ? "Aucun ingrédient n'a pu être reconnu dans la liste fournie. Dis-le simplement, sans utiliser de chiffres comme \"0 sur 0\" ou \"0 ingrédient\". Exemple : \"Aucun ingrédient de cette liste n'est dans notre base, difficile d'aller plus loin.\" ou \"La formule n'a pas pu être lue, les ingrédients sont peut-être mal orthographiés ou trop fragmentés.\" (adapte selon le contexte)." : `"Sur les ${total} ingrédients identifiés, ${input.counts.Vert ?? 0} sont sans risque connu et ${(input.counts.Jaune ?? 0) + (input.counts.Orange ?? 0) + (input.counts.Rouge ?? 0)} méritent un coup d'œil." (varie la formulation, garde les chiffres).`}
- Phrase 3 (TRANSITION, courte) : "Voici ce qui mérite ton attention :" ou similaire.
- ANTI-DOUBLON : ne cite jamais deux fois le même ingrédient dans le bloc 1. Si tu utilises la traduction française ("l'eau", "le beurre de karité"), n'ajoute pas le nom INCI entre parenthèses. Choisis UNE formulation par ingrédient.

BLOC 2 (puces, chaque ligne commence par "- ", 4 à 7 puces max) :

1. ROUGES : 1 puce par ingrédient rouge, avec un DANGER CONCRET BREF. Format :
"- **NOM** (famille + rôle simple${hasMatches ? ", et si flag [restriction], ajouter \", dans tes restrictions\"" : ""}) : danger concret en 1 phrase. Position en fin de phrase si dispo."

2. ORANGES : applique la règle de groupage du system prompt :
- 1 à 2 oranges isolés (familles différentes) → 1 puce par ingrédient avec effet concret bref.
- 3 oranges OU plusieurs de la même famille (même tag dans [tags: ...]) → 1 puce groupée.

3. JAUNES :
- 1 à 3 jaunes notables → 1 puce courte chacun.
- Plus de 3 → 1 puce groupée "À surveiller selon les peaux sensibles : **NOM1**, **NOM2**, **NOM3**...".

4. BONUS optionnel (max 1) :
- "Bon à savoir" sur UN VERT notable (Niacinamide, Acide Hyaluronique, Panthénol, Centella Asiatica). Ignore eau / glycérine / propanediol / sodium hydroxide / pH ajusteurs.
- INTERDIT : ne jamais énumérer ce qui est absent (style "Sans parabens, sans sulfates..."). Cette information est déjà affichée dans le panneau Observations, la répéter ici alourdit la synthèse.

5. CLOSING (DERNIÈRE PUCE, obligatoire) — règle :
   ${closingRule}

CONTRAINTES STRICTES :
- Total puces (bloc 2) : 4 à 7 max, closing comprise.
- Chaque puce : 1 à 2 phrases courtes. Pas de pavé.
- Pas de jargon médical (dermatite, eczéma, comédogène, sébo-régulateur). Préfère "peut irriter", "peut boucher les pores".
- INTERDIT absolu : les verbes "soigne", "traite", "guérit", "cicatrise", "régénère", "répare", "restaure" — réservés aux médicaments (Règlement CE 1223/2009). Utilise à la place : "entretient la peau", "maintient en bon état", "hydrate", "adoucit", "protège", "reconstitue".
- Pas d'emoji, pas d'astérisque autre que les **gras INCI**.
- AUCUN tiret cadratin (—) ni demi-cadratin (–). Utilise virgule, deux-points ou nouvelle phrase.
- VARIE l'attaque du bloc 1 d'une analyse à l'autre.
- Si tu cites le danger concret d'un rouge/orange, reste sobre et factuel : pas de catastrophisme, pas d'invention. Si tu n'as aucune raison documentée, dis-le platement (\"controversé sans consensus clair\").

DONNÉES :
${input.productLabel ? `Produit : ${input.productLabel}` : "Produit : liste collée par l'utilisateur, pas de nom de produit fourni."}
Note : ${input.score.toFixed(1)}/20 (${input.scoreLabel})
Comptes : Vert=${input.counts.Vert ?? 0}, Jaune=${input.counts.Jaune ?? 0}, Orange=${input.counts.Orange ?? 0}, Rouge=${input.counts.Rouge ?? 0}, total reconnu=${total}.

3 premiers ingrédients (utilisés pour caractériser la formule si tu rédiges un hook produit) :
${top3.length ? top3.map((t, i) => `${i + 1}. ${t}`).join("\n") : "(non disponible)"}

ROUGES :
${red.length ? red.map(fmt).join("\n") : "(aucun)"}

ORANGE :
${orange.length ? orange.map(fmt).join("\n") : "(aucun)"}

JAUNES (jusqu'à 8 cités) :
${yellow.length ? yellow.slice(0, 8).map(fmt).join("\n") + (yellow.length > 8 ? `\n- et ${yellow.length - 8} autres` : "") : "(aucun)"}

VERTS notables (utilise UN seul pour la puce "Bon à savoir" si pertinent) :
${greenWithFunction.length ? greenWithFunction.join("\n") : "(aucun avec fonction connue)"}

Écris maintenant la synthèse en suivant la structure (Bloc 1 prose, ligne vide, Bloc 2 puces). Pas de titre, pas de préambule, pas de signature.`;

  return { system, user };
}

async function callMistralFallback(input: SynthesisInput): Promise<string | null> {
  if (!hasMistral()) return null;
  const { system, user } = buildPrompt(input);
  const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      temperature: 0.55,
      top_p: 0.95,
      max_tokens: 900,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!r.ok) return null;
  const json = (await r.json()) as { choices?: { message?: { content?: string } }[] };
  return json?.choices?.[0]?.message?.content?.trim() ?? null;
}

export async function generateSynthesis(input: SynthesisInput): Promise<string | null> {
  const cacheKey = makeCacheKey(input);
  const cached = await getCached<{ text: string }>(cacheKey);
  if (cached?.text) return cached.text;

  // No AI provider available at all → return null gracefully.
  if (!hasOpenAI() && !hasMistral()) return null;

  const { system, user } = buildPrompt(input);

  try {
    const text = await callWithFallback<string | null>({
      feature: "synthesis",
      userId: input.userId ?? null,
      timeoutMs: 25_000,
      primary: async () => {
        if (!hasOpenAI()) throw new Error("openai disabled");
        const resp = await openai().chat.completions.create({
          model: AI_MODEL,
          temperature: 0.55,
          top_p: 0.95,
          max_tokens: 900,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        });
        const raw = resp.choices?.[0]?.message?.content?.trim() ?? null;
        // Post-process safety net: strip em/en-dashes the model may sneak in
        // despite the instruction.
        const value = raw ? stripLongDashes(raw) : null;
        return {
          value,
          tokensIn: resp.usage?.prompt_tokens,
          tokensOut: resp.usage?.completion_tokens,
        };
      },
      fallback: async () => {
        const raw = await callMistralFallback(input);
        return {
          value: raw ? stripLongDashes(raw) : null,
          provider: "mistral" as const,
        };
      },
    });

    if (text) {
      // Cache asynchronously, don't block the response on it.
      void setCached(cacheKey, { text });
    }
    return text;
  } catch {
    return null;
  }
}
