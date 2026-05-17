/**
 * LLM calls for the "Promesses vs Formule" feature.
 *
 * Two roles, two calls:
 *   1. extractPromisesFromDescription — reads the marketing copy, returns a
 *      structured list of detected promises (constrained to a closed enum of
 *      category slugs from claims.ts) and unverifiable fragments.
 *   2. generateConclusion — writes a single sentence summarising the engine's
 *      verdicts. No invention possible: it's only allowed to rephrase the
 *      already-computed verdicts.
 *
 * Both calls use OpenAI's strict JSON schema mode so the model literally
 * cannot return free-form text. Mistral fallback uses prompt-only structure
 * (Mistral doesn't fully enforce JSON schemas) — the parser is defensive.
 */

import {
  AI_MODEL,
  callWithFallback,
  hasMistral,
  hasOpenAI,
  openai,
} from "./client";
import { NO_LONG_DASHES_RULE, stripLongDashes } from "./sanitize";
import {
  absenceCategoriesForPrompt,
  effectCategoriesForPrompt,
} from "@/lib/coherence/claims";
import type { CoherencePromise } from "@/lib/coherence/types";
import type { LlmPromiseProposal, OpenLlmMatch } from "@/lib/coherence/engine";

// -----------------------------------------------------------------------------
// 1) Promise extraction
// -----------------------------------------------------------------------------

export type ExtractionResult = {
  proposals: LlmPromiseProposal[];
  unverifiable: { excerpt: string; reason: string }[];
};

const UNVERIFIABLE_REASONS = [
  "composition",
  "certification",
  "sensoriel",
  "marketing_general",
  "autre",
] as const;

function buildExtractionPrompt(description: string) {
  const effectCats = effectCategoriesForPrompt();
  const absenceCats = absenceCategoriesForPrompt();
  const effectList = effectCats
    .map(
      (c) =>
        `- ${c.slug} (${c.label}) — actifs typiques : ${c.example_actives.join(", ")}`,
    )
    .join("\n");
  const absenceList = absenceCats
    .map((c) => `- ${c.slug} (${c.label}) — mots-clés : ${c.keywords.join(", ")}`)
    .join("\n");

  const system = `Tu es un assistant qui analyse les descriptions marketing de produits cosmétiques en français.

Ta mission : identifier TOUTES les PROMESSES VÉRIFIABLES (effets ET absences d'ingrédients) et les classer.

═══ CATÉGORIES D'EFFETS (promesses positives sur la peau/cheveux) ═══
${effectList}

═══ CATÉGORIES D'ABSENCE (promesses "sans X") ═══
${absenceList}

CATÉGORIE "autre" :
Si une promesse décrit un effet attendu sur la peau/cheveux MAIS ne tombe dans AUCUNE catégorie d'effet ci-dessus, utilise category_slug="autre" avec un label descriptif clair (ex: "Fixation des boucles", "Régulation du sébum", "Renforcement de la barrière cutanée"…).

═══ RÈGLES IMPORTANTES ═══

1. EXHAUSTIVITÉ : Sois EXHAUSTIF. Une description marketing contient typiquement 3 à 8 promesses distinctes (effets + absences). Si tu n'en trouves qu'une seule sur un texte de 5+ phrases, tu en oublies sûrement.

2. CLAIMS "SANS X" SONT DES PROMESSES VÉRIFIABLES :
   "sans sulfate", "sans paraben", "sans silicone", "sans huile minérale", "sans colorant", "sans parfum" → catégorie absence_* correspondante. Ce sont des promesses, PAS des unverifiable. Le système vérifie ces absences mécaniquement via les tags des ingrédients.

3. promesse vs unverifiable — LA RÈGLE CRITIQUE :
   ✓ EST UNE PROMESSE = un EFFET attendu OU une absence d'ingrédient :
     - Effets : "hydrate", "fortifie", "anti-frisottis", "définit les boucles"…
     - Absences (catégories absence_*) : "sans sulfate", "sans paraben"…

   ✗ EST UNVERIFIABLE = ni effet ni absence d'ingrédient identifiable :
     - composition générale non vérifiable : "97 % d'origine naturelle", "à base de B5",
       "100 % naturel", "formule clean" (calcul indisponible — pas dans le périmètre)
     - certification : "Ecocert", "Cosmos Organic", "vegan", "cruelty-free", "bio"
     - sensoriel : "odeur sucrée", "texture fondante", "goût citronné", "mousse rapidement"
     - marketing_general : "véritable soin", "efficacité prouvée", "résultats visibles", "économique", "packaging recyclable"

4. RÈGLE D'OR : si une phrase dit qu'un ingrédient FAIT quelque chose ("la provitamine B5 fortifie les cheveux"), c'est une PROMESSE d'effet. Si elle dit qu'un ingrédient N'EST PAS dedans ("sans sulfate"), c'est une PROMESSE d'absence. Sinon c'est unverifiable.

5. DÉDUPLICATION : Une même catégorie n'apparaît qu'UNE seule fois (excerpt = la formulation la plus claire). "hydrate" + "préserve l'hydratation" = 1 seule promesse hydratation. "sans sulfate ni silicone" → 2 promesses absence (absence_sulfate + absence_silicone), excerpt commun.

6. EXCERPT : verbatim exact (ou fragment fidèle), max 80 caractères.

7. La description peut être en français ou en anglais.

═══ EXEMPLE COMPLET ═══

Description : "Cette gelée hydrate les cheveux, fixe les boucles et limite les frisottis. Sans sulfate ni silicone, formulée à 96 % naturel, odeur de vanille."

Tu dois extraire :
- promises:
  · {category_slug: "hydratation", label: "Hydratation", excerpt: "hydrate les cheveux"}
  · {category_slug: "autre", label: "Fixation des boucles", excerpt: "fixe les boucles"}
  · {category_slug: "anti_frisottis", label: "Anti-frisottis", excerpt: "limite les frisottis"}
  · {category_slug: "absence_sulfate", label: "Sans sulfate", excerpt: "sans sulfate"}
  · {category_slug: "absence_silicone", label: "Sans silicone", excerpt: "ni silicone"}
- unverifiable:
  · {excerpt: "formulée à 96 % naturel", reason: "composition"}
  · {excerpt: "odeur de vanille", reason: "sensoriel"}

→ 5 promesses (3 effets + 2 absences), 2 mentions non vérifiables.`;

  const user = `Description du produit (à analyser) :
"""
${description.trim().slice(0, 4000)}
"""

Retourne le JSON.`;

  return { system, user };
}

const EXTRACTION_SCHEMA = {
  name: "promise_extraction",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      promises: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            category_slug: { type: "string" },
            label: { type: "string" },
            excerpt: { type: "string" },
          },
          required: ["category_slug", "label", "excerpt"],
        },
      },
      unverifiable: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            excerpt: { type: "string" },
            reason: { type: "string", enum: [...UNVERIFIABLE_REASONS] },
          },
          required: ["excerpt", "reason"],
        },
      },
    },
    required: ["promises", "unverifiable"],
  },
} as const;

/** Mistral fallback (prompt-only structure, defensive parser). */
async function mistralExtract(description: string): Promise<ExtractionResult | null> {
  if (!hasMistral()) return null;
  const { system, user } = buildExtractionPrompt(description);
  const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      temperature: 0.1,
      max_tokens: 1500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `${user}\n\nFormat strict :\n{ "promises": [{"category_slug","label","excerpt"}], "unverifiable": [{"excerpt","reason"}] }`,
        },
      ],
    }),
  });
  if (!r.ok) return null;
  const json = (await r.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json?.choices?.[0]?.message?.content;
  if (!raw) return null;
  return safeParseExtraction(raw);
}

function safeParseExtraction(raw: string): ExtractionResult | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as Record<string, unknown>;
    const promises = Array.isArray(obj.promises) ? obj.promises : [];
    const unverifiable = Array.isArray(obj.unverifiable) ? obj.unverifiable : [];
    return {
      proposals: promises
        .map((p) => p as Record<string, unknown>)
        .filter(
          (p): p is { category_slug: string; label: string; excerpt: string } =>
            typeof p.category_slug === "string"
            && typeof p.label === "string"
            && typeof p.excerpt === "string",
        )
        .map((p) => ({
          category_slug: p.category_slug,
          label: p.label,
          excerpt: p.excerpt.slice(0, 200),
        })),
      unverifiable: unverifiable
        .map((u) => u as Record<string, unknown>)
        .filter(
          (u): u is { excerpt: string; reason: string } =>
            typeof u.excerpt === "string" && typeof u.reason === "string",
        )
        .map((u) => ({
          excerpt: u.excerpt.slice(0, 200),
          reason: UNVERIFIABLE_REASONS.includes(
            u.reason as (typeof UNVERIFIABLE_REASONS)[number],
          )
            ? u.reason
            : "autre",
        })),
    };
  } catch {
    return null;
  }
}

export async function extractPromisesFromDescription(
  description: string,
  userId?: string | null,
): Promise<ExtractionResult> {
  if (!hasOpenAI() && !hasMistral()) {
    return { proposals: [], unverifiable: [] };
  }

  const { system, user } = buildExtractionPrompt(description);

  try {
    const result = await callWithFallback<ExtractionResult | null>({
      feature: "categorize",
      userId: userId ?? null,
      timeoutMs: 25_000,
      primary: async () => {
        if (!hasOpenAI()) throw new Error("openai disabled");
        const resp = await openai().chat.completions.create({
          model: AI_MODEL,
          temperature: 0.1,
          max_tokens: 1500,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: {
            type: "json_schema",
            json_schema: EXTRACTION_SCHEMA,
          },
        });
        const raw = resp.choices?.[0]?.message?.content ?? null;
        const value = raw ? safeParseExtraction(raw) : null;
        return {
          value,
          tokensIn: resp.usage?.prompt_tokens,
          tokensOut: resp.usage?.completion_tokens,
        };
      },
      fallback: async () => ({
        value: await mistralExtract(description),
        provider: "mistral",
      }),
    });
    return result ?? { proposals: [], unverifiable: [] };
  } catch {
    return { proposals: [], unverifiable: [] };
  }
}

// -----------------------------------------------------------------------------
// 1.5) Open-promise exploration
//      For promises that don't map to a static catalogue category, we ask the
//      LLM to look at the actual ingredients of the formula and pick the ones
//      it considers active for that specific promise. The LLM is given the
//      list of items by slug — it can ONLY cite slugs from that list, so it
//      cannot invent ingredients. The engine re-validates every cited slug
//      anyway as a defence-in-depth measure (see resolveOpenPromise).
// -----------------------------------------------------------------------------

export type FormulaItemForLlm = {
  slug: string;
  name: string;
  primaryFunction: string | null;
};

export type OpenPromiseExploration = {
  matches: OpenLlmMatch[];
  /** Documented actives the LLM expected but didn't find in the formula. */
  missing: string[];
};

const OPEN_PROMISE_SCHEMA = {
  name: "open_promise_exploration",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      matches: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            item_slug: { type: "string" },
            item_name: { type: "string" },
            evidence: {
              type: "string",
              enum: ["documented", "supportive", "marketing"],
            },
            reason: { type: "string" },
          },
          required: ["item_slug", "item_name", "evidence", "reason"],
        },
      },
      missing: { type: "array", items: { type: "string" } },
    },
    required: ["matches", "missing"],
  },
} as const;

function buildOpenPromisePrompt(
  promiseLabel: string,
  promiseExcerpt: string,
  items: FormulaItemForLlm[],
) {
  // Compact list — only items with a slug (the only ones we can match back
  // mechanically). Truncate to 60 to control prompt size on long formulas.
  const itemsList = items
    .slice(0, 60)
    .map(
      (it, i) =>
        `${i + 1}. ${it.name} (slug: ${it.slug})${
          it.primaryFunction ? ` — ${it.primaryFunction}` : ""
        }`,
    )
    .join("\n");

  const system = `Tu es chimiste cosmétique. On te donne une promesse marketing extraite d'un produit, et la liste réelle des ingrédients de ce produit. Tu dois identifier QUELS ingrédients de la liste soutiennent biologiquement cette promesse.

RÈGLES STRICTES (anti-hallucination) :
1. Tu ne peux citer QUE les ingrédients de la liste fournie. Le champ item_slug DOIT être un slug exact présent dans la liste. JAMAIS d'ingrédient inventé.
2. Pour chaque ingrédient pertinent, choisis un niveau d'évidence :
   - "documented" : actif biologiquement reconnu pour cette promesse, à des doses cosmétiques usuelles (ex: caféine pour anti-chute, niacinamide pour pores)
   - "supportive" : contribue indirectement (ex: panthénol pour confort général)
   - "marketing" : effet visuel/sensoriel uniquement, pas biologique (ex: silicones qui donnent un toucher "lisse")
3. Si AUCUN ingrédient de la liste ne soutient la promesse, retourne matches: [].
4. Sois conservateur. Mieux vaut sous-citer que sur-citer. Si tu n'es pas sûr, ne cite pas.
5. Pas plus de 6 matches au total.
6. Tu peux aussi lister jusqu'à 5 actifs documentés qui auraient typiquement été utilisés pour cette promesse mais qui ne sont PAS dans la liste (champ "missing"). Noms en français de préférence.`;

  const user = `Promesse à vérifier : "${promiseLabel}"
Phrase exacte de la description : "${promiseExcerpt}"

Liste des ingrédients du produit (slug INCI + fonction principale) :
${itemsList}

Retourne le JSON.`;

  return { system, user };
}

function safeParseOpenPromise(raw: string): OpenPromiseExploration | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as Record<string, unknown>;
    const matches = Array.isArray(obj.matches) ? obj.matches : [];
    const missing = Array.isArray(obj.missing) ? obj.missing : [];
    return {
      matches: matches
        .map((m) => m as Record<string, unknown>)
        .filter(
          (
            m,
          ): m is {
            item_slug: string;
            item_name: string;
            evidence: "documented" | "supportive" | "marketing";
            reason: string;
          } =>
            typeof m.item_slug === "string"
            && typeof m.item_name === "string"
            && typeof m.reason === "string"
            && (m.evidence === "documented"
              || m.evidence === "supportive"
              || m.evidence === "marketing"),
        )
        .slice(0, 6)
        .map((m) => ({
          item_slug: m.item_slug,
          item_name: m.item_name,
          evidence: m.evidence,
          reason: m.reason.slice(0, 200),
        })),
      missing: missing
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.slice(0, 80))
        .slice(0, 5),
    };
  } catch {
    return null;
  }
}

async function mistralExploreOpen(
  promiseLabel: string,
  promiseExcerpt: string,
  items: FormulaItemForLlm[],
): Promise<OpenPromiseExploration | null> {
  if (!hasMistral()) return null;
  const { system, user } = buildOpenPromisePrompt(promiseLabel, promiseExcerpt, items);
  const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      temperature: 0.2,
      max_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `${user}\n\nFormat strict :\n{ "matches": [{"item_slug","item_name","evidence","reason"}], "missing": ["string"] }`,
        },
      ],
    }),
  });
  if (!r.ok) return null;
  const json = (await r.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json?.choices?.[0]?.message?.content;
  if (!raw) return null;
  return safeParseOpenPromise(raw);
}

export async function exploreOpenPromise(
  promiseLabel: string,
  promiseExcerpt: string,
  items: FormulaItemForLlm[],
  userId?: string | null,
): Promise<OpenPromiseExploration> {
  if (items.length === 0) return { matches: [], missing: [] };
  if (!hasOpenAI() && !hasMistral()) return { matches: [], missing: [] };

  const { system, user } = buildOpenPromisePrompt(promiseLabel, promiseExcerpt, items);

  try {
    const result = await callWithFallback<OpenPromiseExploration | null>({
      feature: "categorize",
      userId: userId ?? null,
      timeoutMs: 20_000,
      primary: async () => {
        if (!hasOpenAI()) throw new Error("openai disabled");
        const resp = await openai().chat.completions.create({
          model: AI_MODEL,
          temperature: 0.2,
          max_tokens: 1200,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: {
            type: "json_schema",
            json_schema: OPEN_PROMISE_SCHEMA,
          },
        });
        const raw = resp.choices?.[0]?.message?.content ?? null;
        const value = raw ? safeParseOpenPromise(raw) : null;
        return {
          value,
          tokensIn: resp.usage?.prompt_tokens,
          tokensOut: resp.usage?.completion_tokens,
        };
      },
      fallback: async () => ({
        value: await mistralExploreOpen(promiseLabel, promiseExcerpt, items),
        provider: "mistral",
      }),
    });
    return result ?? { matches: [], missing: [] };
  } catch {
    return { matches: [], missing: [] };
  }
}

// -----------------------------------------------------------------------------
// 2) Conclusion sentence
// -----------------------------------------------------------------------------

function buildConclusionPrompt(
  promises: CoherencePromise[],
  productLabel: string | null,
) {
  const tenue = promises.filter((p) => p.verdict === "tenue").map((p) => p.label);
  const partielle = promises.filter((p) => p.verdict === "partielle").map((p) => p.label);
  const marketing = promises.filter((p) => p.verdict === "marketing").map((p) => p.label);
  const non = promises.filter((p) => p.verdict === "non_demontree").map((p) => p.label);
  const contredite = promises.filter((p) => p.verdict === "contredite").map((p) => p.label);

  const system = `Tu rédiges UNE phrase de conclusion (50-120 mots maximum) pour une analyse de cohérence entre les promesses d'un produit cosmétique et sa formule.

Style : direct, factuel, accessible à un consommateur français lambda. Pas de jugement moral, pas d'emoji, pas de marketing inversé ("trompeur"). Tu décris ce que la formule fait probablement vs ce qui est promis.

Si des promesses sont CONTREDITES (le produit dit "sans X" mais contient X), mentionne-les en priorité — c'est l'info la plus actionnable pour l'utilisateur.

Structure attendue : "[ce que la formule tient] mais [ce qu'elle ne tient pas / ce qui est contredit]. Effet attendu : [ce que l'utilisateur peut réellement ressentir]."

NE CITE QUE LES VERDICTS QUE JE TE DONNE. N'invente jamais d'ingrédient ni de verdict.

${NO_LONG_DASHES_RULE}`;

  const user = `${productLabel ? `Produit : ${productLabel}\n\n` : ""}Verdicts (déjà calculés mécaniquement) :
- Promesses TENUES : ${tenue.length ? tenue.join(", ") : "(aucune)"}
- Cohérence PARTIELLE : ${partielle.length ? partielle.join(", ") : "(aucune)"}
- Effet MARKETING uniquement : ${marketing.length ? marketing.join(", ") : "(aucun)"}
- Promesses NON DÉMONTRÉES : ${non.length ? non.join(", ") : "(aucune)"}
- Promesses CONTREDITES par la formule : ${contredite.length ? contredite.join(", ") : "(aucune)"}

Écris la phrase de conclusion. Pas de préambule, juste la phrase.`;

  return { system, user };
}

async function mistralConclusion(
  promises: CoherencePromise[],
  productLabel: string | null,
): Promise<string | null> {
  if (!hasMistral()) return null;
  const { system, user } = buildConclusionPrompt(promises, productLabel);
  const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      temperature: 0.3,
      max_tokens: 250,
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

/** Default conclusion when the LLM is unavailable. */
function fallbackConclusion(promises: CoherencePromise[]): string {
  const tenue = promises.filter((p) => p.verdict === "tenue").length;
  const total = promises.length;
  if (total === 0) {
    return "Aucune promesse d'effet n'a été détectée dans la description fournie.";
  }
  if (tenue === total) {
    return "Toutes les promesses détectées sont soutenues par des actifs documentés dans la formule.";
  }
  if (tenue === 0) {
    return "Aucune des promesses détectées n'est soutenue par un actif documenté dans la formule.";
  }
  return `${tenue} promesse${tenue > 1 ? "s sont tenues" : " est tenue"} sur ${total}, les autres manquent d'actifs documentés dans la formule.`;
}

export async function generateConclusion(
  promises: CoherencePromise[],
  productLabel: string | null,
  userId?: string | null,
): Promise<string> {
  if (!hasOpenAI() && !hasMistral()) return fallbackConclusion(promises);

  const { system, user } = buildConclusionPrompt(promises, productLabel);

  try {
    const text = await callWithFallback<string | null>({
      feature: "synthesis",
      userId: userId ?? null,
      timeoutMs: 15_000,
      primary: async () => {
        if (!hasOpenAI()) throw new Error("openai disabled");
        const resp = await openai().chat.completions.create({
          model: AI_MODEL,
          temperature: 0.3,
          max_tokens: 250,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        });
        const raw = resp.choices?.[0]?.message?.content?.trim() ?? null;
        const value = raw ? stripLongDashes(raw) : null;
        return {
          value,
          tokensIn: resp.usage?.prompt_tokens,
          tokensOut: resp.usage?.completion_tokens,
        };
      },
      fallback: async () => {
        const raw = await mistralConclusion(promises, productLabel);
        return {
          value: raw ? stripLongDashes(raw) : null,
          provider: "mistral" as const,
        };
      },
    });
    return text ?? fallbackConclusion(promises);
  } catch {
    return fallbackConclusion(promises);
  }
}
