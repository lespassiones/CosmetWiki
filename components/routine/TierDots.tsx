"use client";

/**
 * TierDots — rangée de 5 pastilles colorées (twin web du mobile
 * CosmeCheck-App/components/routine/TierDots.tsx). VERT À DROITE :
 * gauche→droite = rouge, orange, jaune, vert clair, vert foncé. Chaque pastille
 * porte sa vraie couleur ; la position du produit est cerclée d'un ANNEAU sur la
 * pastille active. Pas de chiffre.
 */

// index = tier (0 = meilleur … 4 = pire)
const TIER_COLORS = ["#059669", "#34D399", "#FBBF24", "#F97316", "#F43F5E"] as const;
// Ordre d'affichage gauche → droite : pire → meilleur (vert à droite).
const VISUAL_ORDER = [4, 3, 2, 1, 0] as const;

/** Score (0-20, plafonné) → index de tier (0 = meilleur, 4 = pire). */
export function tierIndex(score: number | null | undefined): number {
  if (score == null) return 2;
  if (score >= 17) return 0;
  if (score >= 13) return 1;
  if (score >= 9) return 2;
  if (score >= 5) return 3;
  return 4;
}

export function TierDots({ score }: { score: number | null | undefined }) {
  const active = tierIndex(score);
  return (
    <div className="flex items-center justify-center gap-1.5">
      {VISUAL_ORDER.map((tier) => {
        const color = TIER_COLORS[tier];
        const isActive = tier === active;
        return (
          <span
            key={tier}
            className="flex h-5 w-5 items-center justify-center rounded-full border-2"
            style={{ borderColor: isActive ? color : "transparent" }}
          >
            <span
              className="rounded-full"
              style={{
                backgroundColor: color,
                width: isActive ? 12 : 9,
                height: isActive ? 12 : 9,
              }}
            />
          </span>
        );
      })}
    </div>
  );
}
