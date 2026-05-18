/**
 * Shared text sanitizer + prompt fragment for every AI prose call.
 *
 * GPT (and other LLMs) habitually inject em-dashes (-) and en-dashes (–)
 * into French prose. They read as a stylistic tic and the product owner
 * doesn't want them anywhere in the app. We use a triple safety net:
 *   1. Strict instruction inside every system prompt (`NO_LONG_DASHES_RULE`).
 *   2. Clean source data of the same characters before they reach the model
 *      (the model imitates what it sees in its context).
 *   3. Post-process `stripLongDashes()` on every generated string.
 */

/** Drop-in instruction snippet for any system prompt producing French prose. */
export const NO_LONG_DASHES_RULE =
  "INTERDICTION ABSOLUE : aucun tiret cadratin (-) ni demi-cadratin (–) dans " +
  "ta réponse, nulle part. Utilise une virgule, un deux-points, ou découpe " +
  'en deux phrases. Le tiret simple "-" n\'est autorisé que dans les mots ' +
  "composés (sous-jacent, peau-sébum…). Toute autre utilisation est " +
  "considérée comme une faute.";

/**
 * Replace every em-dash (-) and en-dash (–) with a comma + collapse the
 * doubled inline spaces / spurious whitespace that can leave behind.
 *
 * IMPORTANT: we only touch SPACES and TABS, never newlines. The synthesis
 * formatter relies on `\n\n` to split paragraphs and `\n` to split bullet
 * lines - collapsing them merges the whole synthesis into a single blob.
 */
export function stripLongDashes(s: string): string {
  if (!s) return s;
  return s
    // Em / en dash with adjacent INLINE whitespace only - preserve newlines
    // even if the model put a dash at end of line.
    .replace(/[ \t]*[-–][ \t]*/g, ", ")
    .replace(/,[ \t]*,/g, ",")
    // Collapse doubled spaces/tabs but keep \n / \r intact.
    .replace(/[ \t]{2,}/g, " ")
    // Strip whitespace before punctuation but only horizontal whitespace -
    // a newline before "." is unusual but legal and we don't want to fuse
    // a list item's last char with the punctuation of the next line.
    .replace(/[ \t]+([.,;:!?])/g, "$1")
    .trim();
}
