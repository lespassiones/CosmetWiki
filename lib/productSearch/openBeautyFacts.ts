// Open Beauty Facts client. Free, structured JSON, no scraping required.
// Docs: https://openbeautyfacts.org/

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
};

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
        "User-Agent": "CosmetWiki/1.0 (https://cosmetwiki.vercel.app)",
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

    // Best match : the first product that has substantive ingredients.
    // OBF orders by relevance to search_terms by default.
    const best = products[0]!;
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
