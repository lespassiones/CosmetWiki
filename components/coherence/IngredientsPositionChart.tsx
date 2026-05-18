import { GLASS_CARD } from "@/lib/ui/glass";
import { InfoBadge, Tooltip } from "../Tooltip";
import type { CoherenceResult } from "@/lib/coherence/types";

/**
 * Linear chart showing where the key ingredients sit in the formula relative
 * to the first fragrance/preservative (the "≤ 1 %" threshold).
 *
 * Visual layout (matches the reference mock):
 *   - Two coloured zones split by a vertical dashed marker
 *   - LEFT (green gradient)  : "Ingrédients efficaces"   - pos 1 .. threshold-1
 *   - RIGHT (blue gradient)  : "Ingrédients en trace ≤ 1 %" - pos threshold+1 ..
 *   - Each key ingredient is a CHUNKY white pill with a soft drop shadow,
 *     positioned by its `position`. They wrap into rows so long names breathe.
 *   - The threshold marker sits exactly between the two zones with the parfum
 *     position labelled below ("Parfum (pos. 12)").
 */
export function IngredientsPositionChart({
  snapshot,
}: {
  snapshot: CoherenceResult["positionSnapshot"];
}) {
  const { thresholdPos, totalPositions, keyIngredients, firstFragrancePos } = snapshot;

  // No threshold detected (no fragrance, no preservative) → nothing useful
  // to show. The "≤ 1 %" line wouldn't exist.
  if (thresholdPos === null || totalPositions === 0) {
    return null;
  }

  const before = keyIngredients.filter((k) => !k.inTrace);
  const after = keyIngredients.filter((k) => k.inTrace);

  // The bar is split proportionally: positions before the threshold get their
  // share of the width, positions after get the rest. We clamp to keep both
  // sides visible even at the extremes.
  const thresholdRatio = Math.min(0.85, Math.max(0.15, thresholdPos / totalPositions));
  const leftPct = `${Math.round(thresholdRatio * 100)}%`;
  const rightPct = `${Math.round((1 - thresholdRatio) * 100)}%`;

  const thresholdLabel = firstFragrancePos !== null ? "Parfum" : "Conservateur";

  const beforeCount = before.length;
  const afterCount = after.length;
  const thresholdLabelTip = firstFragrancePos !== null ? "parfum" : "conservateur";

  return (
    <article className={`${GLASS_CARD} p-5 lg:p-7`}>
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-[15px] lg:text-[17px] font-semibold">
          Où se trouvent les ingrédients clés ?
        </h2>
        <Tooltip
          placement="bottom"
          maxWidth={420}
          content={
            <>
              En INCI, les ingrédients sont listés <b>du plus concentré au moins concentré</b>.
              Réglementairement, parfums et conservateurs sont à <b>≤ 1 %</b> - donc tout ce
              qui est <b>après</b> dans la liste est aussi à ≤ 1 %.
              <br /><br />
              <b>Sur cette formule</b> : le seuil est à la <b>position {thresholdPos}</b> ({thresholdLabelTip}).
              {beforeCount > 0 && (
                <> {beforeCount} ingrédient{beforeCount > 1 ? "s" : ""} clé{beforeCount > 1 ? "s sont" : " est"} bien dosé{beforeCount > 1 ? "s" : ""} (zone verte).</>
              )}
              {afterCount > 0 && (
                <> {afterCount} ingrédient{afterCount > 1 ? "s" : ""} clé{afterCount > 1 ? "s sont" : " est"} en trace ≤ 1 % (zone bleue) - peu d&apos;effet réel.</>
              )}
            </>
          }
        >
          <button type="button" aria-label="Pourquoi le seuil 1 % ?">
            <InfoBadge />
          </button>
        </Tooltip>
      </div>
      <p className="text-[12px] text-[#6B7280] mb-5">
        Tout ce qui est après le parfum (ou le 1<sup>er</sup> conservateur) est dosé
        à moins de 1 %, donc avec peu d&apos;effet réel sur le produit.
      </p>

      {/* The two-zone bar */}
      <div className="relative grid grid-cols-[var(--left)_var(--right)] min-h-[160px] rounded-2xl overflow-hidden ring-1 ring-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
        style={{ ["--left" as string]: leftPct, ["--right" as string]: rightPct } as React.CSSProperties}
      >
        {/* LEFT zone - green */}
        <div className="relative bg-gradient-to-br from-emerald-100/90 to-emerald-50/70 p-4 lg:p-5">
          <div className="text-center mb-3">
            <div className="text-[12px] font-bold text-emerald-700">
              Ingrédients efficaces
            </div>
            <div className="text-[10px] text-emerald-600/80 mt-0.5">
              positions 1–{thresholdPos - 1}
            </div>
          </div>
          {before.length === 0 ? (
            <p className="text-center text-[11px] text-emerald-700/60 italic mt-6">
              Aucun ingrédient clé identifié dans cette zone.
            </p>
          ) : (
            <ul className="flex flex-wrap items-center justify-center gap-2">
              {before.map((k) => (
                <PositionBubble
                  key={`b-${k.position}-${k.name}`}
                  name={k.name}
                  position={k.position}
                  colorRating={k.colorRating}
                />
              ))}
            </ul>
          )}
        </div>

        {/* RIGHT zone - blue */}
        <div className="relative bg-gradient-to-bl from-sky-100/90 to-sky-50/70 p-4 lg:p-5">
          <div className="text-center mb-3">
            <div className="text-[12px] font-bold text-sky-700">
              Ingrédients en trace ≤ 1 %
            </div>
            <div className="text-[10px] text-sky-600/80 mt-0.5">
              positions {thresholdPos + 1}–{totalPositions}
            </div>
          </div>
          {after.length === 0 ? (
            <p className="text-center text-[11px] text-sky-700/60 italic mt-6">
              Aucun ingrédient clé identifié dans cette zone.
            </p>
          ) : (
            <ul className="flex flex-wrap items-center justify-center gap-2">
              {after.map((k) => (
                <PositionBubble
                  key={`a-${k.position}-${k.name}`}
                  name={k.name}
                  position={k.position}
                  colorRating={k.colorRating}
                  muted
                />
              ))}
            </ul>
          )}
        </div>

        {/* Threshold marker - vertical dashed line at the zone boundary */}
        <div
          className="pointer-events-none absolute inset-y-0 w-px bg-sky-400"
          style={{
            left: leftPct,
            backgroundImage: "repeating-linear-gradient(to bottom, rgba(14,165,233,1) 0 4px, transparent 4px 8px)",
            backgroundColor: "transparent",
          }}
          aria-hidden
        >
          {/* Threshold dots top + bottom */}
          <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-sky-400 ring-2 ring-white shadow-[0_2px_4px_rgba(14,165,233,0.4)]" />
          <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-sky-400 ring-2 ring-white shadow-[0_2px_4px_rgba(14,165,233,0.4)]" />
        </div>
      </div>

      {/* Threshold label below the bar, centred on the marker */}
      <div className="relative mt-2.5">
        <div
          className="absolute -translate-x-1/2 text-center"
          style={{ left: leftPct }}
        >
          <div className="text-[12px] font-semibold text-sky-700">{thresholdLabel}</div>
          <div className="text-[10px] text-sky-600/80">pos. {thresholdPos}</div>
        </div>
        {/* Spacer to keep layout stable */}
        <div className="invisible text-[12px] leading-[1.5]">
          x
          <br />x
        </div>
      </div>
    </article>
  );
}

type ColorRating = "Vert" | "Jaune" | "Orange" | "Rouge" | null | undefined;

/** Pill tone tokens keyed by the ingredient's color rating. */
const BUBBLE_TONE: Record<"Vert" | "Jaune" | "Orange" | "Rouge", { bg: string; ring: string; text: string; posText: string }> = {
  Vert: {
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
    text: "text-emerald-800",
    posText: "text-emerald-600/80",
  },
  Jaune: {
    bg: "bg-amber-50",
    ring: "ring-amber-200",
    text: "text-amber-800",
    posText: "text-amber-700/80",
  },
  Orange: {
    bg: "bg-orange-50",
    ring: "ring-orange-200",
    text: "text-orange-800",
    posText: "text-orange-700/80",
  },
  Rouge: {
    bg: "bg-rose-50",
    ring: "ring-rose-200",
    text: "text-rose-800",
    posText: "text-rose-700/80",
  },
};

/**
 * Chunky pill with the ingredient name + position. Tinted by the ingredient's
 * Vert/Jaune/Orange/Rouge rating so the user sees at a glance whether the key
 * actives are safe ones or penalising ones. Falls back to plain white for
 * unrated ingredients (shouldn't happen in practice but keeps the UI safe).
 */
function PositionBubble({
  name,
  position,
  colorRating,
  muted = false,
}: {
  name: string;
  position: number;
  colorRating: ColorRating;
  muted?: boolean;
}) {
  const tone = colorRating ? BUBBLE_TONE[colorRating] : null;
  const surface = tone
    ? `${tone.bg} ring-1 ${tone.ring}`
    : "bg-white ring-1 ring-black/[0.06]";
  const nameClass = tone ? tone.text : "text-ink";
  const posClass = tone ? tone.posText : "text-[#9CA3AF]";

  return (
    <li
      className={`inline-flex flex-col items-center gap-0.5 rounded-full px-2 py-1 lg:px-3 lg:py-1.5 shadow-[0_4px_10px_-4px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.95)] max-w-[110px] lg:max-w-[150px] ${surface} ${
        muted ? "opacity-90" : ""
      }`}
    >
      {/* Text shrinks aggressively on mobile (down to 9px) so long INCI
          names like DEHYDROXANTHAN GUM still fit inside the bubble's
          allocated zone instead of being cut off. */}
      <span
        className={`text-[9px] lg:text-[12px] font-medium leading-tight text-center truncate max-w-full ${nameClass}`}
        title={name}
      >
        {name}
      </span>
      <span className={`text-[8px] lg:text-[10px] leading-none ${posClass}`}>pos. {position}</span>
    </li>
  );
}
