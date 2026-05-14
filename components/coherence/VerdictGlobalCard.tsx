import { GLASS_CARD } from "@/lib/ui/glass";
import type { CoherenceResult } from "@/lib/coherence/types";

/**
 * Top-of-page summary card. Shows the % of promises kept on the left and a
 * bicolour donut on the right (green = kept, rose = not kept).
 *
 * Donut design : "claymorphism" / soft 3D — radial gradients on each segment
 * (lighter on the inner edge, darker on the outer edge) + a subtle inset
 * shadow so it looks like a thick rope of paint, not a flat ring.
 */
export function VerdictGlobalCard({ metrics }: { metrics: CoherenceResult["metrics"] }) {
  const pct = metrics.tenuePct;
  // Donut geometry tuned for crisp rendering at 96-112px.
  const r = 38;
  const c = 2 * Math.PI * r;
  const filled = (pct / 100) * c;

  return (
    <article className={`${GLASS_CARD} p-5 lg:p-6`}>
      <div className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle mb-3">
        Verdict global
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[44px] lg:text-[56px] font-bold leading-none tabular-nums text-ink">
            {pct} %
          </div>
          <p className="mt-2 text-[13px] text-[#6B7280]">
            Promesses tenues :{" "}
            <span className="font-semibold text-ink">{metrics.tenueCount}</span>{" "}
            sur <span className="font-semibold text-ink">{metrics.totalPromises}</span>
          </p>
        </div>
        <div className="relative shrink-0">
          <svg
            viewBox="0 0 100 100"
            className="h-24 w-24 lg:h-28 lg:w-28 -rotate-90"
            style={{
              filter:
                "drop-shadow(0 6px 10px rgba(15,23,42,0.12)) drop-shadow(0 2px 3px rgba(15,23,42,0.06))",
            }}
          >
            <defs>
              {/* Radial gradients to give each segment a soft 3D "rope" feel */}
              <linearGradient id="vc-rose" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FB7185" />
                <stop offset="100%" stopColor="#E11D48" />
              </linearGradient>
              <linearGradient id="vc-emerald" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            {/* Track (rose, "not kept" share) */}
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="url(#vc-rose)"
              strokeWidth="16"
              strokeLinecap="butt"
            />
            {/* Filled (emerald, "kept" share) */}
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="url(#vc-emerald)"
              strokeWidth="16"
              strokeDasharray={c}
              strokeDashoffset={c - filled}
              strokeLinecap="butt"
            />
            {/* Inner highlight ring — gives the "polished" look */}
            <circle
              cx="50"
              cy="50"
              r={r - 7}
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1.2"
            />
          </svg>
          {/* Inner % badge */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[12px] lg:text-[13px] font-bold tabular-nums text-ink shadow-[0_2px_6px_-2px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-black/[0.04]">
              {pct} %
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
