"use client";

import { useEffect, useRef, useState } from "react";
import { SearchBar } from "./SearchBar";
import { ProcessingOverlay, randomProcessingTotal } from "./ProcessingOverlay";
import { AnalyseResultPanel } from "./AnalyseResultPanel";
import {
  ProductSearchInput,
  ProductHero,
} from "./ProductSearchInput";
import type { AnalyseResponse } from "@/lib/analyseTypes";

const STORAGE_KEY = "cw:lastAnalysis";
const CACHE_VERSION = 3;

type Mode = "inci" | "product";

type ProductSource = {
  source: string;
  sourceUrl: string | null;
  brand: string | null;
  productName: string | null;
};

type Cached = {
  v: number;
  text: string;
  result: AnalyseResponse;
  ts: number;
  productSource?: ProductSource | null;
};

function readCache(): Cached | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Cached;
    if (!data || data.v !== CACHE_VERSION || !data.result) return null;
    return data;
  } catch {
    return null;
  }
}
function writeCache(
  text: string,
  result: AnalyseResponse,
  productSource: ProductSource | null,
) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        v: CACHE_VERSION,
        text,
        result,
        ts: Date.now(),
        productSource,
      } satisfies Cached),
    );
  } catch {
    /* ignore */
  }
}
function clearCache() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function HomeShell({ initialInci = "" }: { initialInci?: string }) {
  const [mode, setMode] = useState<Mode>("inci");
  const [result, setResult] = useState<AnalyseResponse | null>(null);
  const [originalText, setOriginalText] = useState("");
  const [productSource, setProductSource] = useState<ProductSource | null>(
    null,
  );
  const [processing, setProcessing] = useState<{ active: boolean; budget: number }>({
    active: false,
    budget: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const inFlightRef = useRef<AbortController | null>(null);
  const pendingProductSourceRef = useRef<ProductSource | null>(null);

  // Restore from sessionStorage on mount (e.g., after navigating to a fiche and
  // back). If an `?inci=` param is present, prefer it — but reuse the cached
  // result when the text matches, to avoid relaunching the same analysis.
  useEffect(() => {
    const trimmed = initialInci.trim();
    const cached = readCache();
    if (trimmed) {
      // Strip the param from the URL so reloads / back-nav don't re-trigger.
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("inci");
        window.history.replaceState({}, "", url.pathname + (url.search || ""));
      }
      if (cached && cached.text.trim() === trimmed) {
        setResult(cached.result);
        setOriginalText(cached.text);
        setProductSource(cached.productSource ?? null);
        setHydrated(true);
        return;
      }
      setHydrated(true);
      void runAnalyse(trimmed);
      return;
    }
    if (cached) {
      setResult(cached.result);
      setOriginalText(cached.text);
      setProductSource(cached.productSource ?? null);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runAnalyse(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (inFlightRef.current) inFlightRef.current.abort();
    const ctrl = new AbortController();
    inFlightRef.current = ctrl;

    // Consume the pending product source synchronously : whatever happens
    // next (success, network error, abort), this call owns it exactly once.
    const src = pendingProductSourceRef.current;
    pendingProductSourceRef.current = null;

    const budget = randomProcessingTotal();
    setProcessing({ active: true, budget });
    setError(null);
    const startedAt = Date.now();

    const productLabel = src
      ? [src.brand, src.productName].filter(Boolean).join(" ").trim() || undefined
      : undefined;

    try {
      const r = await fetch("/api/analyser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          withSynthesis: true,
          ...(productLabel ? { productLabel } : {}),
        }),
        signal: ctrl.signal,
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j?.error ?? `Erreur ${r.status}`);
        setProcessing({ active: false, budget: 0 });
        return;
      }
      const data = (await r.json()) as AnalyseResponse;
      const elapsed = Date.now() - startedAt;
      if (elapsed < budget) {
        await new Promise((res) => setTimeout(res, budget - elapsed));
      }
      setProductSource(src);
      setResult(data);
      setOriginalText(trimmed);
      writeCache(trimmed, data, src);
    } catch (err) {
      if ((err as DOMException).name === "AbortError") return;
      setError((err as Error).message ?? "Erreur réseau");
    } finally {
      setProcessing({ active: false, budget: 0 });
      requestAnimationFrame(() => {
        const el = document.getElementById("analyse-results");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function reset() {
    clearCache();
    setResult(null);
    setOriginalText("");
    setProductSource(null);
    setError(null);
  }

  function handleProductFound(input: {
    ingredientsText: string;
    brand: string | null;
    productName: string | null;
    source: string;
    sourceUrl: string | null;
  }) {
    pendingProductSourceRef.current = {
      source: input.source,
      sourceUrl: input.sourceUrl,
      brand: input.brand,
      productName: input.productName,
    };
    void runAnalyse(input.ingredientsText);
  }

  function handleFallbackToManual() {
    setMode("inci");
    setError(null);
  }

  // Avoid SSR/CSR mismatch flash : wait for hydration before deciding what to show.
  if (!hydrated) {
    return null;
  }

  if (result) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16">
        {productSource ? (
          <ProductHero
            source={productSource.source}
            sourceUrl={productSource.sourceUrl}
            brand={productSource.brand}
            productName={productSource.productName}
            onClear={reset}
          />
        ) : null}
        <AnalyseResultPanel
          result={result}
          originalText={originalText}
          onReset={reset}
        />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      {processing.active ? (
        <ProcessingOverlay
          totalMs={processing.budget}
          headline="On décode la composition…"
        />
      ) : null}

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-12 text-center sm:py-16">
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Décrypte tes cosmétiques
          <br className="hidden sm:block" /> en{" "}
          <span className="relative inline-block whitespace-nowrap">
            3 secondes.
            <svg
              aria-hidden
              viewBox="0 0 200 14"
              preserveAspectRatio="none"
              className="pointer-events-none absolute -bottom-2 left-0 h-2.5 w-full text-rose-500 sm:-bottom-3 sm:h-3"
            >
              <path
                d="M3,10 Q60,1 100,5 T197,10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                className="hero-underline"
              />
            </svg>
          </span>
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
          {mode === "inci" ? (
            <>
              Colle la liste INCI d&apos;un produit.
              <br className="hidden sm:block" />
              On te montre en couleurs ce qu&apos;elle cache.
            </>
          ) : (
            <>
              Tape le nom d&apos;un produit.
              <br className="hidden sm:block" />
              On retrouve sa composition et on lui calcule sa note sur 20.
            </>
          )}
        </p>

        <div className="mt-10 w-full">
          <ModeToggle mode={mode} onChange={setMode} />

          {mode === "inci" ? (
            <>
              <div className="mt-5">
                <SearchBar autoFocus size="lg" onAnalyseList={runAnalyse} />
              </div>
              <p className="mt-3 text-[13px] text-ink-subtle">
                Tape un ingrédient pour sa fiche, ou colle une liste pour
                l&apos;analyser.
              </p>
            </>
          ) : (
            <div className="mt-5">
              <ProductSearchInput
                onFound={handleProductFound}
                onFallbackToManual={handleFallbackToManual}
              />
            </div>
          )}
        </div>

        {error ? (
          <p className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2 text-sm text-rose-700 ring-1 ring-rose-100">
            {error}
          </p>
        ) : null}

        <Legend />
      </section>
    </main>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  const tabs: { key: Mode; label: string; labelShort: string }[] = [
    {
      key: "inci",
      label: "Coller une liste INCI",
      labelShort: "Liste INCI",
    },
    {
      key: "product",
      label: "Tape un nom de produit",
      labelShort: "Nom de produit",
    },
  ];
  return (
    <div
      className="
        relative mx-auto flex w-full max-w-xl items-stretch gap-1
        rounded-2xl bg-white/35 p-1
        ring-1 ring-white/60
        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),inset_0_-1px_0_0_rgba(15,23,42,0.04),0_10px_30px_-12px_rgba(15,23,42,0.18)]
        backdrop-blur-2xl backdrop-saturate-150
        sm:gap-1.5 sm:rounded-full sm:p-1.5
      "
    >
      {/* Top specular sheen of the whole capsule */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-px h-1/3 rounded-2xl bg-gradient-to-b from-white/55 to-transparent blur-[1px] sm:rounded-full"
      />
      {tabs.map((t) => {
        const active = mode === t.key;
        const pressed = (active ? "true" : "false") as "true" | "false";
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            aria-pressed={pressed}
            className={`
              group relative flex flex-1 flex-col items-center justify-center
              rounded-xl px-2.5 py-1.5 leading-tight
              transition-all duration-300 ease-out
              sm:gap-0.5 sm:rounded-full sm:px-4 sm:py-2.5
              ${
                active
                  ? "bg-gradient-to-b from-white to-white/85 text-ink shadow-[0_4px_14px_-4px_rgba(15,23,42,0.18),inset_0_1px_0_0_rgba(255,255,255,0.85),inset_0_-1px_0_0_rgba(15,23,42,0.06)] ring-1 ring-black/[0.08]"
                  : "text-ink-muted hover:bg-white/45 hover:text-ink hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]"
              }
            `}
          >
            {/* Specular highlight on the active tab: bright crescent at the top */}
            {active ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-3 top-[3px] h-1/3 rounded-lg bg-gradient-to-b from-white/65 via-white/20 to-transparent sm:rounded-full"
              />
            ) : null}
            <span className="relative whitespace-nowrap text-[12px] font-semibold tracking-tight sm:text-sm">
              <span className="sm:hidden">{t.labelShort}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Legend() {
  const items = [
    { color: "bg-emerald-500", label: "Vert", sub: "Sans risque connu" },
    { color: "bg-amber-400", label: "Jaune", sub: "Pénalité légère" },
    { color: "bg-orange-500", label: "Orange", sub: "Pénalité moyenne" },
    { color: "bg-rose-500", label: "Rouge", sub: "Pénalité forte" },
  ];
  return (
    <div className="mt-10 grid w-full grid-cols-4 gap-x-2 gap-y-1 sm:gap-x-12">
      {items.map((i) => (
        <div key={i.label} className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${i.color} sm:h-2.5 sm:w-2.5`} aria-hidden />
            <span className="text-[12px] font-medium text-ink sm:text-sm">{i.label}</span>
          </div>
          <span className="mt-0.5 text-[10px] leading-tight text-ink-subtle sm:text-[12px]">
            {i.sub}
          </span>
        </div>
      ))}
    </div>
  );
}

