import { supabaseAnon } from "@/lib/supabase";
import { matchesQuery } from "./relevance";

type CatalogHit = {
  brand: string | null;
  productName: string;
  ingredientsText: string;
  ean: string;
};

/**
 * Search the 48k product catalog by name. Returns the first result that:
 *   - has a non-empty ingredients_text (INCI list)
 *   - passes the relevance gate against the original query
 *
 * This is the fastest possible source: a single indexed Postgres query against
 * our own catalog, no external HTTP call. Sub-100 ms.
 */
export async function searchCatalogByName(
  query: string,
): Promise<CatalogHit | null> {
  try {
    const { data, error } = await supabaseAnon()
      .rpc("cosme_check_search_catalog", { p_query: query, p_limit: 5 });

    if (error || !data) return null;

    const rows = data as Array<{
      ean: string;
      brand: string | null;
      name: string;
      ingredients_text: string | null;
    }>;

    for (const row of rows) {
      if (!row.ingredients_text || row.ingredients_text.trim().length < 5) continue;
      const label = `${row.brand ?? ""} ${row.name}`;
      if (!matchesQuery(query, label)) continue;
      return {
        brand: row.brand,
        productName: row.name,
        ingredientsText: row.ingredients_text,
        ean: row.ean,
      };
    }
    return null;
  } catch {
    return null;
  }
}
