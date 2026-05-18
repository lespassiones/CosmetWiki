"use client";

import { useRef, useState } from "react";
import type { ProductSearchResult, ProductSearchHit } from "@/lib/productSearch/types";
import type { OpenBeautyFactsCandidate } from "@/lib/productSearch/openBeautyFacts";

const SOURCE_LABEL: Record<string, string> = {
  cache: "notre base",
  openbeautyfacts: "Open Beauty Facts",
  openproductsfacts: "Open Products Facts",
  incidecoder: "INCIDecoder",
  "duckduckgo+mistral": "recherche web",
};

type FoundPayload = {
  ingredientsText: string;
  brand: string | null;
  productName: string | null;
  source: string;
  sourceUrl: string | null;
};

type Props = {
  /** Called with the ingredients text + source info when a product is found. */
  onFound: (input: FoundPayload) => void;
  /** Called when the user wants to switch to manual INCI input. */
  onFallbackToManual: (initialText?: string) => void;
};

type SuggestResponse = {
  candidates: OpenBeautyFactsCandidate[];
  hasMore: boolean;
  page: number;
};

export function ProductSearchInput({ onFound, onFallbackToManual }: Props) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<OpenBeautyFactsCandidate[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [deepSearching, setDeepSearching] = useState(false);
  const [deepResult, setDeepResult] = useState<ProductSearchHit | null>(null);
  /** When the user clicks an INCIDecoder candidate, we POST /api/incidecoder-fetch
   *  to pull its INCI on demand. `lazyFetching` holds the candidate id while that
   *  call is in flight so the card can show a spinner / dim itself. */
  const [lazyFetching, setLazyFetching] = useState<string | null>(null);
  const inFlightRef = useRef<AbortController | null>(null);

  function resetCandidates() {
    setCandidates([]);
    setHasMore(false);
    setPage(0);
    setSearched(false);
    setDeepResult(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 3) {
      setError("Tape au moins 3 caractères (marque + nom du produit).");
      return;
    }
    setError(null);
    setBusy(true);
    resetCandidates();

    if (inFlightRef.current) inFlightRef.current.abort();
    const ctrl = new AbortController();
    inFlightRef.current = ctrl;

    try {
      // GET so Vercel Edge CDN can cache popular queries.
      const r = await fetch(
        `/api/product-suggest?query=${encodeURIComponent(q)}&page=1`,
        { signal: ctrl.signal },
      );
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `Erreur ${r.status}`);
        return;
      }
      const data = (await r.json()) as SuggestResponse;
      setCandidates(data.candidates);
      setHasMore(data.hasMore);
      setPage(data.page);
      setSearched(true);
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
      setError((err as Error).message ?? "Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;

    if (inFlightRef.current) inFlightRef.current.abort();
    const ctrl = new AbortController();
    inFlightRef.current = ctrl;

    try {
      const r = await fetch(
        `/api/product-suggest?query=${encodeURIComponent(query.trim())}&page=${nextPage}`,
        { signal: ctrl.signal },
      );
      if (!r.ok) return;
      const data = (await r.json()) as SuggestResponse;
      // Dedupe on id in case OBF returns overlapping entries.
      setCandidates((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        const merged = [...prev];
        for (const c of data.candidates) {
          if (!seen.has(c.id)) merged.push(c);
        }
        return merged;
      });
      setHasMore(data.hasMore);
      setPage(data.page);
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
    } finally {
      setLoadingMore(false);
    }
  }

  async function selectCandidate(c: OpenBeautyFactsCandidate) {
    // INCIDecoder candidates ship without INCI to keep the suggest endpoint
    // fast. We lazy-fetch the INCI now (single product-page scrape) before
    // handing the payload to the analyse flow.
    if (c.source === "incidecoder" && c.slug && !c.ingredientsText) {
      setLazyFetching(c.id);
      setError(null);
      try {
        const r = await fetch("/api/incidecoder-fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: c.slug }),
        });
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          setError(j.error ?? `Impossible de charger ce produit (${r.status})`);
          return;
        }
        const data = (await r.json()) as {
          brand: string | null;
          productName: string | null;
          ingredientsText: string;
          sourceUrl: string;
        };
        onFound({
          ingredientsText: data.ingredientsText,
          brand: data.brand ?? c.brand,
          productName: data.productName ?? c.productName,
          source: "incidecoder",
          sourceUrl: data.sourceUrl ?? c.sourceUrl,
        });
      } catch (err) {
        setError((err as Error).message ?? "Erreur réseau");
      } finally {
        setLazyFetching(null);
      }
      return;
    }
    onFound({
      ingredientsText: c.ingredientsText,
      brand: c.brand,
      productName: c.productName,
      source: c.source ?? "openbeautyfacts",
      sourceUrl: c.sourceUrl,
    });
  }

  function selectDeepResult(hit: ProductSearchHit) {
    onFound({
      ingredientsText: hit.ingredientsText,
      brand: hit.brand,
      productName: hit.productName,
      source: hit.source,
      sourceUrl: hit.sourceUrl,
    });
  }

  // Last-resort: when the OBF suggest returned nothing, the user can ask for
  // the full cascade (INCIDecoder + DDG + Mistral). This is the original
  // /api/product-search call.
  async function runDeepSearch() {
    const q = query.trim();
    if (q.length < 3) return;
    setDeepSearching(true);
    setError(null);

    if (inFlightRef.current) inFlightRef.current.abort();
    const ctrl = new AbortController();
    inFlightRef.current = ctrl;

    try {
      const r = await fetch("/api/product-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
        signal: ctrl.signal,
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `Erreur ${r.status}`);
        return;
      }
      const data = (await r.json()) as ProductSearchResult;
      if (!data.found) {
        setError(data.message);
        return;
      }
      // Show the result as a candidate card - never auto-analyse.
      setDeepResult(data);
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
      setError((err as Error).message ?? "Erreur réseau");
    } finally {
      setDeepSearching(false);
    }
  }

  const showEmpty = searched && candidates.length === 0 && !busy;

  return (
    <form onSubmit={submit} className="w-full">
      <div className="rounded-2xl bg-[#EEF3FB] border border-[#DDE5F0] p-3">
        <div className="flex w-full items-center gap-2 rounded-xl bg-white border border-[#DDE5F0] p-1.5 shadow-sm transition-all focus-within:border-[#6189C9] focus-within:ring-2 focus-within:ring-[#BFD2EE]">
          <span aria-hidden className="pl-2.5 text-[#1E3A8A]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Ex : Effaclar Duo+ La Roche-Posay"
            className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-[14px] text-ink placeholder:text-[#9CA3AF] focus:outline-none"
            disabled={busy}
            maxLength={200}
          />
          <button
            type="submit"
            disabled={busy || query.trim().length < 3}
            className="shrink-0 rounded-xl bg-gradient-to-b from-rose-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(244,63,94,0.45),inset_0_1px_0_0_rgba(255,255,255,0.30)] transition-all hover:from-rose-600 hover:to-pink-600 disabled:cursor-not-allowed disabled:from-rose-200 disabled:to-pink-200 disabled:text-white/80 disabled:shadow-none"
          >
            {busy ? "Recherche…" : "Rechercher"}
          </button>
        </div>
      </div>

      {!searched ? (
        <div className="mt-3 rounded-2xl bg-[#EEF3FB] border border-[#DDE5F0] p-4">
          <div className="flex items-start gap-3">
            <span aria-hidden className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#DDE5F0] text-[#1E3A8A] text-[12px] font-bold italic">
              i
            </span>
            <p className="text-[13px] leading-relaxed text-[#475569]">
              Tape la marque, le nom du produit, ou les deux.
              <br />
              <span className="font-semibold text-[#1E3A8A]">Ex :</span> «&nbsp;baume L&apos;Oréal&nbsp;» ou «&nbsp;Effaclar Duo+&nbsp;».
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-[13px] text-rose-600">{error}</p>
      ) : null}

      {searched && candidates.length > 0 ? (
        <div className="mt-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <p className="text-[13px] text-ink-muted">
              {candidates.length} produit{candidates.length > 1 ? "s" : ""} trouvé{candidates.length > 1 ? "s" : ""} - choisis le tien&nbsp;:
            </p>
            <span className="text-[11px] text-ink-subtle/70">défile pour voir plus</span>
          </div>
          {/* Scrollable list - keeps the search input + footer in view while the
              user browses 30+ candidates. The pr-1 gives the scrollbar room
              without pushing cards under it. */}
          <ul className="grid gap-2.5 sm:grid-cols-2 max-h-[58vh] overflow-y-auto overscroll-contain pr-1 -mr-1">
            {candidates.map((c) => (
              <li key={c.id}>
                <CandidateCard
                  candidate={c}
                  onSelect={selectCandidate}
                  loading={lazyFetching === c.id}
                  disabled={lazyFetching !== null && lazyFetching !== c.id}
                />
              </li>
            ))}
            {hasMore ? (
              <li className="sm:col-span-2 flex justify-center pt-1">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-full bg-white px-4 py-2 text-[13px] font-medium text-ink ring-1 ring-[#D1D5DB] shadow-sm transition-colors hover:bg-[#F9FAFB] disabled:opacity-60"
                >
                  {loadingMore ? "Chargement…" : "Voir encore plus de produits"}
                </button>
              </li>
            ) : null}
          </ul>

          <p className="mt-4 text-[12px] text-ink-subtle">
            Tu ne vois pas ton produit ?{" "}
            <button
              type="button"
              onClick={() => onFallbackToManual()}
              className="font-medium text-rose-600 underline underline-offset-2 hover:no-underline"
            >
              Colle la liste INCI manuellement
            </button>
            .
          </p>
        </div>
      ) : null}

      {deepResult ? (
        <div className="mt-5 rounded-2xl bg-white p-5 ring-1 ring-[#E5E7EB] shadow-sm">
          <p className="mb-3 text-[13px] text-ink-muted">
            Produit trouvé via{" "}
            <span className="font-medium text-ink">
              {SOURCE_LABEL[deepResult.source] ?? deepResult.source}
            </span>
            . Clique pour analyser&nbsp;:
          </p>
          <button
            type="button"
            onClick={() => selectDeepResult(deepResult)}
            className="group flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-[#E5E7EB] shadow-sm transition-all hover:ring-rose-300 hover:shadow-md"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-rose-50/70 ring-1 ring-black/[0.04]">
              <span className="text-xs font-medium text-rose-400">INCI</span>
            </div>
            <div className="min-w-0 flex-1">
              {deepResult.brand ? (
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-pink-500/80">
                  {titleCase(deepResult.brand)}
                </p>
              ) : null}
              <p className="truncate text-[14px] font-medium text-ink">
                {deepResult.productName ? titleCase(deepResult.productName) : "Produit sans nom"}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-subtle">
                Cliquer pour analyser →
              </p>
            </div>
          </button>
        </div>
      ) : null}

      {showEmpty ? (
        <div className="mt-5 rounded-2xl bg-white p-5 ring-1 ring-[#E5E7EB] shadow-sm">
          <p className="text-[14px] text-ink">
            Aucun produit trouvé sur Open Beauty Facts pour «&nbsp;
            <span className="font-medium">{query.trim()}</span>&nbsp;».
          </p>
          <p className="mt-2 text-[13px] text-ink-muted">
            Tu peux lancer une recherche approfondie (web + INCIDecoder), ou
            coller directement la liste INCI.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runDeepSearch}
              disabled={deepSearching}
              className="rounded-xl bg-gradient-to-b from-rose-400 to-pink-400 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(251, 113, 133,0.55),inset_0_1px_0_0_rgba(255,255,255,0.30)] transition-all hover:from-rose-500 hover:to-pink-500 disabled:cursor-not-allowed disabled:from-rose-200 disabled:to-pink-200"
            >
              {deepSearching ? "Recherche…" : "Recherche approfondie"}
            </button>
            <button
              type="button"
              onClick={() => onFallbackToManual()}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-ink ring-1 ring-[#D1D5DB] shadow-sm transition-colors hover:bg-[#F9FAFB]"
            >
              Coller la liste INCI
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function ProductPlaceholderIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7 text-rose-400"
    >
      <path d="M9 2h6v3a2 2 0 0 0 .6 1.4L17 7.8A4 4 0 0 1 18 10.6V19a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-8.4a4 4 0 0 1 1-2.8l1.4-1.4A2 2 0 0 0 9 5z" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
  cache: { label: "BASE", cls: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
  openbeautyfacts: { label: "OBF", cls: "bg-amber-100 text-amber-700 ring-amber-200" },
  incidecoder: { label: "INCIDECODER", cls: "bg-violet-100 text-violet-700 ring-violet-200" },
};

function CandidateCard({
  candidate,
  onSelect,
  loading = false,
  disabled = false,
}: {
  candidate: OpenBeautyFactsCandidate;
  onSelect: (c: OpenBeautyFactsCandidate) => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const niceBrand = candidate.brand ? titleCase(candidate.brand) : null;
  const niceName = candidate.productName
    ? titleCase(candidate.productName)
    : null;
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = candidate.imageUrl && !imgFailed;
  const sourceMeta = candidate.source ? SOURCE_BADGE[candidate.source] : null;
  const needsLoad = candidate.source === "incidecoder" && !candidate.ingredientsText;
  return (
    <button
      type="button"
      onClick={() => onSelect(candidate)}
      disabled={loading || disabled}
      className={`group flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-[#E5E7EB] shadow-sm transition-all hover:ring-rose-300 hover:shadow-md disabled:cursor-not-allowed ${disabled && !loading ? "opacity-40" : ""}`}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/60 ring-1 ring-black/[0.04]">
        {loading ? (
          <svg className="h-5 w-5 animate-spin text-rose-500" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={candidate.imageUrl!}
            alt=""
            className="h-full w-full object-contain"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <ProductPlaceholderIcon />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {niceBrand ? (
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-pink-500/80">
              {niceBrand}
            </p>
          ) : null}
          {sourceMeta && (
            <span className={`shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[8.5px] font-semibold tracking-wide ring-1 ${sourceMeta.cls}`}>
              {sourceMeta.label}
            </span>
          )}
        </div>
        <p className="truncate text-[14px] font-medium text-ink">
          {niceName ?? "Produit sans nom"}
        </p>
        <p className="mt-0.5 text-[11px] text-ink-subtle">
          {loading
            ? "Chargement de la composition…"
            : needsLoad
              ? "Cliquer pour récupérer la composition →"
              : "Cliquer pour analyser →"}
        </p>
      </div>
    </button>
  );
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s\-/'])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
}

export function ProductHero({
  source,
  sourceUrl,
  brand,
  productName,
}: {
  source: string;
  sourceUrl: string | null;
  brand: string | null;
  productName: string | null;
}) {
  const sourceText = SOURCE_LABEL[source] ?? source;
  const niceBrand = brand ? titleCase(brand) : null;
  const niceProduct = productName ? titleCase(productName) : null;
  const headline = niceProduct ?? niceBrand ?? "Produit analysé";
  return (
    <header className="mb-6 rounded-3xl bg-white/65 p-5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl sm:p-7">
      {niceBrand && niceProduct ? (
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-pink-500/80">
          {niceBrand}
        </p>
      ) : null}
      <h1 className="mt-1 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {headline}
      </h1>
      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
        <CheckBadgeIcon className="h-4 w-4 text-pink-400" />
        <span>Composition trouvée via</span>
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-rose-500 underline underline-offset-2 hover:no-underline"
          >
            {sourceText}
          </a>
        ) : (
          <span className="font-medium text-rose-500">{sourceText}</span>
        )}
      </p>
    </header>
  );
}

function CheckBadgeIcon({ className }: { className?: string }) {
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
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}
