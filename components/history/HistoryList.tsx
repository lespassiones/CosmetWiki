"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HistoryItemActions } from "@/components/history/HistoryItemActions";
import { type BlobCounts } from "@/components/blob/IngredientBlob";
import { categoryLabel, type ProductCategory } from "@/lib/categoryLabel";
import { decodeHtml } from "@/lib/decodeHtml";

type Row = {
  id: string;
  name: string | null;
  product_label: string | null;
  score: number | null;
  created_at: string;
  counts: BlobCounts | null;
  /** Image produit résolue via EAN côté serveur (null si hors catalogue). */
  imageUrl?: string | null;
  favori?: boolean | null;
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
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [favoris, setFavoris] = useState<Record<string, boolean>>({});
  const router = useRouter();

  const selectedCount = selected.size;
  const canCompare = selectedCount === 2;

  const filteredRows = useMemo(() => {
    let result = rows;

    if (showFavOnly) {
      result = result.filter((r) => {
        const favState = favoris[r.id] !== undefined ? favoris[r.id] : (r.favori ?? false);
        return favState;
      });
    }

    const q = query.trim().toLowerCase();
    if (!q) return result;
    return result.filter((r) => {
      const label = (r.product_label ?? r.name ?? "").toLowerCase();
      if (label.includes(q)) return true;
      const tokens = r.ingredientTokens ?? [];
      return tokens.some((t) => t.includes(q));
    });
  }, [rows, query, showFavOnly, favoris]);

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

  async function toggleFavori(id: string, current: boolean) {
    const next = !current;
    setFavoris((prev) => ({ ...prev, [id]: next }));
    try {
      await fetch(`/api/analyses/${id}/favori`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favori: next }),
      });
    } catch {
      // revert on error
      setFavoris((prev) => ({ ...prev, [id]: current }));
    }
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

      {/* Toolbar - Tout / Favoris toggle on the left, Comparer on the right,
          all on the same line. */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {/* Tout / Favoris toggle — toujours affiché dès qu'il y a une analyse,
            pour un rendu cohérent sur tous les appareils (l'onglet Favoris
            affiche un état vide s'il n'y a encore aucun favori). */}
        {!selectMode && rows.length > 0 ? (
          <div className="inline-flex rounded-full bg-black/[0.06] p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setShowFavOnly(false)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition ${
                !showFavOnly ? "bg-white shadow text-[#111111]" : "text-[#6B7280] hover:text-[#111111]"
              }`}
            >
              Tout
            </button>
            <button
              type="button"
              onClick={() => setShowFavOnly(true)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition ${
                showFavOnly ? "bg-white shadow text-[#111111]" : "text-[#6B7280] hover:text-[#111111]"
              }`}
            >
              Favoris
            </button>
          </div>
        ) : (
          <span />
        )}

        {rows.length >= 2 && !selectMode && (
          <button
            type="button"
            onClick={startSelect}
            className="neu-shadow rounded-full inline-flex items-center gap-1.5 bg-emerald-500 text-white px-3.5 py-1.5 text-[12px] font-semibold transition hover:bg-emerald-600"
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

      {!selectMode && showFavOnly && !query.trim() && filteredRows.length === 0 && (
        <p className="mt-6 text-center text-[13px] text-[#6B7280]">
          Aucun favori pour l&apos;instant. Touche le marque-page sur une analyse pour l&apos;ajouter ici.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {filteredRows.map((a) => {
          const isFavori = favoris[a.id] !== undefined ? favoris[a.id] : (a.favori ?? false);
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
                  className={`neu neu-hover w-full flex items-stretch gap-4 p-4 text-left ${
                    isSelected ? "ring-2 ring-[#111111]" : ""
                  }`}
                >
                  <span
                    aria-hidden
                    className={`h-5 w-5 shrink-0 self-center rounded-full border-2 flex items-center justify-center ${
                      isSelected ? "bg-[#111111] border-[#111111]" : "border-[#9CA3AF]"
                    }`}
                  >
                    {isSelected && (
                      <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path d="M5 12l5 5 9-12" />
                      </svg>
                    )}
                  </span>
                  <ProductThumb url={a.imageUrl} className="-my-2.5 -ml-2.5 w-14 min-h-[56px]" />
                  <div className="min-w-0 flex-1 self-center">
                    <div className="font-semibold text-[#111111] line-clamp-2">{displayName}</div>
                    <div className="text-[12px] text-[#6B7280]">
                      {formatDate(a.created_at)}
                    </div>
                  </div>
                  <ProportionRing counts={a.counts} size={36} stroke={6} className="self-center" />
                </button>
              </li>
            );
          }

          const canAnalysePromesse = true;
          return (
            <li key={a.id} className={`relative${openActionsId === a.id ? " z-[60]" : ""}`}>
              <div
                className="neu neu-hover relative flex min-h-[92px] items-stretch gap-4 p-4 pr-24"
              >
                {/* Card-wide click target */}
                <Link
                  href={`/history/${a.id}`}
                  aria-label={`Ouvrir ${displayName}`}
                  className="absolute inset-0 z-0"
                />
                <ProductThumb
                  url={a.imageUrl}
                  className="relative z-[1] -my-2.5 -ml-2.5 w-16 min-h-[64px] pointer-events-none"
                />
                <div className="relative z-[1] min-w-0 flex-1 self-center pointer-events-none">
                  <div className="font-semibold text-[#111111] truncate mb-0.5">{displayName}</div>
                  {(categoryLabel(a.category) ?? a.productType) ? (
                    <span className="mt-0.5 inline-flex items-center rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] font-medium text-[#6B7280] capitalize">
                      {categoryLabel(a.category) ?? a.productType}
                    </span>
                  ) : null}
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

              {/* Colonne droite : anneau de proportion des ingrédients
                  juste au-dessus du favori (signet) et du menu (•••). */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[2] flex flex-col items-center gap-1.5">
                <ProportionRing counts={a.counts} size={40} stroke={7} />
                <div className="flex items-center">
                  <button
                    type="button"
                    aria-label={isFavori ? "Retirer des favoris" : "Ajouter aux favoris"}
                    onClick={() => toggleFavori(a.id, isFavori)}
                    className={`h-8 w-8 flex items-center justify-center rounded-full transition hover:bg-black/[0.06] ${
                      isFavori ? "text-amber-500" : "text-[#9CA3AF]"
                    }`}
                  >
                    <BookmarkIcon filled={isFavori} />
                  </button>
                  <HistoryItemActions
                    id={a.id}
                    currentName={a.name ?? displayName}
                    onOpenChange={(isOpen) => setOpenActionsId(isOpen ? a.id : null)}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const RING_ORDER = ["vert", "jaune", "orange", "rouge"] as const;
const RING_COLORS: Record<(typeof RING_ORDER)[number], string> = {
  vert: "#10B981",
  jaune: "#FBBF24",
  orange: "#FB923C",
  rouge: "#F43F5E",
};

/** Anneau plein (donut) : proportion des ingrédients par couleur. */
function ProportionRing({
  counts,
  size = 40,
  stroke = 7,
  className,
}: {
  counts: BlobCounts | null;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const c = counts ?? { vert: 0, jaune: 0, orange: 0, rouge: 0 };
  const total = c.vert + c.jaune + c.orange + c.rouge;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  let acc = 0;
  const segments = RING_ORDER.flatMap((k) => {
    const v = c[k];
    if (total <= 0 || v <= 0) return [];
    const frac = v / total;
    const seg = { k, frac, offset: acc };
    acc += frac;
    return [seg];
  });
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`shrink-0 ${className ?? ""}`}
      aria-hidden
    >
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
        {segments.map((s) => (
          <circle
            key={s.k}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={RING_COLORS[s.k]}
            strokeWidth={stroke}
            strokeDasharray={`${s.frac * circ} ${circ - s.frac * circ}`}
            strokeDashoffset={-s.offset * circ}
          />
        ))}
      </g>
    </svg>
  );
}

/** Vignette produit : largeur fixe, hauteur étirée sur toute la carte. */
function ProductThumb({ url, className }: { url: string | null | undefined; className?: string }) {
  return (
    <div
      className={`relative shrink-0 self-stretch overflow-hidden rounded-xl bg-gray-100 ${className ?? ""}`}
    >
      {url ? (
        // Position absolue : l'image remplit le conteneur SANS que son ratio
        // intrinsèque ne dicte la hauteur de la carte (sinon un tube en portrait
        // fait exploser la hauteur du bloc).
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center text-gray-300">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </span>
      )}
    </div>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
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
