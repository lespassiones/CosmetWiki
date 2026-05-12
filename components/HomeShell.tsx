"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SearchBar } from "./SearchBar";
import { ProcessingOverlay, randomProcessingTotal } from "./ProcessingOverlay";
import { AnalyseResultPanel } from "./AnalyseResultPanel";
import { ProductSearchInput } from "./ProductSearchInput";
import { BarcodeScannerInput } from "./BarcodeScannerInput";
import { PENDING_ADD_TO_ROUTINE_KEY } from "./routine/AddProductButton";
import type { AnalyseResponse } from "@/lib/analyseTypes";

const STORAGE_KEY = "cw:lastAnalysis";
const CACHE_VERSION = 3;
const PENDING_FLAG_TTL_MS = 30 * 60 * 1000;

type Mode = "inci" | "product" | "barcode";

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

const PENDING_SOURCE_KEY = "cw:pendingProductSource";

export function HomeShell({
  initialInci = "",
  initialMode,
  signedIn = true,
}: {
  initialInci?: string;
  initialMode?: Mode;
  signedIn?: boolean;
}) {
  const [mode, setMode] = useState<Mode>(initialMode ?? "inci");
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

    // ScanSheet → product / barcode flow writes the brand+name to session
    // storage right before navigating to /?inci=… so we can render the
    // ProductHero on top of the result. Consume it once.
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(PENDING_SOURCE_KEY);
        if (stored) {
          pendingProductSourceRef.current = JSON.parse(stored) as ProductSource;
          sessionStorage.removeItem(PENDING_SOURCE_KEY);
        }
      } catch {
        /* ignore */
      }
    }

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
    // For signed-in users, never auto-restore a cached result on / — the
    // analysis lives on /analyse now, and showing a ghost result under the
    // dashboard was confusing. Guests still get back-nav cache restoration
    // for the public landing flow.
    if (!signedIn && cached) {
      setResult(cached.result);
      setOriginalText(cached.text);
      setProductSource(cached.productSource ?? null);
    }
    setHydrated(true);
    // We depend on `initialInci` so that staying on `/` while the search-param
    // changes (legacy /?inci= flow) re-triggers analysis. Without this dep
    // the effect runs only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInci]);

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

    // Consume the "add to routine" flag (set by /routine's "+ Ajouter un
    // produit" button) eagerly so a refresh or duplicate trigger can't replay it.
    let addToRoutine = false;
    if (typeof window !== "undefined") {
      try {
        const stamp = sessionStorage.getItem(PENDING_ADD_TO_ROUTINE_KEY);
        sessionStorage.removeItem(PENDING_ADD_TO_ROUTINE_KEY);
        if (stamp) {
          const ts = Number(stamp);
          if (Number.isFinite(ts) && Date.now() - ts < PENDING_FLAG_TTL_MS) {
            addToRoutine = true;
          }
        }
      } catch {
        /* ignore */
      }
    }

    try {
      const r = await fetch("/api/analyser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          withSynthesis: true,
          ...(productLabel ? { productLabel } : {}),
          ...(addToRoutine ? { addToRoutine: true } : {}),
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
        // When the analysis came from a product search, scroll all the way
        // up so the ProductHero (the big product title) is the first thing
        // visible. Otherwise land on the analyse panel.
        if (src) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          const el = document.getElementById("analyse-results");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  }

  function clearResultState() {
    clearCache();
    setResult(null);
    setOriginalText("");
    setProductSource(null);
    setError(null);
  }

  // When a result is on screen, push a history entry so the browser/Android
  // back gesture returns to the search view instead of closing the tab/PWA.
  // popstate clears the result state — clicking "Nouvelle analyse" calls
  // history.back() to keep the stack tidy.
  useEffect(() => {
    if (!result || typeof window === "undefined") return;
    window.history.pushState({ cwResult: true }, "");
    const onPop = () => clearResultState();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [result]);

  function reset() {
    if (
      typeof window !== "undefined" &&
      (window.history.state as { cwResult?: boolean } | null)?.cwResult
    ) {
      // popstate listener will clear the result state.
      window.history.back();
      return;
    }
    clearResultState();
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

  // Signed-in users never see the hero/search section — they have the
  // ScanSheet (sidebar / mobile FAB) to pick a flow, and the inputs render
  // inline inside that modal. HomeShell stays mounted only to handle the
  // ?inci= → analyse → result handoff: show the fixed-position overlay while
  // processing, then the result panel.
  if (signedIn) {
    if (result) return renderResult();
    if (processing.active) {
      return (
        <ProcessingOverlay
          totalMs={processing.budget}
          headline="On décode la composition…"
        />
      );
    }
    return null;
  }

  if (result) return renderResult();

  function renderResult() {
    // Build a single human-readable label from the product source (brand +
    // product name), falling back to the panel's own "Analyse de votre liste"
    // when nothing was found.
    const productLabel = productSource
      ? [productSource.brand, productSource.productName].filter(Boolean).join(" ").trim() || null
      : null;
    return (
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 lg:px-8">
        <div id="pdf-root" className="mt-4">
          {result ? (
            <AnalyseResultPanel
              result={result}
              originalText={originalText}
              productLabel={productLabel}
              productSource={productSource ? {
                source: productSource.source,
                sourceUrl: productSource.sourceUrl,
                brand: productSource.brand,
              } : null}
              onResetHome={reset}
            />
          ) : null}
        </div>
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
          ) : mode === "product" ? (
            <>
              Tape le nom d&apos;un produit.
              <br className="hidden sm:block" />
              On retrouve sa composition et on lui calcule sa note sur 20.
            </>
          ) : (
            <>
              Scanne le code-barres du produit.
              <br className="hidden sm:block" />
              On récupère sa composition et on calcule sa note sur 20.
            </>
          )}
        </p>

        <div className="mt-10 w-full">
          <ModeToggle mode={mode} onChange={setMode} />

          {mode === "inci" ? (
            <>
              <div className="mt-5">
                <AuthGate signedIn={signedIn}>
                  <SearchBar autoFocus={signedIn} size="lg" onAnalyseList={runAnalyse} />
                </AuthGate>
              </div>
              <p className="mt-3 text-[13px] text-ink-subtle">
                Tape un ingrédient pour sa fiche, ou colle une liste pour
                l&apos;analyser.
              </p>
            </>
          ) : mode === "product" ? (
            <div className="mt-5">
              <AuthGate signedIn={signedIn}>
                <ProductSearchInput
                  onFound={handleProductFound}
                  onFallbackToManual={handleFallbackToManual}
                />
              </AuthGate>
            </div>
          ) : (
            <div className="mt-5">
              <AuthGate signedIn={signedIn}>
                <BarcodeScannerInput
                  onFound={handleProductFound}
                  onFallbackToManual={() => setMode("inci")}
                  onFallbackToProductSearch={() => setMode("product")}
                />
              </AuthGate>
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

function AuthGate({
  signedIn,
  children,
}: {
  signedIn: boolean;
  children: React.ReactNode;
}) {
  if (signedIn) return <>{children}</>;
  // Block all interaction with the inner input — every click anywhere on top
  // of it bubbles up to the overlay link, which sends the user to sign-in
  // with ?next pointing back to the home page so they land back here after
  // authenticating.
  const href = `/auth/sign-in?next=${encodeURIComponent("/")}`;
  return (
    <div className="relative">
      <div aria-hidden tabIndex={-1} className="pointer-events-none select-none">
        {children}
      </div>
      <Link
        href={href}
        aria-label="Connecte-toi pour analyser un produit"
        className="absolute inset-0 z-20 rounded-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60"
      />
    </div>
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
    {
      key: "barcode",
      label: "Scanner le code-barres",
      labelShort: "Scanner",
    },
  ];
  const activeIdx = Math.max(
    0,
    tabs.findIndex((t) => t.key === mode),
  );

  // Sliding pill that follows the active tab. We measure the active button
  // every time the active tab or the container size changes — that handles
  // both user clicks and breakpoint changes (labels on mobile vs desktop
  // produce different button widths).
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(
    null,
  );
  const [animated, setAnimated] = useState(false);

  useLayoutEffect(() => {
    function measure() {
      const btn = buttonsRef.current[activeIdx];
      if (!btn) return;
      setPill({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
    measure();
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver(measure);
    ro.observe(c);
    return () => ro.disconnect();
  }, [activeIdx]);

  // Enable the slide transition only after the first measurement is painted,
  // so the pill doesn't visibly snap from (0, 0) to its initial position.
  useEffect(() => {
    if (!pill || animated) return;
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, [pill, animated]);

  return (
    <div
      ref={containerRef}
      className="
        relative mx-auto flex w-full max-w-xl items-stretch
        rounded-2xl bg-white/35 p-1
        ring-1 ring-white/60
        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),inset_0_-1px_0_0_rgba(15,23,42,0.04),0_10px_30px_-12px_rgba(15,23,42,0.18)]
        backdrop-blur-2xl backdrop-saturate-150
        sm:rounded-full sm:p-1.5
      "
    >
      {/* Top specular sheen of the whole capsule */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-px h-1/3 rounded-2xl bg-gradient-to-b from-white/55 to-transparent blur-[1px] sm:rounded-full"
      />
      {/* Sliding pill (active background). Lives behind the buttons. */}
      {pill ? (
        <span
          aria-hidden
          className={`
            pointer-events-none absolute top-1 bottom-1
            rounded-xl bg-gradient-to-b from-white to-white/85
            ring-1 ring-black/[0.08]
            shadow-[0_4px_14px_-4px_rgba(15,23,42,0.18),inset_0_1px_0_0_rgba(255,255,255,0.85),inset_0_-1px_0_0_rgba(15,23,42,0.06)]
            sm:top-1.5 sm:bottom-1.5 sm:rounded-full
            ${animated ? "transition-[transform,width] duration-300 ease-out" : ""}
          `}
          style={{
            transform: `translateX(${pill.left}px)`,
            width: `${pill.width}px`,
            left: 0,
          }}
        >
          {/* Specular crescent on the pill */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-3 top-[3px] h-1/3 rounded-lg bg-gradient-to-b from-white/65 via-white/20 to-transparent sm:rounded-full"
          />
        </span>
      ) : null}
      {tabs.map((t, i) => {
        const active = mode === t.key;
        return (
          <button
            key={t.key}
            ref={(el) => {
              buttonsRef.current[i] = el;
            }}
            type="button"
            onClick={() => onChange(t.key)}
            aria-pressed={active ? "true" : "false"}
            className={`
              group relative z-10 flex flex-1 items-center justify-center
              rounded-xl px-2 py-1.5 leading-tight
              transition-colors duration-200 ease-out
              sm:rounded-full sm:px-3 sm:py-2.5
              ${active ? "text-ink" : "text-ink-muted hover:text-ink"}
            `}
          >
            <span className="whitespace-nowrap text-[12px] font-semibold tracking-tight sm:text-sm">
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

