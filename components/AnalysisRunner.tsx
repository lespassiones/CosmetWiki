"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProcessingOverlay, randomProcessingTotal } from "./ProcessingOverlay";
import { AnalyseResultPanel } from "./AnalyseResultPanel";
import { PENDING_ADD_TO_ROUTINE_KEY } from "./routine/AddProductButton";
import type { AnalyseResponse } from "@/lib/analyseTypes";

const PENDING_SOURCE_KEY = "cw:pendingProductSource";
// Stale-flag cutoff for the pending "add to routine" stamp. If the user clicks
// the routine button, cancels the ScanSheet, then analyses something else 30
// min later, we should NOT secretly add that analyse to their routine.
const PENDING_FLAG_TTL_MS = 30 * 60 * 1000;

type ProductSource = {
  source: string;
  sourceUrl: string | null;
  brand: string | null;
  productName: string | null;
};

/**
 * Dedicated analysis page client. Owns the analyse → result lifecycle on
 * `/analyse?inci=…` so the dashboard never bleeds underneath. Receives the
 * INCI text from the URL, picks up an optional product source written to
 * sessionStorage by the ScanSheet, calls /api/analyser, and renders the
 * result panel full-width.
 *
 * Loading is a DERIVED state, not a boolean we toggle late inside an effect.
 * On the first render — before the effect even fires — we already know we
 * have `initialInci` and no result, so we render the ProcessingOverlay
 * immediately. Without this, the user saw a blank page for a frame between
 * mount and the effect kicking the fetch off.
 */
export function AnalysisRunner({ initialInci }: { initialInci: string }) {
  const router = useRouter();
  const [result, setResult] = useState<AnalyseResponse | null>(null);
  const [originalText, setOriginalText] = useState("");
  const [productSource, setProductSource] = useState<ProductSource | null>(null);
  const [addedToRoutine, setAddedToRoutine] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef<AbortController | null>(null);

  // Lazy init: pick the overlay duration once, on mount. Refreshed when the
  // user re-triggers an analyse with a new `initialInci` (see effect below).
  // Using a ref means re-renders during the analyse don't restart the
  // step-by-step animation inside the overlay.
  const budgetRef = useRef<number>(randomProcessingTotal());

  useEffect(() => {
    const trimmed = initialInci.trim();
    if (!trimmed) {
      // Landed on /analyse with no payload — bounce back home.
      router.replace("/");
      return;
    }

    // Reset state when a NEW analyse is triggered (e.g. user came back and
    // navigated to /analyse?inci=B while a previous /analyse?inci=A result
    // was still in state). Without this we'd keep showing the old result.
    setResult(null);
    setError(null);
    setOriginalText("");
    setProductSource(null);
    setAddedToRoutine(false);
    budgetRef.current = randomProcessingTotal();

    // Pick up the product source (brand + name + attribution link) written
    // by the ScanSheet "Rechercher un produit" / "Code-barres" flows. Also
    // pick up the "add to routine" flag set by /routine's "+ Ajouter un
    // produit" button. We consume them HERE (in useEffect) rather than inside
    // runAnalyse, because React strict-mode / Next.js fast refresh runs the
    // effect twice — the second pass would otherwise see an empty storage and
    // silently drop the flag. By the time runAnalyse fires we already have
    // the values in local vars.
    let src: ProductSource | null = null;
    let addToRoutine = false;
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(PENDING_SOURCE_KEY);
        if (stored) {
          src = JSON.parse(stored) as ProductSource;
          sessionStorage.removeItem(PENDING_SOURCE_KEY);
        }
        const stamp = sessionStorage.getItem(PENDING_ADD_TO_ROUTINE_KEY);
        if (stamp) {
          sessionStorage.removeItem(PENDING_ADD_TO_ROUTINE_KEY);
          const ts = Number(stamp);
          if (Number.isFinite(ts) && Date.now() - ts < PENDING_FLAG_TTL_MS) {
            addToRoutine = true;
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

    void runAnalyse(trimmed, src, addToRoutine);
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
    const budget = budgetRef.current;

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
          ...(addToRoutine ? { addToRoutine: true } : {}),
        }),
        signal: ctrl.signal,
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j?.error ?? `Erreur ${r.status}`);
        return;
      }
      const data = (await r.json()) as AnalyseResponse & { addedToRoutine?: boolean };
      if (data.addedToRoutine) setAddedToRoutine(true);
      const elapsed = Date.now() - startedAt;
      // Always honour the minimum animation budget so the user has time to
      // read the "On décode la composition…" steps. The fetch itself is
      // usually too fast for the eye otherwise.
      if (elapsed < budget) {
        await new Promise((res) => setTimeout(res, budget - elapsed));
      }
      setProductSource(src);
      setResult(data);
      setOriginalText(trimmed);
    } catch (err) {
      if ((err as DOMException).name === "AbortError") return;
      setError((err as Error).message ?? "Erreur réseau");
    }
  }

  function resetHome() {
    setResult(null);
    setOriginalText("");
    setProductSource(null);
    router.push("/");
  }

  // Loading is derived: we asked for an analyse (initialInci has content) and
  // we have neither a result nor an error yet. This is true on the very first
  // render — before useEffect runs — so the overlay shows without a blank frame.
  const isLoading = Boolean(initialInci.trim()) && !result && !error;

  if (isLoading) {
    return (
      <ProcessingOverlay
        totalMs={budgetRef.current}
        headline="On décode la composition…"
      />
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-rose-700 font-semibold">{error}</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-4 text-rose-700 hover:underline"
        >
          ← Retour à l&apos;accueil
        </button>
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
            Produit ajouté à ta routine — il pèse maintenant dans ton exposition cumulée.
          </span>
          <Link
            href="/routine"
            className="shrink-0 rounded-full bg-emerald-600 text-white px-3 py-1.5 text-[12px] font-semibold hover:bg-emerald-700 transition"
          >
            Voir ma routine →
          </Link>
        </div>
      )}
      <div id="pdf-root">
        <AnalyseResultPanel
          result={result}
          originalText={originalText}
          productLabel={productLabel}
          productSource={productSource ? {
            source: productSource.source,
            sourceUrl: productSource.sourceUrl,
            brand: productSource.brand,
          } : null}
          onResetHome={resetHome}
        />
      </div>
    </main>
  );
}
