/**
 * OCR of a cosmetic product back-label photo.
 *
 * Primary: GPT-4o-mini Vision (high detail). Returns the raw INCI list
 * exactly as printed, marking uncertain words with [?MOT]. Cached by image
 * SHA-256 hash so reuploading the same photo is free.
 *
 * Fallback: Tesseract.js is run client-side. The server route below only
 * surfaces a clear error code so the browser can switch to Tesseract.
 */
import crypto from "node:crypto";
import { AI_MODEL, callWithFallback, getCached, hasOpenAI, openai, setCached } from "./client";

export type OcrResult =
  | { found: true; text: string; uncertain: string[] }
  | { found: false; reason: string };

export async function ocrFromImageBase64(
  imageBase64: string,
  mimeType: string,
  userId?: string | null,
): Promise<OcrResult> {
  const hash = crypto.createHash("sha256").update(imageBase64).digest("hex").slice(0, 32);
  const cacheKey = `ocr:${hash}`;
  const cached = await getCached<OcrResult>(cacheKey);
  if (cached) return cached;

  if (!hasOpenAI()) {
    return { found: false, reason: "openai_unavailable" };
  }

  const system =
    "Tu es un OCR spécialisé compositions INCI cosmétiques. Tu reçois une photo du dos d'un emballage. Extrais UNIQUEMENT la liste d'ingrédients INCI telle qu'imprimée. Sépare par virgules. Marque chaque mot dont tu n'es pas certain à 100 % avec `[?MOT]`. Ne corrige RIEN, ne traduis RIEN. Réponds en JSON strict.";

  const userMsg = `Extrais la liste INCI de l'image.

Format de réponse JSON :
- Si tu trouves une liste : { "found": true, "text": "AQUA, GLYCERIN, ...", "uncertain": ["[?MOT1]", "[?MOT2]"] }
- Si tu ne trouves AUCUNE liste INCI lisible : { "found": false, "reason": "<brève raison>" }`;

  try {
    const value = await callWithFallback<OcrResult>({
      feature: "ocr",
      userId: userId ?? null,
      timeoutMs: 20_000,
      primary: async () => {
        const r = await openai().chat.completions.create({
          model: AI_MODEL,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            {
              role: "user",
              content: [
                { type: "text", text: userMsg },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${imageBase64}`,
                    detail: "high",
                  },
                },
              ],
            },
          ],
        });
        const raw = r.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(raw) as Partial<OcrResult> & { reason?: string };
        let result: OcrResult;
        if (parsed.found && typeof (parsed as { text?: string }).text === "string") {
          result = {
            found: true,
            text: (parsed as { text: string }).text.trim(),
            uncertain: Array.isArray((parsed as { uncertain?: string[] }).uncertain)
              ? (parsed as { uncertain: string[] }).uncertain
              : [],
          };
        } else {
          result = { found: false, reason: parsed.reason ?? "no_list_detected" };
        }
        return {
          value: result,
          tokensIn: r.usage?.prompt_tokens,
          tokensOut: r.usage?.completion_tokens,
        };
      },
      // No server-side fallback: the browser will run Tesseract.js if this fails.
      fallback: async () => ({
        value: { found: false, reason: "openai_failed" } as OcrResult,
        provider: "tesseract",
      }),
    });

    void setCached(cacheKey, value);
    return value;
  } catch {
    return { found: false, reason: "openai_failed" };
  }
}
