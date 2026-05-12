/**
 * Pre-normalization of a product search query before the cascade.
 *
 * GPT-4o-mini takes the raw user input and returns:
 *   - either a clean "Brand Product" query the cascade can search with,
 *   - or a detection that it's actually a barcode (so we can route to
 *     the barcode lookup endpoint directly),
 *   - or a list of plausible candidates if the input is too ambiguous.
 *
 * Cached permanently per normalized input so repeat searches are free.
 */
import crypto from "node:crypto";
import { AI_MODEL, callWithFallback, getCached, hasOpenAI, openai, setCached } from "./client";

export type ProductQueryNormalization =
  | { kind: "query"; query: string; confidence: number }
  | { kind: "barcode"; barcode: string }
  | { kind: "candidates"; candidates: string[]; reason: string }
  | { kind: "unchanged" };

// Local heuristic: detect EAN-8 / UPC-A / EAN-13 with leading/trailing spaces.
const BARCODE_RE = /^\s*(\d{8}|\d{12}|\d{13})\s*$/;

export async function normalizeProductQuery(
  raw: string,
  userId?: string | null,
): Promise<ProductQueryNormalization> {
  const trimmed = raw.trim();
  if (trimmed.length < 2) return { kind: "unchanged" };

  // 1) Local barcode detection — no need to call GPT, instant.
  const m = BARCODE_RE.exec(trimmed);
  if (m) return { kind: "barcode", barcode: m[1] };

  // 2) Cache lookup.
  const key = "productq:" + crypto.createHash("sha256").update(trimmed.toLowerCase()).digest("hex").slice(0, 24);
  const cached = await getCached<ProductQueryNormalization>(key);
  if (cached) return cached;

  // 3) If no AI is available, defer to the cascade with the raw input.
  if (!hasOpenAI()) return { kind: "unchanged" };

  const system =
    "Tu normalises une requête de recherche produit cosmétique en français pour un moteur de recherche. " +
    "L'utilisateur a tapé un nom de produit éventuellement imparfait (faute d'orthographe, abréviation, " +
    "marque manquante). Tu retournes en JSON STRICT l'une des formes suivantes : " +
    "{ \"kind\": \"query\", \"query\": \"<Marque Produit>\", \"confidence\": <0..1> } si tu peux reconstituer un nom unique probable, " +
    "{ \"kind\": \"candidates\", \"candidates\": [\"...\", \"...\"], \"reason\": \"...\" } si plusieurs produits matchent, " +
    "{ \"kind\": \"unchanged\" } si la saisie est déjà propre ou si tu ne peux pas la reconstituer. " +
    "Tu ne dois JAMAIS inventer une marque que la saisie ne suggère pas. Pas d'emoji.";

  const user = `Saisie : """${trimmed.slice(0, 200)}"""

Donne le JSON.`;

  try {
    const value = await callWithFallback<ProductQueryNormalization>({
      feature: "product_search",
      userId: userId ?? null,
      timeoutMs: 6000,
      primary: async () => {
        const r = await openai().chat.completions.create({
          model: AI_MODEL,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        });
        const raw = r.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(raw) as Partial<ProductQueryNormalization> & {
          kind?: string;
          query?: string;
          confidence?: number;
          candidates?: unknown;
          reason?: string;
        };
        let result: ProductQueryNormalization;
        if (parsed.kind === "query" && typeof parsed.query === "string") {
          result = {
            kind: "query",
            query: parsed.query.trim(),
            confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.7)),
          };
        } else if (
          parsed.kind === "candidates"
          && Array.isArray(parsed.candidates)
          && parsed.candidates.every((c: unknown) => typeof c === "string")
        ) {
          result = {
            kind: "candidates",
            candidates: (parsed.candidates as string[]).slice(0, 5),
            reason: typeof parsed.reason === "string" ? parsed.reason : "Plusieurs produits correspondent.",
          };
        } else {
          result = { kind: "unchanged" };
        }
        return {
          value: result,
          tokensIn: r.usage?.prompt_tokens,
          tokensOut: r.usage?.completion_tokens,
        };
      },
      fallback: async () => ({
        value: { kind: "unchanged" } as ProductQueryNormalization,
        provider: "openai",
      }),
    });
    void setCached(key, value);
    return value;
  } catch {
    return { kind: "unchanged" };
  }
}
