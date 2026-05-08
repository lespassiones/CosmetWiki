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
 * Returns true iff at least one significant token from the query appears
 * (as a substring) in the candidate text. The candidate is usually
 * `brand + productName`, optionally augmented with a URL slug.
 */
export function matchesQuery(query: string, candidate: string): boolean {
  const qTokens = tokens(query);
  if (qTokens.length === 0) return true; // nothing meaningful to check
  const flat = flatten(candidate);
  if (!flat) return false;
  return qTokens.some((t) => flat.includes(t));
}
