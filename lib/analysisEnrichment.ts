/**
 * Backfill helpers for analyses persisted BEFORE a given schema upgrade. The
 * first use case is `dbColorRating` (added so the analyse list can render the
 * matched slug's colour even on low-confidence "suggestion" rows): old rows
 * in `cosme_check.analyses` were saved without that field, so without this
 * helper the list would keep showing grey dashes on historical analyses.
 *
 * Strategy is lazy + self-healing:
 *   1. On read, detect items that need enrichment (slug !== null && both
 *      colorRating and dbColorRating are falsy).
 *   2. Batch-query the `ingredients` table for the missing slugs.
 *   3. Patch the items in memory and return them.
 *   4. Fire-and-forget persist the enriched result_json back to the row so
 *      the next visit doesn't re-pay the round-trip.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnalyseItem, AnalyseResponse } from "@/lib/analyseTypes";
import type { ColorRating } from "@/lib/supabase";

type SupabaseLike = SupabaseClient;

type Result = {
  /** The analyse response with each item's `dbColorRating` filled in where possible. */
  enriched: AnalyseResponse;
  /** True when at least one item gained a non-null dbColorRating that wasn't
   *  there before — the caller can use this to decide whether to persist. */
  changed: boolean;
};

export async function enrichAnalyseWithDbColors(
  result: AnalyseResponse,
  sb: SupabaseLike,
): Promise<Result> {
  const items = result.items as AnalyseItem[] | undefined;
  if (!Array.isArray(items) || items.length === 0) {
    return { enriched: result, changed: false };
  }

  // Collect slugs that need a colour lookup: matched in the past but the
  // analyser didn't carry a dbColorRating (old rows) or the value is null.
  const slugsToLookup = new Set<string>();
  for (const it of items) {
    if (!it.slug) continue;
    if (it.colorRating) continue; // already classified — nothing to backfill
    if (it.dbColorRating) continue; // already enriched on a previous visit
    slugsToLookup.add(it.slug);
  }

  if (slugsToLookup.size === 0) {
    return { enriched: result, changed: false };
  }

  const { data, error } = await sb
    .schema("cosme_check")
    .from("ingredients")
    .select("slug, color_rating")
    .in("slug", Array.from(slugsToLookup));

  if (error || !data) {
    return { enriched: result, changed: false };
  }

  const colorBySlug = new Map<string, ColorRating | null>();
  for (const row of data as { slug: string; color_rating: ColorRating | null }[]) {
    colorBySlug.set(row.slug, row.color_rating);
  }

  let changed = false;
  const newItems = items.map((it) => {
    if (!it.slug) return it;
    if (it.colorRating || it.dbColorRating) return it;
    const dbColor = colorBySlug.get(it.slug);
    if (dbColor === undefined) return it;
    if (dbColor === null) {
      // Slug exists but really has no colour — still mark it as "looked up"
      // so we don't re-query on every visit.
      if (it.dbColorRating === null) return it;
      changed = true;
      return { ...it, dbColorRating: null };
    }
    changed = true;
    return { ...it, dbColorRating: dbColor };
  });

  if (!changed) return { enriched: result, changed: false };

  return {
    enriched: { ...result, items: newItems },
    changed: true,
  };
}
