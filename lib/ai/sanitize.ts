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
  "INTERDICTION ABSOLUE : aucun tiret cadratin (—) ni demi-cadratin (–) dans " +
  "ta réponse, nulle part. Utilise une virgule, un deux-points, ou découpe " +
  'en deux phrases. Le tiret simple "-" n\'est autorisé que dans deux cas, ' +
  "et UNIQUEMENT ces deux cas : (a) les mots composés (sous-jacent, " +
  "peau-sébum…), (b) le marqueur de PUCE markdown EN DÉBUT DE LIGNE, " +
  'sous la forme exacte "- " (tiret + espace) au tout début d\'une ligne. ' +
  "Toute autre utilisation est considérée comme une faute. Les puces " +
  'markdown "- " en début de ligne sont OBLIGATOIRES quand on te demande ' +
  "une liste à puces : ne les remplace JAMAIS par des virgules, des points " +
  "ou des numéros.";

/**
 * Replace every em-dash (—) and en-dash (–) — plus ascii hyphens used as
 * intercalary dashes — with a comma, then collapse the doubled inline spaces
 * left behind.
 *
 * IMPORTANT: we only touch SPACES and TABS, never newlines. The synthesis
 * formatter relies on `\n\n` to split paragraphs and `\n` to split bullet
 * lines - collapsing them merges the whole synthesis into a single blob.
 *
 * Markdown bullet markers ("- " at the very start of a line, after a newline
 * or at the start of the string) are PRESERVED. Without this guard the
 * synthesis bullets get rewritten as ", INGRÉDIENT" paragraphs and the
 * client-side parser stops recognising them as a list.
 */
export function stripLongDashes(s: string): string {
  if (!s) return s;
  return s
    // True em/en dashes anywhere → comma. These are always a typographic
    // mistake in our prose; they never appear as a markdown bullet marker.
    .replace(/[ \t]*[–—][ \t]*/g, ", ")
    // Ascii hyphen "-" used as an intercalary dash: only when preceded by a
    // non-whitespace char (so we skip bullets at start of line) AND followed
    // by at least one space (so we skip compound words like "sous-jacent").
    .replace(/(?<=\S)[ \t]*-[ \t]+/g, ", ")
    .replace(/,[ \t]*,/g, ",")
    // Collapse doubled spaces/tabs but keep \n / \r intact.
    .replace(/[ \t]{2,}/g, " ")
    // Strip whitespace before punctuation but only horizontal whitespace -
    // a newline before "." is unusual but legal and we don't want to fuse
    // a list item's last char with the punctuation of the next line.
    .replace(/[ \t]+([.,;:!?])/g, "$1")
    .trim();
}
