import { GLASS_CARD } from "@/lib/ui/glass";
import type { CoherencePromise } from "@/lib/coherence/types";
import { VERDICT_TONE } from "./tone";

/**
 * One row per promise, with a horizontal progress bar (% of expected actives
 * present and well dosed). The bar's fill colour matches the verdict, so
 * length + colour + verdict pill stay consistent.
 */
export function PromisesBarChart({ promises }: { promises: CoherencePromise[] }) {
  if (promises.length === 0) return null;

  return (
    <article className={`${GLASS_CARD} p-5 lg:p-6`}>
      <h2 className="text-[15px] lg:text-[17px] font-semibold mb-1">Détail par promesse</h2>
      <p className="text-[12px] text-[#6B7280] mb-4">
        Plus la barre est remplie, plus la promesse est documentée par les
        ingrédients de la formule.
      </p>

      <ul className="space-y-3">
        {promises.map((p) => {
          const tone = VERDICT_TONE[p.verdict];
          // Floor at 4 % so 0 % bars are still visible as a thin sliver.
          const visiblePct = Math.max(4, p.score);
          return (
            <li key={p.slug + p.excerpt} className="flex items-center gap-3">
              <span className="min-w-0 flex-[0_0_120px] truncate text-[13px] font-medium text-ink lg:flex-[0_0_160px]">
                {p.label}
              </span>
              <div className="h-2 flex-1 rounded-full bg-[#F3F4F6] overflow-hidden">
                <div
                  className={`h-full rounded-full ${tone.bg} transition-[width] duration-500`}
                  style={{ width: `${visiblePct}%` }}
                />
              </div>
              <span className="min-w-0 flex-[0_0_44px] text-right text-[12px] tabular-nums text-[#6B7280]">
                {p.score} %
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
