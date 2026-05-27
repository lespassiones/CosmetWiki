// Orchestrates the product → INCI cascade. Strategy:
//
//   1. Cache (Supabase, sub-100 ms) - sequential, free, almost-always-fast.
//   2. If cache miss, fire ALL remaining sources in parallel via
//      Promise.allSettled (OBF, INCIDecoder, brand-specific if matched,
//      DuckDuckGo+Mistral). Pick the first one that returns a *matching* hit
//      in priority order. Latency = max of slowest source instead of sum.
//
// Trade-off: we now ALWAYS spend the Mistral cost on INCIDecoder+DDG (~$0.004
// per scan) instead of only when needed. That's the price of a 4-5 s
// reduction in worst-case latency and a 15-20 % bump in hit-rate on FR
// products absent from Open Beauty Facts.
//
// Observability: every source's outcome (hit/miss/error) is logged via
// `logInfo`/`logWarn` so we can diagnose drops without flying blind.

import { normalizeQuery } from "./normalize";
import { getProductCache, setProductCache } from "./cache";
import { searchCatalogByName } from "./catalog";
import { searchOpenBeautyFacts } from "./openBeautyFacts";
import { searchInciDecoder } from "./inciDecoder";
import { searchDuckDuckGo } from "./duckduckgo";
import { matchesQuery } from "./relevance";
import { detectBrand, stripBrandFromQuery } from "./brands";
import { logInfo, logWarn } from "../log";
import type { ProductSearchResult, ProductSource } from "./types";

const NOT_FOUND_MESSAGE =
  "Nous n'avons pas pu trouver la composition de ce produit sur nos sources publiques. Tu peux coller la liste INCI manuellement ci-dessous.";

// Vercel Hobby kills the function at 10 s with no usable response. We cap the
// whole cascade at 8 s and surface a clean "not_found" so the user gets the
// "paste INCI manually" fallback instead of a generic gateway error.
const CASCADE_TIMEOUT_MS = 8_000;

type HitData = {
  brand: string | null;
  productName: string | null;
  ingredientsText: string;
  sourceUrl: string;
};

type SourceAttempt = {
  name: string;
  sourceLabel: ProductSource;
  confidence: number;
  promise: Promise<HitData | null>;
};

export async function searchProductCascade(rawQuery: string): Promise<ProductSearchResult> {
  const startedAt = Date.now();
  const result = await Promise.race([
    runCascade(rawQuery, startedAt),
    new Promise<ProductSearchResult>((resolve) => {
      setTimeout(() => {
        logWarn("cascade.global_timeout", {
          query: rawQuery.slice(0, 80),
          durationMs: Date.now() - startedAt,
        });
        resolve({ found: false, reason: "timeout", message: NOT_FOUND_MESSAGE });
      }, CASCADE_TIMEOUT_MS);
    }),
  ]);
  return result;
}

async function runCascade(rawQuery: string, startedAt: number): Promise<ProductSearchResult> {
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

  // ─── Step 0 : Own catalog (48k products, indexed Postgres). Sub-100 ms,
  // no external HTTP call. Products with known INCI are returned instantly. ──
  const catalogHit = await searchCatalogByName(query);
  if (catalogHit) {
    logInfo("cascade.hit", {
      source: "catalog",
      durationMs: Date.now() - startedAt,
      query: query.slice(0, 60),
    });
    void setProductCache({
      queryNorm,
      brand: catalogHit.brand,
      productName: catalogHit.productName,
      ingredientsText: catalogHit.ingredientsText,
      source: "catalog",
      sourceUrl: null,
      confidence: 0.95,
    });
    return {
      found: true,
      brand: catalogHit.brand,
      productName: catalogHit.productName,
      ingredientsText: catalogHit.ingredientsText,
      source: "cache" as const,
      sourceUrl: null,
      confidence: 0.95,
    };
  }

  // ─── Step 1 : Cache (Supabase). Re-validate the cached row against the
  // current query so historical bad matches (e.g. "brian" → "Mitomo" from
  // a buggy cascade) self-heal. ───────────────────────────────────────────
  const cached = await getProductCache(queryNorm);
  if (cached) {
    const cachedLabel = `${cached.brand ?? ""} ${cached.product_name ?? ""}`;
    if (matchesQuery(query, cachedLabel)) {
      logInfo("cascade.hit", {
        source: "cache",
        durationMs: Date.now() - startedAt,
        query: query.slice(0, 60),
      });
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
    logWarn("cascade.cache_label_mismatch", {
      query: query.slice(0, 60),
      cachedLabel: cachedLabel.slice(0, 80),
    });
  }

  // ─── Step 2 : Fire OBF + INCIDecoder + Brand (optional) + DDG in
  // parallel. The first hit (in priority order) wins; misses + errors are
  // logged so we can see where the cascade falls through. ─────────────────
  const brand = detectBrand(query);
  const attempts: SourceAttempt[] = [
    {
      name: "openbeautyfacts",
      sourceLabel: "openbeautyfacts",
      confidence: 0.95,
      promise: searchOpenBeautyFacts(query),
    },
    {
      name: "incidecoder",
      sourceLabel: "incidecoder",
      confidence: 0.85,
      promise: searchInciDecoder(query),
    },
    ...(brand
      ? [
          {
            name: `brand:${brand.domain}`,
            sourceLabel: `brand:${brand.domain}` as ProductSource,
            confidence: 0.9,
            promise: brand.search(stripBrandFromQuery(query, brand) || query),
          },
        ]
      : []),
    {
      name: "duckduckgo+mistral",
      sourceLabel: "duckduckgo+mistral",
      confidence: 0.7,
      promise: searchDuckDuckGo(query),
    },
  ];

  const settled = await Promise.allSettled(attempts.map((a) => a.promise));

  // Summarise every source's outcome BEFORE picking a winner. This is the
  // anti-silent-failure guarantee: if the cascade returns not_found, we'll
  // still have the per-source verdicts to diagnose why.
  const summary: Array<{ name: string; status: "hit" | "miss" | "error" | "mismatch" }> = [];
  for (let i = 0; i < attempts.length; i++) {
    const r = settled[i];
    const a = attempts[i]!;
    if (r.status === "rejected") {
      summary.push({ name: a.name, status: "error" });
      logWarn("cascade.source_error", {
        source: a.name,
        error: r.reason instanceof Error ? r.reason.message : String(r.reason).slice(0, 200),
      });
      continue;
    }
    if (r.value === null) {
      summary.push({ name: a.name, status: "miss" });
      continue;
    }
    const label = `${r.value.brand ?? ""} ${r.value.productName ?? ""}`;
    summary.push({
      name: a.name,
      status: matchesQuery(query, label) ? "hit" : "mismatch",
    });
  }

  // Pick the first VALID hit in priority order (attempts array is ordered).
  for (let i = 0; i < attempts.length; i++) {
    const r = settled[i];
    const a = attempts[i]!;
    if (r.status !== "fulfilled" || r.value === null) continue;
    const label = `${r.value.brand ?? ""} ${r.value.productName ?? ""}`;
    if (!matchesQuery(query, label)) continue;

    const hit = r.value;
    void setProductCache({
      queryNorm,
      brand: hit.brand,
      productName: hit.productName,
      ingredientsText: hit.ingredientsText,
      source: a.sourceLabel,
      sourceUrl: hit.sourceUrl,
      confidence: a.confidence,
    });

    logInfo("cascade.hit", {
      source: a.name,
      durationMs: Date.now() - startedAt,
      query: query.slice(0, 60),
      summary,
    });

    return {
      found: true,
      brand: hit.brand,
      productName: hit.productName,
      ingredientsText: hit.ingredientsText,
      source: a.sourceLabel,
      sourceUrl: hit.sourceUrl,
      confidence: a.confidence,
    };
  }

  // All sources missed or returned mismatching products.
  logWarn("cascade.not_found", {
    query: query.slice(0, 60),
    durationMs: Date.now() - startedAt,
    summary,
  });
  return {
    found: false,
    reason: "not_found",
    message: NOT_FOUND_MESSAGE,
  };
}
