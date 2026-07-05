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
  /** Compteurs couleur (envoyés à l'Edge Function pour la règle de sélection). */
  counts: { vert: number; jaune: number; orange: number; rouge: number };
  /** Nb d'ingrédients restreints dans CE produit. */
  restrictedCount: number;
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
      const cVert = counts?.vert ?? 0;
      const cJaune = counts?.jaune ?? 0;
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
      // Règle de sélection (parité STRICTE avec l'Edge Function
      // routine-smart-suggest → qualifiesForSuggestion, autorité finale) :
      //   1. orange > 0 OU rouge > 0            → toujours (obligatoire)
      //   2. sinon, ingrédient restreint présent → toujours
      //   3. sinon (vert/jaune only)            → seulement si jaune > vert
      const isAtRisk =
        cOrange > 0 || cRouge > 0 || restrictedCount > 0 || cJaune > cVert;

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
        counts: { vert: cVert, jaune: cJaune, orange: cOrange, rouge: cRouge },
        restrictedCount,
        severity,
        isAtRisk,
      };
    })
    .filter((p) => p.isAtRisk)
    .sort((a, b) => b.severity - a.severity)
    // Pas de cap artificiel : chaque produit concerné peut recevoir une
    // suggestion (le crédit est débité par produit côté serveur). Garde-fou 40.
    .slice(0, 40)
    .map(({ severity: _sev, isAtRisk: _r, ...p }) => p);
}
