/**
 * Side-by-side comparison of two analyses.
 *
 * Goes beyond a dumb "show both scores" by producing actionable insights:
 *   - score delta and counts delta
 *   - tags present in A but missing in B (and vice-versa)
 *   - ingredients that the user already has elsewhere in their routine
 *     (so switching wouldn't actually reduce total exposure)
 */
import type { AnalyseItem, AnalyseResponse } from "@/lib/analyseTypes";

export type CompareSide = {
  id: string;
  name: string;
  score: number | null;
  result: AnalyseResponse;
};

export type CompareDiff = {
  scoreDelta: number;
  winner: "a" | "b" | "tie";
  countsDelta: {
    vert: number;
    jaune: number;
    orange: number;
    rouge: number;
  };
  uniqueToA: { name: string; slug: string | null; colorRating: AnalyseItem["colorRating"] }[];
  uniqueToB: { name: string; slug: string | null; colorRating: AnalyseItem["colorRating"] }[];
  shared: { name: string; slug: string | null; colorRating: AnalyseItem["colorRating"] }[];
  insights: string[];
};

function setOfNames(items: AnalyseItem[]): Map<string, AnalyseItem> {
  const m = new Map<string, AnalyseItem>();
  for (const it of items) {
    const key = (it.slug ?? it.name ?? it.input).toUpperCase();
    if (!m.has(key)) m.set(key, it);
  }
  return m;
}

export function compareAnalyses(
  a: CompareSide,
  b: CompareSide,
  options: { routineIngredientSlugs?: Set<string> } = {},
): CompareDiff {
  const aScore = a.score ?? 0;
  const bScore = b.score ?? 0;
  const scoreDelta = Number((bScore - aScore).toFixed(1));
  const winner: "a" | "b" | "tie" =
    Math.abs(scoreDelta) < 0.3 ? "tie" : scoreDelta > 0 ? "b" : "a";

  const aMap = setOfNames(a.result.items);
  const bMap = setOfNames(b.result.items);

  const uniqueToA: CompareDiff["uniqueToA"] = [];
  const uniqueToB: CompareDiff["uniqueToB"] = [];
  const shared: CompareDiff["shared"] = [];

  for (const [k, it] of aMap) {
    if (!bMap.has(k)) {
      if (it.colorRating && it.colorRating !== "Vert") {
        uniqueToA.push({ name: it.name ?? it.input, slug: it.slug, colorRating: it.colorRating });
      }
    } else {
      shared.push({ name: it.name ?? it.input, slug: it.slug, colorRating: it.colorRating });
    }
  }
  for (const [k, it] of bMap) {
    if (!aMap.has(k)) {
      if (it.colorRating && it.colorRating !== "Vert") {
        uniqueToB.push({ name: it.name ?? it.input, slug: it.slug, colorRating: it.colorRating });
      }
    }
  }

  // Cross-routine insight: how many ingredients of B are already present in
  // OTHER routine products? If high, switching to B doesn't reduce overall
  // exposure even if its individual score is better.
  let bOverlapWithRoutine = 0;
  if (options.routineIngredientSlugs) {
    for (const it of b.result.items) {
      if (it.slug && options.routineIngredientSlugs.has(it.slug)) {
        bOverlapWithRoutine += 1;
      }
    }
  }

  const insights: string[] = [];
  if (winner === "tie") {
    insights.push("Les deux compositions ont une note quasi identique.");
  } else {
    const better = winner === "a" ? a.name : b.name;
    const worse = winner === "a" ? b.name : a.name;
    const abs = Math.abs(scoreDelta).toFixed(1);
    insights.push(`**${better}** est mieux noté que **${worse}** de ${abs} point${Number(abs) > 1 ? "s" : ""}.`);
  }
  if (uniqueToA.length === 0 && uniqueToB.length === 0) {
    insights.push("Compositions identiques sur les ingrédients pénalisants.");
  } else {
    if (uniqueToB.length > 0) {
      const top = uniqueToB.slice(0, 3).map((i) => i.name).join(", ");
      insights.push(`**${b.name}** contient ${uniqueToB.length} ingrédient${uniqueToB.length > 1 ? "s" : ""} pénalisant${uniqueToB.length > 1 ? "s" : ""} absent${uniqueToB.length > 1 ? "s" : ""} de **${a.name}** (${top}).`);
    }
    if (uniqueToA.length > 0) {
      const top = uniqueToA.slice(0, 3).map((i) => i.name).join(", ");
      insights.push(`**${a.name}** contient ${uniqueToA.length} ingrédient${uniqueToA.length > 1 ? "s" : ""} pénalisant${uniqueToA.length > 1 ? "s" : ""} absent${uniqueToA.length > 1 ? "s" : ""} de **${b.name}** (${top}).`);
    }
  }
  if (bOverlapWithRoutine >= 3) {
    insights.push(`Attention : **${b.name}** partage ${bOverlapWithRoutine} ingrédients avec d'autres produits de ta routine — switcher ne réduirait pas significativement ton exposition cumulée.`);
  }

  return {
    scoreDelta,
    winner,
    countsDelta: {
      vert: b.result.counts.vert - a.result.counts.vert,
      jaune: b.result.counts.jaune - a.result.counts.jaune,
      orange: b.result.counts.orange - a.result.counts.orange,
      rouge: b.result.counts.rouge - a.result.counts.rouge,
    },
    uniqueToA: uniqueToA.slice(0, 10),
    uniqueToB: uniqueToB.slice(0, 10),
    shared: shared.slice(0, 10),
    insights,
  };
}
