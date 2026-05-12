/**
 * Synthesis generation. Primary: OpenAI gpt-4o-mini. Fallback: Mistral.
 * Cached by hash of the normalized INCI list.
 */
import crypto from "node:crypto";
import { AI_MODEL, callWithFallback, getCached, hasMistral, hasOpenAI, openai, setCached } from "./client";
import type { ColorRating } from "@/lib/supabase";

export type SynthesisInput = {
  enriched: {
    input_raw: string;
    name: string | null;
    color_rating: ColorRating | null;
    primary_function: string | null;
    tags: string[] | null;
    position_idx: number;
    /** Short human label like "avant parfum" / "après conservateur" — null when not applicable. */
    threshold_label?: string | null;
  }[];
  counts: Record<string, number>;
  score: number;
  scoreLabel: string;
  observations: { label: string; status: "present" | "absent" | "info" | "warn"; count: number }[];
  productLabel: string | null;
  userId?: string | null;
};

// Bump this any time `buildPrompt()` changes meaningfully — old cached
// outputs keyed on the previous version will no longer be served.
const PROMPT_VERSION = 3;

function makeCacheKey(input: SynthesisInput): string {
  const list = input.enriched
    .map((r) => `${(r.name ?? r.input_raw).trim().toUpperCase()}:${r.color_rating ?? "?"}`)
    .join("|");
  const productKey = input.productLabel ? `|p=${input.productLabel.toLowerCase()}` : "";
  const versionKey = `|v=${PROMPT_VERSION}`;
  const hash = crypto.createHash("sha256").update(list + productKey + versionKey).digest("hex").slice(0, 32);
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

  // Top 3 ingredients by position — these define the "character" of the
  // formula (water-based, oil-based, alcohol-heavy, etc.). The model uses
  // them to write the opening sentence with personality.
  const top3 = input.enriched
    .slice()
    .sort((a, b) => a.position_idx - b.position_idx)
    .slice(0, 3)
    .map((r) => `${r.name ?? r.input_raw}${r.primary_function ? ` (${r.primary_function})` : ""}`);

  // A handful of green ingredients with a known function — the model picks
  // ONE if it has something genuinely interesting to say. Optional.
  const greenWithFunction = green
    .filter((r) => r.primary_function && r.name)
    .slice(0, 6)
    .map((r) => `- ${r.name} — ${r.primary_function}`);

  // Helper: full data per ingredient with position hint when available.
  const fmt = (r: SynthesisInput["enriched"][number]) =>
    `- ${r.name ?? r.input_raw} — ${r.primary_function ?? "fonction inconnue"}${r.tags && r.tags.length ? ` [tags: ${r.tags.slice(0, 3).join(", ")}]` : ""}${r.threshold_label ? ` [position: ${r.threshold_label}]` : ""}`;

  const system =
    "Tu écris la synthèse d'une analyse cosmétique INCI pour un consommateur français. Style : comme un pote bien informé qui prend 30 secondes pour t'expliquer ce qu'il y a dans le produit. Accessible à un lecteur de 15 ans — phrases courtes, vocabulaire simple, jamais enfantin. Tu peux mentionner brièvement ce qu'est un ingrédient (sa famille : 'alcool dénaturé', 'tensioactif', 'huile minérale', 'silicone', 'conservateur', 'actif hydratant'…) et à quoi il sert généralement en cosmétique — c'est de la connaissance produit, pas de l'invention. Tu peux ajouter UN détail intéressant ou utile par ingrédient flaggé pour que ça ne soit pas un listing sec. Tu n'évalues JAMAIS le produit dans son ensemble ('bon', 'mauvais', 'à éviter', 'à acheter'). Tu attires l'attention, tu laisses décider. Pas de marketing ('idéal', 'généreux', 'rassurant', 'agréable'…), pas de description sensorielle (texture, odeur, fini), pas d'emoji, pas de conseil médical. Tu utilises **gras** uniquement pour les noms INCI.";

  const user = `Rédige la synthèse de l'analyse INCI ci-dessous. Le but : que le lecteur trouve ça intéressant à lire ET concret — pas un résumé sec des chiffres.

STRUCTURE — deux blocs séparés par une ligne vide.

BLOC 1 — Paragraphe d'intro (2 à 3 phrases, prose, pas de puce)
- Phrase 1 : caractérise la formule en t'appuyant sur les 3 premiers ingrédients listés ci-dessous. Donne au lecteur une idée de "à quoi il a affaire" sans juger. Ex : "Cette formule est dominée par l'eau et le glycérine — un duo classique pour rester légère et hydratante." OU "Le produit s'ouvre sur une base d'huile minérale et de silicone, profil typique d'un soin gainant." Pas de mention de note, pas de "bon signal", pas de "rassurant".
- Phrase 2 : le constat chiffré, naturel. Ex : "Sur les ${total} ingrédients identifiés, ${input.counts.Vert ?? 0} sont sans risque connu et ${(input.counts.Jaune ?? 0) + (input.counts.Orange ?? 0) + (input.counts.Rouge ?? 0)} demandent un coup d'œil."
- Phrase 3 (transition) : courte, vers les puces. Ex : "Voici ce qui mérite ton attention :" ou "Les points à connaître :".

BLOC 2 — Puces (chaque ligne commence par "- "). Vise 4 à 6 puces qui apportent vraiment quelque chose.

Pour CHAQUE ingrédient ROUGE et ORANGE (limite combinée : 4 puces, garde les plus parlants si plus) :
"- **NOM** (famille simple + rôle) : un petit fait sur ce qu'il est ou pourquoi il est utilisé, puis l'effet/le souci concret. Si une position [avant/après parfum/conservateur] est dispo, glisse-la EN FIN de phrase pour donner un indice de quantité, sans expliquer la règle."

Exemple de bonne puce :
"- **Alcohol Denat.** (alcool dénaturé, sert à fluidifier la texture et accélérer la pénétration) : courant dans les soins légers, mais peut tirailler les peaux sensibles à l'usage répété — et ici il apparaît avant le parfum, donc présent en bonne quantité."

JAUNES :
- Si 1 à 3 jaunes notables, fais 1 puce par jaune (format identique mais plus court).
- Si plus de 3 jaunes, regroupe-les en UNE puce : "- À surveiller selon les peaux sensibles : **NOM1**, **NOM2**, **NOM3**…"

BONUS — Ajoute si pertinent :
- UNE puce "Bon à savoir" sur UN ingrédient VERT vraiment notable (pas l'eau, pas la glycérine — choisis un actif intéressant comme **Niacinamide**, **Acide Hyaluronique**, **Panthénol**, **Centella Asiatica**…). Ex : "- Bon à savoir : le **Niacinamide** présent ici est un actif populaire pour resserrer les pores et apaiser les rougeurs."
- UNE puce d'absences si la liste 'Absences réelles' n'est pas vide : "- Sans **parabens**, sans **sulfates**, sans **silicones**…" — uniquement les absences fournies, ne pas inventer.

CLOSING — TERMINE par UNE puce qui invite à la réflexion. Ex : "- À toi de voir si ces ingrédients te conviennent — ça dépend aussi de ta peau et de la fréquence d'usage." OU "- Au final, tout dépend de comment tu utilises le produit et de la sensibilité de ta peau."

CONTRAINTES STRICTES
- Total puces (bloc 2) : 4 à 7 maximum.
- Chaque puce : 1 à 2 phrases courtes max. Pas de pavé.
- Pas de jugement global du produit. Pas de "à éviter", "recommandé", "à acheter".
- Pas de "vous devez", "il faut". Préfère "tu peux", "à toi de voir", "selon ta peau".
- Pas de jargon médical (dermatite, eczéma, comédogène, sébo-régulateur…). Préfère "peut irriter", "peut boucher les pores", "régule l'excès de sébum".
- Pas d'emoji, pas d'astérisque autre que ceux du **gras INCI**.
- Si un ingrédient n'a aucune raison concrète d'être flaggé (fonction inconnue, aucun tag), passe-le.
- Si rouge + orange + jaune sont tous vides : bloc 2 = puce "Bon à savoir" (si possible) + puce d'absences (si possible) + puce de closing.
- VARIE l'attaque du bloc 1 d'une analyse à l'autre — ne réutilise pas une phrase type.

DONNÉES
${input.productLabel ? `Produit : ${input.productLabel}` : "Produit : liste collée par l'utilisateur, pas de nom de produit fourni."}
Note : ${input.score.toFixed(1)}/20 (${input.scoreLabel})
Comptes : Vert=${input.counts.Vert ?? 0}, Jaune=${input.counts.Jaune ?? 0}, Orange=${input.counts.Orange ?? 0}, Rouge=${input.counts.Rouge ?? 0}, total reconnu=${total}.

3 premiers ingrédients (à utiliser pour caractériser la formule dans la phrase 1 du bloc 1) :
${top3.length ? top3.map((t, i) => `${i + 1}. ${t}`).join("\n") : "(non disponible)"}

ROUGES :
${red.length ? red.map(fmt).join("\n") : "(aucun)"}

ORANGE :
${orange.length ? orange.map(fmt).join("\n") : "(aucun)"}

JAUNES (jusqu'à 8 cités) :
${yellow.length ? yellow.slice(0, 8).map(fmt).join("\n") + (yellow.length > 8 ? `\n- et ${yellow.length - 8} autres` : "") : "(aucun)"}

VERTS notables (utilise UN seul pour la puce "Bon à savoir" si pertinent — ignore eau / glycérine / propanediol / sodium hydroxide / les pH ajusteurs) :
${greenWithFunction.length ? greenWithFunction.join("\n") : "(aucun avec fonction connue)"}

Absences réelles à mentionner si tu fais la puce d'absences : ${positives.join(", ") || "(aucune)"}

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
        const value = resp.choices?.[0]?.message?.content?.trim() ?? null;
        return {
          value,
          tokensIn: resp.usage?.prompt_tokens,
          tokensOut: resp.usage?.completion_tokens,
        };
      },
      fallback: async () => ({
        value: await callMistralFallback(input),
        provider: "mistral",
      }),
    });

    if (text) {
      // Cache asynchronously — don't block the response on it
      void setCached(cacheKey, { text });
    }
    return text;
  } catch {
    return null;
  }
}
