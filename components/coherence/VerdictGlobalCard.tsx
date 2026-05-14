import { GLASS_CARD } from "@/lib/ui/glass";
import { InfoBadge, Tooltip } from "../Tooltip";
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
    <article className={`${GLASS_CARD} p-5 lg:p-7 h-full flex flex-col`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="text-[11px] lg:text-[12px] font-medium uppercase tracking-wider text-ink-subtle">
          Verdict global
        </div>
        <Tooltip
          maxWidth={280}
          content={
            <>
              On a trouvé <b>{metrics.totalPromises} promesse{metrics.totalPromises > 1 ? "s" : ""}</b> dans la description.
              Sur ces {metrics.totalPromises}, <b>{metrics.tenueCount}</b> {metrics.tenueCount > 1 ? "sont totalement tenues" : "est totalement tenue"} par la formule (verdict <b>Tenue</b>) — c&apos;est ce {pct} %.
              Les autres ne sont pas zéro : elles peuvent être <b>partielles</b> (actifs présents mais en trace), <b>marketing</b> (effet visuel seulement) ou <b>non démontrées</b> (rien dans la formule).
            </>
          }
        >
          <button type="button" aria-label="Que signifie le verdict global ?">
            <InfoBadge />
          </button>
        </Tooltip>
      </div>
      <div className="flex items-center justify-between gap-4 flex-1">
        <div className="min-w-0 flex-1">
          {/* Inline-flex with explicit small gap so the "%" sits tight against
              the number on the same baseline. whitespace-nowrap prevents the
              "%" from wrapping when the column is narrow. */}
          <div className="inline-flex items-baseline gap-1 whitespace-nowrap text-[52px] lg:text-[64px] font-bold leading-none tabular-nums text-ink">
            <span>{pct}</span>
            <span className="text-[32px] lg:text-[40px] font-bold">%</span>
          </div>
          <p className="mt-3 lg:mt-4 text-[14px] lg:text-[15px] text-[#6B7280] leading-snug">
            Promesses tenues :{" "}
            <span className="font-semibold text-ink">{metrics.tenueCount}</span>{" "}
            sur <span className="font-semibold text-ink">{metrics.totalPromises}</span>
          </p>
        </div>
        <div className="relative shrink-0">
          <svg
            viewBox="0 0 100 100"
            className="h-28 w-28 lg:h-36 lg:w-36 -rotate-90"
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
