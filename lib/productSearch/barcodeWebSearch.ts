/**
 * Action 1 — Fallback web search pour un code-barres inconnu de OBF/OPF.
 *
 * Quand ni Open Beauty Facts ni Open Products Facts ne connaissent un EAN,
 * on interroge OpenAI avec web search pour tenter d'identifier le produit
 * et récupérer sa liste INCI. Si la recherche réussit, le résultat est :
 *   1. Retourné à l'utilisateur pour analyse immédiate.
 *   2. Écrit dans le catalog persistant (ean ↔ brand ↔ name ↔ INCI).
 *
 * Coût estimé : ~$0.025 / appel (OpenAI web search tier 1).
 * N'est déclenché que si OBF + OPF ont tous les deux échoué — pas de
 * surcoût sur les barcodes déjà connus.
 */

import { webSearchComplete } from "@/lib/ai/webSearch";
import { hasOpenAI } from "@/lib/ai/client";
import { logInfo, logWarn } from "@/lib/log";

export type BarcodeWebResult = {
  found: true;
  brand: string | null;
  productName: string | null;
  ingredientsText: string;
  sourceUrl: string | null;
  confidence: number;
} | {
  found: false;
};

const SYSTEM_PROMPT = `Tu es un assistant expert en produits cosmétiques.
On te donne un code-barres EAN. Ta mission :
1. Identifier le produit cosmétique correspondant (marque, nom exact).
2. Trouver sa liste INCI complète des ingrédients.
3. Retourner un objet JSON strict sans texte additionnel.

Format de réponse OBLIGATOIRE (JSON pur, pas de markdown) :
{
  "brand": "Nom de la marque ou null",
  "productName": "Nom complet du produit ou null",
  "ingredientsText": "AQUA, GLYCERIN, ... (liste INCI complète) ou null si non trouvée",
  "sourceUrl": "URL de la fiche produit trouvée ou null"
}

Règles strictes :
- N'invente JAMAIS d'ingrédients. Si tu ne trouves pas la liste INCI, ingredientsText = null.
- La liste INCI doit contenir au minimum 5 ingrédients séparés par des virgules.
- Si le produit n'est pas cosmétique (alimentaire, ménager, etc.), retourne null pour tous les champs.`;

function parseWebSearchResult(text: string): {
  brand: string | null;
  productName: string | null;
  ingredientsText: string | null;
  sourceUrl: string | null;
} | null {
  // Extract JSON from the response (model might add preamble)
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace <= firstBrace) return null;
  try {
    const parsed = JSON.parse(text.slice(firstBrace, lastBrace + 1)) as {
      brand?: unknown;
      productName?: unknown;
      ingredientsText?: unknown;
      sourceUrl?: unknown;
    };
    return {
      brand: typeof parsed.brand === "string" && parsed.brand ? parsed.brand : null,
      productName: typeof parsed.productName === "string" && parsed.productName ? parsed.productName : null,
      ingredientsText: typeof parsed.ingredientsText === "string" && parsed.ingredientsText ? parsed.ingredientsText : null,
      sourceUrl: typeof parsed.sourceUrl === "string" && parsed.sourceUrl ? parsed.sourceUrl : null,
    };
  } catch {
    return null;
  }
}

function looksLikeInci(text: string | null): boolean {
  if (!text || text.length < 20) return false;
  // Must have at least 3 comma/semicolon-separated tokens
  const tokens = text.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
  return tokens.length >= 3;
}

/**
 * Search for a cosmetic product by its EAN barcode using OpenAI web search.
 * Returns found=false if OpenAI is unavailable or the product can't be identified.
 * Timeout: 20 seconds (generous for web search latency).
 */
export async function searchProductByBarcode(
  barcode: string,
): Promise<BarcodeWebResult> {
  if (!hasOpenAI()) {
    return { found: false };
  }

  const t0 = Date.now();
  try {
    const result = await webSearchComplete(
      SYSTEM_PROMPT,
      `Code-barres EAN : ${barcode}\n\nIdentifie ce produit cosmétique et trouve sa liste INCI.`,
      { timeoutMs: 20_000 },
    );

    const parsed = parseWebSearchResult(result.text);
    if (!parsed) {
      logWarn("barcodeWebSearch.parse_failed", {
        barcode,
        durationMs: Date.now() - t0,
        textPreview: result.text.slice(0, 200),
      });
      return { found: false };
    }

    if (!looksLikeInci(parsed.ingredientsText)) {
      logWarn("barcodeWebSearch.no_inci", {
        barcode,
        brand: parsed.brand,
        productName: parsed.productName,
        durationMs: Date.now() - t0,
      });
      return { found: false };
    }

    logInfo("barcodeWebSearch.hit", {
      barcode,
      brand: parsed.brand,
      productName: parsed.productName,
      durationMs: Date.now() - t0,
    });

    return {
      found: true,
      brand: parsed.brand,
      productName: parsed.productName,
      ingredientsText: parsed.ingredientsText!,
      sourceUrl: parsed.sourceUrl ?? (result.citations[0]?.url ?? null),
      confidence: 0.75,
    };
  } catch (err) {
    logWarn("barcodeWebSearch.error", {
      barcode,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - t0,
    });
    return { found: false };
  }
}
