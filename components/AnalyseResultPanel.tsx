"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { recomputeThresholdContext, type AnalyseItem, type AnalyseResponse, type Observation } from "@/lib/analyseTypes";
import type { ColorRating } from "@/lib/supabase";
import { Reveal } from "./Reveal";
import { IngredientSpectrum } from "./analyse/IngredientSpectrum";
import { MobileExpander } from "./analyse/MobileExpander";
import { IngredientBlob, type BlobCounts } from "./blob/IngredientBlob";
import { InfoBadge, Tooltip } from "./Tooltip";
import { commonNameFor, prettyInci } from "@/lib/inciCommonNames";
import { AddToRoutineButton } from "./routine/AddToRoutineButton";
import { RestrictionWarning } from "./analyse/RestrictionWarning";
import { useRestrictions } from "@/components/restrictions/RestrictionsProvider";
import { checkRestrictions } from "@/lib/restrictions/check";
import type { IngredientFamily } from "@/lib/restrictions/types";
import { EssentielView, EssentielToggleButton } from "./analyse/EssentielView";
import { PersonalInsightsCards, type PersonalBlocks } from "./analyse/PersonalInsightsCards";
import { VerdictGauge } from "./analyse/VerdictGauge";
import { computeEssentiel, verdictToneFromScore, colorCapScore } from "@/lib/essentiel/engine";
import type { VerdictTone } from "@/lib/essentiel/engine";
import { categoryLabel, type ProductCategory } from "@/lib/categoryLabel";
import { AlternativesCarousel } from "./analyse/AlternativesCarousel";
import { ToolsSection } from "./analyse/ToolsSection";
import { ScoreExplanationModal } from "./analyse/ScoreExplanationModal";
import { decodeHtml } from "@/lib/decodeHtml";
import { categorySlugToDisplayName } from "@/lib/categories";
import { apiFetch } from "@/lib/clientApi";

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
  ean = null,
  analysisId = null,
  brand = null,
  productType = null,
  existingCoherenceId = null,
  autoOpenPromesse = false,
  alreadyInRoutine = false,
  onResetHome,
  breadcrumb,
  productImageUrl = null,
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
  /** EAN of the analysed product. When present enables the alternatives carousel. */
  ean?: string | null;
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
  /** URL of the product image (from catalog / OBF / web). Displayed at the top left. */
  productImageUrl?: string | null;
}) {
  const title = decodeHtml(productLabel?.trim() || "") || "Analyse de votre liste";
  // The "Analyser la promesse" CTA is always offered - the flow handles
  // the "no product name" case gracefully: the web-search step tries the
  // INCI alone, and if nothing crédible comes back the modal falls through
  // to the "décris la promesse toi-même" textarea. Earlier we required a
  // productLabel before enabling the button, which was inconsistent with
  // the history page (where the fallback "Analyse du 17 mai" always made
  // the button active) and surprising for users who pasted an INCI without
  // a name.
  const [promesseOpen, setPromesseOpen] = useState(autoOpenPromesse);
  const [familiesModalOpen, setFamiliesModalOpen] = useState(false);
  const pathname = usePathname();
  // Persist the "is the full analysis open?" / "is the ingredients modal
  // open?" flags in sessionStorage keyed by analysisId. That way:
  //   * a page refresh keeps the user on the exact same view (modal open,
  //     details expanded) instead of resetting them to the 3-card essentiel.
  //   * clicking back from an ingredient detail page (`router.back()` on the
  //     ingredient page) returns to the analyse with the modal still open.
  // Falls back to the default (collapsed, modal closed) when no analysisId.
  //
  // IMPORTANT — we DO NOT seed the initial state from sessionStorage. Doing
  // that would diverge the server-rendered HTML (where window is undefined
  // and the flags are false) from the first client render (which would read
  // the persisted true values) → "hydration failed" React error. Instead we
  // mount with the safe defaults and hydrate from storage in an effect
  // BELOW, after the first paint.
  const uiStorageKey = analysisId ? `analyse-ui:${analysisId}` : null;
  /** La liste détaillée des ingrédients est rendue dans une modal full-screen
   *  ouverte sur clic d'un simple lien dans le panel d'analyse. Garde le
   *  panel principal léger (juste le score + la synthèse + les observations). */
  const [ingredientsModalOpen, setIngredientsModalOpen] = useState(false);
  // When a square of the top 5/10 spectrum is tapped, we open the ingredients
  // modal AND ask it to scroll to that ingredient once its DOM is mounted.
  // `null` = just open the modal at the top of the list.
  const [targetIngredientPosition, setTargetIngredientPosition] = useState<number | null>(null);
  // "Essentiel" snapshot is rendered first; the full analysis grid below is
  // collapsed by default and opens when the user clicks "Voir l'analyse
  // complète". Rules-based (no LLM), so the snapshot is instantly available.
  //
  // We feed the product context to the engine so verbs in "Ce qui est bien"
  // are picked relative to the product type — e.g. "Agent fixant" surfaces
  // as "lie les ingrédients" on a deodorant rather than the wrong-context
  // "fixe la coiffure" we used to show. Prefer `result.category` (closed
  // enum computed server-side) and fall back to the raw OCR `productType`
  // (free-form) so the very first scan is already context-aware.
  const essentiel = useMemo(
    () => computeEssentiel(result, { category: result.category ?? null, productType }),
    [result, productType],
  );
  const cappedTone = verdictToneFromScore(colorCapScore(result.score, result.counts));
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [scoreExplOpen, setScoreExplOpen] = useState(false);
  const detailsRef = useRef<HTMLDivElement | null>(null);

  // Calculate restricted items count for the verdict card
  const { restrictions, families } = useRestrictions();
  // Familles + ingrédients restreints RÉELLEMENT présents dans le produit
  // (détection par tag, identique au mobile et au backend analyser).
  // Compte = familles uniques + ingrédients uniques → "Contient N de vos
  // restrictions" STRICTEMENT identique entre web et mobile.
  const { restrictedCount, restrictedFamilies } = useMemo(() => {
    const matches = checkRestrictions(result.items, restrictions, families);
    const uniqueFamilySlugs = new Set(
      matches.filter((m) => m.kind === "family").map((m) => m.slug)
    );
    const uniqueIngredientSlugs = new Set(
      matches.filter((m) => m.kind === "ingredient").map((m) => m.slug)
    );
    const filtered = families.filter((f) => uniqueFamilySlugs.has(f.slug));
    return {
      restrictedCount: uniqueFamilySlugs.size + uniqueIngredientSlugs.size,
      restrictedFamilies: filtered,
    };
  }, [result.items, restrictions, families]);
  // True once we've finished the post-mount sessionStorage read — keeps the
  // auto-save effect below from clobbering the persisted value with the
  // default `false` BEFORE we've had a chance to restore it.
  const hasHydratedUiRef = useRef(false);

  // Restore UI flags from sessionStorage on first mount (after hydration).
  useEffect(() => {
    if (!uiStorageKey) {
      hasHydratedUiRef.current = true;
      return;
    }
    try {
      const raw = window.sessionStorage.getItem(uiStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          detailsExpanded?: boolean;
          ingredientsModalOpen?: boolean;
        };
        if (parsed.detailsExpanded) setDetailsExpanded(true);
        if (parsed.ingredientsModalOpen) setIngredientsModalOpen(true);
      }
    } catch {
      // Storage unavailable (Safari private mode, quota) — non-fatal.
    }
    hasHydratedUiRef.current = true;
  }, [uiStorageKey]);

  // Persist UI flags whenever they change so a refresh / back-nav can restore.
  // Skipped until the restore effect above has run, otherwise we'd overwrite
  // the persisted value with the initial `false` defaults on the very first
  // render and lose the user's state.
  useEffect(() => {
    if (!hasHydratedUiRef.current || !uiStorageKey) return;
    try {
      window.sessionStorage.setItem(
        uiStorageKey,
        JSON.stringify({ detailsExpanded, ingredientsModalOpen }),
      );
    } catch {
      // Storage quota / Safari private mode — non-fatal.
    }
  }, [uiStorageKey, detailsExpanded, ingredientsModalOpen]);
  // Synthèse SUPPRIMÉE : remplacée par les 3 blocs IA personnalisés
  // (<PersonalInsightsCards/>, rendus sous L'ESSENTIEL). « Voir l'analyse
  // complète » ne déclenche plus d'IA → gratuit.
  const personalBlocks =
    (result as { personalBlocks?: PersonalBlocks | null }).personalBlocks ?? null;
  const personalBlocksKey =
    (result as { personalBlocksKey?: string | null }).personalBlocksKey ?? null;
  useEffect(() => {
    if (autoOpenPromesse) {
      setPromesseOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenPromesse]);

  // Smoothly scroll the full analysis grid into view when the user opens it,
  // so the page doesn't just "grow" beneath them without a visual cue.
  useEffect(() => {
    if (!detailsExpanded || !detailsRef.current) return;
    const el = detailsRef.current;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [detailsExpanded]);

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
      {/* Product header: image left + title/brand right ALWAYS SIDE-BY-SIDE */}
      <div className="flex flex-col gap-4 mb-6 lg:max-w-[900px]">
        {/* Carte commune : image + titre/marque + boutons d'action regroupés */}
        <div className="neu p-3 lg:p-4 flex flex-col gap-4">
          {/* Image + Title/Brand (always horizontal) */}
          <div className="flex flex-row gap-4 items-start">
          {/* Image — agrandie (portrait), occupe la hauteur du bloc titre+marque */}
          {productImageUrl ? (
            <img
              src={productImageUrl}
              alt={productLabel || "Product image"}
              className="w-[104px] h-[118px] shrink-0 rounded-lg object-cover shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)]"
            />
          ) : null}

          {/* Content: title + brand (flex-1 to use remaining space) */}
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            {/* Title — truncate if too long */}
            <TitleBar
              title={title}
              category={result.category ?? null}
              productType={productType ?? result.productType ?? null}
              catalogCategory={result.catalogCategory ?? null}
              breadcrumb={trail}
            />

            {/* Brand + Subcategory — truncate to stay beside image */}
            {(brand || result.catalogCategory) && (
              <div className="text-[13px] font-medium text-ink-muted truncate">
                {brand && <>{brand}</>}
                {brand && result.catalogCategory && <> · </>}
                {result.catalogCategory && <>{categorySlugToDisplayName(result.catalogCategory)}</>}
              </div>
            )}
          </div>
        </div>

          {/* Boutons d'action (vert / rose) dans la carte commune */}
          <div className="flex flex-row items-center gap-2">
            {existingCoherenceId ? (
              <Link
                href={`/promesses/${existingCoherenceId}`}
                className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_8px_20px_-6px_rgba(16,185,129,0.45)] transition-all hover:bg-emerald-600 hover:shadow-[0_12px_28px_-6px_rgba(16,185,129,0.55)]"
              >
                <PromesseIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Voir l&apos;analyse de la promesse</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setPromesseOpen(true)}
                className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_8px_20px_-6px_rgba(16,185,129,0.45)] transition-all hover:bg-emerald-600 hover:shadow-[0_12px_28px_-6px_rgba(16,185,129,0.55)]"
              >
                <PromesseIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Analyser la promesse</span>
              </button>
            )}
            {analysisId ? (
              <AddToRoutineButton
                analysisId={analysisId}
                alreadyInRoutine={alreadyInRoutine}
                className="flex-1 min-w-0"
              />
            ) : null}
          </div>
        </div>

        {/* Partager + Pastilles — en dehors de la carte commune */}
        <div className="flex flex-1 items-center gap-2.5 rounded-full bg-white/85 px-3 py-1.5 ring-1 ring-black/[0.06] backdrop-blur-md transition-all hover:bg-white/95 hover:shadow-[0_6px_20px_-8px_rgba(15,23,42,0.15)]">
            <button
              type="button"
              onClick={() => shareReport(originalText)}
              aria-label="Partager cette analyse"
              className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-ink transition hover:text-rose-700"
            >
              <ShareIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Partager</span>
            </button>
            <span aria-hidden className="lg:hidden h-4 w-px shrink-0 bg-black/10" />
            <VerdictGauge
              tone={cappedTone}
              className="lg:hidden flex-1 justify-between"
            />
          </div>
      </div>
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

      {/* Essentiel snapshot - the 3 rules-based cards (verdict + ce qui est
          bien + à surveiller) that show instantly after an analysis. The full
          AI-powered grid below is collapsed until the user explicitly asks
          for it.
          DESKTOP layout : the 3 cards sit on the left with a soft max-width
          so they don't span the entire row, and the 5-pastille verdict gauge
          is rendered IMMEDIATELY next to them as a vertical column. Both
          flex items use `items-stretch` so the gauge container takes the
          full height of the cards stack, and inside the gauge the pastilles
          spread evenly (`justify-around` + `h-full`) — matching the cards'
          vertical span as requested. */}
      <div className="lg:flex lg:items-stretch lg:gap-8">
        <div className="lg:flex-1 lg:min-w-0 lg:max-w-[640px]">
          {/* `hideToggle` on desktop only: the toggle button is rendered
              OUTSIDE this flex below, so the verdict gauge's `items-stretch`
              matches the 3 cards' height — not the 3 cards + button. On
              mobile (no flex, no gauge column), we render the toggle
              inline via `EssentielToggleButton` further down. */}
          <EssentielView
            data={essentiel}
            expanded={detailsExpanded}
            onToggle={() => setDetailsExpanded((v) => !v)}
            hideToggle
            scoreTone={cappedTone}
            restrictedCount={restrictedCount}
            onShowFamilies={() => setFamiliesModalOpen(true)}
          />
        </div>
        {/* Desktop verdict gauge — same chrome as the mobile toolbar pill
            (rounded-full + white surface + ring + backdrop-blur) so the 5
            pastilles read as a grouped control instead of floating loose
            next to the cards. The active pastille's `ring-4` is allowed to
            overflow the pill horizontally (px-1.5 keeps the side padding
            small enough for the "pop" effect). Height = exactly the cards
            stack — see `hideToggle` note above. */}
        <div className="hidden lg:flex lg:shrink-0 lg:items-stretch">
          <VerdictGauge
            tone={cappedTone}
            orientation="vertical"
            className="h-full justify-around rounded-full bg-white/85 px-1.5 py-3 ring-1 ring-black/[0.06] backdrop-blur-md"
          />
        </div>
      </div>

      {/* 3 blocs IA personnalisés (objectifs / peau / à surveiller) — lazy,
          1 crédit à la génération, verrouillés→/offre si 0 crédit. */}
      <div className="mt-3 lg:max-w-[640px]">
        <PersonalInsightsCards analysisId={analysisId} initialBlocks={personalBlocks} initialBlocksKey={personalBlocksKey} />
      </div>

      {/* Toggle button — rendered OUTSIDE the flex pair above so the gauge's
          stretched height matches only the 3 cards (not cards + button).
          `lg:max-w-[640px]` mirrors the cards column above so the button is
          centred under the cards, not pushed off-centre by the gauge column
          on the right. */}
      <div className="mt-3 flex justify-center pt-2 lg:max-w-[640px]">
        <EssentielToggleButton
          expanded={detailsExpanded}
          onToggle={() => setDetailsExpanded((v) => !v)}
        />
      </div>

      {/*
        Layout via grid-template-areas - same DOM order regardless of
        viewport, but the placement of each section differs:

        MOBILE (single column, user-requested order)
          score → counts → synthesis → spectrum → observations → items

        DESKTOP (3-column bento, SINGLE ROW)
          col 1 (1fr)   : score → counts (24/76/1) → spectrum
          col 2 (1fr)   : observations + synthesis stacked tight
          col 3 (1.3fr) : items (collapsed CTA → expands inline)

        Each desktop column flows as its own flex-col, so a tall column
        (e.g. ingredients table when expanded) NEVER pushes the other two —
        no more empty vertical gap between observations and synthèse.
      */}
      {detailsExpanded && (
      <div
        ref={detailsRef}
        className="mt-6 grid gap-4 grid-cols-1 [grid-template-areas:'score''warning''counts''synthesis''spectrum''observations''items'] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)] lg:items-start lg:[grid-template-areas:'left_middle_items']"
      >
        {/* Left column: on desktop, grouped as a flex column so Score + Counts
            + Spectrum stack tightly with no gap from row height mismatch. On
            mobile, `contents` makes each child participate directly in the
            outer grid (mobile order driven by grid-template-areas). */}
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

          {/* Restriction warning sits right under the score donut so the user
              sees it without scrolling. Renders nothing when no match. */}
          <Reveal delayMs={REVEAL_SCORE_MS + 200} className="[grid-area:warning]">
            <RestrictionWarning items={result.items} />
          </Reveal>

          {/* 24% / 76% / 1% strip — moved ABOVE the spectrum so it reads
              right after the half-donut as the "verdict en chiffres". */}
          <Reveal delayMs={0} className="[grid-area:counts]">
            <PenaltySummaryStrip counts={result.counts} />
          </Reveal>

          {result.spectrum ? (
            <Reveal delayMs={650} className="[grid-area:spectrum]">
              <IngredientSpectrum
                items={result.items}
                top5={result.spectrum.top5}
                top10={result.spectrum.top10}
                onPositionClick={(position) => {
                  setTargetIngredientPosition(position);
                  setIngredientsModalOpen(true);
                }}
              />
            </Reveal>
          ) : null}
        </div>

        {/* Middle column wrapper — observations + synthèse stacked tight in
            a flex-col on desktop. `contents` on mobile preserves the
            single-column flow controlled by grid-template-areas. */}
        <div className="contents lg:flex lg:flex-col lg:gap-4 lg:[grid-area:middle]">
          <Reveal delayMs={500} className="[grid-area:observations]">
            <ObservationsCard observations={result.observations} />
          </Reveal>

          {/* Synthèse supprimée — remplacée par les 3 blocs IA personnalisés
              (PersonalInsightsCards) rendus en haut, sous L'ESSENTIEL. */}
        </div>

        <Reveal delayMs={1000} className="[grid-area:items]">
          {/* Mobile : carte-lien compacte qui ouvre la modal détaillée — garde
              la vue principale légère sur petit écran.
              Desktop : par défaut, même style de carte cliquable. Clic →
              déplie le tableau INLINE dans cette colonne (qui grandit
              indépendamment des autres colonnes). */}
          <div className="lg:hidden">
            <IngredientsLinkCard
              count={result.counts.total}
              onOpen={() => {
                setTargetIngredientPosition(null);
                setIngredientsModalOpen(true);
              }}
            />
          </div>
          {/* Desktop : tableau avec preview des 5 premiers ingrédients + un
              bouton "Voir les X ingrédients →" en pied de table qui déplie
              le reste inline (et bascule en "Replier ↑" une fois ouvert).
              `compact` resserre la typo pour tenir dans la colonne étroite. */}
          <div className="hidden lg:block">
            <h2 className="text-[15px] font-semibold text-ink mb-3 px-1">
              Liste des ingrédients
            </h2>
            <ItemsTable
              items={result.items}
              counts={result.counts}
              compact
              desktopLimit={5}
            />
          </div>
        </Reveal>
      </div>
      )}

      {ingredientsModalOpen ? (
        <IngredientsModal
          items={result.items}
          counts={result.counts}
          scrollToPosition={targetIngredientPosition}
          onClose={() => {
            setIngredientsModalOpen(false);
            setTargetIngredientPosition(null);
          }}
        />
      ) : null}

      {/* Alternatives carousel — appears right after the toggle button when
          the analysis is collapsed (detailsExpanded = false), and at the very
          bottom once expanded, since the `detailsExpanded` block sits between
          the toggle and this element. */}
      <AlternativesCarousel
        ean={ean ?? null}
        category={result.catalogCategory ?? null}
        brand={brand}
        productName={productLabel}
      />

      {/* Petit espace pour décoller le bloc Outils du bouton « Voir l'analyse
          complète » (et du carrousel d'alternatives quand il est présent). */}
      <div className="mt-5">
        <ToolsSection
          ean={ean ?? null}
          productLabel={productLabel ?? null}
          imageUrl={result.imageUrl ?? null}
          brand={brand ?? null}
          catalogCategory={result.catalogCategory ?? null}
          onOpenScoreExpl={() => setScoreExplOpen(true)}
        />
      </div>

      {scoreExplOpen ? (
        <ScoreExplanationModal
          result={result}
          productLabel={title}
          onClose={() => setScoreExplOpen(false)}
        />
      ) : null}

      {/* Modale : familles restreintes du produit */}
      <FamiliesModalWeb open={familiesModalOpen} onClose={() => setFamiliesModalOpen(false)} families={restrictedFamilies} />
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
  scrollToPosition,
}: {
  items: AnalyseItem[];
  counts: AnalyseResponse["counts"];
  onClose: () => void;
  /** When set, the modal scrolls to and flashes the ingredient row at that
   *  position once the table is mounted. Used by the top 5/10 spectrum: tap
   *  on a square should land you on the matching row inside the modal. */
  scrollToPosition?: number | null;
}) {
  useEffect(() => {
    if (!scrollToPosition) return;
    // The table is rendered on the next paint - rAF + a tiny timeout gives
    // the modal's open animation room to start before we scroll, otherwise
    // the smooth scroll fights the slide-in.
    const id = window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        const el = document.getElementById(`ingredient-row-${scrollToPosition}`);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-[#F43F5E]");
        window.setTimeout(() => el.classList.remove("ring-2", "ring-[#F43F5E]"), 1500);
      }, 180);
    });
    return () => window.cancelAnimationFrame(id);
  }, [scrollToPosition]);

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
  category,
  productType,
  catalogCategory,
  breadcrumb,
}: {
  title: string;
  category: ProductCategory | null;
  productType: string | null;
  /** Full catalog category slug (e.g. "hygiene-du-corps/deodorant/deodorant-spray").
   *  When present, the last segment is resolved to a display name and shown
   *  as "sous-catégorie · marque" below the product title. */
  catalogCategory?: string | null;
  breadcrumb: BreadcrumbItem[] | null;
}) {
  const subCategoryDisplay = catalogCategory
    ? categorySlugToDisplayName(catalogCategory)
    : (categoryLabel(category) ?? productType ?? null);
  // Standard convention: last item is the current location (not clickable).
  const trail = breadcrumb ? breadcrumb.slice(0, -1) : [];
  const current = breadcrumb ? breadcrumb[breadcrumb.length - 1] : undefined;
  return (
    <header className="flex flex-col gap-3">
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
        <h1 className="mt-1 line-clamp-2 text-lg font-bold tracking-tight text-ink sm:text-2xl">
          {title}
        </h1>
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
  // Same layout on every viewport (per design): half-donut gauge on the right,
  // and the recognised-ingredients ratio underneath. Product photo is now
  // displayed in the header above the title (like mobile). No centre count and
  // no "% sans pénalité" line — that figure is already carried by the
  // PenaltySummaryStrip right below this card.
  return (
    <article className="rounded-2xl bg-white/65 p-5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl">
      <div className="flex w-full justify-center">
        {/* Gauge column centred; the ratio text sits centred under the gauge.
            The gauge width is capped so it reads properly. */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-[170px] sm:w-[200px]">
            <IngredientBlob counts={counts} variant="md" animate />
          </div>
          <p className="text-[12px] text-ink-subtle">
            <span className="font-semibold text-ink">{matched}</span> / {total} ingrédients reconnus
          </p>
        </div>
      </div>
    </article>
  );
}

function PenaltySummaryStrip({ counts }: { counts: AnalyseResponse["counts"] }) {
  // All ratios are computed against `matched` (recognised ingredients only).
  // Non-recognised ingredients aren't classified, so it would be misleading
  // to lump them into either bucket.
  const matched = counts.matched;
  const penalised = counts.jaune + counts.orange + counts.rouge;
  const pctSafe = matched > 0 ? Math.round((counts.vert / matched) * 100) : 0;
  const pctPenalised = matched > 0 ? Math.round((penalised / matched) * 100) : 0;
  const atRisk = counts.rouge;

  const stats = [
    {
      key: "safe",
      icon: <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-600" />,
      iconBg: "bg-emerald-50",
      value: `${pctSafe} %`,
      label: "sans pénalité",
    },
    {
      key: "penalty",
      icon: <WarningIcon className="h-3.5 w-3.5 text-amber-600" />,
      iconBg: "bg-amber-50",
      value: `${pctPenalised} %`,
      label: "avec pénalité",
    },
    {
      key: "risk",
      icon: <XSquareIcon className="h-3.5 w-3.5 text-rose-600" />,
      iconBg: "bg-rose-50",
      value: `${atRisk}`,
      label: "à risque fort",
    },
  ];

  return (
    <article className="rounded-2xl bg-white/65 p-1.5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl sm:p-2">
      <ul className="grid grid-cols-3 gap-0.5 sm:gap-1">
        {stats.map((s, i) => (
          <li
            key={s.key}
            className="stagger-up flex min-w-0 items-center gap-0.5 p-0 sm:gap-1 sm:p-0.5"
            style={{ ["--stagger-delay" as string]: `${60 + i * 80}ms` } as React.CSSProperties}
          >
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm sm:h-6 sm:w-6 sm:rounded-md ${s.iconBg}`}
            >
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold tabular-nums leading-tight text-ink sm:text-xs">
                {s.value}
              </p>
              <p className="whitespace-nowrap text-[8px] text-ink-subtle sm:text-[9px]">
                {s.label}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </article>
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
  // Carry the current analyse URL on every ingredient link so the back button
  // / breadcrumb on the ingredient page can return here instead of /home.
  const pathname = usePathname();
  const fromParam = encodeURIComponent(pathname || "/");

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
                          href={`/i/${it.slug}?from=${fromParam}`}
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
      <span className="flex-1 min-w-0 overflow-hidden text-ink">
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
    <span className="flex-1 min-w-0 overflow-hidden text-ink">
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

/**
 * Lightweight skeleton shown while /api/synthesis is generating the AI
 * commentary on the first expand. Renders pulsing placeholder bars instead
 * of the (briefly empty) SynthesisCard so the area never looks broken.
 */
function SynthesisLoadingCard() {
  return (
    <article
      className="rounded-2xl bg-white/65 p-5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl"
      aria-busy="true"
    >
      <h2 className="text-[15px] font-semibold text-ink mb-3">Synthèse</h2>
      <div className="space-y-2.5">
        <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-11/12 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-9/12 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-10/12 bg-gray-200 rounded animate-pulse" />
      </div>
      <p className="mt-4 text-[12px] italic text-[#6B7280]">
        Génération de la synthèse en cours…
      </p>
    </article>
  );
}

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
  const pathname = usePathname();
  const fromParam = encodeURIComponent(pathname || "/");
  // Build name → colorRating and name → slug lookups so bold INCI names in
  // the synthesis can be tinted and made clickable. Indexed on both the
  // canonical name and the user-typed token so spelling variants resolve.
  const { colorByName, slugByName } = useMemo(() => {
    const colorByName = new Map<string, ColorRating>();
    const slugByName = new Map<string, string>();
    for (const it of items) {
      const keys = [
        it.name ? normaliseSynthesisToken(it.name) : null,
        it.input ? normaliseSynthesisToken(it.input) : null,
      ].filter(Boolean) as string[];
      for (const key of keys) {
        if (it.colorRating) colorByName.set(key, it.colorRating);
        if (it.slug) slugByName.set(key, it.slug);
      }
    }
    return { colorByName, slugByName };
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
                  {renderBoldMarkdown(block.text, colorByName, slugByName, fromParam)}
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
                        {renderBoldMarkdown(item, colorByName, slugByName, fromParam)}
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
  slugByName?: Map<string, string>,
  fromParam?: string,
): React.ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) {
      const inner = p.slice(2, -2);
      const normalised = normaliseSynthesisToken(inner);
      const rating = colorByName?.get(normalised);
      const tone = rating ? colorForRating(rating) : "text-ink";
      const slug = slugByName?.get(normalised);
      const href = slug && fromParam ? `/i/${slug}?from=${fromParam}` : null;
      // Grand-public translation: if we know "AQUA" as "eau", render
      // "**eau** (Aqua)" so the body copy reads naturally while keeping the
      // INCI token visible for label cross-reference. Only triggered when
      // the mapping has an entry - other tokens render unchanged.
      const common = commonNameFor(normalised);
      const label = common ?? inner;
      const strong = (
        <strong className={`font-semibold ${tone}${href ? " cursor-pointer underline-offset-2 hover:underline" : ""}`}>
          {label}
        </strong>
      );
      return (
        <span key={i}>
          {href ? <Link href={href}>{strong}</Link> : strong}
          {common ? <span className="text-ink-subtle"> ({prettyInci(inner)})</span> : null}
        </span>
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
  // Carry the current analyse URL on every row's "voir la fiche" arrow so
  // the back button / breadcrumb on the ingredient page can return here.
  const pathname = usePathname();
  const fromParam = encodeURIComponent(pathname || "/");

  // Recompute on read so analyses saved before the ≤1 % rule change (parfum
  // is now the preferred reference, not the first preservative) are still
  // displayed with the current logic - no DB migration needed.
  const normalizedItems = useMemo(() => recomputeThresholdContext(items), [items]);

  // Derive counts from the resolved color (colorRating ?? dbColorRating) so
  // "suggestion" matches (colorRating=null, dbColorRating=Vert) are counted
  // in their real color bucket instead of "Non reconnu". Mirrors what
  // ColorChip already does for display — keeps filter tabs + display coherent.
  const itemCounts = useMemo(() => {
    const c = { all: 0, Vert: 0, Jaune: 0, Orange: 0, Rouge: 0, unknown: 0 };
    for (const it of normalizedItems) {
      const r = it.colorRating ?? it.dbColorRating;
      c.all++;
      if (r === "Vert") c.Vert++;
      else if (r === "Jaune") c.Jaune++;
      else if (r === "Orange") c.Orange++;
      else if (r === "Rouge") c.Rouge++;
      else c.unknown++;
    }
    return c;
  }, [normalizedItems]);

  const filtered = useMemo(() => {
    let out = normalizedItems;
    if (filter !== "all") {
      if (filter === "unknown") {
        out = out.filter((i) => (i.colorRating ?? i.dbColorRating) === null);
      } else {
        out = out.filter((i) => (i.colorRating ?? i.dbColorRating) === filter);
      }
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
  }, [normalizedItems, filter, search]);

  const tabs: { key: typeof filter; label: string; count: number }[] = [
    { key: "all", label: "Tous", count: itemCounts.all },
    { key: "Vert", label: "Vert", count: itemCounts.Vert },
    { key: "Jaune", label: "Jaune", count: itemCounts.Jaune },
    { key: "Orange", label: "Orange", count: itemCounts.Orange },
    { key: "Rouge", label: "Rouge", count: itemCounts.Rouge },
  ];
  if (itemCounts.unknown > 0) {
    tabs.push({ key: "unknown", label: "Non reconnu", count: itemCounts.unknown });
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

      {/* `table-fixed` + an explicit colgroup so the rightmost "arrow" column
          NEVER gets pushed off-screen when the modal narrows. Long ingredient
          names wrap naturally in column 1 instead of forcing horizontal
          overflow. Padding shrinks on mobile so the 3 visible columns always
          fit even on a 360 px viewport. */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-[13px] table-fixed">
          <colgroup>
            <col />
            <col className="hidden md:table-column w-[100px]" />
            <col className="w-[60px]" />
            <col className="w-[40px]" />
          </colgroup>
          <thead>
            <tr className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
              <th className="px-3 sm:px-5 py-3">Ingrédient</th>
              <th className="px-3 sm:px-5 py-3 max-md:hidden">Fonction</th>
              <th className="px-2 sm:px-5 py-3">Tolérance</th>
              <th className="px-2 sm:px-5 py-3 text-right">Détails</th>
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
                // Padding scales down on mobile so the 3 visible columns
                // (Ingrédient + Tolérance + Détails) always fit a 360 px modal
                // without the rightmost cell being clipped.
                const cellPad = compact ? "px-2 py-1.5" : "px-3 sm:px-4 py-2.5";
                const ratingCellPad = compact ? "px-1.5 py-1.5" : "px-2 sm:px-3 py-2.5";
                const arrowCellPad = compact ? "px-0.5 py-1.5" : "px-1 sm:px-2 py-2.5";
                return (
                <tr
                  key={`${i.position}-${i.input}`}
                  id={`ingredient-row-${i.position}`}
                  className={`border-t border-black/[0.04] transition-colors hover:bg-rose-50/30 scroll-mt-24 ${hiddenCls}`}
                >
                  <td className={cellPad}>
                    {/* Truncate with ellipsis on phones so a long INCI name
                        like "Vp/Acrylates/Lauryl Methacrylate Copolymer"
                        doesn't blow the row up to 3-4 lines. On ≥sm limit to 2 lines
                        with line-clamp-2 to prevent overflow. The full name is
                        kept in `title` so a long-press / hover still reveals it. */}
                    <div
                      className={`font-semibold text-ink truncate sm:line-clamp-2 ${compact ? "text-[13px]" : ""}`}
                      title={prettyName(i.name ?? i.input)}
                    >
                      {prettyName(i.name ?? i.input)}
                    </div>
                    {i.translationFr ? (
                      <div
                        className="text-[11px] text-ink-muted truncate sm:line-clamp-2"
                        title={i.translationFr}
                      >
                        {i.translationFr}
                      </div>
                    ) : i.matchKind === null ? (
                      <div className="text-[11px] text-ink-subtle">Non reconnu</div>
                    ) : null}
                  </td>
                  <td className={`${cellPad} text-ink-muted max-md:hidden ${compact ? "hidden xl:table-cell" : ""}`}>
                    {i.primaryFunction || "-"}
                  </td>
                  <td className={ratingCellPad}>
                    <ColorChip rating={i.colorRating} fallback={i.dbColorRating} />
                    {/*
                      "≤ 1 %" badge - shown when the ingredient sits *after* the
                      first fragrance (preferred reference for cosmetic
                      products like creams, lotions, shampoos where parfum is
                      dosed below 1 %). Falls back to "after preservative" only
                      when the formula has no fragrance at all - the engine
                      picks one reference, never both.
                    */}
                    {i.thresholdContext === "after_fragrance"
                    || i.thresholdContext === "after_preservative" ? (
                      <Tooltip
                        maxWidth={280}
                        content={
                          <>
                            Cet ingrédient apparaît{" "}
                            <b>
                              {i.thresholdContext === "after_fragrance"
                                ? "après le premier parfum"
                                : "après le premier conservateur"}
                            </b>{" "}
                            dans la liste INCI. Sa concentration est donc{" "}
                            <b>≤ 1 %</b> - il est peu probable qu&apos;il soit
                            l&apos;élément principal responsable de
                            l&apos;efficacité du produit.
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
                  <td className={`${arrowCellPad} text-right`}>
                    {i.slug ? (
                      <Link
                        href={`/i/${i.slug}?from=${fromParam}`}
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

function ColorChip({
  rating,
  fallback = null,
}: {
  rating: ColorRating | null;
  /** Color carried by the matched slug in the DB even when `rating` is null
   *  (i.e. low-confidence "suggestion" match). When provided, the chip renders
   *  in that colour so the list stays consistent with the ingredient detail
   *  page. Visually identical to a confirmed match — the slug's classification
   *  is trusted as-is. */
  fallback?: ColorRating | null;
}) {
  const effective = rating ?? fallback ?? null;
  if (!effective) {
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
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${map[effective].text}`}>
      <span className={`h-2 w-2 rounded-full ${map[effective].dot}`} aria-hidden />
      {effective}
    </span>
  );
}

// ============================================================
// Helpers
// ============================================================
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
// Familles Modal
// ============================================================
function FamiliesModalWeb({ open, onClose, families: restrictedFamilies }: { open: boolean; onClose: () => void; families: IngredientFamily[] }) {
  if (!open || restrictedFamilies.length === 0) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xs mx-4 max-h-[70vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Familles restreintes</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-3">
          {restrictedFamilies.map((family, idx) => {
            const familyName = family?.name || family?.slug || String(family);
            return (
              <div key={family.slug || idx} className="flex items-center gap-3">
                <svg className="w-5 h-5 text-rose-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2 15 8l6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z" />
                </svg>
                <span className="text-sm font-medium text-gray-900">{familyName}</span>
              </div>
            );
          })}
        </div>

        {/* Button */}
        <div className="px-6 py-4 border-t border-gray-200">
          <Link
            href="/profile/restrictions"
            className="block w-full bg-rose-50 text-rose-700 font-medium py-2.5 rounded-lg text-center hover:bg-rose-100 transition"
          >
            Voir toutes mes familles
          </Link>
        </div>
      </div>
    </div>
  );
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

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function XSquareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
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
