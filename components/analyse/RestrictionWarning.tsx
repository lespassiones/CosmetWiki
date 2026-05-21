"use client";

import { useMemo } from "react";
import { useRestrictions } from "@/components/restrictions/RestrictionsProvider";
import { checkRestrictions } from "@/lib/restrictions/check";
import type { AnalyseItem } from "@/lib/analyseTypes";
import { GLASS_CARD_ROSE } from "@/lib/ui/glass";

/**
 * Banner shown right below the score donut when the analysed product
 * contains at least one ingredient that matches the user's restrictions.
 * Renders nothing when:
 *   - the user has no restrictions configured, OR
 *   - none of the analysed ingredients match.
 * No AI involved — just a local match against the user's saved list.
 */
export function RestrictionWarning({ items }: { items: AnalyseItem[] }) {
  const { restrictions, families } = useRestrictions();

  const matches = useMemo(
    () => checkRestrictions(items, restrictions, families),
    [items, restrictions, families],
  );

  if (matches.length === 0) return null;

  // Dedup by label so we show each family/ingredient once, with the
  // smallest position (closer to the top of the INCI list = more concerning).
  const grouped = new Map<
    string,
    { label: string; kind: "family" | "ingredient"; positions: number[] }
  >();
  for (const m of matches) {
    const key = `${m.kind}:${m.label}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.positions.push(m.position);
    } else {
      grouped.set(key, { label: m.label, kind: m.kind, positions: [m.position] });
    }
  }
  const entries = Array.from(grouped.values()).sort(
    (a, b) => Math.min(...a.positions) - Math.min(...b.positions),
  );

  const totalIngredients = matches.length;

  return (
    <section
      className={`${GLASS_CARD_ROSE} px-4 py-2 lg:py-2.5`}
      role="status"
      aria-live="polite"
    >
      <header className="flex items-center gap-2.5">
        <ShieldAlertIcon className="h-4 w-4 text-rose-600 shrink-0" />
        <h3 className="text-[13px] font-semibold text-rose-700 leading-tight">
          {totalIngredients === 1
            ? "1 ingrédient dans vos restrictions"
            : `${totalIngredients} ingrédients dans vos restrictions`}
        </h3>
      </header>

      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {entries.map((e) => (
          <li
            key={`${e.kind}:${e.label}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/80 ring-1 ring-rose-200 px-2.5 py-1 text-[12px] font-medium text-rose-700"
          >
            <span>{e.label}</span>
            {e.positions.length > 1 ? (
              <span className="text-[10.5px] font-semibold text-rose-500/80">
                ×{e.positions.length}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ShieldAlertIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
      <line x1="12" y1="8" x2="12" y2="13" />
      <circle cx="12" cy="16" r="0.6" fill="currentColor" />
    </svg>
  );
}
