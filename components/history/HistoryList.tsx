"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GLASS_CARD, GLASS_CARD_HOVER, GLASS_PILL_DARK } from "@/lib/ui/glass";

type Row = {
  id: string;
  name: string | null;
  product_label: string | null;
  score: number | null;
  created_at: string;
};

function scoreTone(score: number | null) {
  if (score === null) return { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", label: "—" };
  if (score >= 17) return { bg: "bg-emerald-50", text: "text-emerald-700", label: "Très bien" };
  if (score >= 13) return { bg: "bg-amber-50", text: "text-amber-700", label: "Bien" };
  if (score >= 9) return { bg: "bg-orange-50", text: "text-orange-700", label: "Moyen" };
  return { bg: "bg-rose-50", text: "text-rose-700", label: "À éviter" };
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
      {/* Discrete toolbar — only the "Comparer" entry point is visible when idle */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-[#6B7280]">
          {rows.length === 0
            ? "Tu n'as pas encore d'analyse sauvegardée."
            : `${rows.length} analyse${rows.length > 1 ? "s" : ""} sauvegardée${rows.length > 1 ? "s" : ""}.`}
        </p>
        {rows.length >= 2 && !selectMode && (
          <button
            type="button"
            onClick={startSelect}
            className="text-[12px] text-[#F43F5E] font-medium hover:underline"
          >
            Comparer 2 analyses →
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

      <ul className="space-y-3">
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
                  <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl ${tone.bg} ${tone.text}`}>
                    <span className="text-base font-bold leading-none">
                      {a.score !== null ? a.score.toFixed(1) : "—"}
                    </span>
                    <span className="text-[10px] mt-0.5">/20</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[#111111] truncate">{displayName}</div>
                    <div className="text-[12px] text-[#6B7280]">
                      {tone.label} · {formatDate(a.created_at)}
                    </div>
                  </div>
                </button>
              </li>
            );
          }

          return (
            <li key={a.id}>
              <Link
                href={`/history/${a.id}`}
                className={`${GLASS_CARD} ${GLASS_CARD_HOVER} flex items-center gap-4 p-4`}
              >
                <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl ${tone.bg} ${tone.text}`}>
                  <span className="text-base font-bold leading-none">
                    {a.score !== null ? a.score.toFixed(1) : "—"}
                  </span>
                  <span className="text-[10px] mt-0.5">/20</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[#111111] truncate">{displayName}</div>
                  <div className="text-[12px] text-[#6B7280]">
                    {tone.label} · {formatDate(a.created_at)}
                  </div>
                </div>
                <svg className="h-4 w-4 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
