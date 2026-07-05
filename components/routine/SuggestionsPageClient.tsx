"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SuggestionCard, type DeckAlternative } from "./SuggestionCard";
import type { AtRiskProduct } from "@/lib/routine/atRisk";
import { apiFetch } from "@/lib/clientApi";

// ─── sessionStorage keys (mirror AlternativesCarousel) ───────────────────────
const PENDING_INCI_KEY = "cw:pendingInci";
const PENDING_SOURCE_KEY = "cw:pendingProductSource";

type Alternative = DeckAlternative;

/** Réponse de l'Edge Function routine-smart-suggest (une par produit qualifié). */
type EdgeSuggestion = {
  analysisId: string;
  productName: string;
  productScore: number | null;
  dangerColor: "rouge" | "orange" | null;
  alternative: Alternative | null;
  reason: string | null;
  locked: boolean;
};

/** One ready-to-render suggestion row (product → best alternative). */
type Item = {
  key: string;
  productAnalysisId: string | null;
  productTitle: string;
  productScore: number | null;
  dangerColor: "rouge" | "orange" | null;
  alternative: Alternative;
  reason: string | null;
};

type Status = "loading" | "ready" | "empty" | "error" | "credits";

/**
 * Full-page "Suggestions intelligentes" view (route /routine/suggestions).
 * Renders the suggestions as a normal, top-anchored vertical list — page flow,
 * never a fixed overlay — so the mobile bottom-nav can't cover it. Fetches once
 * on mount; the endpoint only debits a credit if at least one suggestion lands.
 */
export function SuggestionsPageClient({
  products,
}: {
  products: AtRiskProduct[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<Item[]>([]);
  const [keepingKey, setKeepingKey] = useState<string | null>(null);
  const [keptKeys, setKeptKeys] = useState<Set<string>>(new Set());
  // Fetch exactly once (StrictMode double-invokes effects in dev).
  const fetched = useRef(false);

  useEffect(() => {
    // Fetch exactly once. NB: no abort-on-cleanup here — under React StrictMode
    // (dev) the effect runs setup→cleanup→setup on the SAME instance, so aborting
    // in cleanup would kill the only fetch the `fetched` guard ever allows and the
    // skeleton would hang forever. The guard alone prevents a double request.
    if (fetched.current) return;
    fetched.current = true;
    // Cache + crédits sont désormais AUTORITATIFS côté serveur (table
    // routine_suggestions, par produit). On envoie TOUS les produits qualifiés ;
    // l'Edge Function renvoie les recos déjà en cache (0 crédit) et génère les
    // nouvelles (1 crédit/produit). Plus de cache localStorage (source de vérité
    // = serveur, cohérent mobile/web, non contournable).
    (async () => {
      try {
        const payload = products.map((p) => ({
          analysisId: p.id,
          name: p.name,
          ean: p.ean,
          category: p.category,
          counts: p.counts,
          cappedScore: p.cappedScore,
          restrictedCount: p.restrictedCount,
        }));
        const r = await apiFetch("/api/routine/catalog-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: payload }),
        });
        if (r.status === 429) return setStatus("credits");
        if (!r.ok) return setStatus("error");
        // Des crédits ont pu être débités → rafraîchir la pilule.
        window.dispatchEvent(new CustomEvent("cosmecheck:credits-updated"));
        const d = (await r.json()) as { suggestions?: EdgeSuggestion[] };
        const all = d.suggestions ?? [];
        const next: Item[] = all
          .filter((s) => s.alternative !== null)
          .map((s) => ({
            key: s.analysisId,
            productAnalysisId: s.analysisId,
            productTitle: s.productName,
            productScore: s.productScore,
            dangerColor: s.dangerColor,
            alternative: s.alternative!,
            reason: s.reason,
          }));
        const anyLocked = all.some((s) => s.locked);
        setItems(next);
        // Rien trouvé mais des produits verrouillés faute de crédits → message crédits.
        setStatus(next.length === 0 ? (anyLocked ? "credits" : "empty") : "ready");
      } catch {
        setStatus("error");
      }
    })();
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
    async (s: Item) => {
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
    async (s: Item) => {
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
    (s: Item) => {
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

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-5 pb-8">
      {/* Header */}
      <div className="mb-1 flex items-center gap-2">
        <Link
          href="/routine"
          aria-label="Retour à ma routine"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-ink ring-1 ring-black/[0.06] hover:bg-white"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="flex items-center gap-2 text-[17px] font-bold">
          <span aria-hidden>✨</span>
          Suggestions intelligentes
        </h1>
      </div>
      <p className="mb-5 pl-11 text-[12px] text-ink-muted">
        Pour tes produits pénalisants, un remplaçant mieux noté dans la même catégorie.
      </p>

      {status === "loading" && (
        <div aria-busy aria-label="Chargement des suggestions">
          {/* Bandeau visible "en cours" : spinner + message qui rassurent l'utilisateur */}
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-black/[0.06]">
            <Spinner className="h-5 w-5 shrink-0 text-[#FF5A8A]" />
            <span className="text-[13px] font-medium text-ink">
              Recherche des meilleures alternatives…
            </span>
          </div>
          <ul className="space-y-4">
            {Array.from({ length: Math.max(1, Math.min(products.length, 3)) }).map((_, i) => (
              <li
                key={i}
                className="h-[360px] animate-pulse rounded-3xl bg-gradient-to-br from-black/[0.06] to-black/[0.02] ring-1 ring-black/[0.04]"
              />
            ))}
          </ul>
        </div>
      )}

      {status === "ready" && (
        <ul className="space-y-4">
          {items.map((s) => (
            <li key={s.key}>
              <SuggestionCard
                productTitle={s.productTitle}
                productScore={s.productScore}
                dangerColor={s.dangerColor}
                alternative={s.alternative}
                reason={s.reason}
                keeping={keepingKey === s.key}
                kept={keptKeys.has(s.key)}
                onKeep={() => onKeep(s)}
                onCompare={() => onCompare(s)}
                onOpenAlternative={() => onOpenAlternative(s)}
              />
            </li>
          ))}
        </ul>
      )}

      {status === "empty" && (
        <Notice>Aucune alternative nettement mieux notée trouvée dans le catalogue.</Notice>
      )}
      {status === "credits" && (
        <Notice>
          Tu as utilisé tous tes crédits du jour. Reviens demain pour de nouvelles suggestions.
        </Notice>
      )}
      {status === "error" && <Notice>Impossible de charger les suggestions pour le moment.</Notice>}
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white/70 p-5 text-[13px] text-ink-subtle ring-1 ring-black/[0.06]">
      {children}
    </div>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`animate-spin ${className ?? ""}`} aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
