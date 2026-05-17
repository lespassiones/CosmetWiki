"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GLASS_CARD, GLASS_CARD_HOVER, GLASS_PILL_DARK } from "@/lib/ui/glass";
import { HistoryItemActions } from "@/components/history/HistoryItemActions";
import { IngredientBlob, type BlobCounts } from "@/components/blob/IngredientBlob";

type Row = {
  id: string;
  name: string | null;
  product_label: string | null;
  score: number | null;
  created_at: string;
  counts: BlobCounts | null;
  /** When set, the user has already run a coherence (promise) analysis on
   *  this analyse — the per-card CTA links straight to that result instead
   *  of relaunching the modal. */
  latestCoherenceId?: string | null;
};

function scoreTone(score: number | null) {
  if (score === null) return { text: "text-[#6B7280]", label: "—" };
  if (score >= 17) return { text: "text-emerald-700", label: "Très bien" };
  if (score >= 13) return { text: "text-amber-700", label: "Bien" };
  if (score >= 9) return { text: "text-orange-700", label: "Moyen" };
  return { text: "text-rose-700", label: "À éviter" };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryList({ rows }: { rows: Row[] }) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const router = useRouter();

  const selectedCount = selected.size;
  const canCompare = selectedCount === 2;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 2) next.add(id);
      else {
        // already 2 selected — replace the oldest
        const first = Array.from(next)[0];
        next.delete(first);
        next.add(id);
      }
      return next;
    });
  }

  function startSelect() {
    setSelectMode(true);
    setSelected(new Set());
  }

  function cancel() {
    setSelectMode(false);
    setSelected(new Set());
  }

  function compare() {
    if (!canCompare) return;
    const ids = Array.from(selected).join(",");
    router.push(`/compare?ids=${ids}`);
  }

  const hint = useMemo(() => {
    if (!selectMode) return null;
    if (selectedCount === 0) return "Sélectionne 2 analyses à comparer";
    if (selectedCount === 1) return "Sélectionne 1 deuxième analyse";
    return "Prêt à comparer";
  }, [selectMode, selectedCount]);

  return (
    <div>
      {/* Separator first — sits right under the page title (which is rendered
          by the parent route), before the toolbar / count subline. */}
      <div className="-mx-5 h-[2px] bg-black/30 lg:mx-0 lg:h-px lg:bg-black/[0.08]" />

      {/* Discrete toolbar — only the "Comparer" entry point is visible when idle */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-[#6B7280]">
          {rows.length === 0
            ? "Tu n'as pas encore d'analyse sauvegardée."
            : `${rows.length} analyse${rows.length > 1 ? "s" : ""} sauvegardée${rows.length > 1 ? "s" : ""}.`}
        </p>
        {rows.length >= 2 && !selectMode && (
          <button
            type="button"
            onClick={startSelect}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/85 hover:bg-rose-50 text-[#F43F5E] ring-1 ring-rose-200/70 hover:ring-rose-300 backdrop-blur-md px-3 py-1.5 text-[12px] font-semibold shadow-[0_6px_16px_-4px_rgba(244,63,94,0.20),inset_0_1px_0_rgba(255,255,255,0.85)] hover:shadow-[0_8px_20px_-4px_rgba(244,63,94,0.28),inset_0_1px_0_rgba(255,255,255,0.9)] transition"
          >
            Comparer 2 analyses
            <SwapHorizontalIcon className="h-3.5 w-3.5" />
          </button>
        )}
        {selectMode && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#6B7280]">{hint}</span>
            <button
              type="button"
              onClick={cancel}
              className="text-[12px] text-[#6B7280] hover:text-black px-2"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={compare}
              disabled={!canCompare}
              className={`${GLASS_PILL_DARK} text-[12px] font-semibold px-3 py-1.5 disabled:opacity-40`}
            >
              Comparer ({selectedCount}/2)
            </button>
          </div>
        )}
      </div>

      <ul className="mt-6 space-y-3">
        {rows.map((a) => {
          const tone = scoreTone(a.score);
          const displayName =
            a.product_label ?? a.name ?? `Analyse du ${formatDate(a.created_at)}`;
          const isSelected = selected.has(a.id);

          if (selectMode) {
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => toggle(a.id)}
                  aria-pressed={isSelected}
                  className={`${GLASS_CARD} ${GLASS_CARD_HOVER} w-full flex items-center gap-4 p-4 text-left ${
                    isSelected ? "ring-2 ring-[#111111]" : ""
                  }`}
                >
                  <span
                    aria-hidden
                    className={`h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? "bg-[#111111] border-[#111111]" : "border-[#9CA3AF]"
                    }`}
                  >
                    {isSelected && (
                      <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path d="M5 12l5 5 9-12" />
                      </svg>
                    )}
                  </span>
                  <div className="h-12 w-16 shrink-0">
                    <IngredientBlob
                      counts={a.counts ?? { vert: 0, jaune: 0, orange: 0, rouge: 0 }}
                      variant="sm"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[#111111] truncate">{displayName}</div>
                    <div className="text-[12px] text-[#6B7280]">
                      {formatDate(a.created_at)}
                    </div>
                  </div>
                </button>
              </li>
            );
          }

          // The pill is shown on every card now — earlier we hid it when no
          // product_label was set, which was inconsistent: on the detail
          // page the same analyse showed "Voir l'analyse de la promesse"
          // (because of the "Analyse du …" fallback title). Always visible
          // here too — the modal handles the "no name" case by searching
          // on the INCI alone and falling back to manual description.
          const canAnalysePromesse = true;
          return (
            <li key={a.id} className="relative">
              <div
                className={`${GLASS_CARD} ${GLASS_CARD_HOVER} relative flex items-center gap-4 p-4 pr-16`}
              >
                {/* Card-wide click target — kept underneath the action buttons
                    so the dedicated "Analyser la promesse" link / kebab menu
                    receive their own clicks. */}
                <Link
                  href={`/history/${a.id}`}
                  aria-label={`Ouvrir ${displayName}`}
                  className="absolute inset-0 z-0"
                />
                <div className="relative z-[1] h-12 w-16 shrink-0 pointer-events-none">
                  <IngredientBlob
                    counts={a.counts ?? { vert: 0, jaune: 0, orange: 0, rouge: 0 }}
                    variant="sm"
                  />
                </div>
                <div className="relative z-[1] min-w-0 flex-1 pointer-events-none">
                  <div className="font-semibold text-[#111111] truncate">{displayName}</div>
                  <div className="text-[12px] text-[#6B7280]">
                    {formatDate(a.created_at)}
                  </div>
                  {canAnalysePromesse && (
                    a.latestCoherenceId ? (
                      <Link
                        href={`/promesses/${a.latestCoherenceId}`}
                        className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 text-[11px] font-semibold px-2.5 py-1 transition pointer-events-auto"
                      >
                        <span aria-hidden>✨</span> Voir l&apos;analyse de la promesse
                      </Link>
                    ) : (
                      <Link
                        href={`/history/${a.id}?promesse=auto`}
                        className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 text-[11px] font-semibold px-2.5 py-1 transition pointer-events-auto"
                      >
                        <span aria-hidden>✨</span> Analyser la promesse
                      </Link>
                    )
                  )}
                </div>
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
                <HistoryItemActions id={a.id} currentName={a.name ?? displayName} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SwapHorizontalIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M7 4 3 8l4 4" />
      <path d="M3 8h14" />
      <path d="m17 20 4-4-4-4" />
      <path d="M21 16H7" />
    </svg>
  );
}
