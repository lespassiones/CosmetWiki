// Open Beauty Facts client. Free, structured JSON, no scraping required.
// Docs: https://openbeautyfacts.org/

import { matchesQuery } from "./relevance";

const SEARCH_ENDPOINT = "https://world.openbeautyfacts.org/cgi/search.pl";

type OBFProduct = {
  product_name?: string;
  product_name_fr?: string;
  product_name_en?: string;
  brands?: string;
  ingredients_text?: string;
  ingredients_text_fr?: string;
  ingredients_text_en?: string;
  code?: string;
  image_front_small_url?: string;
  image_front_url?: string;
  image_small_url?: string;
  image_url?: string;
};

function pickImage(p: OBFProduct): string | null {
  return (
    p.image_front_small_url ||
    p.image_small_url ||
    p.image_front_url ||
    p.image_url ||
    null
  );
}

function pickName(p: OBFProduct): string | null {
  return p.product_name_fr || p.product_name || p.product_name_en || null;
}

function pickIngredients(p: OBFProduct): string | null {
  const txt =
    p.ingredients_text_fr ||
    p.ingredients_text ||
    p.ingredients_text_en ||
    "";
  return txt.length > 30 ? txt : null;
}

export async function searchOpenBeautyFacts(query: string): Promise<{
  brand: string | null;
  productName: string | null;
  ingredientsText: string;
  sourceUrl: string;
} | null> {
  const url =
    `${SEARCH_ENDPOINT}?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=10`;
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Cosme-Check/1.0 (https://cosme-check.vercel.app)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!r.ok) return null;
    const json = (await r.json()) as { products?: OBFProduct[] };
    const products = (json.products ?? []).filter(
      (p) => pickIngredients(p) !== null,
    );
    if (products.length === 0) return null;

    // OBF returns loose fuzzy matches when there's no good hit (e.g. "brian"
    // returns "Mitomo"). Keep only candidates whose brand+name actually share
    // a token with the user query.
    const best = products.find((p) => {
      const label = `${p.brands ?? ""} ${pickName(p) ?? ""}`;
      return matchesQuery(query, label);
    });
    if (!best) return null;

    const ingredientsText = pickIngredients(best)!;
    return {
      brand: best.brands ?? null,
      productName: pickName(best),
      ingredientsText,
      sourceUrl: best.code
        ? `https://world.openbeautyfacts.org/product/${best.code}`
        : url,
    };
  } catch {
    return null;
  }
}

export type OpenBeautyFactsCandidate = {
  id: string;
  brand: string | null;
  productName: string | null;
  ingredientsText: string;
  imageUrl: string | null;
  sourceUrl: string;
};

/**
 * Returns a paginated list of OBF candidates that already have a usable
 * INCI list. Used by the "show me 10 matches before analysing" disambiguation
 * flow — the user picks the right product, then we feed its INCI directly to
 * the analyser without re-running the full cascade.
 */
export async function searchOpenBeautyFactsList(
  query: string,
  page = 1,
  pageSize = 10,
): Promise<{ candidates: OpenBeautyFactsCandidate[]; hasMore: boolean }> {
  const url =
    `${SEARCH_ENDPOINT}?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1` +
    `&page_size=${pageSize}&page=${page}`;
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Cosme-Check/1.0 (https://cosme-check.vercel.app)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!r.ok) return { candidates: [], hasMore: false };
    const json = (await r.json()) as {
      products?: OBFProduct[];
      count?: number;
      page?: number;
      page_size?: number;
    };
    const products = json.products ?? [];

    const candidates: OpenBeautyFactsCandidate[] = [];
    for (const p of products) {
      const ingredientsText = pickIngredients(p);
      if (!ingredientsText) continue;
      const label = `${p.brands ?? ""} ${pickName(p) ?? ""}`;
      if (!matchesQuery(query, label)) continue;
      candidates.push({
        id: p.code || `${label}-${candidates.length}`,
        brand: p.brands ?? null,
        productName: pickName(p),
        ingredientsText,
        imageUrl: pickImage(p),
        sourceUrl: p.code
          ? `https://world.openbeautyfacts.org/product/${p.code}`
          : url,
      });
    }

    const total = json.count ?? 0;
    const hasMore = page * pageSize < total;
    return { candidates, hasMore };
  } catch {
    return { candidates: [], hasMore: false };
  }
}
