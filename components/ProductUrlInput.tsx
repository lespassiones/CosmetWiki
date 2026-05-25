"use client";

/**
 * "Coller le lien d'un produit" flow. Two-step UI:
 *
 *   1. URL field + "Récupérer" button → POST /api/ecommerce-scrape, which
 *      pulls JSON-LD metadata + LLM-extracted INCI from the page.
 *   2. Preview card (image, brand, name, snippet of description) with
 *      "Analyser ce produit" → fires the `onFound` callback the parent uses
 *      to navigate to /analyse, exactly like ProductSearchInput.
 *
 * Whole scrape is cached server-side per URL, so the confirm round-trip is
 * already paid for by the preview call — no double LLM cost.
 */

import { useState } from "react";

type FoundPayload = {
  ingredientsText: string;
  brand: string | null;
  productName: string | null;
  source: string;
  sourceUrl: string | null;
};

type ScrapePreview = {
  productName: string | null;
  brand: string | null;
  description: string | null;
  ingredientsText: string | null;
  imageUrl: string | null;
  sourceUrl: string;
  /** Echoed from the API for telemetry / debug display. */
  metadataSource: "json-ld" | "meta-tags" | "mixed" | "none";
};

export function ProductUrlInput({
  onFound,
  onFallbackToManual,
}: {
  onFound: (payload: FoundPayload) => void;
  /** Offered when the page returned no INCI — we route the user back to the
   *  paste view so they can drop the list themselves. */
  onFallbackToManual?: () => void;
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ScrapePreview | null>(null);

  function isLikelyUrl(s: string): boolean {
    const t = s.trim();
    return /^https?:\/\//i.test(t) && t.length >= 12;
  }

  async function fetchPreview(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (busy) return;
    const target = url.trim();
    if (!isLikelyUrl(target)) {
      setError("Colle un lien complet commençant par https://");
      return;
    }
    setBusy(true);
    setError(null);
    setPreview(null);
    try {
      const r = await fetch("/api/ecommerce-scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const json = (await r.json()) as
        | (ScrapeApiOk & { ok: true })
        | { ok?: false; error?: string; reason?: string };
      if (!r.ok || json.ok === false) {
        const msg = ("error" in json && json.error) || "Récupération impossible.";
        setError(msg);
        return;
      }
      const ok = json as ScrapeApiOk;
      setPreview({
        productName: ok.productName,
        brand: ok.brand,
        description: ok.description,
        ingredientsText: ok.ingredientsText,
        imageUrl: ok.imageUrl,
        sourceUrl: ok.sourceUrl,
        metadataSource: ok.source.metadata,
      });
    } catch {
      setError("Connexion impossible. Réessaie dans un instant.");
    } finally {
      setBusy(false);
    }
  }

  function confirm() {
    if (!preview?.ingredientsText) return;
    onFound({
      ingredientsText: preview.ingredientsText,
      brand: preview.brand,
      productName: preview.productName,
      source: "ecommerce-url",
      sourceUrl: preview.sourceUrl,
    });
  }

  function reset() {
    setPreview(null);
    setError(null);
  }

  // ─── Preview state ─────────────────────────────────────────────────────
  if (preview) {
    const noInci = !preview.ingredientsText;
    return (
      <div className="space-y-3">
        <article className="rounded-2xl bg-white border border-[#E5E7EB] p-4 flex gap-3">
          {preview.imageUrl ? (
            // Using a plain <img> deliberately — Next/Image would require us
            // to allowlist every e-commerce CDN in next.config, which is the
            // opposite of what we want (any shop should work). Preview only.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.imageUrl}
              alt=""
              className="h-20 w-20 rounded-xl object-cover shrink-0 bg-[#F3F4F6]"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="h-20 w-20 rounded-xl bg-[#F3F4F6] shrink-0 grid place-items-center text-[#9CA3AF] text-2xl">
              ✦
            </div>
          )}
          <div className="min-w-0 flex-1">
            {preview.brand ? (
              <div className="text-[11px] uppercase tracking-wide font-semibold text-[#6B7280]">
                {preview.brand}
              </div>
            ) : null}
            <div className="text-[14px] font-semibold text-[#111111] leading-snug line-clamp-2">
              {preview.productName ?? "Produit sans nom détecté"}
            </div>
            {preview.description ? (
              <p className="mt-1 text-[12px] text-[#6B7280] leading-snug line-clamp-2">
                {preview.description}
              </p>
            ) : null}
            <a
              href={preview.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-[11px] text-[#1E3A8A] hover:underline truncate max-w-full"
            >
              {hostOf(preview.sourceUrl)}
            </a>
          </div>
        </article>

        {noInci ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[13px] text-amber-900">
            On a bien retrouvé le produit mais pas sa liste INCI sur cette page.
            {onFallbackToManual ? (
              <>
                {" "}
                <button
                  type="button"
                  onClick={onFallbackToManual}
                  className="underline font-medium"
                >
                  Colle-la à la main ?
                </button>
              </>
            ) : null}
          </div>
        ) : null}

        <p className="text-center text-[12px] text-[#6B7280]">C&apos;est bien ce produit&nbsp;?</p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="flex-1 rounded-xl bg-[#F3F4F6] px-4 py-3 text-sm font-medium text-[#6B7280] hover:bg-[#E5E7EB] transition"
          >
            Non, autre lien
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={noInci}
            className="flex-1 rounded-xl bg-gradient-to-b from-rose-500 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow hover:from-rose-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Oui, analyser
          </button>
        </div>
      </div>
    );
  }

  // ─── Input state ───────────────────────────────────────────────────────
  return (
    <form onSubmit={fetchPreview} className="space-y-3">
      <div className="rounded-2xl bg-[#EEF3FB] border border-[#DDE5F0] p-3">
        <div className="flex items-center gap-2">
          <input
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            placeholder="https://lessecretsdeloly.com/products/..."
            className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-[14px] placeholder:text-[#9CA3AF] focus:outline-none"
            disabled={busy}
            maxLength={2048}
          />
          <button
            type="submit"
            disabled={busy || !isLikelyUrl(url)}
            className="rounded-xl bg-gradient-to-b from-rose-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow hover:from-rose-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {busy ? "…" : "Récupérer"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-[13px] text-rose-900">
          {error}
        </div>
      ) : null}

    </form>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────

type ScrapeApiOk = {
  ok: true;
  productName: string | null;
  brand: string | null;
  description: string | null;
  ingredientsText: string | null;
  imageUrl: string | null;
  sourceUrl: string;
  source: { metadata: "json-ld" | "meta-tags" | "mixed" | "none"; inci: "llm" | "none"; cached: boolean };
};

function hostOf(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}
