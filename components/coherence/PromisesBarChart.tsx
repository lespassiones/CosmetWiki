"use client";

import { useEffect, useRef, useState } from "react";
import { GLASS_CARD } from "@/lib/ui/glass";
import { InfoBadge, Tooltip } from "../Tooltip";
import type { CoherencePromise } from "@/lib/coherence/types";
import { VERDICT_TONE } from "./tone";

/**
 * One row per promise, with a horizontal progress bar (% of expected actives
 * present and well dosed). Bars fill from 0 to their target width on mount
 * with a shared ease-out cubic animation (~1100ms), in sync with the verdict
 * donut. The numeric % counter ticks alongside the bar so the whole row
 * feels alive.
 */
export function PromisesBarChart({ promises }: { promises: CoherencePromise[] }) {
  // Shared mount-time animation. progress ramps 0 → 1 with ease-out cubic.
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
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (promises.length === 0) return null;

  // Real examples from the current promises so the tooltip is concrete.
  const exampleTenue = promises.find((p) => p.verdict === "tenue");
  const examplePartielle = promises.find((p) => p.verdict === "partielle");
  const exampleNon = promises.find((p) => p.verdict === "non_demontree");
  const exampleContredite = promises.find((p) => p.verdict === "contredite");

  return (
    <article className={`${GLASS_CARD} p-5 lg:p-6`}>
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-[15px] lg:text-[17px] font-semibold">Détail par promesse</h2>
        <Tooltip
          placement="bottom"
          maxWidth={420}
          content={
            <>
              Chaque barre montre à quel point la formule soutient la promesse.
              {(exampleTenue || examplePartielle || exampleNon) && (
                <><br /><br /><b>Ici</b> :</>
              )}
              {exampleTenue && (
                <><br /><i>{exampleTenue.label}</i> à{" "}
                <b>{exampleTenue.score} %</b> = au moins un actif bien dosé.</>
              )}
              {examplePartielle && (
                <><br /><i>{examplePartielle.label}</i> à{" "}
                <b>{examplePartielle.score} %</b> = actif présent mais en trace.</>
              )}
              {exampleNon && (
                <><br /><i>{exampleNon.label}</i> à <b>{exampleNon.score} %</b> =
                aucun ingrédient connu trouvé.</>
              )}
              {exampleContredite && (
                <><br /><i>{exampleContredite.label}</i> à <b>0 %</b> = la formule contient
                un ingrédient que la promesse exclut.</>
              )}
            </>
          }
        >
          <button type="button" aria-label="Que signifient ces barres ?">
            <InfoBadge />
          </button>
        </Tooltip>
      </div>
      <p className="text-[12px] text-[#6B7280] mb-4">
        Plus la barre est remplie, plus la promesse est documentée par les
        ingrédients de la formule.
      </p>

      <ul className="space-y-3">
        {promises.map((p) => {
          const tone = VERDICT_TONE[p.verdict];
          // Floor at 4 % so 0 % bars are still visible as a thin sliver.
          // The animated width comes from progress * score, with the same
          // floor applied so the sliver always shows once progress > ~0.05.
          const target = Math.max(4, p.score);
          const animatedWidth = Math.max(progress > 0 ? 4 : 0, target * progress);
          const animatedPct = Math.round(p.score * progress);
          return (
            <li key={p.slug + p.excerpt} className="flex items-center gap-3">
              <span className="min-w-0 flex-[0_0_120px] truncate text-[13px] font-medium text-ink lg:flex-[0_0_160px]">
                {p.label}
              </span>
              <div className="h-2 flex-1 rounded-full bg-[#F3F4F6] overflow-hidden">
                <div
                  className={`h-full rounded-full ${tone.bg}`}
                  style={{ width: `${animatedWidth}%` }}
                />
              </div>
              <span className="min-w-0 flex-[0_0_44px] text-right text-[12px] tabular-nums text-[#6B7280]">
                {animatedPct} %
              </span>
              <span
                aria-hidden
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone.bg}`}
              />
            </li>
          );
        })}
      </ul>
    </article>
  );
}
