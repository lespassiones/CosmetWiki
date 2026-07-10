"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRestrictions } from "@/components/restrictions/RestrictionsProvider";
import { checkRestrictions } from "@/lib/restrictions/check";
import { hasAnyRestriction } from "@/lib/restrictions/types";
import type { AnalyseItem } from "@/lib/analyseTypes";
import { GLASS_CARD_ROSE } from "@/lib/ui/glass";

const RESTRICTIONS_HREF = "/profile/restrictions";

export function RestrictionWarning({ items }: { items: AnalyseItem[] }) {
  const { restrictions, families } = useRestrictions();

  const matches = useMemo(
    () => checkRestrictions(items, restrictions, families),
    [items, restrictions, families],
  );

  const hasRestrictions = hasAnyRestriction(restrictions);

  // No restrictions configured → persistent invite to set them up
  if (!hasRestrictions) {
    return (
      <Link
        href={RESTRICTIONS_HREF}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11.5px] font-medium text-rose-600 ring-1 ring-rose-200 bg-rose-50/60 hover:bg-rose-50 transition-colors overflow-hidden"
      >
        <ShieldPlusIcon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Configure tes restrictions pour personnaliser l'analyse</span>
        <ChevronRightIcon className="h-3 w-3 ml-auto shrink-0 opacity-60" />
      </Link>
    );
  }

  // Restrictions configured but no match → clean product, offer to manage
  if (matches.length === 0) {
    return (
      <Link
        href={RESTRICTIONS_HREF}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11.5px] font-medium text-emerald-700 ring-1 ring-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 transition-colors overflow-hidden"
      >
        <ShieldCheckIcon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Aucune restriction détectée</span>
        <span className="ml-auto whitespace-nowrap text-[11px] text-emerald-600/70 shrink-0 pl-2">Gérer</span>
        <ChevronRightIcon className="h-3 w-3 shrink-0 opacity-60" />
      </Link>
    );
  }

  // Restrictions configured and matches found → full warning + manage link
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
            ? "1 ingrédient dans tes restrictions"
            : `${totalIngredients} ingrédients dans tes restrictions`}
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

      <Link
        href={RESTRICTIONS_HREF}
        className="mt-2 flex items-center gap-1.5 text-[11.5px] font-medium text-rose-500 hover:text-rose-700 transition-colors w-fit"
      >
        <span>Gérer mes restrictions</span>
        <ChevronRightIcon className="h-3 w-3" />
      </Link>
    </section>
  );
}

function ShieldAlertIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
      <line x1="12" y1="8" x2="12" y2="13" />
      <circle cx="12" cy="16" r="0.6" fill="currentColor" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function ShieldPlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
      <line x1="12" y1="9" x2="12" y2="15" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
