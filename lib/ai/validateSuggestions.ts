/**
 * AI guardrail for catalog suggestions (handoff §2.3).
 *
 * Even with an exact-category match, `catalog.category` can be wrong for the
 * PRODUCT itself, so before showing an alternative we ask the LLM whether each
 * {product, alternative} pair is the SAME type of product (a logical
 * replacement). It also returns the product's REAL short type, which the caller
 * uses to re-route the search when the pair is illogical.
 *
 * Never blocks display: if no AI key is configured or the call fails, we
 * degrade to `logical: true` for every item (product_type left empty).
 */

import { AI_MODEL, callWithFallback, hasMistral, hasOpenAI, openai } from "./client";

export type ValidateItem = { product: string; alternative: string };
export type ValidateResult = { logical: boolean; product_type: string };

const VALIDATE_SCHEMA = {
  name: "validate_suggestions",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            logical: { type: "boolean" },
            product_type: { type: "string" },
          },
          required: ["logical", "product_type"],
        },
      },
    },
    required: ["results"],
  },
} as const;

const SYSTEM_BASE = `Tu vérifies qu'une alternative cosmétique proposée est un REMPLAÇANT LOGIQUE du produit d'origine, c'est-à-dire le MÊME type d'article.

Pour chaque paire { produit, alternative } :
- "logical" = true si l'alternative est le même type de produit que le produit (ex : vernis -> vernis, shampoing -> shampoing, autobronzant -> autobronzant, enlumineur -> enlumineur).
- "logical" = false si ce sont des types différents (ex : parfum -> lingette, autobronzant -> tatouage temporaire, vernis -> crayon yeux, dentifrice -> bain de bouche).
- "product_type" = le type RÉEL du PRODUIT d'origine (pas de l'alternative), en français court et grand public (ex : "autobronzant", "enlumineur visage", "shampoing", "vernis à ongles", "dentifrice"). Jamais la marque, jamais une phrase.`;

const SYSTEM_RULES = `Règles :
1. Réponds avec EXACTEMENT une entrée par paire reçue, dans le MÊME ordre.
2. En cas de doute sur la logique, mets "logical": false (mieux vaut re-router que proposer une absurdité).
3. N'utilise jamais le tiret cadratin. Pas de texte hors du JSON.`;

/**
 * Assemble the system prompt, splicing in the user's skin profile when present.
 * Mirrors the mobile `validate-suggestions` edge function: the profile only
 * tightens "logical" for alternatives that are clearly inappropriate for the
 * skin (e.g. occlusive on oily skin), and never over-filters acceptable ones.
 */
function buildSystem(skinContext?: string | null): string {
  const profileLine = skinContext
    ? `\n\nProfil utilisateur : ${skinContext}. Vérifie aussi que l'alternative est ADAPTÉE à ce profil (ex : éviter les produits occlusifs pour une peau grasse, les irritants pour peau sensible, les huiles lourdes pour acné). Si inadapté au profil ET illogique à la fois -> "logical": false. Si juste légèrement sous-optimal mais acceptable -> "logical": true (ne pas sur-filtrer).`
    : "";
  return `${SYSTEM_BASE}${profileLine}\n\n${SYSTEM_RULES}`;
}

function buildUser(items: ValidateItem[]): string {
  const lines = items
    .map((it, i) => `${i + 1}. produit: "${it.product}" | alternative: "${it.alternative}"`)
    .join("\n");
  return `Paires à valider (réponds dans le même ordre) :\n${lines}\n\nRetourne le JSON { "results": [{ "logical", "product_type" }] }.`;
}

function safeParse(raw: string, expected: number): ValidateResult[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const arr = (parsed as { results?: unknown })?.results;
    if (!Array.isArray(arr)) return null;
    const out = arr.map((r): ValidateResult => {
      const o = (r ?? {}) as Record<string, unknown>;
      return {
        logical: o.logical !== false, // default to true on missing/garbage
        product_type: typeof o.product_type === "string" ? o.product_type.slice(0, 60) : "",
      };
    });
    // Pad/truncate to the expected length so callers can zip by index safely.
    while (out.length < expected) out.push({ logical: true, product_type: "" });
    return out.slice(0, expected);
  } catch {
    return null;
  }
}

async function mistralValidate(
  items: ValidateItem[],
  system: string,
): Promise<ValidateResult[] | null> {
  if (!hasMistral()) return null;
  const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      temperature: 0,
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: buildUser(items) },
      ],
    }),
  });
  if (!r.ok) return null;
  const json = (await r.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json?.choices?.[0]?.message?.content;
  return raw ? safeParse(raw, items.length) : null;
}

/** Degrade-safe default: keep everything, no known type. */
function allLogical(items: ValidateItem[]): ValidateResult[] {
  return items.map(() => ({ logical: true, product_type: "" }));
}

/**
 * Validate a batch of {product, alternative} pairs. Always resolves to an array
 * of the same length and order as `items` (never throws).
 */
export async function validateSuggestions(
  items: ValidateItem[],
  userId?: string | null,
  skinContext?: string | null,
): Promise<ValidateResult[]> {
  if (items.length === 0) return [];
  if (!hasOpenAI() && !hasMistral()) return allLogical(items);

  const system = buildSystem(skinContext);

  try {
    const result = await callWithFallback<ValidateResult[] | null>({
      feature: "validate",
      userId: userId ?? null,
      timeoutMs: 15_000,
      primary: async () => {
        if (!hasOpenAI()) throw new Error("openai disabled");
        const resp = await openai().chat.completions.create({
          model: AI_MODEL,
          temperature: 0,
          max_tokens: 800,
          messages: [
            { role: "system", content: system },
            { role: "user", content: buildUser(items) },
          ],
          response_format: { type: "json_schema", json_schema: VALIDATE_SCHEMA },
        });
        const raw = resp.choices?.[0]?.message?.content ?? null;
        return {
          value: raw ? safeParse(raw, items.length) : null,
          tokensIn: resp.usage?.prompt_tokens,
          tokensOut: resp.usage?.completion_tokens,
        };
      },
      fallback: async () => ({
        value: await mistralValidate(items, system),
        provider: "mistral",
      }),
    });
    return result ?? allLogical(items);
  } catch {
    return allLogical(items);
  }
}
