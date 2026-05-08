// Orchestrates the product → INCI cascade :
// cache → Open Beauty Facts → INCIDecoder → DuckDuckGo+Mistral → not_found.
// Each step is a fallback and is only attempted if the previous one fails.

import { normalizeQuery } from "./normalize";
import { getProductCache, setProductCache } from "./cache";
import { searchOpenBeautyFacts } from "./openBeautyFacts";
import { searchInciDecoder } from "./inciDecoder";
import { searchDuckDuckGo } from "./duckduckgo";
import type { ProductSearchResult } from "./types";

const NOT_FOUND_MESSAGE =
  "Nous n'avons pas pu trouver la composition de ce produit sur nos sources publiques. Tu peux coller la liste INCI manuellement ci-dessous.";

export async function searchProductCascade(
  rawQuery: string,
): Promise<ProductSearchResult> {
  const query = rawQuery.trim().slice(0, 200);
  if (query.length < 3) {
    return {
      found: false,
      reason: "too_short",
      message: "Tape au moins 3 caractères (marque + nom du produit).",
    };
  }
  const queryNorm = normalizeQuery(query);
  if (queryNorm.length < 3) {
    return {
      found: false,
      reason: "too_short",
      message: "Tape au moins 3 caractères (marque + nom du produit).",
    };
  }

  // 1. Cache (Supabase)
  const cached = await getProductCache(queryNorm);
  if (cached) {
    return {
      found: true,
      brand: cached.brand,
      productName: cached.product_name,
      ingredientsText: cached.ingredients_text,
      source: "cache",
      sourceUrl: cached.source_url,
      confidence: cached.confidence ?? 0.9,
    };
  }

  // 2. Open Beauty Facts (free, structured)
  const obf = await searchOpenBeautyFacts(query);
  if (obf) {
    void setProductCache({
      queryNorm,
      brand: obf.brand,
      productName: obf.productName,
      ingredientsText: obf.ingredientsText,
      source: "openbeautyfacts",
      sourceUrl: obf.sourceUrl,
      confidence: 0.95,
    });
    return {
      found: true,
      brand: obf.brand,
      productName: obf.productName,
      ingredientsText: obf.ingredientsText,
      source: "openbeautyfacts",
      sourceUrl: obf.sourceUrl,
      confidence: 0.95,
    };
  }

  // 3. INCIDecoder (search → page → Mistral extract)
  const idc = await searchInciDecoder(query);
  if (idc) {
    void setProductCache({
      queryNorm,
      brand: idc.brand,
      productName: idc.productName,
      ingredientsText: idc.ingredientsText,
      source: "incidecoder",
      sourceUrl: idc.sourceUrl,
      confidence: 0.85,
    });
    return {
      found: true,
      brand: idc.brand,
      productName: idc.productName,
      ingredientsText: idc.ingredientsText,
      source: "incidecoder",
      sourceUrl: idc.sourceUrl,
      confidence: 0.85,
    };
  }

  // 4. DuckDuckGo + Mistral extraction (last automated fallback)
  const ddg = await searchDuckDuckGo(query);
  if (ddg) {
    void setProductCache({
      queryNorm,
      brand: ddg.brand,
      productName: ddg.productName,
      ingredientsText: ddg.ingredientsText,
      source: "duckduckgo+mistral",
      sourceUrl: ddg.sourceUrl,
      confidence: 0.7,
    });
    return {
      found: true,
      brand: ddg.brand,
      productName: ddg.productName,
      ingredientsText: ddg.ingredientsText,
      source: "duckduckgo+mistral",
      sourceUrl: ddg.sourceUrl,
      confidence: 0.7,
    };
  }

  // 5. All free fallbacks failed
  return {
    found: false,
    reason: "not_found",
    message: NOT_FOUND_MESSAGE,
  };
}
