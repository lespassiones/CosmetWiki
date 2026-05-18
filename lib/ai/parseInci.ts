/**
 * AI-powered INCI parser. Cascade: Mistral (gratuit) → OpenAI → null.
 *
 * Handles the cases the regex parser can't:
 *  - ingredients pasted without separators (`AQUA/WATER/EAUALCOHOL DENAT...`)
 *  - OCR noise, missing punctuation, typos, mixed languages
 *  - product/batch identifiers mixed into the list
 *
 * Returns an ordered list of ingredient strings as the AI extracted them,
 * keeping official synonyms grouped (e.g. "AQUA / WATER / EAU" as one).
 * On total failure, returns null - the caller falls back to the regex parser.
 */
import { createHash } from "node:crypto";
import {
  AI_MODEL,
  getCached,
  hasMistral,
  hasOpenAI,
  logAI,
  openai,
  setCached,
} from "./client";

const MISTRAL_MODEL = "mistral-small-latest";
const MISTRAL_TIMEOUT_MS = 8_000;
const OPENAI_TIMEOUT_MS = 10_000;

export type ParseInciProvider = "mistral" | "openai" | "cache";

export type ParseInciResult = {
  ingredients: string[];
  provider: ParseInciProvider;
};

const SYSTEM = `Tu es un parseur INCI (International Nomenclature of Cosmetic Ingredients). L'utilisateur a collé une liste d'ingrédients cosmétiques qui peut être mal formatée : mots collés sans séparateurs, ponctuation absente, fautes de frappe, sortie OCR. Reconstruis la liste selon la nomenclature INCI standard.

RÈGLES STRICTES :
- N'invente AUCUN ingrédient absent du texte source.
- Garde l'ordre exact d'apparition.
- Sépare correctement les ingrédients même s'ils sont collés sans espace ni virgule.
- Conserve les synonymes officiels comme UN seul ingrédient (ex : "AQUA/WATER/EAU", "PARFUM/FRAGRANCE").
- Conserve les colorants "CI 12345" tels quels.
- Ignore les codes/identifiants produit non-INCI (ex : "11075v0", numéros de lot, références internes).
- Les marqueurs "*", "**", "***", "°", "†" placés AVANT ou APRÈS un nom signalent un statut (bio, Ecocert, allergène réglementé UE, actif clé) et NE FONT PAS partie du nom INCI. Retire-les systématiquement.
- Quand la liste est collée sans virgule ni saut de ligne et que les ingrédients sont délimités uniquement par "*", "**" ou "***" (ex : "AQUA **AMMONIUM LAURYL SULFATE *PEG-40 GLYCERYL COCOATE"), traite chaque astérisque (simple, double ou triple) comme un séparateur d'ingrédient. Chaque suite de mots majuscules entre deux astérisques (ou entre le début/fin de chaîne et un astérisque) est UN ingrédient.
- Réponds UNIQUEMENT en JSON : { "ingredients": ["AQUA / WATER / EAU", "ALCOHOL DENAT.", ...] }
- Pas de commentaire, pas de markdown, juste le JSON.`;

function userPrompt(text: string): string {
  return `Liste à parser :
"""
${text}
"""`;
}

function hashInput(text: string): string {
  return createHash("sha256")
    .update(text.trim().toLowerCase())
    .digest("hex")
    .slice(0, 24);
}

function parseIngredients(content: string): string[] {
  const parsed = JSON.parse(content) as { ingredients?: unknown };
  const list = parsed.ingredients;
  if (!Array.isArray(list)) throw new Error("no ingredients[] in response");
  return list
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0 && s.length < 200);
}

async function callMistral(text: string, signal: AbortSignal): Promise<string[]> {
  const resp = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt(text) },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Mistral ${resp.status}: ${body.slice(0, 200)}`);
  }
  const json = (await resp.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content ?? "{}";
  return parseIngredients(content);
}

async function callOpenAI(text: string): Promise<string[]> {
  const r = await openai().chat.completions.create({
    model: AI_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: userPrompt(text) },
    ],
  });
  const content = r.choices?.[0]?.message?.content ?? "{}";
  return parseIngredients(content);
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timeout`)), ms);
    p.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

export async function parseInciWithAI(
  text: string,
  userId?: string | null,
): Promise<ParseInciResult | null> {
  if (!text || text.trim().length < 3) return null;

  const key = `parse_inci:${hashInput(text)}`;
  const cached = await getCached<string[]>(key);
  if (cached && cached.length > 0) {
    return { ingredients: cached, provider: "cache" };
  }

  // 1) Mistral primary (gratuit)
  if (hasMistral()) {
    const t0 = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MISTRAL_TIMEOUT_MS);
    try {
      const ingredients = await callMistral(text, controller.signal);
      clearTimeout(timer);
      logAI({
        feature: "parse_inci",
        provider: "mistral",
        status: "success",
        duration_ms: Date.now() - t0,
        user_id: userId ?? null,
      });
      if (ingredients.length > 0) {
        void setCached(key, ingredients);
        return { ingredients, provider: "mistral" };
      }
    } catch {
      clearTimeout(timer);
      logAI({
        feature: "parse_inci",
        provider: "mistral",
        status: "fallback",
        duration_ms: Date.now() - t0,
        user_id: userId ?? null,
      });
      // fall through to OpenAI
    }
  }

  // 2) OpenAI fallback
  if (hasOpenAI()) {
    const t0 = Date.now();
    try {
      const ingredients = await withTimeout(callOpenAI(text), OPENAI_TIMEOUT_MS, "openai");
      logAI({
        feature: "parse_inci",
        provider: "openai",
        status: "success",
        duration_ms: Date.now() - t0,
        user_id: userId ?? null,
      });
      if (ingredients.length > 0) {
        void setCached(key, ingredients);
        return { ingredients, provider: "openai" };
      }
    } catch {
      logAI({
        feature: "parse_inci",
        provider: "openai",
        status: "error",
        duration_ms: Date.now() - t0,
        user_id: userId ?? null,
      });
    }
  }

  // 3) Total AI failure - caller falls back to regex parser.
  return null;
}
