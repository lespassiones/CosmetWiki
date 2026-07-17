"use client";

/**
 * QualityStars — barème étoiles « Qualité de la formule », SOURCE UNIQUE partagée
 * entre AnalyseResultPanel (bloc qualité) et la carte d'aperçu scan
 * (components/scan/ScanPreviewCard.tsx). Le NOMBRE d'étoiles pleines ET leur
 * COULEUR encodent la note (la pastille reste la source de vérité) :
 *   5 vertes = très douce · 4 vertes = saine · 3 jaunes = à surveiller
 *   2 oranges = moyenne · 1 rouge = à examiner. Lecture gauche→droite.
 * Miroir exact du mobile (lib/analysis/qualityStars.ts + components/analysis/Star3D.tsx).
 */
import type { VerdictTone } from "@/lib/essentiel/engine";

export type StarPalette = { face: string; dark: string; light: string };

const STARS_BY_TONE: Record<VerdictTone, number> = {
  "very-safe": 5,
  safe: 4,
  caution: 3,
  warning: 2,
  danger: 1,
  "high-risk": 1,
  unknown: 0,
};

// Palette 3D par tone (HEX inline, jamais de classes Tailwind : garantit le
// rendu et aligne le web sur le mobile). light = reflet haut-gauche, face =
// couleur principale, dark = tranche d'extrusion (épaisseur 3D) + fin du dégradé.
const STAR_PALETTE_BY_TONE: Record<VerdictTone, StarPalette> = {
  "very-safe": { face: "#10B981", dark: "#047857", light: "#6EE7B7" }, // emerald 500/700/300
  safe: { face: "#34D399", dark: "#059669", light: "#A7F3D0" }, // emerald 400/600/200 (atténué)
  caution: { face: "#FBBF24", dark: "#D97706", light: "#FDE68A" }, // amber 400/600/200
  warning: { face: "#F97316", dark: "#C2410C", light: "#FDBA74" }, // orange 500/700/300
  danger: { face: "#F43F5E", dark: "#BE123C", light: "#FDA4AF" }, // rose 500/700/300
  "high-risk": { face: "#F43F5E", dark: "#BE123C", light: "#FDA4AF" },
  unknown: { face: "#E5E7EB", dark: "#C7CBD1", light: "#F5F6F8" },
};

const STAR_EMPTY_PALETTE: StarPalette = {
  face: "#E5E7EB",
  dark: "#C7CBD1",
  light: "#F5F6F8",
}; // gray

const STAR_PATH =
  "M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.77l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.94L12 2.5z";

/** Étoile « 3D inclinée » : légère rotation (-8°) + tranche d'extrusion sombre
 *  décalée bas-droite + face avant en dégradé (reflet haut-gauche → teinte →
 *  ombre bas-droite). Miroir exact du composant mobile Star3D. */
export function Star3DIcon({
  gradientId,
  className,
  palette,
}: {
  /** Id unique du dégradé DANS la page (une rangée → `qstar-i`). */
  gradientId: string;
  className?: string;
  palette: StarPalette;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="20%" y1="0%" x2="65%" y2="100%">
          <stop offset="0%" stopColor={palette.light} />
          <stop offset="55%" stopColor={palette.face} />
          <stop offset="100%" stopColor={palette.dark} />
        </linearGradient>
      </defs>
      <g transform="rotate(-8, 12, 12)">
        {/* Épaisseur (extrusion) : même étoile décalée bas-droite, teinte sombre. */}
        <path d={STAR_PATH} transform="translate(0.5, 1.7)" fill={palette.dark} />
        {/* Face avant en dégradé. */}
        <path d={STAR_PATH} fill={`url(#${gradientId})`} />
      </g>
    </svg>
  );
}

/**
 * Rangée de 5 étoiles 3D pleine largeur (`justify-between`), N pleines selon le
 * tone (couleur = note), les autres grises. `idPrefix` doit être unique par page
 * (deux rangées sur la même page → prefixes distincts pour éviter les collisions
 * d'id de dégradé SVG).
 */
export function QualityStarsRow({
  tone,
  className = "flex items-center justify-between",
  starClassName = "h-14 w-14 sm:h-[72px] sm:w-[72px]",
  idPrefix = "qstar",
  ariaLabel = "Qualité de la formule",
}: {
  tone: VerdictTone;
  className?: string;
  starClassName?: string;
  idPrefix?: string;
  ariaLabel?: string;
}) {
  const filled = STARS_BY_TONE[tone];
  const palette = STAR_PALETTE_BY_TONE[tone];
  return (
    <div
      role="meter"
      aria-label={ariaLabel}
      aria-valuemin={1}
      aria-valuemax={5}
      aria-valuenow={filled || undefined}
      className={className}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Star3DIcon
          key={i}
          gradientId={`${idPrefix}-${i}`}
          className={starClassName}
          palette={i < filled ? palette : STAR_EMPTY_PALETTE}
        />
      ))}
    </div>
  );
}
