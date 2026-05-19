"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AnalyseItem, AnalyseResponse, Observation } from "@/lib/analyseTypes";
import type { ColorRating } from "@/lib/supabase";
import { Reveal } from "./Reveal";
import { IngredientSpectrum } from "./analyse/IngredientSpectrum";
import { MobileExpander } from "./analyse/MobileExpander";
import { IngredientBlob, type BlobCounts } from "./blob/IngredientBlob";
import { InfoBadge, Tooltip } from "./Tooltip";
import { commonNameFor, prettyInci } from "@/lib/inciCommonNames";
import { AddToRoutineButton } from "./routine/AddToRoutineButton";

// Lazy-load : la modale n'est ouverte que sur clic utilisateur, on évite
// d'embarquer son JS (et celui de ses dépendances OpenAI/Markdown) au LCP.
const PromesseFlowModal = dynamic(
  () => import("./promesse/PromesseFlowModal").then((m) => m.PromesseFlowModal),
  { ssr: false },
);

// Delay (ms) after panel mount before each block becomes visible.
// Synthesis streaming and score animation start at the same time as their
// Reveal so the motion is seen as the user looks at the block.
const REVEAL_SCORE_MS = 400;
const REVEAL_SYNTHESIS_MS = 900;

export type BreadcrumbItem = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export function AnalyseResultPanel({
  result,
  originalText,
  productLabel = null,
  productSource = null,
  analysisId = null,
  brand = null,
  productType = null,
  existingCoherenceId = null,
  autoOpenPromesse = false,
  alreadyInRoutine = false,
  onResetHome,
  breadcrumb,
}: {
  result: AnalyseResponse;
  originalText: string;
  /**
   * Human title for the analysis. When null and there's no productSource we
   * fall back to "Analyse de votre liste" (pasted-INCI flow).
   */
  productLabel?: string | null;
  productSource?: {
    source: string;
    sourceUrl: string | null;
    brand: string | null;
  } | null;
  /**
   * Supabase id of the persisted analyses row. When present, the
   * "Analyser la promesse" flow can PATCH the row with the marketing
   * description it fetches from the web. When null, the flow still works
   * but the description isn't persisted.
   */
  analysisId?: string | null;
  /** Brand from front-OCR / product-search. Fed to the web-search identification step. */
  brand?: string | null;
  /** Product type from front-OCR. Disambiguates similar formulas. */
  productType?: string | null;
  /** Id of the existing coherence (promise) analysis attached to this
   *  analyse, if any. When set, the "Analyser la promesse" button becomes
   *  "Voir l'analyse de la promesse" and links to /promesses/{id} instead
   *  of opening the modal - so the user doesn't pay for a second web
   *  search round-trip on the same product. */
  existingCoherenceId?: string | null;
  /** When true, the PromesseFlowModal opens automatically on mount. Used by
   *  the history list "Analyser la promesse" button which routes to
   *  /history/[id]?promesse=auto so the user lands directly on the flow.
   *  Ignored when existingCoherenceId is set (the parent route has already
   *  redirected to the existing result). */
  autoOpenPromesse?: boolean;
  /**
   * Whether this analyse is already in the user's routine. Used to pre-fill
   * the "Ajouter à ma routine" button state so it shows "Dans ta routine"
   * without an extra click.
   */
  alreadyInRoutine?: boolean;
  /**
   * Optional handler fired when the user clicks "Accueil" in the default
   * breadcrumb. Used by HomeShell to clear cached result state. Ignored
   * when `breadcrumb` is provided.
   */
  onResetHome?: () => void;
  /**
   * Override the breadcrumb trail. Last item is the current page (not
   * clickable). When omitted, defaults to `[Accueil, Nouvelle analyse]`
   * with the home item wired to `onResetHome` if provided. Pass `null`
   * to hide the breadcrumb entirely - used by the history detail page
   * which renders its own back button instead.
   */
  breadcrumb?: BreadcrumbItem[] | null;
}) {
  const title = productLabel?.trim() || "Analyse de votre liste";
  // The "Analyser la promesse" CTA is always offered - the flow handles
  // the "no product name" case gracefully: the web-search step tries the
  // INCI alone, and if nothing crédible comes back the modal falls through
  // to the "décris la promesse toi-même" textarea. Earlier we required a
  // productLabel before enabling the button, which was inconsistent with
  // the history page (where the fallback "Analyse du 17 mai" always made
  // the button active) and surprising for users who pasted an INCI without
  // a name.
  const [promesseOpen, setPromesseOpen] = useState(autoOpenPromesse);
  /** La liste détaillée des ingrédients est rendue dans une modal full-screen
   *  ouverte sur clic d'un simple lien dans le panel d'analyse. Garde le
   *  panel principal léger (juste le score + la synthèse + les observations). */
  const [ingredientsModalOpen, setIngredientsModalOpen] = useState(false);
  useEffect(() => {
    if (autoOpenPromesse) {
      setPromesseOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenPromesse]);

  // Ferme la modal au Escape pour cohérence avec PromesseFlowModal.
  useEffect(() => {
    if (!ingredientsModalOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIngredientsModalOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ingredientsModalOpen]);

  // `null` → caller explicitly hides the breadcrumb (history detail page).
  // `undefined` → fall back to the default [Accueil, Nouvelle analyse].
  const trail: BreadcrumbItem[] | null =
    breadcrumb === null
      ? null
      : (breadcrumb ?? [
          { label: "Accueil", href: "/", onClick: onResetHome },
          { label: "Nouvelle analyse" },
        ]);

  return (
    <section id="analyse-results" className="pt-2">
      <TitleBar
        title={title}
        productSource={productSource}
        onAnalysePromesse={() => setPromesseOpen(true)}
        existingCoherenceId={existingCoherenceId}
        onShare={() => shareReport(originalText)}
        breadcrumb={trail}
        analysisId={analysisId}
        alreadyInRoutine={alreadyInRoutine}
      />
      {!existingCoherenceId && (
        <PromesseFlowModal
          open={promesseOpen}
          onClose={() => setPromesseOpen(false)}
          inci={originalText}
          productLabel={productLabel}
          brand={brand}
          productType={productType}
          analysisId={analysisId}
        />
      )}

      {/*
        Layout via grid-template-areas - same DOM order regardless of
        viewport, but the placement of each section differs:

        MOBILE (single column, user-requested order)
          score → counts → synthesis → spectrum → observations → items

        DESKTOP (3-column bento)
          col 1 (1fr) : score → spectrum → counts
          col 2 (1fr) : observations on top, synthesis spanning 2 rows below
          col 3 (1.3fr): items spanning the full height
      */}
      <div className="mt-6 grid gap-4 grid-cols-1 [grid-template-areas:'score''counts''synthesis''spectrum''observations''items'] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)] lg:items-start lg:[grid-template-areas:'left_observations_items''left_synthesis_items']">
        {/* Left column: on desktop, grouped as a flex column so Score + Spectrum
            + Counts stack tightly with no gap from row height mismatch. On mobile,
            `contents` makes each child participate directly in the outer grid. */}
        <div className="contents lg:flex lg:flex-col lg:gap-4 lg:[grid-area:left]">
          <Reveal delayMs={REVEAL_SCORE_MS} className="[grid-area:score]">
            <BigScoreCard
              counts={{
                vert: result.counts.vert,
                jaune: result.counts.jaune,
                orange: result.counts.orange,
                rouge: result.counts.rouge,
              }}
              matched={result.counts.matched}
              total={result.counts.total}
            />
          </Reveal>

          {result.spectrum ? (
            <Reveal delayMs={650} className="[grid-area:spectrum]">
              <IngredientSpectrum
                items={result.items}
                top5={result.spectrum.top5}
                top10={result.spectrum.top10}
              />
            </Reveal>
          ) : null}

          <Reveal delayMs={0} className="[grid-area:counts]">
            <CountsStrip counts={result.counts} />
          </Reveal>
        </div>

        <Reveal delayMs={REVEAL_SYNTHESIS_MS} className="[grid-area:synthesis]">
          <MobileExpander
            expandLabel="Voir la synthèse complète"
            collapsedMaxHeight={160}
            desktopCollapsedMaxHeight={320}
          >
            <SynthesisCard
              synthesis={result.synthesis}
              items={result.items}
              streamDelayMs={REVEAL_SYNTHESIS_MS}
            />
          </MobileExpander>
        </Reveal>

        <Reveal delayMs={500} className="[grid-area:observations]">
          <ObservationsCard observations={result.observations} />
        </Reveal>

        <Reveal delayMs={1000} className="[grid-area:items]">
          <IngredientsLinkCard
            count={result.counts.total}
            onOpen={() => setIngredientsModalOpen(true)}
          />
        </Reveal>
      </div>

      {ingredientsModalOpen ? (
        <IngredientsModal
          items={result.items}
          counts={result.counts}
          onClose={() => setIngredientsModalOpen(false)}
        />
      ) : null}
    </section>
  );
}

/**
 * Carte compacte rendue à la place du tableau d'ingrédients dans le panel
 * d'analyse. Un seul lien-bouton qui ouvre la modal détaillée. Garde la
 * vue principale légère.
 */
function IngredientsLinkCard({
  count,
  onOpen,
}: {
  count: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full rounded-2xl bg-white/65 ring-1 ring-white/70 backdrop-blur-2xl px-5 py-4 text-left shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] transition hover:bg-white/85 hover:ring-rose-200"
      aria-label={`Voir la liste détaillée des ${count} ingrédients`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-ink">Liste des ingrédients</p>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            Voir les <span className="font-semibold text-ink">{count}</span> ingrédient{count > 1 ? "s" : ""} avec couleur, fonction et fiche détaillée.
          </p>
        </div>
        <span
          aria-hidden
          className="shrink-0 grid h-9 w-9 place-items-center rounded-full bg-ink text-white transition group-hover:bg-[#F43F5E]"
        >
          <ArrowRightIcon className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
}

/**
 * Modal full-screen qui rend le tableau complet des ingrédients (filtres
 * couleur + barre de recherche + lignes). Backdrop cliquable pour fermer,
 * Escape pour fermer, scroll interne pour les longues listes.
 */
function IngredientsModal({
  items,
  counts,
  onClose,
}: {
  items: AnalyseItem[];
  counts: AnalyseResponse["counts"];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm lg:items-center animate-[fadeIn_180ms_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Liste détaillée des ingrédients"
    >
      <div
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-bg shadow-xl lg:max-w-3xl lg:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:hidden mx-auto h-1 w-10 shrink-0 rounded-full bg-[#D1D5DB] my-3" aria-hidden />
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-3">
          <h2 className="text-[16px] font-bold text-ink">Liste des ingrédients</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-9 w-9 place-items-center rounded-full text-ink-muted transition hover:bg-black/[0.04] hover:text-ink"
          >
            <span aria-hidden className="text-lg leading-none">×</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <ItemsTable items={items} counts={counts} />
        </div>
      </div>
    </div>
  );
}

function TitleBar({
  title,
  productSource,
  onAnalysePromesse,
  existingCoherenceId,
  onShare,
  breadcrumb,
  analysisId,
  alreadyInRoutine,
}: {
  title: string;
  productSource: { source: string; sourceUrl: string | null; brand: string | null } | null;
  onAnalysePromesse: () => void;
  existingCoherenceId: string | null;
  onShare: () => void;
  breadcrumb: BreadcrumbItem[] | null;
  analysisId: string | null;
  alreadyInRoutine: boolean;
}) {
  const brand = productSource?.brand ?? null;
  // Standard convention: last item is the current location (not clickable).
  const trail = breadcrumb ? breadcrumb.slice(0, -1) : [];
  const current = breadcrumb ? breadcrumb[breadcrumb.length - 1] : undefined;
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {breadcrumb ? (
          <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-subtle" aria-label="Fil d'Ariane">
            {trail.map((item, i) => (
              <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1.5">
                {item.onClick ? (
                  <button type="button" onClick={item.onClick} className="rounded-md px-0.5 hover:text-ink">
                    {item.label}
                  </button>
                ) : item.href ? (
                  <Link href={item.href} className="hover:text-ink">{item.label}</Link>
                ) : (
                  <span>{item.label}</span>
                )}
                <span aria-hidden>›</span>
              </span>
            ))}
            {current ? (
              <span className="text-ink-muted truncate max-w-[16rem]">{current.label}</span>
            ) : null}
          </nav>
        ) : null}
        {brand ? (
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-pink-500/80">
            {brand}
          </p>
        ) : null}
        <h1 className="mt-1 text-balance text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        {existingCoherenceId ? (
          // Coherence already exists for this analyse - short-circuit to it
          // instead of re-running the (paid) web search + LLM round-trip.
          <Link
            href={`/promesses/${existingCoherenceId}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(16,185,129,0.45)] transition-all hover:bg-emerald-600 hover:shadow-[0_12px_28px_-6px_rgba(16,185,129,0.55)]"
          >
            <PromesseIcon className="h-3.5 w-3.5" /> Voir l&apos;analyse de la promesse
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAnalysePromesse}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(16,185,129,0.45)] transition-all hover:bg-emerald-600 hover:shadow-[0_12px_28px_-6px_rgba(16,185,129,0.55)]"
          >
            <PromesseIcon className="h-3.5 w-3.5" /> Analyser la promesse
          </button>
        )}
        {analysisId ? (
          <AddToRoutineButton analysisId={analysisId} alreadyInRoutine={alreadyInRoutine} />
        ) : null}
        <ToolbarButton onClick={onShare}>
          <ShareIcon className="h-3.5 w-3.5" /> Partager
        </ToolbarButton>
      </div>
    </header>
  );
}

function BigScoreCard({
  counts,
  matched,
  total,
}: {
  counts: BlobCounts;
  matched: number;
  total: number;
}) {
  // Share of recognised ingredients flagged as "no penalty" (vert). Computed
  // against `matched` (not `total`) - non-recognised ingredients aren't
  // classified, so it would be misleading to count them as either safe or
  // penalising.
  const pctSansPenalite =
    matched > 0 ? Math.round((counts.vert / matched) * 100) : null;

  return (
    <article className="rounded-2xl bg-white/65 p-5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl">
      {/* MOBILE - compact stacked: blob (no legend) + "% sans pénalité" + ratio. */}
      <div className="flex flex-col items-center gap-2 lg:hidden">
        <IngredientBlob counts={counts} variant="md" showCenter animate />
        {pctSansPenalite !== null && (
          <p className="text-[13px] italic text-emerald-700">
            <span className="font-semibold not-italic">{pctSansPenalite} %</span> sans pénalité
          </p>
        )}
        <p className="text-[11px] text-ink-subtle">
          <span className="font-semibold text-ink">{matched}</span> / {total} ingrédients reconnus
        </p>
      </div>

      {/* DESKTOP - full blob with "% sans pénalité" injected between the
          centre count and the colour legend, then the ratio at the bottom. */}
      <div className="hidden lg:flex lg:flex-col lg:items-center">
        <IngredientBlob
          counts={counts}
          variant="lg"
          showCenter
          showLegend
          animate
          subtitle={
            pctSansPenalite !== null ? (
              <p className="text-[14px] italic text-emerald-700">
                <span className="font-semibold not-italic">{pctSansPenalite} %</span> sans pénalité
              </p>
            ) : null
          }
        />
        <p className="mt-3 text-[12px] text-ink-subtle">
          <span className="font-semibold text-ink">{matched}</span> / {total} ingrédients reconnus
        </p>
      </div>
    </article>
  );
}

function CountsStrip({ counts }: { counts: AnalyseResponse["counts"] }) {
  const colors = [
    { label: "Vert", count: counts.vert, dot: "bg-emerald-500", text: "text-emerald-700", penalty: "sans pénalité" },
    { label: "Jaune", count: counts.jaune, dot: "bg-amber-400", text: "text-amber-700", penalty: "pénalité faible" },
    { label: "Orange", count: counts.orange, dot: "bg-orange-500", text: "text-orange-700", penalty: "pénalité moyenne" },
    { label: "Rouge", count: counts.rouge, dot: "bg-rose-500", text: "text-rose-700", penalty: "pénalité forte" },
  ];
  const vert = colors[0];
  const penaltyColors = [colors[1], colors[2], colors[3]];

  // Common card chrome (bg/blur/ring/shadow) - extracted so the mobile bento
  // and the desktop strip stay visually consistent if we tweak it later.
  const CARD =
    "rounded-2xl bg-white/65 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl";

  return (
    <>
      {/* MOBILE - asymmetric 2-col bento:
            LEFT  (1fr) : 2 stacked tall cards   → Identifiés + Vert
            RIGHT (1fr) : 3 stacked thin strips  → Jaune / Orange / Rouge
          Each tile gets a `stagger-up` animation with an incrementing delay
          so the bento "fills up" cell-by-cell (~80ms apart) - playful and
          guides the eye through the breakdown after the blob lands. */}
      <div className="grid grid-cols-2 gap-2.5 lg:hidden">
        <div className="flex flex-col gap-2.5">
          <article
            className={`${CARD} stagger-up p-3.5`}
            style={{ ["--stagger-delay" as string]: "60ms" } as React.CSSProperties}
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
              Ingrédients identifiés
            </p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink leading-none">
              {counts.matched}
            </p>
            <p className="mt-1 text-[11px] text-ink-subtle">
              sur {counts.total} ingrédients
            </p>
          </article>
          <article
            className={`${CARD} stagger-up p-3.5`}
            style={{ ["--stagger-delay" as string]: "220ms" } as React.CSSProperties}
          >
            <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide">
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${vert.dot}`} />
              <span className={vert.text}>{vert.label}</span>
            </p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink leading-none">
              {vert.count}
            </p>
            <p className={`mt-1 text-[10px] italic ${vert.text}`}>{vert.penalty}</p>
          </article>
        </div>

        <div className="flex flex-col gap-2.5">
          {penaltyColors.map((c, i) => (
            <article
              key={c.label}
              className={`${CARD} stagger-up flex items-center gap-2 p-2.5`}
              style={{ ["--stagger-delay" as string]: `${140 + i * 80}ms` } as React.CSSProperties}
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide">
                  <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                  <span className={c.text}>{c.label}</span>
                </p>
                <p className={`mt-0.5 text-[10px] italic ${c.text}`}>{c.penalty}</p>
              </div>
              <p className="text-xl font-bold tabular-nums text-ink leading-none">
                {c.count}
              </p>
            </article>
          ))}
        </div>
      </div>

      {/* DESKTOP - compact 4-cell strip living under the score gauge in the
          left column of the bento. */}
      <article className={`hidden lg:block ${CARD} p-3`}>
        <ul className="grid grid-cols-4 gap-2">
          {colors.map((c) => (
            <li key={c.label} className="flex flex-col items-center gap-0.5 py-1.5">
              <span className="flex items-center gap-1.5">
                <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                <span className={`text-[11px] font-semibold ${c.text}`}>{c.label}</span>
              </span>
              <span className="text-lg font-bold tabular-nums text-ink">{c.count}</span>
              <span className="text-[10px] text-ink-subtle tabular-nums">
                {pct(c.count, counts.total)} %
              </span>
            </li>
          ))}
        </ul>
      </article>
    </>
  );
}


// ============================================================
// Stat / Score cards
// ============================================================
function StatCard({
  label,
  children,
  dot,
  muted = false,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  dot?: string;
  muted?: boolean;
  className?: string;
}) {
  return (
    <article
      className={`flex flex-col rounded-2xl bg-white/65 p-4 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl ${className}`}
    >
      <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-ink-subtle">
        {dot ? <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden /> : null}
        {label}
      </p>
      <div className={`mt-2 ${muted ? "text-ink-muted" : ""}`}>{children}</div>
    </article>
  );
}

// Compact card used in the mobile bento layout : label on top, then number
// + percentage on the same baseline (left/right justified).
function SmallStatCard({
  label,
  dot,
  count,
  pct,
}: {
  label: string;
  dot: string;
  count: number;
  pct: string;
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl bg-white/65 p-4 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl">
      <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-ink-subtle">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
        {label}
      </p>
      <div className="mt-auto flex items-baseline justify-between gap-2 pt-2">
        <p className="text-2xl font-semibold tabular-nums text-ink">{count}</p>
        <p className="text-[12px] text-ink-subtle tabular-nums">{pct} %</p>
      </div>
    </article>
  );
}

function ScoreCard({
  score,
  label,
  tone,
  startDelayMs = 0,
}: {
  score: number;
  label: string;
  tone: "green" | "amber" | "orange" | "rose";
  startDelayMs?: number;
}) {
  const TONE_RING: Record<string, string> = {
    green: "stroke-emerald-500",
    amber: "stroke-amber-500",
    orange: "stroke-orange-500",
    rose: "stroke-rose-500",
  };
  const TONE_TEXT: Record<string, string> = {
    green: "text-emerald-600",
    amber: "text-amber-600",
    orange: "text-orange-600",
    rose: "text-rose-600",
  };
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 20) * circumference;

  // Animate progress from 0 → 1 with an ease-out cubic, after `startDelayMs`.
  // Drives both the SVG fill and the displayed number.
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let rafId = 0;
    let started: number | null = null;
    const DURATION = 1500;
    const tick = (now: number) => {
      if (started === null) started = now;
      const elapsed = now - started;
      const t = Math.min(1, elapsed / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    const startId = window.setTimeout(() => {
      rafId = requestAnimationFrame(tick);
    }, startDelayMs);
    return () => {
      window.clearTimeout(startId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [startDelayMs]);

  const animFilled = filled * progress;
  const animScore = score * progress;

  return (
    <article className="flex items-center gap-3 rounded-2xl bg-white/65 p-4 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl">
      <div className="flex flex-1 flex-col">
        <p className="text-[11px] font-medium tracking-wide text-ink-subtle">
          Note globale
        </p>
        <p className="mt-1 flex items-baseline gap-1">
          <span className="text-3xl font-semibold tabular-nums text-ink">
            {animScore.toFixed(1)}
          </span>
          <span className="text-base font-medium text-ink-subtle">/20</span>
        </p>
        <p className={`mt-0.5 text-[12px] font-semibold ${TONE_TEXT[tone]}`}>
          {label}
        </p>
      </div>
      <div className="relative h-11 w-11 shrink-0 sm:h-12 sm:w-12">
        <svg viewBox="0 0 60 60" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="30" cy="30" r={radius} className="fill-none stroke-black/[0.05]" strokeWidth="6" />
          <circle
            cx="30"
            cy="30"
            r={radius}
            className={`fill-none ${TONE_RING[tone]}`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - animFilled}
          />
        </svg>
      </div>
    </article>
  );
}

// ============================================================
// Observations
// ============================================================
function ObservationsCard({
  observations,
}: {
  observations: Observation[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [openTags, setOpenTags] = useState<Set<string>>(new Set());
  const visible = expanded ? observations : observations.slice(0, 5);

  function toggleTag(tag: string) {
    setOpenTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  return (
    <article className="rounded-2xl bg-white/65 p-5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl">
      <h2 className="text-base font-semibold text-ink">Observations</h2>
      <ul className="mt-3 space-y-2">
        {visible.map((o) => {
          const isOpen = openTags.has(o.tag);
          const items = o.items ?? [];
          const expandable = o.count > 0 && items.length > 0;
          const showCount = expandable && (o.status === "present" || o.status === "warn");
          return (
            <li key={o.tag}>
              {expandable ? (
                // Rendered as a <div role="button"> instead of a real <button>
                // because <ObservationLabel> embeds an inline tooltip whose
                // trigger is itself a <button> - and HTML forbids nesting
                // <button> inside <button>. Keyboard accessibility is preserved
                // via tabIndex + onKeyDown.
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleTag(o.tag)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleTag(o.tag);
                    }
                  }}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-1.5 py-1 text-left text-[14px] transition-colors hover:bg-black/[0.025] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                >
                  <ObservationIcon obs={o} />
                  <ObservationLabel obs={o} />
                  {showCount ? (
                    <span className="rounded-full bg-black/[0.04] px-2 py-0.5 font-mono text-[11px] text-ink-muted">
                      {o.count}
                    </span>
                  ) : null}
                  <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 text-ink-subtle transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
              ) : (
                <div className="flex w-full items-center gap-2.5 px-1.5 py-1 text-[14px]">
                  <ObservationIcon obs={o} />
                  <ObservationLabel obs={o} />
                </div>
              )}

              {expandable && isOpen ? (
                <ul className="ml-9 mt-1.5 space-y-1 border-l border-black/[0.06] pl-3 animate-fade-in">
                  {items.map((it, idx) => (
                    <li key={idx} className="text-[13px]">
                      {it.slug ? (
                        <Link
                          href={`/i/${it.slug}?from=home`}
                          className="inline-flex items-center gap-1.5 text-ink hover:text-rose-700"
                        >
                          {it.colorRating ? (
                            <span className={`h-1.5 w-1.5 rounded-full ${dotForRating(it.colorRating)}`} aria-hidden />
                          ) : null}
                          {prettyName(it.name)}
                        </Link>
                      ) : (
                        <span className="text-ink-muted">{prettyName(it.name)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>

      {observations.length > 5 ? (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-rose-700 hover:text-rose-900"
        >
          {expanded ? "Réduire" : `Voir le détail des observations`}{" "}
          <span aria-hidden>→</span>
        </button>
      ) : null}
    </article>
  );
}

function ObservationIcon({ obs }: { obs: Observation }) {
  if (obs.status === "absent") {
    return (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-50 ring-1 ring-emerald-100 text-emerald-600">
        <CheckIcon className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (obs.status === "info") {
    return (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-50 ring-1 ring-sky-100 text-sky-600">
        <InfoIcon className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (obs.status === "warn") {
    return (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-50 ring-1 ring-amber-100 text-amber-700">
        <WarnIcon className="h-3.5 w-3.5" />
      </span>
    );
  }
  // "present" status: use an alert icon so it doesn't look like an ingredient colour rating
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-50 ring-1 ring-orange-100 text-orange-500">
      <WarnIcon className="h-3.5 w-3.5" />
    </span>
  );
}

function ObservationLabel({ obs }: { obs: Observation }) {
  // Some observations get an inline info tooltip when the topic needs a bit
  // of pedagogy (e.g. "Conservateurs" - explaining that any water-based
  // formula needs a preservative system, what the colour means, etc.).
  const inlineTooltip =
    obs.label === "Conservateurs" ? (
      <Tooltip
        maxWidth={300}
        content={
          <>
            Toute formule à base d&apos;eau <b>a besoin de conservateurs</b> pour limiter
            le développement microbien. Une formule aqueuse sans conservateur identifiable
            doit donc attirer l&apos;attention. La différence se joue surtout sur leur{" "}
            <b>nombre</b>, leur <b>nature</b> et leur classement (vert / jaune / orange / rouge).
          </>
        }
      >
        <button
          type="button"
          aria-label="Pourquoi des conservateurs ?"
          className="ml-1 inline-flex items-center align-middle"
        >
          <InfoBadge />
        </button>
      </Tooltip>
    ) : null;

  if (obs.message) {
    const tone =
      obs.status === "absent"
        ? "text-emerald-700"
        : obs.status === "warn"
          ? "text-amber-700"
          : obs.status === "info"
            ? "text-sky-700"
            : "text-ink-muted";
    return (
      <span className="flex-1 text-ink">
        {obs.label}{" "}
        <span className={tone}>{obs.message}</span>
        {inlineTooltip}
      </span>
    );
  }
  // Suffix follows the status: "absents" (green, good news), "non détectés"
  // (sky blue, neutral - used for essential oils where absence is not
  // automatically a win), "présents" (muted, factual).
  const suffix
    = obs.status === "absent"
      ? "absents"
      : obs.status === "info"
        ? "non détectés"
        : "présents";
  const suffixTone
    = obs.status === "absent"
      ? "text-emerald-700"
      : obs.status === "info"
        ? "text-sky-700"
        : "text-ink-muted";
  return (
    <span className="flex-1 text-ink">
      {obs.label}{" "}
      <span className={suffixTone}>{suffix}</span>
      {inlineTooltip}
    </span>
  );
}

function InfoIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="8" />
      <line x1="12" y1="11" x2="12" y2="16" />
    </svg>
  );
}

function WarnIcon({ className }: { className?: string }) {
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
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12" y2="17" />
    </svg>
  );
}

function dotForRating(r: ColorRating): string {
  switch (r) {
    case "Vert": return "bg-emerald-500";
    case "Jaune": return "bg-amber-400";
    case "Orange": return "bg-orange-500";
    case "Rouge": return "bg-rose-500";
  }
}

// ============================================================
// Synthesis
// ============================================================
function SynthesisCard({
  synthesis,
  items,
  streamDelayMs = 0,
}: {
  synthesis: string | null;
  items: AnalyseItem[];
  streamDelayMs?: number;
}) {
  const fullText = synthesis ?? "";
  // Build a name → colorRating lookup so bold INCI names in the synthesis
  // can be tinted with their rating colour. Indexed on both the canonical
  // name and the user-typed token so spelling variants resolve.
  const colorByName = useMemo(() => {
    const m = new Map<string, ColorRating>();
    for (const it of items) {
      if (!it.colorRating) continue;
      if (it.name) m.set(normaliseSynthesisToken(it.name), it.colorRating);
      if (it.input) m.set(normaliseSynthesisToken(it.input), it.colorRating);
    }
    return m;
  }, [items]);
  // Characters revealed so far (the streaming effect). Starts at 0 once we
  // have text, gets incremented on a timer until we reach the full length.
  const [shown, setShown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setShown(0);
    if (!fullText) return;

    const TARGET_DURATION = 3500; // total streaming time, ms
    const TICK = 22;
    const charsPerTick = Math.max(2, Math.ceil(fullText.length / (TARGET_DURATION / TICK)));

    const start = window.setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setShown((prev) => {
          const next = prev + charsPerTick;
          if (next >= fullText.length) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return fullText.length;
          }
          return next;
        });
      }, TICK);
    }, streamDelayMs);

    return () => {
      window.clearTimeout(start);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fullText, streamDelayMs]);

  const visible = fullText.slice(0, shown);
  // While streaming we may be in the middle of a `**bold**` span - close it
  // temporarily so the markdown renderer doesn't break on an unmatched `**`.
  const safeVisible = balanceBold(visible);
  const blocks = parseSynthesisBlocks(safeVisible);
  const streaming = fullText.length > 0 && shown < fullText.length;

  return (
    <article className="rounded-2xl bg-white/65 p-5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl">
      <h2 className="text-base font-semibold text-ink">Synthèse</h2>
      {fullText ? (
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink">
          {blocks.map((block, i) => {
            const isLast = i === blocks.length - 1;
            const showCursor = streaming && isLast;
            if (block.type === "p") {
              return (
                <p key={i}>
                  {renderBoldMarkdown(block.text, colorByName)}
                  {showCursor ? <StreamCursor /> : null}
                </p>
              );
            }
            return (
              <ul key={i} className="space-y-1.5 pl-1">
                {block.items.map((item, j) => {
                  const lastItem = j === block.items.length - 1;
                  // Use the rating of the first bold INCI name in the bullet
                  // to colour the dot, so a jaune ingredient gets an amber
                  // dot instead of the previously hard-coded rose. Falls back
                  // to muted when no rating can be resolved.
                  const firstBold = /\*\*([^*]+)\*\*/.exec(item);
                  const bulletRating = firstBold
                    ? colorByName.get(normaliseSynthesisToken(firstBold[1]))
                    : undefined;
                  return (
                    <li key={j} className="flex gap-2">
                      <span
                        aria-hidden
                        className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${bulletBgForRating(bulletRating)}`}
                      />
                      <span className="flex-1">
                        {renderBoldMarkdown(item, colorByName)}
                        {showCursor && lastItem ? <StreamCursor /> : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-muted">
          Synthèse temporairement indisponible. Consulte le détail des
          observations et le tableau ci-dessous pour interpréter les résultats.
        </p>
      )}
    </article>
  );
}

function StreamCursor() {
  return (
    <span className="ml-0.5 inline-block h-[1em] w-[2px] -mb-[2px] animate-pulse bg-rose-500/70 align-middle" />
  );
}

type SynthesisBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

const BULLET_RE = /^[-•*]\s+(.+)$/;

function parseSynthesisBlocks(text: string): SynthesisBlock[] {
  const blocks: SynthesisBlock[] = [];
  for (const chunk of text.split(/\n{2,}/)) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    const lines = trimmed.split("\n");

    let pBuffer: string[] = [];
    let ulBuffer: string[] = [];

    const flushP = () => {
      if (pBuffer.length === 0) return;
      blocks.push({ type: "p", text: pBuffer.join(" ") });
      pBuffer = [];
    };
    const flushUl = () => {
      if (ulBuffer.length === 0) return;
      blocks.push({ type: "ul", items: ulBuffer });
      ulBuffer = [];
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      const m = BULLET_RE.exec(line);
      if (m) {
        flushP();
        ulBuffer.push(m[1]!.trim());
      } else {
        flushUl();
        pBuffer.push(line);
      }
    }
    flushP();
    flushUl();
  }
  return blocks;
}

function balanceBold(text: string): string {
  const stars = (text.match(/\*\*/g) || []).length;
  return stars % 2 === 1 ? text + "**" : text;
}

function renderBoldMarkdown(
  s: string,
  colorByName?: Map<string, ColorRating>,
): React.ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) {
      const inner = p.slice(2, -2);
      const normalised = normaliseSynthesisToken(inner);
      const rating = colorByName?.get(normalised);
      const tone = rating ? colorForRating(rating) : "text-ink";
      // Grand-public translation: if we know "AQUA" as "eau", render
      // "**eau** (Aqua)" so the body copy reads naturally while keeping the
      // INCI token visible for label cross-reference. Only triggered when
      // the mapping has an entry - other tokens render unchanged.
      const common = commonNameFor(normalised);
      if (common) {
        return (
          <span key={i}>
            <strong className={`font-semibold ${tone}`}>{common}</strong>
            <span className="text-ink-subtle"> ({prettyInci(inner)})</span>
          </span>
        );
      }
      return (
        <strong key={i} className={`font-semibold ${tone}`}>
          {inner}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

function normaliseSynthesisToken(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();
}

function colorForRating(r: ColorRating): string {
  // Jaune / Orange / Rouge get a coloured highlight (background) on top of
  // the text colour because the raw text-amber-600 / text-orange-600 hues
  // are hard to tell apart in body copy - users were misreading "Jaune"
  // ingredients as "Orange". Vert stays text-only since it's the default
  // "safe" state and a highlight would over-emphasise it. The horizontal
  // negative margin tucks the highlight back so it doesn't push neighbouring
  // words apart, while px-1 keeps the colour pad legible around the term.
  switch (r) {
    case "Vert":
      return "text-emerald-700";
    case "Jaune":
      return "rounded bg-amber-200/70 px-1 -mx-0.5 text-amber-900 decoration-amber-500";
    case "Orange":
      return "rounded bg-orange-200/70 px-1 -mx-0.5 text-orange-900 decoration-orange-500";
    case "Rouge":
      return "rounded bg-rose-200/70 px-1 -mx-0.5 text-rose-900 decoration-rose-500";
  }
}

function bulletBgForRating(r: ColorRating | undefined): string {
  switch (r) {
    case "Vert":
      return "bg-emerald-500";
    case "Jaune":
      return "bg-amber-500";
    case "Orange":
      return "bg-orange-500";
    case "Rouge":
      return "bg-rose-500";
    default:
      return "bg-ink-subtle/60";
  }
}

// ============================================================
// Items table
// ============================================================
type TabKey = "all" | ColorRating | "unknown";

const TAB_TONE: Record<TabKey, { activeBg: string; inactiveHover: string; countInactive: string }> = {
  all: {
    activeBg: "bg-ink",
    inactiveHover: "hover:bg-black/[0.04] hover:text-ink",
    countInactive: "bg-black/[0.05] text-ink-muted",
  },
  Vert: {
    activeBg: "bg-emerald-500",
    inactiveHover: "hover:bg-emerald-50 hover:text-emerald-700",
    countInactive: "bg-emerald-50 text-emerald-700",
  },
  Jaune: {
    activeBg: "bg-amber-500",
    inactiveHover: "hover:bg-amber-50 hover:text-amber-700",
    countInactive: "bg-amber-50 text-amber-700",
  },
  Orange: {
    activeBg: "bg-orange-500",
    inactiveHover: "hover:bg-orange-50 hover:text-orange-700",
    countInactive: "bg-orange-50 text-orange-700",
  },
  Rouge: {
    activeBg: "bg-rose-500",
    inactiveHover: "hover:bg-rose-50 hover:text-rose-700",
    countInactive: "bg-rose-50 text-rose-700",
  },
  unknown: {
    activeBg: "bg-slate-500",
    inactiveHover: "hover:bg-black/[0.04] hover:text-ink",
    countInactive: "bg-black/[0.05] text-ink-muted",
  },
};

function ItemsTable({
  items,
  counts,
  mobileLimit,
  desktopLimit,
  compact = false,
}: {
  items: AnalyseItem[];
  counts: AnalyseResponse["counts"];
  /** When set, mobile only shows the first N rows + a "Voir les {total}" link. */
  mobileLimit?: number;
  /** When set, desktop also collapses to the first N rows behind a "Voir tout". */
  desktopLimit?: number;
  /** Tighter typography / spacing - used when the table sits inside a narrow
   * column of the analysis grid. */
  compact?: boolean;
}) {
  const [filter, setFilter] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(false);

  const filtered = useMemo(() => {
    let out = items;
    if (filter !== "all") {
      if (filter === "unknown") out = out.filter((i) => i.colorRating === null);
      else out = out.filter((i) => i.colorRating === filter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (i) =>
          (i.name ?? "").toLowerCase().includes(q) ||
          (i.input ?? "").toLowerCase().includes(q) ||
          (i.translationFr ?? "").toLowerCase().includes(q),
      );
    }
    return out;
  }, [items, filter, search]);

  const tabs: { key: typeof filter; label: string; count: number }[] = [
    { key: "all", label: "Tous", count: counts.total },
    { key: "Vert", label: "Vert", count: counts.vert },
    { key: "Jaune", label: "Jaune", count: counts.jaune },
    { key: "Orange", label: "Orange", count: counts.orange },
    { key: "Rouge", label: "Rouge", count: counts.rouge },
  ];
  if (counts.unknown > 0) {
    tabs.push({ key: "unknown", label: "Non reconnu", count: counts.unknown });
  }

  return (
    <article className="rounded-2xl bg-white/65 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl">
      {/* Header - in `compact` mode (narrow column on the analysis page) the
          filter chips and the search bar are stacked vertically: a single
          row would otherwise wrap chaotically with 5+ chips beside the input.
          In the full-width case (history page etc.) we keep them on one row. */}
      <div
        className={`border-b border-black/[0.05] p-4 ${
          compact
            ? "flex flex-col gap-3"
            : "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        }`}
      >
        <div className="-mb-px flex flex-wrap gap-1 overflow-x-auto">
          {tabs.map((t) => {
            const active = t.key === filter;
            const tone = TAB_TONE[t.key];
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full ${compact ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[13px]"} font-medium transition-colors ${
                  active
                    ? `${tone.activeBg} text-white`
                    : `text-ink-muted ${tone.inactiveHover}`
                }`}
              >
                {t.label}
                <span
                  className={`rounded-full px-1.5 text-[11px] tabular-nums ${
                    active ? "bg-white/25 text-white" : tone.countInactive
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        <label className={`relative ${compact ? "w-full" : "w-full sm:w-64"}`}>
          <SearchIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle" aria-hidden />
          <input
            type="search"
            placeholder="Rechercher un ingrédient"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full bg-white/80 py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-subtle outline-none ring-1 ring-black/[0.06] focus:ring-2 focus:ring-rose-200"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
              <th className="px-5 py-3">Ingrédient</th>
              <th className="px-5 py-3 max-md:hidden">Fonction</th>
              <th className="px-5 py-3">Tolérance</th>
              <th className="px-5 py-3 text-right">Détails</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-ink-muted">
                  Aucun ingrédient ne correspond à ce filtre.
                </td>
              </tr>
            ) : (
              filtered.map((i, idx) => {
                const hiddenOnMobile =
                  mobileLimit !== undefined
                  && !mobileExpanded
                  && idx >= mobileLimit;
                const hiddenOnDesktop =
                  desktopLimit !== undefined
                  && !desktopExpanded
                  && idx >= desktopLimit;
                let hiddenCls = "";
                if (hiddenOnMobile && hiddenOnDesktop) hiddenCls = "hidden";
                else if (hiddenOnMobile) hiddenCls = "hidden lg:table-row";
                else if (hiddenOnDesktop) hiddenCls = "lg:hidden";
                const cellPad = compact ? "px-3 py-2" : "px-5 py-3";
                return (
                <tr
                  key={`${i.position}-${i.input}`}
                  id={`ingredient-row-${i.position}`}
                  className={`border-t border-black/[0.04] transition-colors hover:bg-rose-50/30 scroll-mt-24 ${hiddenCls}`}
                >
                  <td className={cellPad}>
                    <div className={`font-semibold text-ink ${compact ? "text-[13px]" : ""}`}>
                      {prettyName(i.name ?? i.input)}
                    </div>
                    {i.translationFr ? (
                      <div className="text-[11px] text-ink-muted">{i.translationFr}</div>
                    ) : i.matchKind === null ? (
                      <div className="text-[11px] text-ink-subtle">Non reconnu</div>
                    ) : null}
                  </td>
                  <td className={`${cellPad} text-ink-muted max-md:hidden ${compact ? "hidden xl:table-cell" : ""}`}>
                    {i.primaryFunction || "-"}
                  </td>
                  <td className={cellPad}>
                    <ColorChip rating={i.colorRating} />
                    {/*
                      "≤ 1 %" badge - only when the ingredient sits *after* the
                      first preservative in the list. In INCI regulation,
                      preservatives are required at ≤1 % and the list is ordered
                      by descending concentration above 1 %, so anything past
                      the first preservative is necessarily ≤1 %. We deliberately
                      DO NOT show this badge after the first fragrance because
                      some brands (EDT, body sprays, etc.) put 2-3 % of parfum,
                      so "after parfum" doesn't imply ≤1 %.
                    */}
                    {i.thresholdContext === "after_preservative" ? (
                      <Tooltip
                        maxWidth={280}
                        content={
                          <>
                            Cet ingrédient apparaît <b>après le premier
                            conservateur</b> dans la liste INCI. Sa
                            concentration est donc <b>≤ 1 %</b> - il est peu
                            probable qu&apos;il soit l&apos;élément principal
                            responsable de l&apos;efficacité du produit.
                          </>
                        }
                      >
                        <button
                          type="button"
                          aria-label={`${i.name ?? i.input} : présent en trace (≤ 1 %)`}
                          className="ml-2 inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 ring-1 ring-sky-200 align-middle hover:bg-sky-100 transition"
                        >
                          ≤ 1 %
                        </button>
                      </Tooltip>
                    ) : null}
                  </td>
                  <td className={`${cellPad} text-right`}>
                    {i.slug ? (
                      <Link
                        href={`/i/${i.slug}?from=home`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-muted transition hover:bg-rose-50 hover:text-rose-700"
                        aria-label={`Voir la fiche de ${i.name}`}
                      >
                        <ArrowRightIcon className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <span className="inline-flex h-7 w-7 items-center justify-center text-ink-subtle">
                        -
                      </span>
                    )}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {mobileLimit !== undefined && filtered.length > mobileLimit ? (
        <div className="lg:hidden border-t border-black/[0.04] px-5 py-3 text-center">
          <button
            type="button"
            onClick={() => setMobileExpanded((v) => !v)}
            className="text-[13px] font-medium text-[#F43F5E] hover:underline"
          >
            {mobileExpanded
              ? "Replier ↑"
              : `Voir les ${filtered.length} ingrédients →`}
          </button>
        </div>
      ) : null}
      {desktopLimit !== undefined && filtered.length > desktopLimit ? (
        <div className="hidden lg:block border-t border-black/[0.04] px-5 py-3 text-center">
          <button
            type="button"
            onClick={() => setDesktopExpanded((v) => !v)}
            className="text-[13px] font-medium text-[#F43F5E] hover:underline"
          >
            {desktopExpanded
              ? "Replier ↑"
              : `Voir les ${filtered.length} ingrédients →`}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function ColorChip({ rating }: { rating: ColorRating | null }) {
  if (!rating) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-subtle">
        <span className="h-1.5 w-1.5 rounded-full bg-black/[0.2]" aria-hidden /> -
      </span>
    );
  }
  const map: Record<ColorRating, { dot: string; text: string }> = {
    Vert: { dot: "bg-emerald-500", text: "text-emerald-700" },
    Jaune: { dot: "bg-amber-400", text: "text-amber-700" },
    Orange: { dot: "bg-orange-500", text: "text-orange-700" },
    Rouge: { dot: "bg-rose-500", text: "text-rose-700" },
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${map[rating].text}`}>
      <span className={`h-2 w-2 rounded-full ${map[rating].dot}`} aria-hidden />
      {rating}
    </span>
  );
}

// ============================================================
// Helpers
// ============================================================
function pct(n: number, total: number): string {
  if (!total) return "0";
  return ((n / total) * 100).toFixed(0);
}

function prettyName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Denat\./i, "Denat.");
}

function tagColor(tag: string): string {
  if (["paraben", "sulfate", "huile-minerale"].includes(tag)) return "bg-rose-500";
  if (["allergene-parfumant", "ammonium-quaternaire", "parfum-synthese"].includes(tag)) return "bg-orange-400";
  if (["silicone", "ethoxyle", "colorant-synthese", "huile-essentielle"].includes(tag)) return "bg-amber-400";
  return "bg-ink-subtle";
}

function ToolbarButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-1.5 text-[13px] font-medium text-ink ring-1 ring-white/70 backdrop-blur-md transition-all hover:bg-white/90 hover:shadow-[0_6px_20px_-8px_rgba(15,23,42,0.15)]"
    >
      {children}
    </button>
  );
}

async function shareReport(text: string) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("inci", text.trim().slice(0, 6000));
  const shareUrl = url.toString();
  try {
    if (navigator.share) {
      await navigator.share({
        title: "Mon analyse Cosme Check",
        text: "Voici l'analyse de ce produit",
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert("Lien copié dans le presse-papier !");
    }
  } catch {
    /* user dismissed */
  }
}

// ============================================================
// Icons
// ============================================================
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DotIcon({ className }: { className?: string }) {
  return <span className={`block rounded-full ${className}`} aria-hidden />;
}

function PromesseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 2 15 8l6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
