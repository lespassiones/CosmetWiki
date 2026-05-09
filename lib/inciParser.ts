/**
 * INCI list parser : turns a free-form pasted ingredient list into a clean
 * array of normalized tokens, preserving order.
 *
 * Handles : commas, semicolons, "/" between synonyms, parentheses,
 * asterisks, "(F.I.L. ...)", line breaks, double-spaces.
 */
export type ParsedToken = {
  /** Original raw value as the user pasted it (kept for display). */
  raw: string;
  /** Normalized for matching: uppercase, accents stripped, spaces collapsed. */
  normalized: string;
  /** Position in the original list (0 = first / main ingredient). */
  position: number;
};

const STOP_WORDS = new Set([
  "INGREDIENTS", "INGREDIENT", "INGRÉDIENTS", "INGRÉDIENT",
  "INCI", "COMPOSITION", "LISTE", "INGREDIENTS:", "INCI:",
]);

const NOISE_PATTERNS: RegExp[] = [
  /\(F\.?I\.?L\.?\s+[A-Z0-9]+\/?\d*\)/gi,
  /\(\+\/?\-\)/g,                         // (+/-)
  /\(may contain\)/gi,
  /\(peut contenir\)/gi,
  /\([A-Z0-9. ]+\d+\/\d+\)/g,             // batch codes
];

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function parseInciList(text: string): ParsedToken[] {
  if (!text) return [];

  let work = text;

  // Drop common noise and codes
  for (const re of NOISE_PATTERNS) {
    work = work.replace(re, " ");
  }
  // Drop parenthesized notes like "(en français)" but keep things like
  // "(i)", "(ii)" by collapsing them
  work = work.replace(/\([^)]{20,}\)/g, " ");
  // Remove asterisks (mention notes)
  work = work.replace(/\*+/g, " ");
  // Final period at end-of-list
  work = work.replace(/\.+$/g, " ");
  // Split synonyms separated by " / " (spaces on both sides) into separate tokens.
  // ex : "AQUA / WATER" → "AQUA, WATER"
  // Do NOT split "CAPRYLIC/CAPRIC TRIGLYCERIDE" or "LEUCONOSTOC/RADISH ROOT FERMENT
  // FILTRATE" — those are compound INCI names where the slash has no surrounding space.
  work = work.replace(/\s+\/\s+/g, ", ");
  // Replace hyphens used as separators by commas. Catch all asymmetric spacing
  // patterns: "X - Y", "X -Y", "X- Y" (but NOT "X-Y", which is too risky — many
  // INCI names have intra-name hyphens like "PEG-100 Stearate" or "C12-15 Alkyl
  // Benzoate"). Bullets/middots can also be used as separators in pasted lists.
  work = work.replace(/(?<=\w)(?:\s+-+\s*|\s*-+\s+)(?=\w)/g, ", ");
  work = work.replace(/(?<=\w)\s*[•·]\s*(?=\w)/g, ", ");

  // Split on common separators
  const rawParts = work
    .split(/[,;\n]+/g)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const tokens: ParsedToken[] = [];
  let position = 0;
  const seenNormalized = new Set<string>();

  for (const raw of rawParts) {
    // Strip leading/trailing parens leftovers, dashes, dots
    const cleaned = raw
      .replace(/^[\s\-•·]+|[\s\-•·.]+$/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (!cleaned) continue;
    if (cleaned.length < 2) continue;
    if (cleaned.length > 120) continue; // likely garbage paragraph

    const upper = stripAccents(cleaned).toUpperCase();
    if (STOP_WORDS.has(upper)) continue;
    if (/^[\d\s\-+%]+$/.test(upper)) continue; // pure numbers
    if (seenNormalized.has(upper)) continue;
    seenNormalized.add(upper);

    tokens.push({
      raw: cleaned,
      normalized: upper,
      position: position++,
    });
  }

  return tokens;
}

/**
 * Compute a /20 score from a list of matched ingredients.
 * Earlier positions weigh more (logarithmic decay).
 *
 *   penalty = { Vert: 0, Jaune: 0.6, Orange: 2.0, Rouge: 4.0 }
 *   score = 20 - sum(penalty * weight(position))
 *   weight(p) = log(N - p + 1) / log(N + 1)   ∈ [0, 1]
 */
export type ColorRating = "Vert" | "Jaune" | "Orange" | "Rouge";

const PENALTY: Record<ColorRating, number> = {
  Vert: 0,
  Jaune: 0.6,
  Orange: 2.0,
  Rouge: 4.0,
};

export function computeScore(
  matches: { color_rating: ColorRating | null; position: number }[],
  totalPositions: number,
): number {
  if (totalPositions === 0) return 0;
  let score = 20;
  for (const m of matches) {
    if (!m.color_rating) continue;
    const p = m.position;
    const N = Math.max(totalPositions, 1);
    // Logarithmic position weight: 1.0 for the first ingredient, ~0.05 for the last
    const weight = Math.log(N - p + 1) / Math.log(N + 1);
    score -= PENALTY[m.color_rating] * weight;
  }
  return Math.max(0, Math.min(20, score));
}

/** Map a numeric score (0-20) to a qualitative label and color. */
export function scoreLabel(score: number): { label: string; tone: "green" | "amber" | "orange" | "rose" } {
  if (score >= 17) return { label: "Très bien", tone: "green" };
  if (score >= 13) return { label: "Bien", tone: "amber" };
  if (score >= 9) return { label: "Moyen", tone: "orange" };
  return { label: "À éviter", tone: "rose" };
}
