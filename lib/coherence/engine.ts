/**
 * Coherence engine — pure deterministic logic.
 *
 * The LLM proposes (in lib/ai/coherence.ts) which actives WOULD support a
 * given promise. This engine then *mechanically* checks whether those actives
 * are actually present in the parent INCI analysis, in what position, and
 * derives the per-promise verdict from rules.
 *
 * No LLM call here. The engine is what guarantees we never report an
 * ingredient that isn't physically in the formula.
 */

import type { AnalyseItem, AnalyseResponse } from "@/lib/analyseTypes";
import { findCategoryBySlug, type ActiveEntry } from "./claims";
import type {
  CoherencePromise,
  CoherenceResult,
  CoherenceVerdict,
  UnverifiableClaim,
} from "./types";

// -----------------------------------------------------------------------------
// Matching helpers
// -----------------------------------------------------------------------------

/**
 * Normalised string for fuzzy comparison: lowercase, no diacritics, no
 * non-alphanumerics. Catches "Acide hyaluronique" ≈ "Hyaluronic Acid"
 * loosely, and "Caféine" ≈ "Caffeine" exactly after stripping.
 */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Find an item in the parent analysis that corresponds to a candidate
 * active proposed by the LLM.
 *
 * Match priority:
 *   1. exact slug match (most reliable, since `claims.ts` uses the same
 *      slug schema as cosme_check.ingredients.slug)
 *   2. exact normalised name match
 *   3. normalised name contained in either direction (handles
 *      "Caffeine" inside "Caffeine Anhydrous", or display name vs INCI)
 */
function findItemForActive(
  active: ActiveEntry,
  items: AnalyseItem[],
): AnalyseItem | null {
  // 1. slug match
  if (active.slug) {
    const bySlug = items.find((it) => it.slug === active.slug);
    if (bySlug) return bySlug;
  }

  const targetName = norm(active.name);
  const targetSlug = norm(active.slug ?? "");

  // 2. exact normalised name (try both `name` and `input` since users sometimes
  //    paste a translated/aliased token)
  const exactName = items.find((it) => {
    const n1 = norm(it.name ?? "");
    const n2 = norm(it.input ?? "");
    return (
      (targetName.length > 0 && (n1 === targetName || n2 === targetName))
      || (targetSlug.length > 0 && (n1 === targetSlug || n2 === targetSlug))
    );
  });
  if (exactName) return exactName;

  // 3. partial normalised match — only when the candidate is at least 5
  //    characters long, otherwise we'd match noise (e.g. "C" inside "Cocoa")
  if (targetName.length >= 5) {
    const partial = items.find((it) => {
      const n1 = norm(it.name ?? "");
      const n2 = norm(it.input ?? "");
      return (
        (n1 && (n1.includes(targetName) || targetName.includes(n1)))
        || (n2 && (n2.includes(targetName) || targetName.includes(n2)))
      );
    });
    if (partial) return partial;
  }

  return null;
}

/** True when the item sits past the first fragrance OR first preservative. */
function isInTrace(item: AnalyseItem): boolean {
  return (
    item.thresholdContext === "after_fragrance"
    || item.thresholdContext === "after_preservative"
  );
}

// -----------------------------------------------------------------------------
// Verdict derivation
// -----------------------------------------------------------------------------

/**
 * Decide the verdict for one promise based on what was found in the formula.
 *
 * Rules (evaluated top-down):
 *   - At least one *documented* active is present AND well dosed (not in trace)
 *     → "tenue"
 *   - At least one *documented* active is present but ALL are in trace (≤1 %)
 *     → "partielle"
 *   - No documented active, but a *marketing* active is present
 *     (e.g. polysaccharides for densification) → "marketing"
 *   - Otherwise → "non_demontree"
 */
function deriveVerdict({
  documentedFound,
  documentedFoundWellDosed,
  marketingFound,
}: {
  documentedFound: number;
  documentedFoundWellDosed: number;
  marketingFound: number;
}): CoherenceVerdict {
  if (documentedFoundWellDosed > 0) return "tenue";
  if (documentedFound > 0) return "partielle";
  if (marketingFound > 0) return "marketing";
  return "non_demontree";
}

/**
 * Score 0–100 for the per-promise progress bar.
 *   - 100 if every documented active is present and well dosed.
 *   - In-trace doses count as half-credit (the active *is* there, just under
 *     the efficacy threshold — partial credit).
 *   - Marketing-only matches count as 10 (visible on the bar but clearly low).
 */
function scoreFor({
  documentedExpected,
  documentedFoundWellDosed,
  documentedFoundInTrace,
  marketingFound,
}: {
  documentedExpected: number;
  documentedFoundWellDosed: number;
  documentedFoundInTrace: number;
  marketingFound: number;
}): number {
  if (documentedExpected === 0) {
    return marketingFound > 0 ? 25 : 0;
  }
  const ratio
    = (documentedFoundWellDosed + documentedFoundInTrace * 0.5) / documentedExpected;
  return Math.round(Math.min(1, ratio) * 100);
}

// -----------------------------------------------------------------------------
// Per-promise resolver — the main mechanical step
// -----------------------------------------------------------------------------

export type LlmPromiseProposal = {
  /** Slug from the catalogue (or "autre" for an off-catalogue claim). */
  category_slug: string;
  /** Human label (LLM-provided fallback if the slug doesn't map). */
  label: string;
  /** Verbatim phrase from the description that triggered this promise. */
  excerpt: string;
};

/**
 * Result of the "open promise" LLM exploration step. The LLM is given the
 * actual list of items in the formula and proposes which ones support the
 * promise — by slug. We validate every entry against the items list before
 * trusting it, so even if the LLM hallucinates a slug, we discard it.
 */
export type OpenLlmMatch = {
  item_slug: string;
  item_name: string;
  evidence: "documented" | "supportive" | "marketing";
  reason: string;
};

/**
 * For one promise proposed by the LLM, look up the catalogue, find which
 * candidate actives are actually in the formula, and compute the verdict.
 */
export function resolvePromise(
  proposal: LlmPromiseProposal,
  items: AnalyseItem[],
): CoherencePromise {
  const cat = findCategoryBySlug(proposal.category_slug);

  // Off-catalogue claim → we can't verify. Return as "non_demontree" so the
  // user still sees the claim was detected.
  if (!cat) {
    return {
      slug: proposal.category_slug || "autre",
      label: proposal.label || proposal.category_slug || "Promesse",
      excerpt: proposal.excerpt,
      verdict: "non_demontree",
      expectedActives: [],
      foundActives: [],
      cosmeticActives: [],
      missingActives: [],
      score: 0,
    };
  }

  const documentedActives = cat.actives.filter(
    (a) => a.evidence === "documented" || a.evidence === "supportive",
  );
  const cosmeticActives = cat.actives.filter((a) => a.evidence === "marketing");

  const foundDocumented: CoherencePromise["foundActives"] = [];
  const foundCosmetic: CoherencePromise["cosmeticActives"] = [];
  const missing: string[] = [];

  for (const active of documentedActives) {
    const item = findItemForActive(active, items);
    if (item) {
      foundDocumented.push({
        name: active.name,
        slug: item.slug,
        position: item.position,
        inTrace: isInTrace(item),
      });
    } else {
      missing.push(active.name);
    }
  }

  for (const active of cosmeticActives) {
    const item = findItemForActive(active, items);
    if (item) {
      foundCosmetic.push({
        name: active.name,
        slug: item.slug,
        position: item.position,
        note: "effet visuel/sensoriel",
      });
    }
  }

  const wellDosed = foundDocumented.filter((f) => !f.inTrace).length;
  const inTrace = foundDocumented.filter((f) => f.inTrace).length;
  const verdict = deriveVerdict({
    documentedFound: foundDocumented.length,
    documentedFoundWellDosed: wellDosed,
    marketingFound: foundCosmetic.length,
  });
  const score = scoreFor({
    documentedExpected: documentedActives.length,
    documentedFoundWellDosed: wellDosed,
    documentedFoundInTrace: inTrace,
    marketingFound: foundCosmetic.length,
  });

  return {
    slug: cat.slug,
    label: cat.label,
    excerpt: proposal.excerpt,
    verdict,
    expectedActives: documentedActives.map((a) => a.name),
    foundActives: foundDocumented,
    cosmeticActives: foundCosmetic,
    // Trim missing list to the most informative ones (max 5) so the table
    // doesn't blow up visually.
    missingActives: missing.slice(0, 5),
    score,
  };
}

/**
 * Resolve a promise that's NOT in the static catalogue, using LLM-proposed
 * matches against the actual formula's items.
 *
 * The LLM has already returned a list of items it considers active for this
 * promise (by slug, picked from the items we showed it). This function:
 *   1. Re-validates each match against the parent items (defence in depth —
 *      even if the LLM hallucinated a slug, we drop it here).
 *   2. Reads each matched item's `thresholdContext` to decide if well dosed
 *      vs in trace.
 *   3. Derives the verdict using the same rules as the catalogue path.
 *
 * The LLM cannot cause an invented ingredient to appear in the result.
 */
export function resolveOpenPromise(
  proposal: LlmPromiseProposal,
  items: AnalyseItem[],
  llmMatches: OpenLlmMatch[],
  llmMissing: string[],
): CoherencePromise {
  // Validate each match against the actual items list. If the LLM cited a
  // slug that doesn't exist in the formula, drop the match silently.
  const validated = llmMatches
    .map((m) => {
      // 1. Slug match (primary path — what we asked the LLM to use).
      let item = m.item_slug
        ? items.find((it) => it.slug && it.slug === m.item_slug) ?? null
        : null;
      // 2. Name fallback for the rare case where the LLM picked the right
      //    item but mistyped its slug.
      if (!item && m.item_name) {
        const target = norm(m.item_name);
        if (target.length >= 4) {
          item = items.find((it) => {
            const a = norm(it.name ?? "");
            const b = norm(it.input ?? "");
            return a === target || b === target;
          }) ?? null;
        }
      }
      if (!item) return null;
      return { match: m, item };
    })
    .filter((x): x is { match: OpenLlmMatch; item: AnalyseItem } => x !== null);

  const foundDocumented: CoherencePromise["foundActives"] = [];
  const foundCosmetic: CoherencePromise["cosmeticActives"] = [];

  // De-dupe by item position — the LLM might cite the same item twice.
  const seenPositions = new Set<number>();

  for (const { match, item } of validated) {
    if (seenPositions.has(item.position)) continue;
    seenPositions.add(item.position);
    if (match.evidence === "marketing") {
      foundCosmetic.push({
        name: item.name ?? match.item_name,
        slug: item.slug,
        position: item.position,
        note: match.reason.trim().slice(0, 80) || "effet visuel/sensoriel",
      });
    } else {
      foundDocumented.push({
        name: item.name ?? match.item_name,
        slug: item.slug,
        position: item.position,
        inTrace: isInTrace(item),
      });
    }
  }

  const wellDosed = foundDocumented.filter((f) => !f.inTrace).length;
  const trace = foundDocumented.filter((f) => f.inTrace).length;
  const verdict = deriveVerdict({
    documentedFound: foundDocumented.length,
    documentedFoundWellDosed: wellDosed,
    marketingFound: foundCosmetic.length,
  });

  // Score for open promises: there's no "expected count" to divide by, so
  // we score by depth-of-evidence directly.
  //   - well-dosed documented: 60 + 15 per extra (cap 100)
  //   - in-trace documented:   20 + 8 per extra (cap 40)
  //   - cosmetic only:         25
  //   - nothing:               0
  let score = 0;
  if (wellDosed > 0) score = Math.min(100, 60 + (wellDosed - 1) * 15);
  else if (trace > 0) score = Math.min(40, 20 + (trace - 1) * 8);
  else if (foundCosmetic.length > 0) score = 25;

  return {
    slug: proposal.category_slug || "autre",
    label: proposal.label || "Promesse libre",
    excerpt: proposal.excerpt,
    verdict,
    expectedActives: foundDocumented
      .map((f) => f.name)
      .concat(llmMissing.slice(0, 5))
      .slice(0, 8),
    foundActives: foundDocumented,
    cosmeticActives: foundCosmetic,
    missingActives: llmMissing.slice(0, 5),
    score,
  };
}

// -----------------------------------------------------------------------------
// Aggregate metrics & position snapshot
// -----------------------------------------------------------------------------

export function computeMetrics(promises: CoherencePromise[]): CoherenceResult["metrics"] {
  const total = promises.length;
  const tenueCount = promises.filter((p) => p.verdict === "tenue").length;
  const partielleCount = promises.filter((p) => p.verdict === "partielle").length;
  const marketingCount = promises.filter((p) => p.verdict === "marketing").length;
  const nonDemontreeCount = promises.filter((p) => p.verdict === "non_demontree").length;
  const tenuePct = total === 0 ? 0 : Math.round((tenueCount / total) * 100);
  // "Marketing index" = promises with NO documented active at all (marketing
  // verdict OR non_demontree). Partielle verdicts are deliberately excluded —
  // those have actives, just under-dosed, so they aren't pure marketing.
  const noActiveCount = marketingCount + nonDemontreeCount;
  const marketingIndex = total === 0 ? 100 : Math.round((noActiveCount / total) * 100);
  return {
    tenuePct,
    tenueCount,
    partielleCount,
    marketingCount,
    nonDemontreeCount,
    totalPromises: total,
    marketingIndex,
  };
}

export function computePositionSnapshot(
  parent: AnalyseResponse,
  promises: CoherencePromise[],
): CoherenceResult["positionSnapshot"] {
  // Find first fragrance / first preservative position by scanning items.
  // We rely on the existing tag system (cf. ANALYSER_TAGS in api/analyser).
  let firstFragrancePos: number | null = null;
  let firstPreservativePos: number | null = null;
  for (const it of parent.items) {
    const tags = it.tags ?? [];
    if (
      firstFragrancePos === null
      && (tags.includes("parfum-synthese") || tags.includes("allergene-parfumant"))
    ) {
      firstFragrancePos = it.position;
    }
    if (firstPreservativePos === null && tags.includes("conservateur")) {
      firstPreservativePos = it.position;
    }
    if (firstFragrancePos !== null && firstPreservativePos !== null) break;
  }
  const thresholdPos = (() => {
    const xs = [firstFragrancePos, firstPreservativePos].filter(
      (x): x is number => x !== null,
    );
    return xs.length === 0 ? null : Math.min(...xs);
  })();

  // Deduplicate key ingredients across promises (same active can support
  // multiple claims). Sort by position ascending for the linear chart.
  const seen = new Set<number>();
  const keyIngredients: CoherenceResult["positionSnapshot"]["keyIngredients"] = [];
  for (const p of promises) {
    for (const f of p.foundActives) {
      if (seen.has(f.position)) continue;
      seen.add(f.position);
      keyIngredients.push({ name: f.name, position: f.position, inTrace: f.inTrace });
    }
    for (const c of p.cosmeticActives) {
      if (seen.has(c.position)) continue;
      seen.add(c.position);
      // Cosmetic actives flagged as in-trace if past threshold (deterministic).
      const item = parent.items.find((it) => it.position === c.position);
      const inTrace = item ? isInTrace(item) : false;
      keyIngredients.push({ name: c.name, position: c.position, inTrace });
    }
  }
  keyIngredients.sort((a, b) => a.position - b.position);

  return {
    firstFragrancePos,
    firstPreservativePos,
    thresholdPos,
    totalPositions: parent.counts.total,
    keyIngredients,
  };
}

// -----------------------------------------------------------------------------
// Top-level assembly
// -----------------------------------------------------------------------------

/**
 * Orchestrates the deterministic part of the pipeline. Takes the
 * already-resolved promises (mix of catalogue + open) and the parent INCI
 * analysis, returns the full structured result minus the conclusion sentence
 * (which the LLM writes on top of this output).
 *
 * Resolution itself is delegated to the route handler, which knows whether
 * each proposal is in the catalogue (→ resolvePromise) or open
 * (→ resolveOpenPromise after a per-promise LLM exploration).
 */
export function buildCoherenceResult(args: {
  description: string;
  promises: CoherencePromise[];
  unverifiable: UnverifiableClaim[];
  parent: AnalyseResponse;
  conclusion: string;
}): CoherenceResult {
  const metrics = computeMetrics(args.promises);
  const positionSnapshot = computePositionSnapshot(args.parent, args.promises);
  return {
    computedAt: new Date().toISOString(),
    description: args.description,
    promises: args.promises,
    unverifiable: args.unverifiable,
    metrics,
    positionSnapshot,
    conclusion: args.conclusion,
  };
}
