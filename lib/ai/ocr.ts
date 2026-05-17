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
import { parseInciList } from "../inciParser";
import { supabaseAnon } from "../supabase";
import { logInfo, logWarn } from "../log";

// Sharp is a transitive dep (used by next/image) — we lazy-load it so an
// install miss on a fresh CI runner doesn't crash this module's import.
type SharpFactory = (input?: Buffer) => {
  metadata: () => Promise<{ width?: number; height?: number }>;
  extract: (region: { left: number; top: number; width: number; height: number }) => ReturnType<SharpFactory>;
  jpeg: (opts?: { quality?: number }) => ReturnType<SharpFactory>;
  toBuffer: () => Promise<Buffer>;
};
let sharpPromise: Promise<SharpFactory | null> | null = null;
function loadSharp(): Promise<SharpFactory | null> {
  if (!sharpPromise) {
    sharpPromise = import("sharp")
      .then((m) => (m.default ?? m) as unknown as SharpFactory)
      .catch(() => null);
  }
  return sharpPromise;
}

export type OcrValidation = {
  /** Total tokens parsed from the OCR text. */
  total: number;
  /** Tokens that matched the INCI DB exactly or via known alias. */
  matched: number;
  /** matched / total in [0, 1]. */
  rate: number;
  /**
   * - "ok"            : ≥ 70 % matched → high confidence.
   * - "low_match"     : 30–70 % matched → some hallucination likely.
   * - "very_low_match": < 30 % matched → photo unusable, ask user to retake.
   */
  level: "ok" | "low_match" | "very_low_match";
  /** Human-facing French message, set only when level !== "ok". */
  message?: string;
};

export type OcrResult =
  | { found: true; text: string; uncertain: string[]; validation?: OcrValidation }
  | { found: false; reason: string };

/**
 * Identity extracted from the FRONT of the packaging. All fields optional —
 * a poorly lit photo may yield only the brand, or only the product line. The
 * downstream pipeline uses whatever it gets as `productLabel` for the
 * analysis title and as input to the web-search identification call.
 */
export type OcrFrontResult =
  | {
      found: true;
      productName: string | null;
      brand: string | null;
      productType: string | null;
    }
  | { found: false; reason: string };

/**
 * Validates an OCR-extracted INCI text against the live INCI database. Returns
 * how many tokens matched exactly / via alias and a confidence level. Anything
 * below 70 % match strongly suggests Vision hallucinated ingredients (a
 * recurring failure mode on small / curved labels) — surfacing this lets the
 * UI nudge the user to retake the photo before we score a phantom formula.
 */
export async function validateOcrText(text: string): Promise<OcrValidation> {
  const tokens = parseInciList(text);
  const total = tokens.length;
  if (total === 0) {
    return { total: 0, matched: 0, rate: 0, level: "very_low_match", message: "Aucun ingrédient lisible dans la photo. Reprends-en une plus nette, cadrée sur le bloc INGREDIENTS." };
  }

  type MatchRow = { match_kind: "exact" | "alias" | "fuzzy_high" | "suggestion" | null };
  let matched = 0;
  try {
    const sb = supabaseAnon();
    const { data } = await sb.rpc("cosme_check_match_inci_batch", {
      p_tokens: tokens.map((t) => t.normalized),
    });
    for (const row of (data ?? []) as MatchRow[]) {
      // Only confident matches count: a "suggestion" (fuzzy 0.55..0.90) is
      // exactly the symptom of hallucination — a near-real ingredient name
      // that doesn't quite line up with the DB. We deliberately exclude it.
      if (row.match_kind === "exact" || row.match_kind === "alias") {
        matched += 1;
      }
    }
  } catch {
    // DB unavailable → don't block the user, treat as "ok" silently
    return { total, matched: total, rate: 1, level: "ok" };
  }

  const rate = matched / total;
  if (rate >= 0.7) return { total, matched, rate, level: "ok" };
  if (rate >= 0.3) {
    return {
      total,
      matched,
      rate,
      level: "low_match",
      message: `Seulement ${matched}/${total} ingrédients reconnus. La photo est peut-être floue ou l'OCR a inventé des noms — vérifie le résultat ou reprends une photo plus nette.`,
    };
  }
  return {
    total,
    matched,
    rate,
    level: "very_low_match",
    message: `Très peu d'ingrédients reconnus (${matched}/${total}). La photo est trop floue ou ne montre pas le bloc INGREDIENTS — reprends-la, cadrée et avec un bon éclairage.`,
  };
}

/**
 * P4 — Locate the INCI block in the image and return a normalized bounding
 * box. Uses a low-detail Vision call (cheaper than the OCR call itself) and
 * returns null if the model can't find a clear block. The bbox values are in
 * [0, 1] : x0/y0 = top-left, x1/y1 = bottom-right.
 */
async function locateInciRegion(
  imageBase64: string,
  mimeType: string,
): Promise<{ x0: number; y0: number; x1: number; y1: number } | null> {
  try {
    const r = await Promise.race([
      openai().chat.completions.create({
        model: AI_MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Tu localises le bloc INGREDIENTS / INCI / COMPOSITION dans une photo de cosmétique. Tu renvoies UNIQUEMENT sa bounding box, ou null si tu ne le vois pas. Les coordonnées sont normalisées 0..1 : 0,0 = coin haut-gauche ; 1,1 = coin bas-droit.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: 'Renvoie en JSON la bounding box du bloc INCI : { "bbox": [x0, y0, x1, y1] } avec valeurs en 0..1, ou { "bbox": null } si pas visible. Inclus une petite marge autour du bloc, mais évite d\'englober des paragraphes descriptifs multilingues.',
              },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: "low" },
              },
            ],
          },
        ],
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("locate timeout")), 12_000)),
    ]);
    const raw = r.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { bbox?: unknown };
    if (!Array.isArray(parsed.bbox) || parsed.bbox.length !== 4) return null;
    const [x0, y0, x1, y1] = parsed.bbox.map(Number);
    if ([x0, y0, x1, y1].some((v) => !Number.isFinite(v) || v < 0 || v > 1)) return null;
    if (x1 - x0 < 0.05 || y1 - y0 < 0.05) return null; // too tiny to be real
    return { x0, y0, x1, y1 };
  } catch {
    return null;
  }
}

/**
 * Crops the given JPEG/PNG/WebP base64 image to the supplied normalized bbox
 * (with a 5 % padding so we don't clip the first/last characters). Returns
 * the cropped JPEG base64 + mime, or null on any error (Sharp missing,
 * unsupported format, etc.) — callers should fall back to the original.
 */
async function cropToBbox(
  imageBase64: string,
  bbox: { x0: number; y0: number; x1: number; y1: number },
): Promise<{ base64: string; mimeType: string } | null> {
  const sharp = await loadSharp();
  if (!sharp) return null;
  try {
    const input = Buffer.from(imageBase64, "base64");
    const img = sharp(input);
    const meta = await img.metadata();
    const W = meta.width ?? 0;
    const H = meta.height ?? 0;
    if (W < 100 || H < 100) return null;
    const padX = (bbox.x1 - bbox.x0) * 0.05;
    const padY = (bbox.y1 - bbox.y0) * 0.05;
    const left = Math.max(0, Math.floor((bbox.x0 - padX) * W));
    const top = Math.max(0, Math.floor((bbox.y0 - padY) * H));
    const width = Math.min(W - left, Math.ceil((bbox.x1 - bbox.x0 + 2 * padX) * W));
    const height = Math.min(H - top, Math.ceil((bbox.y1 - bbox.y0 + 2 * padY) * H));
    if (width < 50 || height < 50) return null;
    const out = await img.extract({ left, top, width, height }).jpeg({ quality: 92 }).toBuffer();
    return { base64: out.toString("base64"), mimeType: "image/jpeg" };
  } catch {
    return null;
  }
}

/**
 * Second-pass Vision call: asks the model to look at the same image and list
 * ONLY the ingredients it didn't capture on the first pass. This is the
 * single most effective fix for long lists (Dove, L'Oréal, Yves Rocher have
 * 20-26 ingredients but the first pass typically only returns 10-16).
 *
 * Returns the merged comma-separated list. Falls back to the original text
 * on any error.
 */
async function ocrSecondPass(
  imageBase64: string,
  mimeType: string,
  firstPass: string,
): Promise<string> {
  const system = [
    "Tu es un OCR spécialisé compositions INCI cosmétiques. Tu reçois une photo et une liste INCI partielle déjà extraite d'un autre passage.",
    "",
    "Ta mission : examine attentivement la photo et liste UNIQUEMENT les ingrédients du bloc INGREDIENTS / INCI qui ne sont PAS dans la liste partielle.",
    "",
    "RÈGLES :",
    "1. N'INVENTE RIEN. Si tu ne vois pas d'ingrédient supplémentaire lisible, renvoie une chaîne vide.",
    "2. Ne répète AUCUN ingrédient déjà dans la liste partielle.",
    "3. Ignore les paragraphes descriptifs multilingues.",
    "4. Renvoie une simple chaîne séparée par des virgules, JAMAIS du JSON.",
  ].join("\n");

  const userMsg = `Liste partielle déjà extraite :\n${firstPass}\n\nListe les ingrédients INCI restants visibles sur la photo (sans répéter ceux ci-dessus). Si rien d'autre n'est lisible, renvoie une chaîne vide.`;

  try {
    const r = await Promise.race([
      openai().chat.completions.create({
        model: AI_MODEL,
        temperature: 0,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: userMsg },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: "high" },
              },
            ],
          },
        ],
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("second-pass timeout")), 15_000)),
    ]);
    const extra = (r.choices?.[0]?.message?.content ?? "")
      .replace(/^["'`]+|["'`]+$/g, "")
      .trim();
    if (!extra) return firstPass;
    // Merge: append the new ingredients after a comma. Dedup happens later in
    // parseInciList during validation/analysis (it has its own seen-set).
    return firstPass.endsWith(",") ? `${firstPass} ${extra}` : `${firstPass}, ${extra}`;
  } catch {
    return firstPass;
  }
}

/**
 * Heuristic: trigger a second OCR pass when the first one looks suspiciously
 * short. Cosmetics with >20 ingredients (Dove, L'Oréal, Yves Rocher, Garnier)
 * are extremely common — when we get back 6-17 tokens we're almost always
 * missing the tail end of the list. Below 6 it's likely a small list or a
 * non-cosmetic; above 17 the first pass is usually complete enough.
 */
function shouldTriggerSecondPass(text: string): boolean {
  const tokens = parseInciList(text);
  return tokens.length >= 6 && tokens.length < 18;
}

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

  // P4 — locate the INCI block in the original image, crop to it, and run
  // OCR on the crop. Removes 80-90 % of the multilingual descriptive
  // paragraphs that confused the model on full-frame photos. Falls back to
  // the original image if locate or crop fails.
  let workingImage = imageBase64;
  let workingMime = mimeType;
  const bbox = await locateInciRegion(imageBase64, mimeType);
  if (bbox) {
    const cropped = await cropToBbox(imageBase64, bbox);
    if (cropped) {
      workingImage = cropped.base64;
      workingMime = cropped.mimeType;
    }
  }

  const system = [
    "Tu es un OCR spécialisé compositions INCI cosmétiques. Tu reçois une photo du dos d'un emballage.",
    "",
    "RÈGLES CRITIQUES — la fidélité prime sur la complétude :",
    "1. N'INVENTE JAMAIS d'ingrédient. Si tu ne peux pas lire un mot avec certitude, omets-le ou écris `[?]` à sa place. Une liste incomplète mais fidèle vaut MILLE fois mieux qu'une liste complète mais hallucinée.",
    "2. Cherche le bloc qui commence explicitement par `INGREDIENTS:`, `INGRÉDIENTS:`, `INCI:`, `COMPOSITION:` ou équivalent. C'est UNIQUEMENT ce bloc qui contient la liste INCI.",
    "3. IGNORE tous les paragraphes descriptifs multilingues (suédois, danois, néerlandais, allemand, italien, etc.). Des mots comme `KASTANJEMELK`, `BALSAM`, `HOITOAINE`, `BESCHERMENDE` NE SONT PAS des ingrédients INCI — ce sont des descriptions de produit traduites.",
    "4. Les ingrédients INCI réels sont en MAJUSCULES (ou Title Case), en latin ou en anglais botanique (ex. `BUTYROSPERMUM PARKII`, `AQUA`, `GLYCERIN`, `TOCOPHEROL`), séparés par des virgules ou points-virgules.",
    "5. Ne corrige RIEN, ne traduis RIEN, ne remplace RIEN par un nom \"plausible\".",
    "6. Réponds en JSON strict.",
  ].join("\n");

  const userMsg = `Extrais la liste INCI de cette photo de packaging.

Procédure :
- Localise le bloc \"INGREDIENTS:\" / \"INGRÉDIENTS:\" / \"INCI:\" / \"COMPOSITION:\".
- N'extrais QUE les ingrédients de ce bloc, dans l'ordre où ils apparaissent.
- Pour chaque mot illisible : OMETS-LE ou écris \`[?]\`. NE DEVINE PAS.
- Si tu vois un texte mais qu'il ressemble à de la description produit (phrases, langues nordiques/germaniques, slogans marketing), c'est PAS la liste INCI.

Format de réponse JSON :
- Si tu trouves la liste : { "found": true, "text": "AQUA, GLYCERIN, ...", "uncertain": ["[?MOT1]"] }
- Si pas de bloc INCI clairement identifiable : { "found": false, "reason": "<brève raison>" }`;

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
                    url: `data:${workingMime};base64,${workingImage}`,
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

    // P3 — multi-pass: a single Vision call truncates 20+ item lists
    // (Dove, L'Oréal…) to ~10-16 entries. We used to ALWAYS trigger pass 2
    // when 6 < tokens < 18 (~80% of scans, half useless). Now we validate
    // first and only re-run when validation says the OCR is clearly thin
    // (rate < 0.70). Cuts ~$0.005 / scan and 2-4 s on ~half of all scans.
    if (value.found) {
      try {
        value.validation = await validateOcrText(value.text);
      } catch (err) {
        logWarn("ocr.validation_failed", { error: (err as Error).message });
      }

      const tokensAfterPass1 = value.validation?.total ?? 0;
      const ratePass1 = value.validation?.rate ?? 0;
      const inSecondPassWindow = shouldTriggerSecondPass(value.text);
      const needsSecondPass = inSecondPassWindow && ratePass1 < 0.70;

      logInfo("ocr.pass1_result", {
        tokens: tokensAfterPass1,
        matchRate: Number(ratePass1.toFixed(2)),
        secondPassWindow: inSecondPassWindow,
        secondPassTriggered: needsSecondPass,
      });

      if (needsSecondPass) {
        try {
          value.text = await ocrSecondPass(workingImage, workingMime, value.text);
          // Re-validate so the response carries the merged rate.
          try {
            value.validation = await validateOcrText(value.text);
            logInfo("ocr.pass2_result", {
              tokens: value.validation.total,
              matchRate: Number(value.validation.rate.toFixed(2)),
            });
          } catch (err) {
            logWarn("ocr.validation_failed_after_pass2", { error: (err as Error).message });
          }
        } catch (err) {
          logWarn("ocr.second_pass_failed", { error: (err as Error).message });
        }
      }
    }

    void setCached(cacheKey, value);
    return value;
  } catch {
    return { found: false, reason: "openai_failed" };
  }
}

/**
 * OCR of the FRONT of a cosmetic package. Extracts the product identity
 * (name + brand + type) so we can identify the product via web search later.
 * No INCI extraction here — the back-label call (ocrFromImageBase64) is the
 * authoritative source for ingredients.
 *
 * The photo is read once and discarded; only the extracted fields are returned.
 * Cached by image SHA-256 hash so reuploading the same photo is free.
 */
export async function ocrFrontFromImageBase64(
  imageBase64: string,
  mimeType: string,
  userId?: string | null,
): Promise<OcrFrontResult> {
  const hash = crypto.createHash("sha256").update(imageBase64).digest("hex").slice(0, 32);
  const cacheKey = `ocr-front:${hash}`;
  const cached = await getCached<OcrFrontResult>(cacheKey);
  if (cached) return cached;

  if (!hasOpenAI()) {
    return { found: false, reason: "openai_unavailable" };
  }

  const system = [
    "Tu analyses la face avant d'un produit cosmétique. Tu extrais l'identité du produit telle qu'elle est imprimée sur le packaging.",
    "",
    "RÈGLES :",
    "1. N'INVENTE RIEN. Si un champ n'est pas lisible avec certitude, mets-le à null.",
    "2. `brand` : la marque (souvent en haut, en gros — ex. `L'Oréal`, `CeraVe`, `The Ordinary`, `Yves Rocher`). Garde la casse d'origine.",
    "3. `productName` : le nom de la gamme/produit (ex. `Effaclar Duo+`, `Foaming Cleanser`, `Niacinamide 10 % + Zinc 1 %`). Exclus la marque, les claims marketing (`hydrate 24h`), les volumes (`200 mL`) et les certifications (`bio`).",
    "4. `productType` : le type de produit en français court (ex. `nettoyant visage`, `crème hydratante`, `sérum`, `shampoing`, `gel douche`, `démaquillant`, `huile capillaire`). Choisis le terme le plus précis visible sur le packaging ; si non précisé, déduis-le des claims (mais reste prudent).",
    "5. Si la photo est floue, trop sombre, ou ne montre pas la face avant : renvoie `{ \"found\": false, \"reason\": \"<brève raison>\" }`.",
    "6. Réponds en JSON strict.",
  ].join("\n");

  const userMsg = `Extrais l'identité du produit visible sur cette photo de packaging (face avant).

Format de réponse JSON :
- Si lisible : { "found": true, "brand": "...", "productName": "...", "productType": "..." } (mets null pour les champs non lisibles)
- Si illisible : { "found": false, "reason": "<brève raison>" }`;

  try {
    const value = await callWithFallback<OcrFrontResult>({
      feature: "ocr",
      userId: userId ?? null,
      timeoutMs: 15_000,
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
        const parsed = JSON.parse(raw) as Partial<{
          found: boolean;
          brand: string | null;
          productName: string | null;
          productType: string | null;
          reason: string;
        }>;
        const cleanField = (v: unknown): string | null => {
          if (typeof v !== "string") return null;
          const t = v.trim();
          if (t.length === 0 || t.toLowerCase() === "null" || t === "—") return null;
          return t.slice(0, 200);
        };
        let result: OcrFrontResult;
        if (parsed.found === true) {
          result = {
            found: true,
            brand: cleanField(parsed.brand),
            productName: cleanField(parsed.productName),
            productType: cleanField(parsed.productType),
          };
          // Treat all-null as a failure so the caller knows to ignore it.
          if (!result.brand && !result.productName && !result.productType) {
            result = { found: false, reason: "no_text_extracted" };
          }
        } else {
          result = { found: false, reason: parsed.reason ?? "front_not_detected" };
        }
        return {
          value: result,
          tokensIn: r.usage?.prompt_tokens,
          tokensOut: r.usage?.completion_tokens,
        };
      },
      fallback: async () => ({
        value: { found: false, reason: "openai_failed" } as OcrFrontResult,
        provider: "tesseract",
      }),
    });

    void setCached(cacheKey, value);
    return value;
  } catch {
    return { found: false, reason: "openai_failed" };
  }
}
