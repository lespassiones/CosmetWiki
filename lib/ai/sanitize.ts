/**
 * Shared text sanitizer + prompt fragment for every AI prose call.
 *
 * GPT (and other LLMs) habitually inject em-dashes (—) and en-dashes (–)
 * into French prose. They read as a stylistic tic and the product owner
 * doesn't want them anywhere in the app. We use a triple safety net:
 *   1. Strict instruction inside every system prompt (`NO_LONG_DASHES_RULE`).
 *   2. Clean source data of the same characters before they reach the model
 *      (the model imitates what it sees in its context).
 *   3. Post-process `stripLongDashes()` on every generated string.
 */

/** Drop-in instruction snippet for any system prompt producing French prose. */
export const NO_LONG_DASHES_RULE =
  "INTERDICTION ABSOLUE : aucun tiret cadratin (—) ni demi-cadratin (–) dans " +
  "ta réponse, nulle part. Utilise une virgule, un deux-points, ou découpe " +
  'en deux phrases. Le tiret simple "-" n\'est autorisé que dans les mots ' +
  "composés (sous-jacent, peau-sébum…). Toute autre utilisation est " +
  "considérée comme une faute.";

/**
 * Replace every em-dash (—) and en-dash (–) with a comma + collapse the
 * doubled spaces / spurious whitespace that can leave behind. Safe to apply
 * blindly on any AI output.
 */
export function stripLongDashes(s: string): string {
  if (!s) return s;
  return s
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}
