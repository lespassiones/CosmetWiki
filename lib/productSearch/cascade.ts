// Orchestrates the product → INCI cascade :
// cache → Open Beauty Facts → INCIDecoder → brand-specific (if brand detected)
// → DuckDuckGo+Mistral → not_found. Each step is a fallback and is only
// attempted if the previous one fails.

import { normalizeQuery } from "./normalize";
import { getProductCache, setProductCache } from "./cache";
import { searchOpenBeautyFacts } from "./openBeautyFacts";
import { searchInciDecoder } from "./inciDecoder";
import { searchDuckDuckGo } from "./duckduckgo";
import { matchesQuery } from "./relevance";
import { detectBrand, stripBrandFromQuery } from "./brands";
import type { ProductSearchResult } from "./types";

const NOT_FOUND_MESSAGE =
  "Nous n'avons pas pu trouver la composition de ce produit sur nos sources publiques. Tu peux coller la liste INCI manuellement ci-dessous.";

// Vercel Hobby kills the function at 10 s with no usable response. We cap the
// whole cascade at 8 s and surface a clean "not_found" so the user gets the
// "paste INCI manually" fallback instead of a generic gateway error.
const CASCADE_TIMEOUT_MS = 8_000;

export async function searchProductCascade(rawQuery: string): Promise<ProductSearchResult> {
  return await Promise.race([
    runCascade(rawQuery),
    new Promise<ProductSearchResult>((resolve) => {
      setTimeout(
        () => resolve({ found: false, reason: "timeout", message: NOT_FOUND_MESSAGE }),
        CASCADE_TIMEOUT_MS,
      );
    }),
  ]);
}

async function runCascade(rawQuery: string): Promise<ProductSearchResult> {
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

  // 1. Cache (Supabase). Re-validate the cached row against the current query
  // so historical bad matches (e.g. "brian" → "Mitomo" from a buggy cascade)
  // self-heal: if the brand+name don't share a token with the query, treat it
  // as a cache miss and re-run the cascade.
  const cached = await getProductCache(queryNorm);
  if (cached) {
    const cachedLabel = `${cached.brand ?? ""} ${cached.product_name ?? ""}`;
    if (matchesQuery(query, cachedLabel)) {
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

  // 4. Brand-specific search — if the query mentions a known brand
  // (La Roche-Posay, Vichy, Bioderma, etc.), hit DDG with a `site:` filter
  // restricted to the brand's own domain. More reliable than the generic
  // DDG step below because the brand's official page is guaranteed to have
  // the real INCI list (whereas generic DDG might surface an aggregator with
  // truncated data or a blog post).
  const brand = detectBrand(query);
  if (brand) {
    const productQuery = stripBrandFromQuery(query, brand) || query;
    const brandResult = await brand.search(productQuery);
    if (brandResult) {
      void setProductCache({
        queryNorm,
        brand: brandResult.brand,
        productName: brandResult.productName,
        ingredientsText: brandResult.ingredientsText,
        source: `brand:${brand.domain}`,
        sourceUrl: brandResult.sourceUrl,
        confidence: 0.9,
      });
      return {
        found: true,
        brand: brandResult.brand,
        productName: brandResult.productName,
        ingredientsText: brandResult.ingredientsText,
        source: `brand:${brand.domain}`,
        sourceUrl: brandResult.sourceUrl,
        confidence: 0.9,
      };
    }
  }

  // 5. DuckDuckGo + Mistral extraction (last automated fallback)
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

  // 6. All free fallbacks failed
  return {
    found: false,
    reason: "not_found",
    message: NOT_FOUND_MESSAGE,
  };
}
