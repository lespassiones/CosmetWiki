"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { GLASS_CARD } from "@/lib/ui/glass";
import { SuggestionsDeck, type DeckSuggestion } from "./SuggestionsDeck";
import type { DeckAlternative } from "./SuggestionCard";

// ─── sessionStorage keys (mirror AlternativesCarousel) ───────────────────────
const PENDING_INCI_KEY = "cw:pendingInci";
const PENDING_SOURCE_KEY = "cw:pendingProductSource";

export type AtRiskProduct = {
  /** Analysis id of the routine product (needed for "compare"). */
  id: string;
  name: string;
  ean: string | null;
  category: string | null;
  /** Raw /20 score, sent to the suggestions endpoint. */
  score: number;
  /** Capped score (for the tier pastilles). */
  cappedScore: number | null;
  /** Badge colour derived from the capped score (rouge < 5, else orange). */
  dangerColor: "rouge" | "orange" | null;
};

type Alternative = DeckAlternative;

type Suggestion = {
  product: string;
  category: string | null;
  alternative: Alternative | null;
};

type Props = {
  products: AtRiskProduct[];
};

type Status = "idle" | "loading" | "ready" | "empty" | "error" | "credits";

export function CatalogAlternatives({ products }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [deck, setDeck] = useState<DeckSuggestion[]>([]);
  const [deckOpen, setDeckOpen] = useState(false);
  const [keepingKey, setKeepingKey] = useState<string | null>(null);
  const [keptKeys, setKeptKeys] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const r = await fetch("/api/routine/catalog-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: products.slice(0, 5) }),
      });
      if (r.status === 429) {
        setStatus("credits");
        return;
      }
      if (!r.ok) {
        setStatus("error");
        return;
      }
      const d = (await r.json()) as { suggestions: Suggestion[] };
      const byName = new Map(products.map((p) => [p.name, p]));
      const items: DeckSuggestion[] = (d.suggestions ?? [])
        .filter((s) => s.alternative !== null)
        .map((s) => {
          const p = byName.get(s.product);
          return {
            key: p?.id ?? s.alternative!.ean,
            productAnalysisId: p?.id ?? null,
            productTitle: s.product,
            productScore: p?.cappedScore ?? null,
            dangerColor: p?.dangerColor ?? null,
            alternative: s.alternative!,
          } satisfies DeckSuggestion;
        });
      if (items.length === 0) {
        setStatus("empty");
        return;
      }
      setDeck(items);
      setStatus("ready");
      setDeckOpen(true);
    } catch {
      setStatus("error");
    }
  }, [products]);

  /** Analyse l'alternative (fast-path EAN = gratuit) et renvoie son id. */
  async function ensureAlternativeAnalysis(alt: Alternative): Promise<string | null> {
    if (!alt.ingredients_text) return null;
    try {
      const r = await fetch("/api/analyser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: alt.ingredients_text,
          productLabel: alt.name ?? undefined,
          brand: alt.brand ?? undefined,
          productEan: alt.ean || undefined,
        }),
      });
      if (!r.ok) return null;
      const d = (await r.json()) as { analysisId?: string | null };
      return d.analysisId ?? null;
    } catch {
      return null;
    }
  }

  const onKeep = useCallback(
    async (s: DeckSuggestion) => {
      if (keptKeys.has(s.key) || keepingKey === s.key) return;
      setKeepingKey(s.key);
      try {
        const altId = await ensureAlternativeAnalysis(s.alternative);
        if (!altId) return;
        await fetch(`/api/analyses/${altId}/favori`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ favori: true }),
        });
        setKeptKeys((prev) => new Set(prev).add(s.key));
      } finally {
        setKeepingKey(null);
      }
    },
    [keptKeys, keepingKey],
  );

  const onCompare = useCallback(
    async (s: DeckSuggestion) => {
      if (!s.productAnalysisId || keepingKey === s.key) return;
      setKeepingKey(s.key);
      try {
        const altId = await ensureAlternativeAnalysis(s.alternative);
        if (!altId) return;
        router.push(`/compare?ids=${s.productAnalysisId},${altId}`);
      } finally {
        setKeepingKey(null);
      }
    },
    [keepingKey, router],
  );

  const onOpenAlternative = useCallback(
    (s: DeckSuggestion) => {
      const alt = s.alternative;
      if (!alt.ingredients_text) return;
      try {
        sessionStorage.setItem(PENDING_INCI_KEY, alt.ingredients_text);
        sessionStorage.setItem(
          PENDING_SOURCE_KEY,
          JSON.stringify({
            source: "catalog",
            sourceUrl: null,
            brand: alt.brand ?? null,
            productName: alt.name,
            ean: alt.ean,
          }),
        );
      } catch {
        /* ignore storage errors */
      }
      router.push(`/analyse?inci=${encodeURIComponent(alt.ingredients_text.slice(0, 6000))}`);
    },
    [router],
  );

  if (products.length === 0) return null;

  const busy = status === "loading";

  return (
    <section className={`${GLASS_CARD} px-5 py-4`}>
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle mb-1">
        Alternatives mieux notées
      </h2>
      <p className="text-[12px] text-ink-muted mb-4">
        Pour tes produits pénalisants, on cherche un remplaçant mieux noté dans la même catégorie.
      </p>

      <button
        type="button"
        onClick={load}
        disabled={busy}
        className="rounded-full bg-ink px-4 py-2 text-[12px] font-semibold text-white hover:bg-ink/80 transition disabled:opacity-60"
      >
        {busy ? "Recherche en cours…" : "Trouver des alternatives mieux notées"}
      </button>

      {/* Réouvre le deck déjà chargé sans refaire d'appel. */}
      {status === "ready" && !deckOpen && deck.length > 0 && (
        <button
          type="button"
          onClick={() => setDeckOpen(true)}
          className="ml-3 text-[12px] font-semibold text-rose-600 underline"
        >
          Revoir les {deck.length} suggestion{deck.length > 1 ? "s" : ""}
        </button>
      )}

      {status === "credits" && (
        <p className="mt-3 text-[12px] text-rose-600">
          Tu as utilisé tous tes crédits du jour. Reviens demain pour de nouvelles suggestions.
        </p>
      )}
      {status === "error" && (
        <p className="mt-3 text-[12px] text-ink-subtle">
          Impossible de charger les alternatives pour le moment.
        </p>
      )}
      {status === "empty" && (
        <p className="mt-3 text-[12px] text-ink-subtle">
          Aucune alternative nettement mieux notée trouvée dans le catalogue.
        </p>
      )}

      <SuggestionsDeck
        open={deckOpen}
        suggestions={deck}
        keepingKey={keepingKey}
        keptKeys={keptKeys}
        onClose={() => setDeckOpen(false)}
        onKeep={onKeep}
        onCompare={onCompare}
        onOpenAlternative={onOpenAlternative}
      />
    </section>
  );
}
