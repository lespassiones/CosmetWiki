/**
 * Étoiles d'un produit, EXACTEMENT comme l'app mobile :
 *   note du catalogue plafonnée par les ingrédients orange et rouge
 *   (`applyColorCap` de l'app), puis seuils 17 / 13 / 9 / 5.
 *   5 vertes = très douce · 4 vertes = saine · 3 jaunes = à surveiller ·
 *   2 oranges = moyenne · 1 rouge = à examiner.
 * Miroir de CosmeCheck-App `lib/analysis/scoreCap.ts` + `lib/analysis/qualityStars.ts`.
 * Logique pure, testée dans tests/brandSubmission.test.ts.
 */

export type StarCount = 1 | 2 | 3 | 4 | 5;

export type StarPalette = { face: string; dark: string; light: string };

/** Plafond par invariants du moteur pastille (même règle que l'app). */
export function applyColorCap(score: number, countOrange: number, countRouge: number): number {
  let cap = Number.POSITIVE_INFINITY;
  if (countRouge >= 2 || countOrange >= 4) cap = 8.9;
  else if (countRouge >= 1) cap = 12.9;
  return Math.min(score, cap);
}

export function starsFromScore(score: number): StarCount {
  if (score >= 17) return 5;
  if (score >= 13) return 4;
  if (score >= 9) return 3;
  if (score >= 5) return 2;
  return 1;
}

/** `null` si le produit n'a pas encore de note. */
export function starsForProduct(p: {
  score: number | null | undefined;
  count_orange?: number | null;
  count_rouge?: number | null;
}): StarCount | null {
  if (p.score == null || Number.isNaN(Number(p.score))) return null;
  const capped = applyColorCap(Number(p.score), p.count_orange ?? 0, p.count_rouge ?? 0);
  return starsFromScore(capped);
}

/** Libellé court affiché sous les étoiles (badge, mails). */
export const STAR_LABEL: Record<StarCount, string> = {
  5: "Composition très douce",
  4: "Composition saine",
  3: "Composition correcte",
  2: "Composition moyenne",
  1: "Composition à examiner",
};

const GREEN: StarPalette = { face: "#16A34A", dark: "#166534", light: "#22C55E" };

export const STAR_PALETTE: Record<StarCount, StarPalette> = {
  5: GREEN,
  4: GREEN,
  3: { face: "#FBBF24", dark: "#D97706", light: "#FDE68A" },
  2: { face: "#F97316", dark: "#C2410C", light: "#FDBA74" },
  1: { face: "#F43F5E", dark: "#BE123C", light: "#FDA4AF" },
};

export const STAR_EMPTY: StarPalette = { face: "#E5E7EB", dark: "#C7CBD1", light: "#F5F6F8" };

/** Une seule couleur par niveau, pour le texte des mails. */
export function starColor(stars: StarCount): string {
  return STAR_PALETTE[stars].face;
}
