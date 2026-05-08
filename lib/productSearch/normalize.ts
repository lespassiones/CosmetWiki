// Normalize a free-form product query so that "La Roche-Posay Effaclar Duo+",
// "effaclar duo+ la roche posay" and "Effaclar  Duo+  La  Roche-Posay" all
// resolve to the same cache key.
const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

export function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_RE, "")
    .replace(/[^a-z0-9+\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w.length > 1)
    .sort()
    .join(" ");
}
