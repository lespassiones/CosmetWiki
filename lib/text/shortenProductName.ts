/**
 * Compress a long product name into a tighter label suitable for headlines
 * and inline mentions in narrative copy.
 *
 *   "Phyto Phyto Réparateur Spray Thermo-Protecteur 230°C Anti-Casse"
 *     → "Phyto Réparateur Spray"
 *   "L'Oréal Professionnel Curl Expression Anti-Buildup Cleansing Jelly Shampoo"
 *     → "L'Oréal Curl Expression"
 *
 * Heuristic, not magic:
 *   1. If the raw name fits under `maxLen`, return it unchanged.
 *   2. Drop the immediately-repeated brand prefix (e.g. "Phyto Phyto …").
 *   3. Drop low-signal words (Professionnel, Anti-Casse, Anti-Buildup,
 *      product-type suffixes…) only when needed to reach the budget.
 *   4. Take significant words from the front until we hit the budget, then
 *      ellipsise.
 *
 * Caller convention: pass to the compare prompt + render side-by-side. Keep
 * `maxLen` small (~30) so the label fits in a single sentence comfortably.
 */

// Stopwords we'll happily drop when trimming. Lowercased for comparison.
// Conservative - only words that genuinely add no identity ("Pro", "230°C",
// "Anti-Casse" don't disambiguate two shampoos of the same product line).
const LOW_SIGNAL_WORDS = new Set<string>([
  "professionnel",
  "professional",
  "pro",
  "anti-casse",
  "anti-buildup",
  "anti-frizz",
  "anti-frisottis",
  "anti-chute",
  "anti-age",
  "anti-âge",
  "thermo-protecteur",
  "thermoprotector",
  "réparateur",
  "reparateur",
  "repair",
  "jelly",
  "cleansing",
  "shampoo",
  "shampooing",
  "spray",
  "230°c",
  "expression",
  "fusion",
  "care",
]);

function dropRepeatedPrefix(words: string[]): string[] {
  if (words.length >= 2 && words[0].toLowerCase() === words[1].toLowerCase()) {
    return words.slice(1);
  }
  return words;
}

function joinedLen(words: string[]): number {
  if (words.length === 0) return 0;
  return words.reduce((sum, w) => sum + w.length, 0) + (words.length - 1);
}

export function shortenProductName(raw: string, maxLen = 30): string {
  const name = raw.trim();
  if (!name) return name;
  if (name.length <= maxLen) return name;

  let words = dropRepeatedPrefix(name.split(/\s+/));

  // First pass: take words from the front until we'd overflow.
  const front: string[] = [];
  for (const w of words) {
    if (joinedLen([...front, w]) <= maxLen) {
      front.push(w);
    } else {
      break;
    }
  }
  // If we still have at least 2 meaningful words, that's the result.
  if (front.length >= 2) {
    return front.join(" ");
  }

  // Second pass: drop low-signal words from the original, then retry.
  words = words.filter((w) => !LOW_SIGNAL_WORDS.has(w.toLowerCase()));
  const front2: string[] = [];
  for (const w of words) {
    if (joinedLen([...front2, w]) <= maxLen) {
      front2.push(w);
    } else {
      break;
    }
  }
  if (front2.length >= 2) {
    return front2.join(" ");
  }
  if (front2.length === 1) return front2[0];

  // Last resort: hard truncate.
  return name.slice(0, maxLen - 1).trimEnd() + "…";
}
