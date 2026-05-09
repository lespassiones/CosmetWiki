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
      const r = await fetch("/api/product-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, page: 1 }),
        signal: ctrl.signal,
      });
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
      const r = await fetch("/api/product-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), page: nextPage }),
        signal: ctrl.signal,
      });
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

  function selectCandidate(c: OpenBeautyFactsCandidate) {
    onFound({
      ingredientsText: c.ingredientsText,
      brand: c.brand,
      productName: c.productName,
      source: "openbeautyfacts",
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
      // Show the result as a candidate card — never auto-analyse.
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
      <div className="flex w-full items-center gap-2 rounded-2xl bg-white/80 p-1.5 shadow-[0_2px_24px_-6px_rgba(15,23,42,0.06)] ring-1 ring-white/70 backdrop-blur-xl focus-within:ring-black/[0.18]">
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
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base text-ink placeholder:text-ink-subtle focus:outline-none"
          disabled={busy}
          maxLength={200}
        />
        <button
          type="submit"
          disabled={busy || query.trim().length < 3}
          className="shrink-0 rounded-xl bg-gradient-to-b from-rose-400 to-pink-400 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(251, 113, 133,0.55),inset_0_1px_0_0_rgba(255,255,255,0.30)] transition-all hover:from-rose-500 hover:to-pink-500 disabled:cursor-not-allowed disabled:from-rose-200 disabled:to-pink-200 disabled:shadow-none"
        >
          {busy ? "Recherche…" : "Rechercher"}
        </button>
      </div>

      {!searched ? (
        <p className="mt-3 text-[13px] text-ink-subtle">
          Tape la marque, le nom du produit, ou les deux. Ex&nbsp;: «&nbsp;baume L&apos;Oréal&nbsp;» ou «&nbsp;Effaclar Duo+&nbsp;».
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-[13px] text-rose-600">{error}</p>
      ) : null}

      {searched && candidates.length > 0 ? (
        <div className="mt-5">
          <p className="mb-3 text-[13px] text-ink-muted">
            Plusieurs produits correspondent. Choisis le tien&nbsp;:
          </p>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {candidates.map((c) => (
              <li key={c.id}>
                <CandidateCard candidate={c} onSelect={selectCandidate} />
              </li>
            ))}
          </ul>

          {hasMore ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-full bg-white/80 px-4 py-2 text-[13px] font-medium text-ink ring-1 ring-black/[0.06] transition-colors hover:bg-white disabled:opacity-60"
              >
                {loadingMore ? "Chargement…" : "Voir plus de produits"}
              </button>
            </div>
          ) : null}

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
        <div className="mt-5 rounded-2xl bg-white/65 p-5 ring-1 ring-white/70">
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
            className="group flex w-full items-center gap-3 rounded-2xl bg-white/75 p-3 text-left ring-1 ring-white/70 shadow-[0_2px_18px_-8px_rgba(15,23,42,0.10)] backdrop-blur-xl transition-all hover:bg-white hover:ring-black/[0.10] hover:shadow-[0_6px_22px_-8px_rgba(15,23,42,0.16)]"
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
        <div className="mt-5 rounded-2xl bg-white/65 p-5 ring-1 ring-white/70">
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
              className="rounded-xl bg-white/80 px-4 py-2 text-sm font-medium text-ink ring-1 ring-black/[0.06] transition-colors hover:bg-white"
            >
              Coller la liste INCI
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function CandidateCard({
  candidate,
  onSelect,
}: {
  candidate: OpenBeautyFactsCandidate;
  onSelect: (c: OpenBeautyFactsCandidate) => void;
}) {
  const niceBrand = candidate.brand ? titleCase(candidate.brand) : null;
  const niceName = candidate.productName
    ? titleCase(candidate.productName)
    : null;
  return (
    <button
      type="button"
      onClick={() => onSelect(candidate)}
      className="group flex w-full items-center gap-3 rounded-2xl bg-white/75 p-3 text-left ring-1 ring-white/70 shadow-[0_2px_18px_-8px_rgba(15,23,42,0.10)] backdrop-blur-xl transition-all hover:bg-white hover:ring-black/[0.10] hover:shadow-[0_6px_22px_-8px_rgba(15,23,42,0.16)]"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-rose-50/70 ring-1 ring-black/[0.04]">
        {candidate.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={candidate.imageUrl}
            alt=""
            className="h-full w-full object-contain"
            loading="lazy"
          />
        ) : (
          <span className="text-xs font-medium text-rose-400">INCI</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {niceBrand ? (
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-pink-500/80">
            {niceBrand}
          </p>
        ) : null}
        <p className="truncate text-[14px] font-medium text-ink">
          {niceName ?? "Produit sans nom"}
        </p>
        <p className="mt-0.5 text-[11px] text-ink-subtle">
          Cliquer pour analyser →
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
