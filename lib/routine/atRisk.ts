/**
 * At-risk routine products → input for the "Suggestions intelligentes" feature.
 *
 * STRICTE PARITÉ avec le mobile (`lib/routine/optimize.ts` selectToOptimize) :
 * un produit est « à optimiser » si son score PLAFONNÉ est hors zone verte
 * (< 13) OU s'il viole une restriction du profil (même s'il est vert). On trie
 * par SÉVÉRITÉ (restriction ≫ rouge > orange > déficit de note) et on garde le
 * top 8. Sans la dimension restriction + le tri, le web envoyait les 5 premiers
 * dans l'ordre de routine → une seule suggestion verte survivait, là où le
 * mobile en montrait 5.
 */
import { colorCapScore } from "@/lib/essentiel/engine";
import { checkRestrictions } from "@/lib/restrictions/check";
import type { RoutineProduct } from "@/lib/routine/engine";
import type { AnalyseItem } from "@/lib/analyseTypes";
import type { IngredientFamily, UserRestrictions } from "@/lib/restrictions/types";

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
  /** Badge colour: rouge si restriction ou capped < 5, sinon orange. */
  dangerColor: "rouge" | "orange" | null;
};

export interface AtRiskOptions {
  /** Restrictions du profil — active la détection « viole une restriction ». */
  restrictions?: UserRestrictions;
  /** Référentiel des familles (tag_slug) — requis pour le match par tag. */
  families?: IngredientFamily[];
}

/**
 * Sélectionne les produits à optimiser, triés par sévérité, top 8.
 * Passer `opts.restrictions` + `opts.families` pour inclure aussi les produits
 * verts qui violent une restriction (comme le mobile).
 */
export function selectAtRiskProducts(
  products: RoutineProduct[],
  opts?: AtRiskOptions,
): AtRiskProduct[] {
  const restrictions = opts?.restrictions;
  const families = opts?.families ?? [];
  const hasRestrictions =
    !!restrictions &&
    (restrictions.families.length > 0 || restrictions.ingredients.length > 0);

  return products
    .map((p) => {
      const counts = p.result?.counts;
      const cOrange = counts?.orange ?? 0;
      const cRouge = counts?.rouge ?? 0;
      const capped = colorCapScore(typeof p.score === "number" ? p.score : 0, {
        orange: cOrange,
        rouge: cRouge,
      });

      // Détection « viole une restriction » DANS ce produit (par tag, identique
      // au mobile + au backend analyser). Un produit vert mais restreint compte.
      let restrictedCount = 0;
      if (hasRestrictions) {
        const items = (Array.isArray(p.result?.items) ? p.result!.items : []) as AnalyseItem[];
        restrictedCount = checkRestrictions(items, restrictions!, families).length;
      }

      const severity =
        (restrictedCount > 0 ? 1000 : 0) +
        cRouge * 40 +
        cOrange * 15 +
        Math.max(0, 20 - capped);
      // « À optimiser » si : note plafonnée hors zone verte (< 13), OU viole une
      // restriction, OU contient au moins un ingrédient orange/rouge. Ce dernier
      // critère élargit la sélection : un produit peut afficher une note plafonnée
      // verte tout en ayant un ingrédient à surveiller — il mérite quand même une
      // alternative plus propre. La zone verte ne suffit donc plus à exclure.
      const isAtRisk = capped < 13 || restrictedCount > 0 || cOrange >= 1 || cRouge >= 1;

      return {
        id: p.id,
        name: p.name,
        ean: p.ean ?? null,
        category: p.categoryPrecise ?? (p.result?.catalogCategory as string | null) ?? null,
        score: typeof p.score === "number" ? p.score : 0,
        cappedScore: capped,
        dangerColor: (restrictedCount > 0 || capped < 5 ? "rouge" : "orange") as
          | "rouge"
          | "orange",
        severity,
        isAtRisk,
      };
    })
    .filter((p) => p.isAtRisk)
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 8)
    .map(({ severity: _sev, isAtRisk: _r, ...p }) => p);
}
