"use client";

import { useEffect, useRef, useState } from "react";
import { GLASS_CARD } from "@/lib/ui/glass";
import { InfoBadge, Tooltip } from "../Tooltip";
import type { CoherenceResult } from "@/lib/coherence/types";

/**
 * Top-of-page summary card. Shows the % of promises kept on the left and a
 * bicolour donut on the right (green = kept, rose = not kept).
 *
 * Donut design : "claymorphism" / soft 3D — radial gradients on each segment
 * + a subtle drop shadow so it looks like a thick rope of paint.
 *
 * Mount animation:
 *   - The donut's emerald fill grows from 0 → target percentage with an
 *     ease-out cubic over ~1100ms (the rose track stays full underneath).
 *   - The big number on the left and the centre badge tick from 0 → pct in
 *     sync, so the whole card "comes to life" together.
 */
export function VerdictGlobalCard({ metrics }: { metrics: CoherenceResult["metrics"] }) {
  const pct = metrics.tenuePct;
  // Number of promises that have at least one documented active in the
  // formula (verdict tenue OR partielle). Symmetrical opposite of the
  // marketing index — together they sum to the total.
  const supportedCount = metrics.tenueCount + metrics.partielleCount;
  // Donut geometry tuned for crisp rendering at 96-112px.
  const r = 38;
  const c = 2 * Math.PI * r;
  const filled = (pct / 100) * c;

  // Mount-time animation. `progress` ramps 0 → 1 over DURATION ms with an
  // ease-out cubic. Honours prefers-reduced-motion: jumps straight to 1.
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce
      = typeof window !== "undefined"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setProgress(1);
      return;
    }
    const DURATION = 3500;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      // ease-out cubic: starts fast, lands smoothly
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const animatedFilled = filled * progress;
  const animatedPct = Math.round(pct * progress);

  return (
    <article className={`${GLASS_CARD} p-5 lg:p-7 h-full flex flex-col`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="text-[11px] lg:text-[12px] font-medium uppercase tracking-wider text-ink-subtle">
          Verdict global
        </div>
        <Tooltip
          placement="bottom"
          maxWidth={320}
          content={
            <>
              <b>{pct} %</b> = part des promesses qui ont au moins un{" "}
              <b>actif documenté</b> dans la formule pour les soutenir.
              <br /><br />
              <b>Sur cette analyse</b> : {supportedCount} sur{" "}
              {metrics.totalPromises} (
              {metrics.tenueCount > 0 && <>{metrics.tenueCount} totalement tenue{metrics.tenueCount > 1 ? "s" : ""}</>}
              {metrics.tenueCount > 0 && metrics.partielleCount > 0 && <>, </>}
              {metrics.partielleCount > 0 && <>{metrics.partielleCount} partielle{metrics.partielleCount > 1 ? "s" : ""} — actifs en trace ≤ 1 %</>}
              ).
              <br /><br />
              C&apos;est l&apos;<b>opposé exact</b> de l&apos;indice marketing
              ({metrics.marketingIndex} %) : les deux additionnent toujours à 100 %.
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
          <div className="inline-flex items-baseline gap-1 whitespace-nowrap text-[52px] lg:text-[64px] font-bold leading-none tabular-nums text-ink">
            <span>{animatedPct}</span>
            <span className="text-[32px] lg:text-[40px] font-bold">%</span>
          </div>
          <p className="mt-3 lg:mt-4 text-[14px] lg:text-[15px] text-[#6B7280] leading-snug">
            Promesses soutenues :{" "}
            <span className="font-semibold text-ink">{supportedCount}</span>{" "}
            sur <span className="font-semibold text-ink">{metrics.totalPromises}</span>
            {metrics.tenueCount > 0 && metrics.partielleCount > 0 && (
              <span className="block text-[12px] text-[#9CA3AF] mt-0.5">
                {metrics.tenueCount} totalement, {metrics.partielleCount} partielle
                {metrics.partielleCount > 1 ? "s" : ""}
              </span>
            )}
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
              <linearGradient id="vc-rose" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FB7185" />
                <stop offset="100%" stopColor="#E11D48" />
              </linearGradient>
              <linearGradient id="vc-emerald" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            {/* Rose track always full — the emerald fill animates over it */}
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="url(#vc-rose)"
              strokeWidth="16"
              strokeLinecap="butt"
            />
            {/* Emerald filled segment, animates from 0 to its target */}
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="url(#vc-emerald)"
              strokeWidth="16"
              strokeDasharray={c}
              strokeDashoffset={c - animatedFilled}
              strokeLinecap="butt"
            />
            <circle
              cx="50"
              cy="50"
              r={r - 7}
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1.2"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[12px] lg:text-[13px] font-bold tabular-nums text-ink shadow-[0_2px_6px_-2px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-black/[0.04]">
              {animatedPct} %
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
