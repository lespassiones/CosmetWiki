import { GLASS_CARD } from "@/lib/ui/glass";
import type { CoherenceResult } from "@/lib/coherence/types";

/**
 * Linear chart showing where the key ingredients sit in the formula relative
 * to the first fragrance/preservative (the "≤ 1 %" threshold).
 *
 * Visual layout (matches the reference mock):
 *   - Two coloured zones split by a vertical dashed marker
 *   - LEFT (green gradient)  : "Ingrédients efficaces"   — pos 1 .. threshold-1
 *   - RIGHT (blue gradient)  : "Ingrédients en trace ≤ 1 %" — pos threshold+1 ..
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

  return (
    <article className={`${GLASS_CARD} p-5 lg:p-7`}>
      <h2 className="text-[15px] lg:text-[17px] font-semibold mb-1">
        Où se trouvent les ingrédients clés ?
      </h2>
      <p className="text-[12px] text-[#6B7280] mb-5">
        Tout ce qui est après le parfum (ou le 1<sup>er</sup> conservateur) est dosé
        à moins de 1 %, donc avec peu d&apos;effet réel sur le produit.
      </p>

      {/* The two-zone bar */}
      <div className="relative grid grid-cols-[var(--left)_var(--right)] min-h-[160px] rounded-2xl overflow-hidden ring-1 ring-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
        style={{ ["--left" as string]: leftPct, ["--right" as string]: rightPct } as React.CSSProperties}
      >
        {/* LEFT zone — green */}
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
                <PositionBubble key={`b-${k.position}-${k.name}`} name={k.name} position={k.position} />
              ))}
            </ul>
          )}
        </div>

        {/* RIGHT zone — blue */}
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
                <PositionBubble key={`a-${k.position}-${k.name}`} name={k.name} position={k.position} muted />
              ))}
            </ul>
          )}
        </div>

        {/* Threshold marker — vertical dashed line at the zone boundary */}
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

/**
 * Chunky pill with the ingredient name + position. Soft white background,
 * fine ring + drop shadow → the "neumorphic / pill" look from the mock.
 */
function PositionBubble({
  name,
  position,
  muted = false,
}: {
  name: string;
  position: number;
  muted?: boolean;
}) {
  return (
    <li
      className={`inline-flex flex-col items-center gap-0.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-black/[0.06] shadow-[0_4px_10px_-4px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.95)] max-w-[150px] ${
        muted ? "opacity-90" : ""
      }`}
    >
      <span
        className="text-[12px] font-medium text-ink leading-tight text-center truncate max-w-full"
        title={name}
      >
        {name}
      </span>
      <span className="text-[10px] text-[#9CA3AF] leading-none">pos. {position}</span>
    </li>
  );
}
