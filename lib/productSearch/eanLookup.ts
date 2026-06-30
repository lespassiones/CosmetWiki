/**
 * eanLookup — recherche un EAN sur Open Beauty Facts par nom de produit.
 *
 * Port web (parité avec l'Edge Function mobile `_shared/eanLookup.ts`). Utilisé
 * en fire-and-forget par /api/analyser après une analyse d'un produit internet
 * SANS EAN : si OBF connaît le produit, on récupère son code-barres pour
 * l'ajouter au catalogue Supabase (cache inter-users permanent).
 *
 * - `lookupEanByName(brand, name)` : appel réseau OBF + timeout 6s, jamais throw.
 * - `parseOBFSearchResult(data)` : extraction pure (testable).
 */

const OBF_SEARCH_URL = "https://world.openbeautyfacts.org/cgi/search.pl";
const UA = "Cosme-Check/1.0 (https://cosme-check.com)";
const TIMEOUT_MS = 6_000;
const MIN_INCI_LENGTH = 30;

type OBFProduct = {
  code?: string;
  ingredients_text?: string;
  ingredients_text_fr?: string;
  ingredients_text_en?: string;
};

type OBFSearchResponse = {
  products?: OBFProduct[];
};

export type EanLookupResult = {
  ean: string;
  ingredientsText: string;
};

/**
 * Premier résultat OBF valide : code non vide + ingredients_text ≥ 30 chars.
 * Fonction pure (testable).
 */
export function parseOBFSearchResult(data: unknown): EanLookupResult | null {
  if (!data || typeof data !== "object") return null;
  const products = (data as OBFSearchResponse).products;
  if (!Array.isArray(products) || products.length === 0) return null;

  for (const product of products) {
    if (!product || typeof product !== "object") continue;
    const p = product as OBFProduct;
    const code = p.code;
    if (!code || code.trim() === "") continue;

    const rawText =
      p.ingredients_text_fr || p.ingredients_text || p.ingredients_text_en || "";
    if (rawText.length < MIN_INCI_LENGTH) continue;

    return { ean: code.trim(), ingredientsText: rawText };
  }
  return null;
}

/**
 * Cherche un EAN sur Open Beauty Facts par marque + nom. Timeout 6s.
 * Retourne null en cas d'erreur ou si aucun résultat valide.
 */
export async function lookupEanByName(
  brand: string,
  name: string,
): Promise<EanLookupResult | null> {
  try {
    const query = encodeURIComponent(`${brand} ${name}`.trim());
    const url = `${OBF_SEARCH_URL}?search_terms=${query}&action=process&json=1&page_size=3&search_simple=1`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: controller.signal,
      });
      if (!r.ok) return null;
      return parseOBFSearchResult((await r.json()) as unknown);
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}
