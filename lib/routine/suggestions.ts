/**
 * Pure selection logic for the "smart catalog suggestions" feature
 * (routine page). Kept free of any I/O so it can be unit-tested in isolation;
 * the route in app/api/routine/catalog-suggestions wires it to the Supabase
 * RPCs and the AI guardrail.
 *
 * Handoff §2.3 — for each product to optimise we:
 *   1. apply the color cap to every candidate alternative (same cap as the
 *      search / browse lists, never the raw catalog score);
 *   2. drop candidates that hit one of the user's ingredient restrictions;
 *   3. keep only candidates that are BOTH in the green zone (capped >= 13, i.e.
 *      tier "Bien"/"Très bien") AND strictly better than the product (> +0.5).
 *      A smart suggestion must never recommend a yellow/orange product — only a
 *      genuinely clean replacement counts. If none qualify, suggest nothing.
 *   4. return the single best (highest capped score), or null if none qualify.
 */

import { colorCapScore } from "@/lib/essentiel/engine";
import { scoreLabel } from "@/lib/inciParser";
import type { UserRestrictions } from "@/lib/restrictions/types";

/** A raw catalog row as returned by cosme_check_alternatives_by_category_exact. */
export type CatalogAlternative = {
  ean: string;
  brand: string | null;
  name: string | null;
  category: string | null;
  image_url?: string | null;
  /** Raw catalog score (INCI Beauty), BEFORE the color cap. */
  score: number;
  ingredients_text?: string | null;
  count_orange?: number | null;
  count_rouge?: number | null;
};

/** An alternative once the color cap + label/tone have been applied. */
export type ScoredAlternative = CatalogAlternative & {
  /** Capped score (display value). */
  score: number;
  score_label: string;
  score_tone: "green" | "amber" | "orange" | "rose";
};

/** Minimum capped-score gain over the product for an alternative to qualify. */
export const MIN_IMPROVEMENT = 0.5;

/** Capped-score floor for the green zone ("Bien"). Suggestions must clear it. */
export const GREEN_MIN = 13;

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

function deburr(s: string): string {
  return s.normalize("NFD").replace(DIACRITICS_RE, "").toLowerCase();
}

/**
 * True when the alternative's INCI list contains one of the user's restricted
 * ingredients. We match on the persisted ingredient NAME against the catalog
 * `ingredients_text` (the reliable, catalog-side signal). Family restrictions
 * are intentionally NOT applied here: they need a tag->ingredient expansion the
 * catalog rows don't carry, so the analyser screen remains the place that flags
 * families; here we only guarantee we never suggest something containing an
 * ingredient the user explicitly excluded.
 */
export function altHitsRestriction(
  alt: CatalogAlternative,
  restrictions: UserRestrictions,
): boolean {
  if (!restrictions.ingredients.length) return false;
  const text = deburr(alt.ingredients_text ?? "");
  if (!text) return false;
  return restrictions.ingredients.some((r) => {
    const needle = deburr(r.name).trim();
    return needle.length >= 3 && text.includes(needle);
  });
}

/** Apply the color cap and attach the display label/tone. */
export function scoreAlternative(alt: CatalogAlternative): ScoredAlternative {
  const capped = colorCapScore(alt.score ?? 0, {
    orange: alt.count_orange ?? 0,
    rouge: alt.count_rouge ?? 0,
  });
  const { label, tone } = scoreLabel(capped);
  return { ...alt, score: capped, score_label: label, score_tone: tone };
}

/**
 * Pick the single best alternative for a product (handoff §2.3). Returns null
 * when no candidate is both restriction-clean AND meaningfully better.
 */
export function pickBestAlternative(
  productScore: number,
  alternatives: CatalogAlternative[],
  restrictions: UserRestrictions,
): ScoredAlternative | null {
  const threshold = productScore + MIN_IMPROVEMENT;
  const eligible = alternatives
    .filter((a) => !altHitsRestriction(a, restrictions))
    .map(scoreAlternative)
    // Green AND strictly better: never propose a yellow/orange "improvement".
    .filter((a) => a.score >= GREEN_MIN && a.score > threshold)
    .sort((a, b) => b.score - a.score);
  return eligible[0] ?? null;
}
