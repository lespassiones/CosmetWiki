// Relevance gate for product search results.
//
// Free fuzzy-search APIs (Open Beauty Facts, INCIDecoder search, DuckDuckGo)
// happily return loosely-related products when the query has no good match.
// Without a relevance check we'd surface "Mitomo" for the query "brian".
//
// We require that at least one significant token from the query (>= 3 chars,
// not a stopword) appears in the candidate's brand + product name.

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "your",
  "from",
  "this",
  "that",
  "into",
  "onto",
  "over",
  "under",
  "le",
  "la",
  "les",
  "un",
  "une",
  "des",
  "du",
  "de",
  "et",
  "ou",
  "pour",
  "avec",
  "sans",
  "par",
  "sur",
  "ce",
  "cette",
  "ces",
  "mon",
  "ma",
  "mes",
  "ton",
  "ta",
  "tes",
  "son",
  "sa",
  "ses",
]);

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

function flatten(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_RE, "")
    .replace(/[^a-z0-9+\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  return flatten(s)
    .split(" ")
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

/**
 * Strip common FR/EN plural / nominal suffixes so "cheveux" ↔ "cheveu",
 * "produits" ↔ "produit", "ingredients" ↔ "ingredient". Conservative on
 * purpose: only strips suffixes when the remaining stem is still ≥ 4 chars,
 * to avoid butchering short words ("eyes" → "eye" is fine, "les" stays "les").
 */
function stem(w: string): string {
  if (w.length < 5) return w;
  for (const suf of ["ements", "ement", "ation", "tions", "ions", "eaux", "aux", "ies", "es", "s", "x"]) {
    if (w.length - suf.length >= 4 && w.endsWith(suf)) {
      return w.slice(0, -suf.length);
    }
  }
  return w;
}

/**
 * Returns true iff at least one significant token from the query appears
 * (as a substring) in the candidate text. The candidate is usually
 * `brand + productName`, optionally augmented with a URL slug.
 *
 * Matching has two layers:
 *   1. Direct substring on the flattened candidate (fast path, covers most
 *      cases including "duo+" inside "effaclar-duo-plus").
 *   2. Stem-based: if a query token has a singular/plural variant, retry
 *      against the candidate's stemmed tokens. Adds tolerance for FR plurals
 *      ("cheveux" ↔ "cheveu", "soins" ↔ "soin") without re-formulating the
 *      query — purely a relevance gate, not a search re-write.
 */
export function matchesQuery(query: string, candidate: string): boolean {
  const qTokens = tokens(query);
  if (qTokens.length === 0) return true; // nothing meaningful to check
  const flat = flatten(candidate);
  if (!flat) return false;
  // Fast path: direct substring on the full flattened candidate.
  if (qTokens.some((t) => flat.includes(t))) return true;
  // Permissive path: stem both sides and compare token-by-token.
  const cStems = tokens(candidate).map(stem);
  if (cStems.length === 0) return false;
  return qTokens.some((qt) => {
    const qs = stem(qt);
    if (qs.length < 3) return false;
    return cStems.some((cs) => cs === qs || cs.includes(qs) || qs.includes(cs));
  });
}
