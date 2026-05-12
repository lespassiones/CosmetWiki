/**
 * Shared types for the INCI analyser feature.
 */

import type { ColorRating } from "./supabase";

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
  casNumber: string | null;
  translationFr: string | null;
  primaryFunction: string | null;
  tags: string[] | null;
  matchKind: MatchKind;
  /** Trigram similarity for fuzzy/suggestion kinds, 1 for exact/alias, 0 if unmatched. */
  confidence: number;
  /** Position context relative to first fragrance / preservative in the list. */
  thresholdContext: ThresholdContext;
  /** Short human label of the threshold context, in French. */
  thresholdLabel: string | null;
};

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
};
