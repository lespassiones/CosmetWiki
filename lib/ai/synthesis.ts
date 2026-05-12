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
  }[];
  counts: Record<string, number>;
  score: number;
  scoreLabel: string;
  observations: { label: string; status: "present" | "absent" | "info" | "warn"; count: number }[];
  productLabel: string | null;
  userId?: string | null;
};

function makeCacheKey(input: SynthesisInput): string {
  const list = input.enriched
    .map((r) => `${(r.name ?? r.input_raw).trim().toUpperCase()}:${r.color_rating ?? "?"}`)
    .join("|");
  const productKey = input.productLabel ? `|p=${input.productLabel.toLowerCase()}` : "";
  const hash = crypto.createHash("sha256").update(list + productKey).digest("hex").slice(0, 32);
  return `synthesis:${hash}`;
}

function buildPrompt(input: SynthesisInput): { system: string; user: string } {
  const red = input.enriched.filter((r) => r.color_rating === "Rouge");
  const orange = input.enriched.filter((r) => r.color_rating === "Orange");
  const yellow = input.enriched.filter((r) => r.color_rating === "Jaune");
  const mainIngredients = input.enriched
    .slice(0, 3)
    .map((r) => `${r.name ?? r.input_raw}${r.primary_function ? ` (${r.primary_function})` : ""}`);
  const greenHero = input.enriched.find(
    (r) => r.color_rating === "Vert" && r.primary_function && r.name,
  );
  const greenHeroLine = greenHero
    ? `${greenHero.name} (${greenHero.primary_function})`
    : "(aucun ingrédient vert avec fonction connue)";
  const positives = input.observations.filter((o) => o.status === "absent").map((o) => o.label);
  const presents = input.observations
    .filter((o) => o.status === "present")
    .map((o) => `${o.label} (${o.count})`);
  const total =
    (input.counts.Vert ?? 0) +
    (input.counts.Jaune ?? 0) +
    (input.counts.Orange ?? 0) +
    (input.counts.Rouge ?? 0);

  const system =
    "Tu es un analyste INCI FACTUEL — pas un rédacteur marketing, pas un vendeur. Tu écris pour le grand public français à partir de données fournies, JAMAIS d'invention. Tu énonces les faits chiffrés et tu attires l'attention sur les ingrédients problématiques sans dramatiser. Tu n'utilises JAMAIS de langage marketing (pas de 'mise sur', 'rassurant', 'idéal', 'généreux', 'simplicité', 'apporte', 'offre', 'agréable'…). Tu ne décris JAMAIS la texture ni le parfum. Tu ne recommandes JAMAIS d'acheter ni d'éviter le produit. Tu ne donnes AUCUN conseil médical. Tu structures TOUJOURS ta sortie en deux blocs : un paragraphe court de 2-3 phrases (prose, pas de puces) qui (a) donne le constat chiffré, (b) cite UN bon ingrédient avec sa fonction, (c) FINIT par une phrase de transition introduisant la liste, puis une ligne vide, puis un bloc de puces (chaque ligne commençant par '- '). Tu encadres les noms INCI avec **. Tu varies les formulations d'un produit à l'autre.";

  const user = `Tu rédiges la synthèse d'une analyse INCI cosmétique pour un consommateur français.
Tu es un analyste FACTUEL, pas un rédacteur marketing. Pas de blabla, pas de mise en valeur du produit.

STRUCTURE OBLIGATOIRE — DEUX BLOCS SÉPARÉS PAR UNE LIGNE VIDE.

BLOC 1 — Paragraphe court (2 à 3 phrases MAXIMUM, en prose, AUCUNE puce)
Ce paragraphe doit dire dans cet ordre logique :
  (a) Le constat chiffré : combien d'ingrédients verts (bon signal) vs combien d'orange ou rouges (à examiner).
      Ex : "Sur les ${total} ingrédients reconnus, ${input.counts.Vert} sont classés vert et ${input.counts.Orange + input.counts.Rouge} demandent une attention particulière."
  (b) UNE phrase qui cite UN seul bon ingrédient présent et dit BREF à quoi il sert (pas d'éloge).
      Ex : "**${greenHero?.name ?? "[ingrédient vert]"}** y joue son rôle d'${greenHero?.primary_function ?? "[fonction]"}."
  (c) UNE phrase de TRANSITION qui introduit la liste à puces qui suit.
      Cette phrase doit ressembler à : "Voici les ingrédients sur lesquels attirer votre attention :" ou "Les points de vigilance ci-dessous :" ou "Voici le détail des ingrédients problématiques :".

BLOC 2 — Liste en PUCES (chaque ligne commence par "- ")
- Cite CHAQUE ingrédient ROUGE : "- **NOM_INCI** ([fonction]) : [1 phrase courte expliquant la pénalité]"
- Cite CHAQUE ingrédient ORANGE (limite 6, sinon les 5 premiers + "- et N autres") : "- **NOM_INCI** ([fonction]) : [1 phrase courte sur la pénalité]"
- Si plus de 3 jaunes notables, regroupe-les en UNE puce : "- Quelques ingrédients jaunes à surveiller : **NOM1**, **NOM2**, **NOM3**…"
- Si pertinent, UNE puce d'absences : "- Sans **parabens**, sans **sulfates**, sans **silicones**, sans **huiles minérales**" — uniquement les absences réelles.
- Termine par UNE puce factuelle "- À savoir : …" (ex. test sur petite zone, position dans la liste = concentration). Pas de conseil médical.

CE QUE TU NE DOIS JAMAIS FAIRE
- AUCUN langage marketing. Mots et tournures INTERDITS : "mise sur", "rassurante", "rassurant", "généreuse", "généreux", "idéal", "idéale", "parfait", "parfaite", "doux comme caresse", "simplicité", "merites", "vanter", "offre", "apporte un confort", "soin idéal", "à appliquer matin et soir", "en confiance", "agréable".
- AUCUNE recommandation d'achat ou d'évitement ("à acheter", "à éviter", "produit dangereux", "produit excellent", "à recommander").
- AUCUNE description sensorielle (texture, parfum, agréable, doux, fondant, onctueux…).
- AUCUNE phrase qui déduit un usage ("crème pour peau sèche", "produit anti-âge"…) — concentre-toi UNIQUEMENT sur les ingrédients.
- AUCUN conseil médical, AUCUN emoji.
- Tu ne dis JAMAIS "ce produit est bon" ni "ce produit est mauvais". Tu énonces les faits ingrédient par ingrédient.
- Encadre TOUJOURS les noms INCI cités avec **.
- VARIE les formulations entre produits — ne réutilise pas mécaniquement la même phrase d'attaque.

DONNÉES FACTUELLES
${input.productLabel ? `Produit analysé : ${input.productLabel}` : "Produit : composition collée par l'utilisateur (pas de nom fourni)."}
Note globale : ${input.score.toFixed(1)}/20 (${input.scoreLabel})
Comptes : Vert ${input.counts.Vert}, Jaune ${input.counts.Jaune}, Orange ${input.counts.Orange}, Rouge ${input.counts.Rouge}
3 premiers ingrédients (concentration) : ${mainIngredients.join(", ") || "(non disponibles)"}
Ingrédient vert "hero" suggéré pour le paragraphe : ${greenHeroLine}

Ingrédients ROUGES :
${red.length ? red.map((r) => `- ${r.name} — ${r.primary_function ?? "fonction inconnue"}`).join("\n") : "(aucun)"}

Ingrédients ORANGE :
${orange.length ? orange.map((r) => `- ${r.name} — ${r.primary_function ?? "fonction inconnue"}`).join("\n") : "(aucun)"}

Ingrédients JAUNES (jusqu'à 8 cités) :
${yellow.length ? yellow.slice(0, 8).map((r) => r.name).join(", ") + (yellow.length > 8 ? ` et ${yellow.length - 8} autres` : "") : "(aucun)"}

Observations positives (absences) : ${positives.join(", ") || "(aucune)"}
Observations présentes : ${presents.join(", ") || "(aucune)"}

Rédige maintenant la synthèse. Bloc 1 (prose, 2-3 phrases, finis par la phrase de transition), ligne vide, puis Bloc 2 (puces) :`;

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
