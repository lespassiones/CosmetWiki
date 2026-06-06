// Persistent write helper for cosme_check.catalog.
// Called after product discovery (barcode scan, web search) and after
// full analysis, so every identified product ends up in the durable
// catalog — not just in the volatile product_inci_cache.

import { supabaseService } from "@/lib/supabase";

export type CatalogUpsertParams = {
  ean: string;
  brand?: string | null;
  name?: string | null;
  ingredientsText?: string | null;
  sourceUrl?: string | null;
  category?: string | null;
  // Score fields: only provided after a full analysis. When null, the
  // existing row's score is preserved (ON CONFLICT logic in the RPC).
  score?: number | null;
  scoreLabel?: string | null;
  scoreTone?: string | null;
  countTotal?: number | null;
};

/**
 * Upsert a product into the persistent catalog.
 *
 * - Always non-blocking (fire-and-forget): caller does `void upsertCatalogProduct(...)`.
 * - Never throws: errors are logged as warnings and swallowed so they
 *   never break the main API response.
 * - Merge strategy: null fields do NOT overwrite existing non-null values;
 *   score is updated only when provided (i.e. after a real analysis).
 */
export type CatalogRow = {
  ean: string;
  brand: string | null;
  name: string;
  ingredients_text: string | null;
  source_url: string | null;
  image_url: string | null;
  count_total: number | null;
};

/**
 * Lecture du catalogue par EAN exact. Retourne la ligne ou null.
 * Utilisé par le scan code-barres : on lit NOTRE base avant toute autre source.
 * Lecture seule, jamais bloquante : toute erreur → null.
 */
export async function getCatalogByEan(ean: string): Promise<CatalogRow | null> {
  try {
    const { data, error } = await supabaseService()
      .schema("cosme_check")
      .from("catalog")
      .select("ean, brand, name, ingredients_text, source_url, image_url, count_total")
      .eq("ean", ean)
      .maybeSingle();
    if (error || !data) return null;
    return data as CatalogRow;
  } catch {
    return null;
  }
}

/**
 * Enregistre un code-barres scanné mais inconnu dans le catalogue, en mode
 * "à compléter" (masqué tant qu'il n'a pas de liste INCI). Idempotent côté DB
 * (ON CONFLICT DO NOTHING). Fire-and-forget : ne jette jamais.
 */
export async function registerScannedBarcode(ean: string): Promise<void> {
  try {
    const { error } = await supabaseService().rpc(
      "cosme_check_register_scanned_barcode",
      { p_ean: ean },
    );
    if (error) {
      console.warn("[catalog] register scanned barcode error:", error.message);
    }
  } catch (err) {
    console.warn("[catalog] register scanned barcode failed:", err);
  }
}

export async function upsertCatalogProduct(
  params: CatalogUpsertParams,
): Promise<void> {
  try {
    const { error } = await supabaseService().rpc(
      "cosme_check_upsert_catalog_product",
      {
        p_ean: params.ean,
        p_brand: params.brand ?? null,
        p_name: params.name ?? null,
        p_ingredients_text: params.ingredientsText ?? null,
        p_source_url: params.sourceUrl ?? null,
        p_category: params.category ?? null,
        p_score: params.score ?? null,
        p_score_label: params.scoreLabel ?? null,
        p_score_tone: params.scoreTone ?? null,
        p_count_total: params.countTotal ?? null,
      },
    );
    if (error) {
      console.warn("[catalog] upsert error:", error.message);
    }
  } catch (err) {
    console.warn("[catalog] upsert failed:", err);
  }
}
