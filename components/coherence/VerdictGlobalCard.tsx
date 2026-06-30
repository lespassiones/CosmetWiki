"use client";

import { useEffect, useRef, useState } from "react";
import { GLASS_CARD } from "@/lib/ui/glass";
import type { CoherenceResult, CoherenceVerdict } from "@/lib/coherence/types";
import { VERDICT_TONE, verdictChipLabel } from "./tone";

/**
 * Hero summary card (refonte épurée, twin du mockup mobile).
 *
 * A single green ring centred on the % of kept promises, with a stack of
 * per-verdict chips on the right, and a "Globalement tenu · X sur Y" line
 * underneath. The ring fill + the big number animate from 0 → target on mount
 * (ease-out cubic), honouring prefers-reduced-motion.
 *
 * PRESENTATION ONLY — metrics come straight from the backend, untouched.
 */

/** Synthesis label derived from the kept-% (presentation only). */
function globalLabel(pct: number): string {
  if (pct >= 80) return "Globalement tenu";
  if (pct >= 50) return "Partiellement tenu";
  if (pct > 0) return "Peu tenu";
  return "Non démontré";
}

export function VerdictGlobalCard({ metrics }: { metrics: CoherenceResult["metrics"] }) {
  const pct = metrics.tenuePct;
  const supportedCount = metrics.tenueCount + metrics.partielleCount;
  const r = 42;
  const c = 2 * Math.PI * r;
  const filled = (pct / 100) * c;

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
    const DURATION = 1400;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
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

  const chips = (
    [
      { verdict: "tenue", count: metrics.tenueCount },
      { verdict: "partielle", count: metrics.partielleCount },
      { verdict: "marketing", count: metrics.marketingCount },
      { verdict: "non_demontree", count: metrics.nonDemontreeCount },
      { verdict: "contredite", count: metrics.contrediteCount },
    ] as { verdict: CoherenceVerdict; count: number }[]
  ).filter((x) => x.count > 0);

  return (
    <article className={`${GLASS_CARD} p-6 lg:p-8`}>
      <div className="flex items-center justify-center gap-6 lg:gap-10">
        {/* Ring */}
        <div className="relative shrink-0">
          <svg viewBox="0 0 100 100" className="h-36 w-36 lg:h-44 lg:w-44 -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="#F3F4F6" strokeWidth="9" />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="#10B981"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c - animatedFilled}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex items-start tabular-nums text-ink">
              <span className="text-[40px] lg:text-[48px] font-bold leading-none">{animatedPct}</span>
              <span className="text-[20px] lg:text-[24px] font-bold leading-none mt-1">%</span>
            </span>
          </div>
        </div>

        {/* Per-verdict chips */}
        <ul className="flex flex-col gap-2 min-w-0">
          {chips.map((ch) => {
            const tone = VERDICT_TONE[ch.verdict];
            return (
              <li
                key={ch.verdict}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] lg:text-[13px] font-medium ${tone.bgSoft} ${tone.text} ring-1 ${tone.ringSoft}`}
              >
                <span aria-hidden className={`h-2 w-2 rounded-full ${tone.bg}`} />
                {verdictChipLabel(ch.verdict, ch.count)}
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-6 text-center text-[14px] lg:text-[15px] text-[#6B7280]">
        {globalLabel(pct)} ·{" "}
        <span className="font-semibold text-ink">
          {supportedCount} sur {metrics.totalPromises}
        </span>
      </p>
    </article>
  );
}
