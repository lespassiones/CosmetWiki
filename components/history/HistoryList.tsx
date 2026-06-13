"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HistoryItemActions } from "@/components/history/HistoryItemActions";
import { IngredientBlob, type BlobCounts } from "@/components/blob/IngredientBlob";
import { categoryLabel, type ProductCategory } from "@/lib/categoryLabel";
import { decodeHtml } from "@/lib/decodeHtml";

type Row = {
  id: string;
  name: string | null;
  product_label: string | null;
  score: number | null;
  created_at: string;
  counts: BlobCounts | null;
  /** When set, the user has already run a coherence (promise) analysis on
   *  this analyse - the per-card CTA links straight to that result instead
   *  of relaunching the modal. */
  latestCoherenceId?: string | null;
  /** Lowercased ingredient names + raw INCI inputs, used by the search bar
   *  to match analyses containing a given ingredient. */
  ingredientTokens?: string[];
  /** Closed-enum product category from result_json, null when absent or "autre". */
  category?: ProductCategory | null;
  /** Raw free-form product type from OCR, used as fallback when category is absent. */
  productType?: string | null;
};

function scoreTone(score: number | null) {
  if (score === null) return { text: "text-[#6B7280]", label: "-" };
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
  const [query, setQuery] = useState("");
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);
  const router = useRouter();

  const selectedCount = selected.size;
  const canCompare = selectedCount === 2;

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const label = (r.product_label ?? r.name ?? "").toLowerCase();
      if (label.includes(q)) return true;
      const tokens = r.ingredientTokens ?? [];
      return tokens.some((t) => t.includes(q));
    });
  }, [rows, query]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 2) next.add(id);
      else {
        // already 2 selected - replace the oldest
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
      {/* Separator first - sits right under the page title (which is rendered
          by the parent route), before the toolbar / count subline. */}
      <div className="-mx-5 h-px bg-[#c5ccd6] lg:mx-0" />

      {/* Discrete toolbar - only the "Comparer" entry point is visible when idle */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-[#6B7280]">
          {rows.length === 0
            ? "Aucune analyse pour l'instant."
            : `${rows.length} analyse${rows.length > 1 ? "s" : ""}.`}
        </p>
        {rows.length >= 2 && !selectMode && (
          <button
            type="button"
            onClick={startSelect}
            className="neu-shadow-rose rounded-full inline-flex items-center gap-1.5 bg-[#F43F5E] text-white px-3.5 py-1.5 text-[12px] font-semibold transition hover:bg-[#E11D48]"
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
              className="neu-btn-primary rounded-full text-[12px] px-3 py-1.5 disabled:opacity-40"
            >
              Comparer ({selectedCount}/2)
            </button>
          </div>
        )}
      </div>

      {!selectMode && rows.length > 0 && (
        <div className="mt-3">
          <label htmlFor="history-search" className="sr-only">
            Rechercher dans l&apos;historique
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              id="history-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit ou un ingrédient…"
              className="neu-inset w-full rounded-full focus:outline-none pl-9 pr-9 py-2.5 text-sm text-[#111111] placeholder:text-[#9CA3AF]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Effacer la recherche"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-full text-[#6B7280] hover:bg-black/5"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>
          {query.trim() && (
            <p className="mt-2 text-[12px] text-[#6B7280]">
              {filteredRows.length === 0
                ? "Aucune analyse ne correspond."
                : `${filteredRows.length} résultat${filteredRows.length > 1 ? "s" : ""}.`}
            </p>
          )}
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {filteredRows.map((a) => {
          const tone = scoreTone(a.score);
          const displayName = decodeHtml(
            a.name ?? a.product_label ?? `Analyse du ${formatDate(a.created_at)}`,
          );
          const isSelected = selected.has(a.id);

          if (selectMode) {
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => toggle(a.id)}
                  aria-pressed={isSelected}
                  className={`neu neu-hover w-full flex items-center gap-4 p-4 text-left ${
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

          // The pill is shown on every card now - earlier we hid it when no
          // product_label was set, which was inconsistent: on the detail
          // page the same analyse showed "Voir l'analyse de la promesse"
          // (because of the "Analyse du …" fallback title). Always visible
          // here too - the modal handles the "no name" case by searching
          // on the INCI alone and falling back to manual description.
          const canAnalysePromesse = true;
          return (
            <li key={a.id} className={`relative${openActionsId === a.id ? " z-[60]" : ""}`}>
              <div
                className="neu neu-hover relative flex items-center gap-4 p-4 pr-16"
              >
                {/* Card-wide click target - kept underneath the action buttons
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
                  {(categoryLabel(a.category) ?? a.productType) ? (
                    <span className="mt-0.5 inline-flex items-center rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] font-medium text-[#6B7280] capitalize">
                      {categoryLabel(a.category) ?? a.productType}
                    </span>
                  ) : null}
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
              <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[2]">
                <HistoryItemActions
                  id={a.id}
                  currentName={a.name ?? displayName}
                  onOpenChange={(isOpen) => setOpenActionsId(isOpen ? a.id : null)}
                />
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

function SearchIcon({ className }: { className?: string }) {
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
