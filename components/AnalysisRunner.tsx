"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProcessingOverlay, randomProcessingTotal } from "./ProcessingOverlay";
import { AnalyseResultPanel } from "./AnalyseResultPanel";
import { PENDING_ADD_TO_ROUTINE_KEY } from "./routine/AddProductButton";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import { apiFetch } from "@/lib/clientApi";

const PENDING_SOURCE_KEY = "cw:pendingProductSource";
// Authoritative INCI handoff: callers (ScanSheet, PhotoOcrFlow, …) write the
// list to this key right before `router.push("/analyse?inci=…")`. Without
// this we relied solely on the URL searchParam, which Next.js can serve
// EMPTY when its router cache hits a prefetched `/analyse` shell. That's the
// bug where users hit "Décode → Analyser" and end up bounced back to the
// home page while the analyse silently lands in /history.
const PENDING_INCI_KEY = "cw:pendingInci";
// Stale-flag cutoff for the pending "add to routine" stamp. If the user clicks
// the routine button, cancels the ScanSheet, then analyses something else 30
// min later, we should NOT secretly add that analyse to their routine.
const PENDING_FLAG_TTL_MS = 30 * 60 * 1000;
// Last-completed analyse cache. Lets us re-hydrate the result panel if the
// component unmounts mid-flight (mobile swipe-back, accidental reload, or
// Next.js re-evaluating the server component with empty searchParams after
// we've stripped `?inci=` from the URL).
const RUN_CACHE_KEY = "cw:analyseRunnerCache";
const RUN_CACHE_TTL_MS = 10 * 60 * 1000;

type ProductSource = {
  source: string;
  sourceUrl: string | null;
  brand: string | null;
  productName: string | null;
  /** Optional product type ("crème hydratante", "sérum"…). Filled by the
   *  front-photo OCR; absent on barcode / product-search / paste flows. */
  productType?: string | null;
};

type CachedRun = {
  inci: string;
  text: string;
  result: AnalyseResponse;
  productSource: ProductSource | null;
  addedToRoutine: boolean;
  /** Persisted analyses row id (when the user was signed in at save time).
   *  Cached so a refresh / re-hydrate still lets "Analyser la promesse" PATCH
   *  the right row. */
  analysisId?: string | null;
  ts: number;
};

function readRunCache(): CachedRun | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RUN_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedRun;
    if (!data?.result || !data.inci) return null;
    if (Date.now() - data.ts > RUN_CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeRunCache(data: CachedRun) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(RUN_CACHE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function clearRunCache() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(RUN_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Dedicated analysis page client. Owns the analyse → result lifecycle on
 * `/analyse?inci=…` so the dashboard never bleeds underneath. Receives the
 * INCI text from the URL, picks up an optional product source written to
 * sessionStorage by the ScanSheet, calls /api/analyser, and renders the
 * result panel full-width.
 *
 * IMPORTANT - why we keep an `inciRef` instead of trusting `initialInci`:
 * the effect below strips `?inci=` from the URL via `replaceState` so that
 * a reload doesn't relaunch the analyse. If Next.js then re-evaluates the
 * server component for any reason (auth cookie refresh, middleware run,
 * partial re-render), the new `initialInci` prop comes back EMPTY - the URL
 * no longer carries the payload. Treating that empty value as authoritative
 * caused the dreaded "the loading screen closes and I have to open the
 * history to see my result" bug: we'd redirect to "/" or fall through to
 * `return null` mid-fetch, while the server-side save still succeeded.
 *
 * The fix: capture the INCI in `inciRef` on first render, and only update
 * it when a new non-empty value arrives (= a fresh analyse pushed onto the
 * same route). Empty incoming props are IGNORED - we keep working on the
 * frozen ref. As a second line of defence, we also write the completed
 * result to sessionStorage so an actual remount can restore it.
 */
/**
 * Resolve the INCI to analyse, in order of priority:
 *   1. `initialInci` prop from the URL searchParam (works on the happy path)
 *   2. `cw:pendingInci` in sessionStorage (set by the caller right before
 *      router.push - covers the case where Next.js served a prefetched
 *      `/analyse` shell with empty searchParams)
 * Removes the sessionStorage entry on read so a stale value can never leak
 * into the next mount.
 */
function bootInci(propInci: string): string {
  const fromProp = propInci.trim();
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(PENDING_INCI_KEY);
      if (stored) {
        sessionStorage.removeItem(PENDING_INCI_KEY);
        if (!fromProp) return stored.trim();
      }
    } catch {
      /* ignore */
    }
  }
  return fromProp;
}

export function AnalysisRunner({ initialInci }: { initialInci: string }) {
  const router = useRouter();
  const [result, setResult] = useState<AnalyseResponse | null>(null);
  const [originalText, setOriginalText] = useState("");
  const [productSource, setProductSource] = useState<ProductSource | null>(null);
  const [addedToRoutine, setAddedToRoutine] = useState(false);
  // Persisted Supabase row id returned by /api/analyser. Used by the
  // "Analyser la promesse" flow to PATCH the analyses row with the
  // marketing description once the user picks a candidate.
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef<AbortController | null>(null);

  // Frozen INCI for the currently-running analyse. useState lazy init runs
  // exactly once per mount: that's where we look the INCI up from the prop
  // and, failing that, from sessionStorage. After that, inciRef is the
  // single source of truth for which analyse this component is running.
  const [bootInciValue] = useState<string>(() => bootInci(initialInci));
  const inciRef = useRef<string>(bootInciValue);
  // Track which INCI we've already kicked off, so StrictMode double-effect
  // (or a redundant useEffect run from an empty-prop re-render) doesn't
  // launch the same analyse twice.
  const launchedForRef = useRef<string>("");

  // Lazy init: pick the overlay duration once, on mount. Refreshed when the
  // user re-triggers an analyse with a new `initialInci` (see effect below).
  // Using a ref means re-renders during the analyse don't restart the
  // step-by-step animation inside the overlay.
  const budgetRef = useRef<number>(randomProcessingTotal());

  useEffect(() => {
    const incoming = initialInci.trim();

    // A truly new analyse pushed onto /analyse (soft nav, e.g. "Décode" again
    // with a different list). Reset state and re-launch.
    if (incoming && incoming !== inciRef.current) {
      inciRef.current = incoming;
      launchedForRef.current = "";
      setResult(null);
      setError(null);
      setOriginalText("");
      setProductSource(null);
      setAddedToRoutine(false);
      budgetRef.current = randomProcessingTotal();
      clearRunCache();
    }

    const trimmed = inciRef.current;

    // No INCI at all (genuine empty mount). Try to restore the last result
    // from sessionStorage - covers the case where the component unmounted
    // mid-flight on the previous visit (mobile swipe-back, refresh) and we
    // managed to write the cache before being torn down. Falls back to "/".
    if (!trimmed) {
      const cached = readRunCache();
      if (cached) {
        inciRef.current = cached.inci;
        launchedForRef.current = cached.inci;
        setResult(cached.result);
        setOriginalText(cached.text);
        setProductSource(cached.productSource);
        setAddedToRoutine(cached.addedToRoutine);
        setAnalysisId(cached.analysisId ?? null);
        return;
      }
      router.replace("/");
      return;
    }

    // Already launched for this INCI (StrictMode double-effect, or this
    // useEffect re-fired because `initialInci` flipped to "" after the
    // replaceState below - see the "IMPORTANT" comment on the component).
    if (launchedForRef.current === trimmed) return;
    launchedForRef.current = trimmed;

    // Same INCI already analysed in this tab → re-hydrate from cache instead
    // of paying for a second /api/analyser round-trip (also covers F5
    // refresh on /analyse just after a successful run).
    const cached = readRunCache();
    if (cached && cached.inci === trimmed) {
      setResult(cached.result);
      setOriginalText(cached.text);
      setProductSource(cached.productSource);
      setAddedToRoutine(cached.addedToRoutine);
      return;
    }

    let pendingSrc: ProductSource | null = null;
    let pendingAddToRoutine = false;
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(PENDING_SOURCE_KEY);
        if (stored) {
          pendingSrc = JSON.parse(stored) as ProductSource;
          sessionStorage.removeItem(PENDING_SOURCE_KEY);
        }

        const stamp = sessionStorage.getItem(PENDING_ADD_TO_ROUTINE_KEY);
        if (stamp) {
          sessionStorage.removeItem(PENDING_ADD_TO_ROUTINE_KEY);
          const ts = Number(stamp);
          if (Number.isFinite(ts) && Date.now() - ts < PENDING_FLAG_TTL_MS) {
            pendingAddToRoutine = true;
          }
        }
      } catch {
        /* ignore */
      }
      // Strip the inci param so reload/back-nav doesn't relaunch the analyse.
      const url = new URL(window.location.href);
      url.searchParams.delete("inci");
      window.history.replaceState({}, "", url.pathname + (url.search || ""));
    }

    void runAnalyse(trimmed, pendingSrc, pendingAddToRoutine);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInci]);

  async function runAnalyse(text: string, src: ProductSource | null, addToRoutine: boolean) {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (inFlightRef.current) inFlightRef.current.abort();
    const ctrl = new AbortController();
    inFlightRef.current = ctrl;

    setError(null);
    const startedAt = Date.now();
    void budgetRef.current; // budget no longer enforces a minimum wait

    // Hard timeout so the overlay never hangs forever on a stalled fetch
    // (was the root cause of the "stuck on Génération de la synthèse" bug
    // — the old animation had a synthesis step but no abort, so when the
    // server was slow or the network dropped, the overlay never closed).
    let timedOut = false;
    const analyseTimeout = setTimeout(() => {
      timedOut = true;
      try { ctrl.abort(); } catch { /* noop */ }
    }, 10000);

    const productLabel = src
      ? [src.brand, src.productName].filter(Boolean).join(" ").trim() || undefined
      : undefined;
    const brand = src?.brand?.trim() || undefined;
    const productType = src?.productType?.trim() || undefined;

    try {
      const r = await apiFetch("/api/analyser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          // Initial scan returns FAST (≈300 ms — DB lookup + colour bucketing
          // only). The AI synthesis is fetched lazily by AnalyseResultPanel
          // when the user clicks "Voir l'analyse complète", so the EssentielView
          // appears instantly without waiting on the LLM round-trip.
          withSynthesis: false,
          ...(productLabel ? { productLabel } : {}),
          ...(brand ? { brand } : {}),
          ...(productType ? { productType } : {}),
          ...(addToRoutine ? { addToRoutine: true } : {}),
        }),
        signal: ctrl.signal,
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as {
          error?: string;
          credits?: { used?: number; limit?: number; remaining?: number };
        };
        // 429 with a credits payload = quota exhausted. apiFetch has already
        // dispatched `cosmecheck:credits-exhausted` so the global modal is
        // showing - kick the user back to "/" so they don't also see this
        // page's inline error stripe behind the modal.
        if (r.status === 429 && j?.credits) {
          router.replace("/");
          return;
        }
        setError(j?.error ?? `Erreur ${r.status}`);
        return;
      }
      const data = (await r.json()) as AnalyseResponse & {
        addedToRoutine?: boolean;
        analysisId?: string | null;
      };
      const addedFlag = data.addedToRoutine === true;
      if (addedFlag) setAddedToRoutine(true);
      const savedId = typeof data.analysisId === "string" ? data.analysisId : null;
      setAnalysisId(savedId);
      // No artificial wait — show the EssentielView the moment the fetch
      // returns. The overlay used to be padded so the user could read the
      // 5 fake steps, but the initial call is now rules-based + fast, so
      // padding it would just feel sluggish.
      void startedAt;
      setProductSource(src);
      setResult(data);
      setOriginalText(trimmed);
      // Persist BEFORE updating state would race a tear-down: even if the
      // component is already unmounted (state setters become no-ops), the
      // sessionStorage write still lands, so a later mount can re-hydrate
      // instead of leaving the user staring at a blank page.
      writeRunCache({
        inci: trimmed,
        text: trimmed,
        result: data,
        productSource: src,
        addedToRoutine: addedFlag,
        analysisId: savedId,
        ts: Date.now(),
      });
    } catch (err) {
      if ((err as DOMException).name === "AbortError") {
        if (timedOut) {
          setError("La connexion a expiré. Réessaye dans un instant.");
        }
        return;
      }
      setError((err as Error).message ?? "Erreur réseau");
    } finally {
      clearTimeout(analyseTimeout);
    }
  }

  function resetHome() {
    clearRunCache();
    setResult(null);
    setOriginalText("");
    setProductSource(null);
    router.push("/");
  }

  // Loading is derived: we asked for an analyse (inciRef has content) and
  // we have neither a result nor an error yet. We read from `inciRef` (frozen
  // at mount) NOT from `initialInci` (the prop), because the prop flips to
  // an empty string the moment Next.js re-evaluates the server component
  // after our replaceState - and we don't want that to flicker the overlay
  // off mid-fetch.
  const isLoading = Boolean(inciRef.current) && !result && !error;

  if (isLoading) {
    return (
      <ProcessingOverlay
        totalMs={budgetRef.current}
        headline="On décode la composition…"
      />
    );
  }

  if (error) {
    // Known "user input doesn't look like a real INCI list" errors get a
    // friendly modal-style screen instead of a red one-liner. Generic 500-class
    // errors keep the technical message so the user can report it.
    const isNoInciError =
      /trop court/i.test(error)
      || /non reconnu/i.test(error)
      || /Aucun ingrédient détecté/i.test(error)
      || /pas une liste INCI/i.test(error)
      || /ne ressemble pas/i.test(error);
    return (
      <main className="mx-auto max-w-md px-5 py-10 text-center">
        <div className="flex items-center justify-center mb-4">
          <span aria-hidden className="grid place-items-center h-16 w-16 rounded-full bg-rose-50 text-3xl ring-1 ring-rose-100">
            {isNoInciError ? "🔎" : "⚠️"}
          </span>
        </div>
        <h1 className="text-[18px] font-semibold text-ink mb-2">
          {isNoInciError ? "Pas de liste d'ingrédients exploitable" : "L'analyse a échoué"}
        </h1>
        <p className="text-[13.5px] text-[#6B7280] leading-relaxed mb-6">
          {isNoInciError
            ? "Le texte fourni ne contient pas assez d'ingrédients reconnaissables pour lancer une analyse. C'est peut-être un produit sans liste INCI visible, ou le texte est incomplet."
            : error}
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => router.push("/?mode=paste")}
            className="w-full rounded-xl bg-ink text-white text-sm font-semibold py-3 hover:brightness-110 transition"
          >
            Saisir la liste à la main
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full rounded-xl bg-white/80 ring-1 ring-black/[0.06] text-ink text-sm font-medium py-3 hover:bg-white transition"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </main>
    );
  }

  if (!result) return null;

  const productLabel = productSource
    ? [productSource.brand, productSource.productName].filter(Boolean).join(" ").trim() || null
    : null;

  return (
    <main className="w-full px-3 lg:px-6 pt-4 pb-16">
      {addedToRoutine && (
        <div className="mx-auto max-w-6xl mb-4 flex items-center gap-3 rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 px-4 py-3 text-[13px] text-emerald-800">
          <span aria-hidden className="text-base">✓</span>
          <span className="flex-1">
            Produit ajouté à ta routine - il pèse maintenant dans ton exposition cumulée.
          </span>
          <Link
            href="/routine"
            className="shrink-0 rounded-full bg-emerald-600 text-white px-3 py-1.5 text-[12px] font-semibold hover:bg-emerald-700 transition"
          >
            Voir ma routine →
          </Link>
        </div>
      )}
      <div id="analyse-root">
        <AnalyseResultPanel
          result={result}
          originalText={originalText}
          productLabel={productLabel}
          productSource={productSource ? {
            source: productSource.source,
            sourceUrl: productSource.sourceUrl,
            brand: productSource.brand,
          } : null}
          analysisId={analysisId}
          alreadyInRoutine={addedToRoutine}
          brand={productSource?.brand ?? null}
          productType={productSource?.productType ?? null}
          onResetHome={resetHome}
        />
      </div>
    </main>
  );
}
