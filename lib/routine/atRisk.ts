/**
 * At-risk routine products → input for the "Suggestions intelligentes" feature.
 *
 * Pure transformation of the already-loaded routine products: keep the ones the
 * app considers "à optimiser" (capped score out of the green zone, < 13), sorted
 * implicitly by routine order, capped to 5. We compute the CAPPED score + danger
 * colour here so both the routine page and the dedicated suggestions page agree
 * on the exact set sent to /api/routine/catalog-suggestions.
 */
import { colorCapScore } from "@/lib/essentiel/engine";
import type { RoutineProduct } from "@/lib/routine/engine";

export type AtRiskProduct = {
  /** Analysis id of the routine product (needed for "compare"). */
  id: string;
  name: string;
  ean: string | null;
  category: string | null;
  /** Raw /20 score, sent to the suggestions endpoint. */
  score: number;
  /** Capped score (tier pastilles + eligibility baseline, mirror mobile). */
  cappedScore: number;
  /** Badge colour derived from the capped score (rouge < 5, else orange). */
  dangerColor: "rouge" | "orange" | null;
};

/** Select the at-risk products (capped score < 13), capped to 5. */
export function selectAtRiskProducts(products: RoutineProduct[]): AtRiskProduct[] {
  return products
    .map((p) => {
      const counts = p.result?.counts;
      const capped = colorCapScore(typeof p.score === "number" ? p.score : 0, {
        orange: counts?.orange ?? 0,
        rouge: counts?.rouge ?? 0,
      });
      return {
        id: p.id,
        name: p.name,
        ean: p.ean ?? null,
        category: p.categoryPrecise ?? (p.result?.catalogCategory as string | null) ?? null,
        score: typeof p.score === "number" ? p.score : 0,
        cappedScore: capped,
        dangerColor: (capped < 5 ? "rouge" : "orange") as "rouge" | "orange",
      };
    })
    .filter((p) => p.cappedScore < 13)
    .slice(0, 5);
}
