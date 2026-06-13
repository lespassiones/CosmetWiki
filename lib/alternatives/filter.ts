/**
 * Client-side filtering for product alternatives.
 * Pure functions — no async, no side effects, fully testable.
 */

function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build an exclusion set from:
 *  - exact INCI names (from restrictions.ingredients + family expansion)
 *  - freeform allergy text (split on ,;\n, substring match)
 */
export function buildExclusionSet(
  exactNames: string[],
  allergiesFreeform: string | undefined,
): { exact: Set<string>; substrings: string[] } {
  const exact = new Set(exactNames.map(normalise).filter(Boolean));
  const substrings = (allergiesFreeform ?? "")
    .split(/[,;\n]/)
    .map((s) => normalise(s.trim()))
    .filter((s) => s.length >= 3);
  return { exact, substrings };
}

/**
 * Returns true when `ingredientsText` contains at least one excluded ingredient.
 * Exact match: normalised token (split on , and ;) must equal an entry in `excl.exact`.
 * Substring match: normalised full text must contain an entry in `excl.substrings`.
 */
export function isExcluded(
  ingredientsText: string | null,
  excl: { exact: Set<string>; substrings: string[] },
): boolean {
  if (!ingredientsText) return false;
  if (excl.exact.size === 0 && excl.substrings.length === 0) return false;

  if (excl.exact.size > 0) {
    const tokens = ingredientsText
      .split(/[,;]/)
      .map((t) => normalise(t.trim()))
      .filter(Boolean);
    for (const token of tokens) {
      if (excl.exact.has(token)) return true;
    }
  }

  if (excl.substrings.length > 0) {
    const fullNorm = normalise(ingredientsText);
    for (const sub of excl.substrings) {
      if (fullNorm.includes(sub)) return true;
    }
  }

  return false;
}
