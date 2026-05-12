/**
 * Routine analytics engine.
 *
 * Inputs: an array of (analysis, frequency) tuples.
 * Outputs:
 *   - exposureScore /20 — weighted average penalty per use, normalized.
 *   - tagExposure   — cumulative occurrences per tag, weighted by use frequency.
 *   - topIngredients— ingredients most cumulatively encountered (frequency × penalty).
 *   - allergenOverlap — EU fragrance allergens present in 2+ products.
 *   - simulation    — projected exposure if the worst 1/2 products are removed.
 */
import { EU_FRAGRANCE_ALLERGENS, isEuFragranceAllergen } from "@/lib/euAllergens";
import type { AnalyseItem, AnalyseResponse } from "@/lib/analyseTypes";

export type Frequency = "daily" | "weekly" | "monthly";

const FREQ_WEIGHT: Record<Frequency, number> = {
  daily: 1.0,
  weekly: 1 / 7,
  monthly: 1 / 30,
};

const PENALTY: Record<string, number> = {
  Vert: 0,
  Jaune: 0.6,
  Orange: 2.0,
  Rouge: 4.0,
};

export type RoutineProduct = {
  id: string;            // analysis id
  name: string;
  frequency: Frequency;
  score: number | null;  // /20
  result: AnalyseResponse;
};

export type RoutineMetrics = {
  exposureScore: number;        // /20 — higher = safer
  exposureLabel: "Faible" | "Modérée" | "Élevée" | "Très élevée";
  totalUseUnits: number;        // sum of frequency weights
  /** Count of routine products whose own score falls in orange/rose band (< 13/20). */
  penalizingProductsCount: number;
  tagExposure: { tag: string; label: string; cumulativeCount: number }[];
  topIngredients: {
    name: string;
    slug: string | null;
    colorRating: AnalyseItem["colorRating"];
    productCount: number;       // how many distinct routine products contain it
    weightedExposure: number;   // sum of frequency weights of those products × penalty
  }[];
  allergenOverlap: {
    inciName: string;
    label: string;
    productCount: number;       // 2+ products
  }[];
  simulation: {
    /** Exposure score if the single worst product is removed. */
    minus1: { exposureScore: number; removedName: string | null };
    /** Exposure score if the two worst products are removed. */
    minus2: { exposureScore: number; removedNames: string[] };
    /** Detailed info on the 1-2 worst products (id, name, score, top problematic ingredients). */
    worstProducts: {
      id: string;
      name: string;
      score: number | null;
      worstIngredients: {
        name: string;
        slug: string | null;
        colorRating: AnalyseItem["colorRating"];
        tags: string[];
      }[];
    }[];
  };
};

const TAG_LABELS: Record<string, string> = {
  paraben: "Parabens",
  silicone: "Silicones",
  sulfate: "Sulfates",
  "huile-minerale": "Huiles minérales",
  ethoxyle: "Composés éthoxylés",
  "colorant-synthese": "Colorants de synthèse",
  "ammonium-quaternaire": "Ammoniums quaternaires",
  "allergene-parfumant": "Allergènes parfumants",
  conservateur: "Conservateurs",
  "parfum-synthese": "Parfums de synthèse",
  "huile-essentielle": "Huiles essentielles",
  ogm: "OGM",
};

function exposureLabelFor(score: number): RoutineMetrics["exposureLabel"] {
  if (score >= 17) return "Faible";
  if (score >= 13) return "Modérée";
  if (score >= 9) return "Élevée";
  return "Très élevée";
}

/**
 * Compute the exposure for a SINGLE product, as a "penalty / use".
 * We use the inverse-of-score so that "weighted average" stays linear.
 *
 *   penaltyPerUse(product) = 20 - product.score
 *   exposure(product) = penaltyPerUse × frequencyWeight
 *
 * Routine exposure score = 20 - sum(weightedPenalty) / max(1, totalUnits)
 */
function penaltyPerUse(score: number | null): number {
  if (score === null || Number.isNaN(score)) return 0;
  return Math.max(0, 20 - score);
}

export function computeRoutineMetrics(products: RoutineProduct[]): RoutineMetrics {
  if (products.length === 0) {
    return {
      exposureScore: 20,
      exposureLabel: "Faible",
      totalUseUnits: 0,
      penalizingProductsCount: 0,
      tagExposure: [],
      topIngredients: [],
      allergenOverlap: [],
      simulation: {
        minus1: { exposureScore: 20, removedName: null },
        minus2: { exposureScore: 20, removedNames: [] },
        worstProducts: [],
      },
    };
  }

  const totalUseUnits = products.reduce((sum, p) => sum + FREQ_WEIGHT[p.frequency], 0);

  function scoreOf(list: RoutineProduct[]): number {
    if (list.length === 0) return 20;
    const total = list.reduce((s, p) => s + FREQ_WEIGHT[p.frequency], 0);
    const weighted = list.reduce(
      (s, p) => s + penaltyPerUse(p.score) * FREQ_WEIGHT[p.frequency],
      0,
    );
    return Math.max(0, Math.min(20, 20 - weighted / Math.max(total, 0.0001)));
  }
  const exposureScore = scoreOf(products);

  // Tag exposure — weighted by frequency, sum across all products.
  const tagMap = new Map<string, number>();
  for (const p of products) {
    const weight = FREQ_WEIGHT[p.frequency];
    const tagsInProduct = new Set<string>();
    for (const it of p.result.items) {
      for (const t of it.tags ?? []) {
        tagsInProduct.add(t);
      }
    }
    for (const t of tagsInProduct) {
      tagMap.set(t, (tagMap.get(t) ?? 0) + weight);
    }
  }
  const tagExposure = Array.from(tagMap.entries())
    .map(([tag, cumulativeCount]) => ({
      tag,
      label: TAG_LABELS[tag] ?? tag,
      cumulativeCount: Number(cumulativeCount.toFixed(2)),
    }))
    .sort((a, b) => b.cumulativeCount - a.cumulativeCount);

  // Top ingredients — most cumulatively encountered, weighted by frequency × penalty.
  // We only consider non-green ingredients so the top list highlights what to address.
  type IngAccum = {
    name: string;
    slug: string | null;
    colorRating: AnalyseItem["colorRating"];
    productCount: number;
    weightedExposure: number;
  };
  const ingMap = new Map<string, IngAccum>();
  for (const p of products) {
    const weight = FREQ_WEIGHT[p.frequency];
    const seen = new Set<string>();
    for (const it of p.result.items) {
      if (!it.colorRating || it.colorRating === "Vert") continue;
      const key = (it.slug ?? it.name ?? it.input).toUpperCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const cur = ingMap.get(key);
      const penalty = PENALTY[it.colorRating] ?? 0;
      if (cur) {
        cur.productCount += 1;
        cur.weightedExposure += weight * penalty;
      } else {
        ingMap.set(key, {
          name: it.name ?? it.input,
          slug: it.slug,
          colorRating: it.colorRating,
          productCount: 1,
          weightedExposure: weight * penalty,
        });
      }
    }
  }
  const topIngredients = Array.from(ingMap.values())
    .sort((a, b) => b.weightedExposure - a.weightedExposure || b.productCount - a.productCount)
    .slice(0, 5)
    .map((i) => ({ ...i, weightedExposure: Number(i.weightedExposure.toFixed(2)) }));

  // EU fragrance allergens overlap — present in 2+ products.
  const allergenCount = new Map<string, { label: string; products: Set<string> }>();
  for (const p of products) {
    for (const it of p.result.items) {
      const candidates = [it.name, it.input].filter((v): v is string => Boolean(v));
      for (const c of candidates) {
        if (isEuFragranceAllergen(c)) {
          const upper = c.toUpperCase();
          const meta = EU_FRAGRANCE_ALLERGENS.find((a) => a.inciName === upper)!;
          if (!allergenCount.has(upper)) {
            allergenCount.set(upper, { label: meta.label, products: new Set() });
          }
          allergenCount.get(upper)!.products.add(p.id);
          break;
        }
      }
    }
  }
  const allergenOverlap = Array.from(allergenCount.entries())
    .filter(([, v]) => v.products.size >= 2)
    .map(([inciName, v]) => ({ inciName, label: v.label, productCount: v.products.size }))
    .sort((a, b) => b.productCount - a.productCount);

  // Simulation : remove the 1 or 2 products with the worst (lowest) score.
  const sortedByScore = [...products].sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  const remove1 = products.filter((p) => p.id !== sortedByScore[0]?.id);
  const remove2 = products.filter(
    (p) => p.id !== sortedByScore[0]?.id && p.id !== sortedByScore[1]?.id,
  );

  // Per-product detail for the simulation modal: surface the 3 worst
  // (Rouge then Orange) ingredients of each worst product so the user can see
  // *why* removing it matters.
  const worstProducts = [sortedByScore[0], sortedByScore[1]]
    .filter((p): p is RoutineProduct => Boolean(p))
    .map((p) => {
      const ranked = [...p.result.items]
        .filter((it) => it.colorRating === "Rouge" || it.colorRating === "Orange")
        .sort((a, b) => {
          const ra = a.colorRating === "Rouge" ? 0 : 1;
          const rb = b.colorRating === "Rouge" ? 0 : 1;
          if (ra !== rb) return ra - rb;
          return (a.position ?? 999) - (b.position ?? 999);
        })
        .slice(0, 5);
      return {
        id: p.id,
        name: p.name,
        score: p.score,
        worstIngredients: ranked.map((it) => ({
          name: it.name ?? it.input,
          slug: it.slug,
          colorRating: it.colorRating,
          tags: it.tags ?? [],
        })),
      };
    });
  const simulation = {
    minus1: {
      exposureScore: Number(scoreOf(remove1).toFixed(1)),
      removedName: sortedByScore[0]?.name ?? null,
    },
    minus2: {
      exposureScore: Number(scoreOf(remove2).toFixed(1)),
      removedNames: [sortedByScore[0], sortedByScore[1]]
        .filter((p): p is RoutineProduct => Boolean(p))
        .map((p) => p.name),
    },
    worstProducts,
  };

  // Products that are themselves "penalizing": their own score is < 13/20
  // (i.e. orange/rose band — Bien threshold sits at 13).
  const penalizingProductsCount = products.filter(
    (p) => typeof p.score === "number" && p.score < 13,
  ).length;

  return {
    exposureScore: Number(exposureScore.toFixed(1)),
    exposureLabel: exposureLabelFor(exposureScore),
    totalUseUnits: Number(totalUseUnits.toFixed(2)),
    penalizingProductsCount,
    tagExposure,
    topIngredients,
    allergenOverlap,
    simulation,
  };
}
