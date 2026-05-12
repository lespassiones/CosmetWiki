// Read/write the product_inci_cache table via SECURITY DEFINER RPCs.

import { supabaseAnon, supabaseService } from "@/lib/supabase";

type CacheRow = {
  query_norm: string;
  brand: string | null;
  product_name: string | null;
  ingredients_text: string;
  source: string;
  source_url: string | null;
  confidence: number | null;
  votes_correct: number;
  votes_wrong: number;
  updated_at: string;
};

export async function getProductCache(
  queryNorm: string,
): Promise<CacheRow | null> {
  try {
    const { data, error } = await supabaseAnon().rpc(
      "cosme_check_get_product_cache",
      { p_query_norm: queryNorm },
    );
    if (error) return null;
    if (!data || (Array.isArray(data) && data.length === 0)) return null;
    const row = Array.isArray(data) ? data[0] : data;
    return row as CacheRow;
  } catch {
    return null;
  }
}

export async function setProductCache(input: {
  queryNorm: string;
  brand: string | null;
  productName: string | null;
  ingredientsText: string;
  source: string;
  sourceUrl: string | null;
  confidence: number;
}): Promise<void> {
  try {
    const sb = supabaseService();
    await sb.rpc("cosme_check_set_product_cache", {
      p_query_norm: input.queryNorm,
      p_brand: input.brand,
      p_product_name: input.productName,
      p_ingredients_text: input.ingredientsText,
      p_source: input.source,
      p_source_url: input.sourceUrl,
      p_confidence: input.confidence,
    });
  } catch (err) {
    // Cache writes are best-effort. Log but don't fail the request.
    console.warn("[productSearch] cache write failed:", err);
  }
}
