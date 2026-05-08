"use client";

import { useRef, useState } from "react";
import type { ProductSearchResult } from "@/lib/productSearch/types";

const SOURCE_LABEL: Record<string, string> = {
  cache: "cache",
  openbeautyfacts: "Open Beauty Facts",
  incidecoder: "INCIDecoder",
  "duckduckgo+mistral": "recherche web",
};

type Props = {
  /** Called with the ingredients text + source info when a product is found. */
  onFound: (input: {
    ingredientsText: string;
    brand: string | null;
    productName: string | null;
    source: string;
    sourceUrl: string | null;
  }) => void;
  /** Called when the user wants to switch to manual INCI input. */
  onFallbackToManual: (initialText?: string) => void;
};

export function ProductSearchInput({ onFound, onFallbackToManual }: Props) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const inFlightRef = useRef<AbortController | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 3) {
      setError("Tape au moins 3 caractères (marque + nom du produit).");
      return;
    }
    setError(null);
    setNotFound(false);
    setBusy(true);

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
        setNotFound(true);
        return;
      }
      onFound({
        ingredientsText: data.ingredientsText,
        brand: data.brand,
        productName: data.productName,
        source: data.source,
        sourceUrl: data.sourceUrl,
      });
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
      setError((err as Error).message ?? "Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

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
            if (notFound) setNotFound(false);
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

      <p className="mt-3 text-[13px] text-ink-subtle">
        On cherche la composition INCI sur Open Beauty Facts, INCIDecoder, puis le web.
      </p>

      {error ? (
        <p className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2 text-sm text-rose-700 ring-1 ring-rose-100">
          {error}
        </p>
      ) : null}

      {notFound ? (
        <div className="mt-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-4 text-left">
          <p className="text-sm font-medium text-amber-900">
            Produit non trouvé sur nos sources publiques.
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Tu peux coller toi-même la composition INCI imprimée au dos du
            produit pour lancer l&apos;analyse.
          </p>
          <button
            type="button"
            onClick={() => onFallbackToManual()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
          >
            Coller la composition manuellement
            <span aria-hidden>→</span>
          </button>
        </div>
      ) : null}
    </form>
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
  onClear,
}: {
  source: string;
  sourceUrl: string | null;
  brand: string | null;
  productName: string | null;
  onClear: () => void;
}) {
  const sourceText = SOURCE_LABEL[source] ?? source;
  const niceBrand = brand ? titleCase(brand) : null;
  const niceProduct = productName ? titleCase(productName) : null;
  const headline = niceProduct ?? niceBrand ?? "Produit analysé";
  return (
    <header
      data-pdf-hide
      className="mb-6 flex flex-wrap items-start justify-between gap-3 rounded-3xl bg-white/65 p-5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl sm:p-7"
    >
      <div className="min-w-0 flex-1">
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
      </div>
      <button
        type="button"
        onClick={onClear}
        className="shrink-0 rounded-full bg-white/80 px-3.5 py-1.5 text-[13px] font-medium text-ink ring-1 ring-black/[0.06] transition-colors hover:bg-white"
      >
        Nouvelle recherche
      </button>
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
