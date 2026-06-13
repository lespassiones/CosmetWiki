/**
 * Shared types for the INCI analyser feature.
 */

import type { ColorRating } from "./supabase";
import type { ProductCategory } from "./ai/categorize";

export type MatchKind = "exact" | "alias" | "fuzzy_high" | "suggestion" | null;

/** Position relative to the first fragrance/preservative in the formula. */
export type ThresholdContext =
  | "before_fragrance"
  | "after_fragrance"
  | "before_preservative"
  | "after_preservative"
  | null;

export type AnalyseItem = {
  position: number;
  input: string;
  slug: string | null;
  name: string | null;
  colorRating: ColorRating | null;
  /**
   * Color carried by the matched slug's row in the `ingredients` table — kept
   * even when the match was a low-confidence "suggestion" so the analyse list
   * can stay consistent with the ingredient detail page the row's arrow links
   * to. Counts / spectrum / score only ever read `colorRating`, so a
   * suggestion never silently shifts the verdict.
   */
  dbColorRating: ColorRating | null;
  casNumber: string | null;
  translationFr: string | null;
  primaryFunction: string | null;
  allFunctions: string[] | null;
  tags: string[] | null;
  matchKind: MatchKind;
  /** Trigram similarity for fuzzy/suggestion kinds, 1 for exact/alias, 0 if unmatched. */
  confidence: number;
  /** Position context relative to first fragrance / preservative in the list. */
  thresholdContext: ThresholdContext;
  /** Short human label of the threshold context, in French. */
  thresholdLabel: string | null;
};

/**
 * Recompute `thresholdContext` + `thresholdLabel` on each item using the
 * current ≤1 % rule (prefer fragrance, fall back to preservative). Lets
 * analyses persisted in `cosme_check.analyses.result_json` reflect rule
 * changes without a data migration. Mirrors the logic in
 * `app/api/analyser/route.ts` — keep them in sync.
 */
const FRAGRANCE_NAMES = new Set(["PARFUM", "FRAGRANCE", "AROMA", "FLAVOR"]);

export function recomputeThresholdContext(items: AnalyseItem[]): AnalyseItem[] {
  const firstFragranceIdx = items.findIndex(
    (it) =>
      (it.name && FRAGRANCE_NAMES.has(it.name.toUpperCase()))
      || (it.tags?.includes("parfum-synthese") ?? false),
  );
  const firstPreservativeIdx = items.findIndex(
    (it) => it.tags?.includes("conservateur") ?? false,
  );

  let referenceIdx: number;
  let kind: "fragrance" | "preservative" | null;
  if (firstFragranceIdx >= 0) {
    referenceIdx = firstFragranceIdx;
    kind = "fragrance";
  } else if (firstPreservativeIdx >= 0) {
    referenceIdx = firstPreservativeIdx;
    kind = "preservative";
  } else {
    referenceIdx = -1;
    kind = null;
  }

  return items.map((it, idx) => {
    if (referenceIdx < 0 || !kind || idx === referenceIdx) {
      return { ...it, thresholdContext: null, thresholdLabel: null };
    }
    const before = idx < referenceIdx;
    if (kind === "fragrance") {
      return {
        ...it,
        thresholdContext: before ? "before_fragrance" : "after_fragrance",
        thresholdLabel: before ? "avant parfum" : "après parfum",
      };
    }
    return {
      ...it,
      thresholdContext: before ? "before_preservative" : "after_preservative",
      thresholdLabel: before ? "avant conservateur" : "après conservateur",
    };
  });
}

export type Observation = {
  tag: string;
  label: string;
  /**
   * - `absent`  : tag known to be reported when missing (Parabens absents, etc.)
   * - `present` : tag found in the list (Conservateurs présents, etc.)
   * - `info`    : neutral computed insight (water-based formula, coverage, …)
   * - `warn`    : computed concern (problematic ingredient near the top, …)
   */
  status: "present" | "absent" | "info" | "warn";
  count: number;
  items: { name: string; slug: string | null; colorRating: ColorRating | null }[];
  /** When set, replaces the auto "absents/présents" suffix in the UI. */
  message?: string;
};

export type AnalyseResponse = {
  counts: {
    total: number;
    matched: number;
    vert: number;
    jaune: number;
    orange: number;
    rouge: number;
    unknown: number;
  };
  score: number;
  scoreLabel: string;
  scoreTone: "green" | "amber" | "orange" | "rose";
  items: AnalyseItem[];
  observations: Observation[];
  aliasesUsed: { from: string; to: string | null }[];
  /** Suggestions for ambiguous tokens (fuzzy 0.55..0.90). */
  suggestions: {
    position: number;
    input: string;
    suggestedName: string;
    confidence: number;
  }[];
  /** Color rating spectrum for the first 5 and first 10 ingredients (null if position empty). */
  spectrum: {
    top5: (ColorRating | null)[];
    top10: (ColorRating | null)[];
  };
  /** EU Annex III fragrance allergens detected in this list (max 26). */
  euFragranceAllergens?: {
    detected: { inciName: string; label: string; note: string; position: number }[];
    total: number;
  };
  synthesis: string | null;
  /** Raw free-form product type from the front-photo OCR (e.g. "déodorant
   *  spray", "shampoing antipelliculaire"). Optional; not always available. */
  productType?: string | null;
  /** Closed-enum product category, either resolved from `productType` via a
   *  keyword fallback or computed by the backend's LLM categoriser. Used by
   *  `computeEssentiel` to pick context-aware verbs in the "Ce qui est bien"
   *  card (e.g. "Agent fixant" on a deodorant becomes "lie les ingrédients"
   *  instead of the wrong "fixe la coiffure"). */
  category?: ProductCategory | null;
  /** Full catalog category slug (e.g. "coiffure/shampooing/shampooing-classique")
   *  resolved from `catalog.category` when the product's EAN is known. More
   *  specific than `category` and used to display "sous-catégorie · marque"
   *  on the analysis screen. */
  catalogCategory?: string | null;
  /** Public image URL from the catalog entry, when available. Used by the
   *  "Outils" section to decide whether to offer the "add photo" row. */
  imageUrl?: string | null;
};
