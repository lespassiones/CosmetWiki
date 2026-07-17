"use client";

/**
 * CompatibilityCard (web) — carte « Score de compatibilité » : % du produit vs
 * le profil, via /api/personal-insights (MÊME appel que les 3 blocs, 1 crédit).
 * MIROIR EXACT du composant mobile (components/analysis/CompatibilityCard.tsx) :
 *   - Titre « Score de compatibilité à ton profil » À GAUCHE, en tête de carte.
 *   - Anneau 132px À GAUCHE (le % est DANS le cercle), textes À DROITE
 *     (chip label tonal, sous-titre IA, « Ce qu'il faut retenir » → modal).
 *   - Calcul en cours : anneau ROTATIF (arc qui tourne) + barres pulsantes.
 *   - Apparition : l'arc se REMPLIT de 0 au score (900 ms), le chiffre compte.
 *   - La ligne RESTRICTIONS vit DANS la carte, sous un séparateur (comme mobile).
 * États : ready / locked (429 → /offre) / profileIncomplete → section exacte /
 * loading / error.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { PersonalBlocksList } from "./PersonalInsightsCards";
import type { PersonalBlocks } from "./personalInsightsState";
import type { Compatibility } from "@/lib/ai/personalInsights";

// Synchro avec PERSONAL_PROMPT_VERSION (lib/ai/personalInsights.ts).
// v29 : produit hors profil → score = qualité, lignes IA informatives (0 pt).
// v30 : sensibilités déduites = -8. v31 : hors profil → positif via les 3 blocs IA.
const PERSONAL_BLOCKS_VERSION = 31;

type MissingSection = "skin" | "hair";

type State =
  | { status: "loading" }
  | { status: "ready"; blocks: PersonalBlocks; compatibility: Compatibility | null }
  | { status: "locked" }
  | { status: "profileIncomplete"; missingSection: MissingSection }
  | { status: "error" };

const TONE: Record<
  Compatibility["tone"],
  { hex: string; ringDark: string; chip: string; text: string }
> = {
  // hex = teinte de l'arc (couleur PLEINE, pas de dégradé) ;
  // ringDark = teinte de la tranche d'extrusion (l'épaisseur 3D dessous).
  vert: { hex: "#059669", ringDark: "#065F46", chip: "bg-emerald-100 text-emerald-600", text: "text-emerald-600" },
  jaune: { hex: "#F59E0B", ringDark: "#B45309", chip: "bg-amber-100 text-amber-600", text: "text-amber-600" },
  orange: { hex: "#F97316", ringDark: "#C2410C", chip: "bg-orange-100 text-orange-600", text: "text-orange-600" },
  rouge: { hex: "#F43F5E", ringDark: "#BE123C", chip: "bg-rose-100 text-rose-600", text: "text-rose-600" },
};

const RING_SIZE = 132;
// Tube épais : nécessaire pour que le relief 3D (dégradé + tranche) se lise.
const RING_STROKE = 12;
/** Décalage vertical de la tranche d'extrusion (l'épaisseur 3D sous l'anneau). */
const RING_DEPTH = 3;
const FILL_MS = 900;

/** Progression 0→1 (easing cubic-out) pilotant l'arc ET le compteur (parité mobile). */
function useFillProgress(duration = FILL_MS): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      setP(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);
  return p;
}

// ── Anneau REMPLI animé (0 → score) + compteur central, 3D SIMPLE ────────────
// Deux couches, rien d'autre (pas de dégradé, pas de reflet, pas d'ombre
// portée) : la face en couleur PLEINE + la même forme décalée de RING_DEPTH px
// vers le bas en teinte sombre = l'épaisseur. Même principe que les étoiles.
// L'animation d'origine (remplissage 0 → score + compteur) est conservée.
function FillRing({ score, tone }: { score: number; tone: Compatibility["tone"] }) {
  const { hex, ringDark } = TONE[tone];
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;
  const r = (RING_SIZE - RING_STROKE) / 2 - RING_DEPTH;
  const circ = 2 * Math.PI * r;
  const p = useFillProgress();
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const filled = circ * pct * p;
  const shown = Math.round(score * p);
  return (
    <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
        {/* Épaisseur du rail (même forme, décalée, plus sombre) */}
        <circle cx={cx} cy={cy + RING_DEPTH} r={r} fill="none" stroke="#CBD0D8" strokeWidth={RING_STROKE} />
        {/* Rail */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth={RING_STROKE} />
        {/* Épaisseur de l'arc */}
        <circle
          cx={cx}
          cy={cy + RING_DEPTH}
          r={r}
          fill="none"
          stroke={ringDark}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ - filled}`}
          transform={`rotate(-90 ${cx} ${cy + RING_DEPTH})`}
        />
        {/* Arc de progression (couleur pleine) */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={hex}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ - filled}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      {/* Compteur CENTRÉ dans le cercle (l'ancien items-baseline sur la couche
          absolue collait le « 100% » en HAUT du cercle — bug vu en prod). */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex items-baseline">
          <span className="text-[40px] font-bold leading-none tracking-tight text-[#111111]">{shown}</span>
          {/* « 100 % » avec un léger espace (maquette). */}
          <span className="ml-1 text-[18px] font-bold text-[#111111]">%</span>
        </span>
      </div>
    </div>
  );
}

// ── Anneau ROTATIF (calcul en cours) : un arc qui tourne en boucle ────────────
function SpinnerRing() {
  // Même géométrie que FillRing (rayon réduit de RING_DEPTH) pour éviter tout
  // saut visuel au passage loading → ready.
  const r = (RING_SIZE - RING_STROKE) / 2 - RING_DEPTH;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
        <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={RING_STROKE} />
      </svg>
      <div className="absolute inset-0 animate-[spin_1.1s_linear_infinite]">
        <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={r}
            fill="none"
            stroke="#8B5CF6"
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={`${circ * 0.22} ${circ * 0.78}`}
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        </svg>
      </div>
    </div>
  );
}

export function CompatibilityCard({
  analysisId,
  initialCompatibility,
  initialBlocks,
  initialBlocksKey,
  restrictedCount = 0,
  onShowRestrictedFamilies,
}: {
  analysisId: string | null;
  initialCompatibility?: Compatibility | null;
  initialBlocks?: PersonalBlocks | null;
  initialBlocksKey?: string | null;
  /** Ligne restrictions (déterministe, toujours affichée sous le score). */
  restrictedCount?: number;
  onShowRestrictedFamilies?: () => void;
}) {
  const router = useRouter();
  const hasInitial = Boolean(initialCompatibility && initialBlocks);
  const [state, setState] = useState<State>(
    hasInitial
      ? { status: "ready", blocks: initialBlocks as PersonalBlocks, compatibility: initialCompatibility ?? null }
      : { status: "loading" },
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fetchedRef = useRef(false);

  // Portail : on ne rend le modal qu'après montage client (document dispo).
  useEffect(() => setMounted(true), []);

  const stale =
    hasInitial && (!initialBlocksKey || !initialBlocksKey.startsWith(`v${PERSONAL_BLOCKS_VERSION}:`));

  async function run(background = false) {
    if (!analysisId) {
      if (!background) setState({ status: "error" });
      return;
    }
    if (!background) setState({ status: "loading" });
    try {
      const r = await fetch("/api/personal-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, compat: true }),
      });
      if (!r.ok) {
        if (background) return;
        setState(r.status === 429 ? { status: "locked" } : { status: "error" });
        return;
      }
      const j = (await r.json()) as {
        blocks?: PersonalBlocks;
        compatibility?: Compatibility | null;
        profileIncomplete?: boolean;
        missingSection?: MissingSection;
      };
      if (j.profileIncomplete) {
        if (background) return;
        setState({ status: "profileIncomplete", missingSection: j.missingSection ?? "skin" });
        return;
      }
      if (j.blocks?.goals && j.blocks.skin && j.blocks.watch) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("cosmecheck:credits-updated"));
        }
        setState({ status: "ready", blocks: j.blocks, compatibility: j.compatibility ?? null });
      } else if (!background) {
        setState({ status: "error" });
      }
    } catch {
      if (!background) setState({ status: "error" });
    }
  }

  useEffect(() => {
    if (fetchedRef.current) return;
    if (!hasInitial) {
      fetchedRef.current = true;
      run();
      return;
    }
    if (stale) {
      fetchedRef.current = true;
      run(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisId]);

  // Escape ferme le modal.
  useEffect(() => {
    if (!modalOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setModalOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  // « ✦ Ce qu'il faut retenir … › » — dans un BLOC encadré (demande user) :
  // fond blanc, liseré, ombre douce ; chevron repoussé au bord droit.
  const retainRow = (
    <span className="flex w-full items-center gap-1.5 rounded-2xl bg-white px-3.5 py-3 text-[13px] font-semibold text-[#111111] ring-1 ring-black/[0.08] shadow-[0_2px_12px_-6px_rgba(15,23,42,0.14)]">
      <svg viewBox="0 0 24 24" fill="#8B5CF6" className="h-3.5 w-3.5 shrink-0" aria-hidden>
        <path d="M12 2c.5 4.5 2.5 7.5 8 8-5.5 1.5-7.5 4.5-8 10-.5-5.5-2.5-8.5-8-10 5.5-.5 7.5-3.5 8-8z" />
      </svg>
      Ce qu&apos;il faut retenir
      <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2} className="ml-auto h-3.5 w-3.5 shrink-0">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </span>
  );

  // ── Ligne restrictions (toujours affichée sous le score) — maquette web :
  // bouclier-check VERT + texte SOMBRE quand tout va bien ; bouclier-alerte
  // rose + texte rose quand une restriction matche.
  const hasRestriction = restrictedCount > 0;
  const restrictionText = hasRestriction
    ? `Contient ${restrictedCount} de tes restrictions`
    : "Aucune de tes restrictions détectée";
  const restrictionLine = (
    <button
      type="button"
      onClick={() => {
        if (hasRestriction) onShowRestrictedFamilies?.();
        else router.push("/profile/restrictions");
      }}
      className="flex w-full items-center gap-2.5 text-left transition hover:opacity-70"
      aria-label={restrictionText}
    >
      {hasRestriction ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0" aria-hidden>
          <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
          <line x1="12" y1="8" x2="12" y2="13" />
          <circle cx="12" cy="16.5" r="0.6" fill="#E11D48" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="#059669" className="h-[18px] w-[18px] shrink-0" aria-hidden>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3zm3.7 8.2-4.2 4.6a1 1 0 0 1-1.46.02L8.3 13a1 1 0 1 1 1.4-1.42l1.03 1.02 3.5-3.83a1 1 0 0 1 1.47 1.35z"
          />
        </svg>
      )}
      <span
        className={`min-w-0 flex-1 text-[13px] font-medium ${hasRestriction ? "text-rose-600 font-semibold" : "text-[#374151]"}`}
      >
        {restrictionText}
      </span>
      <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2} className="h-3.5 w-3.5 shrink-0">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  );

  return (
    <article className="card-white p-5">
      {/* Titre de carte, en gros, À GAUCHE — libellé de la maquette web. */}
      {/* Titre en VIOLET accent (demande user, parité web/mobile). */}
      <h2 className="mb-3 text-left text-[18px] font-bold tracking-tight text-[#8B5CF6]">
        Compatibilité avec ton profil
      </h2>

      {state.status === "loading" ? (
        <>
          {/* Skeleton aligné sur le layout final : chip sous le titre, puis
              cercle + colonne droite. */}
          <div className="h-[26px] w-[130px] animate-pulse rounded-lg bg-gray-200" />
          <div className="mt-4 flex items-center gap-4">
            <SpinnerRing />
            <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-2">
              <div className="h-3 w-[150px] animate-pulse rounded-md bg-gray-200" />
              <div className="h-3 w-[120px] animate-pulse rounded-md bg-gray-200" />
              <div className="h-[42px] w-full animate-pulse rounded-2xl bg-gray-200" />
            </div>
          </div>
        </>
      ) : null}

      {state.status === "error" ? (
        <div className="flex flex-col items-center gap-1 py-4 text-center">
          <span className="text-[13px] text-ink-subtle">Compatibilité indisponible.</span>
          <button type="button" onClick={() => run()} className="text-[13px] font-semibold text-[#8B5CF6]">
            Réessayer
          </button>
        </div>
      ) : null}

      {state.status === "profileIncomplete" ? (
        <div className="flex w-full flex-col items-center py-3 text-center">
          <span className="mb-2 grid h-12 w-12 place-items-center rounded-full bg-violet-100 text-violet-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" />
            </svg>
          </span>
          <p className="text-[15px] font-bold text-[#111111]">Complète ton profil</p>
          <p className="mt-1 max-w-sm text-[13px] text-ink-subtle">
            {state.missingSection === "hair"
              ? "Renseigne tes cheveux pour voir ta compatibilité avec ce produit."
              : "Renseigne ta peau pour voir ta compatibilité avec ce produit."}
          </p>
          {/* « next » = on revient AU PRODUIT après enregistrement (pas /profile). */}
          <button
            type="button"
            onClick={() =>
              router.push(
                `/profile/beauty?section=${state.missingSection}&next=${encodeURIComponent(
                  typeof window !== "undefined" ? window.location.pathname : "/",
                )}`,
              )
            }
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#8B5CF6] px-5 py-2 text-[14px] font-semibold text-white"
          >
            Compléter mon profil
          </button>
          {/* Recharger : au retour de l'édition, relance l'analyse. Profil
              complété → score ; sinon → même blocage. */}
          <button
            type="button"
            onClick={() => run()}
            className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8B5CF6]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Recharger
          </button>
        </div>
      ) : null}

      {state.status === "locked" ? (
        <button type="button" onClick={() => router.push("/offre")} className="block w-full">
          <div className="relative overflow-hidden rounded-3xl">
            <div className="flex items-center gap-4 blur-[5px]" aria-hidden>
              <div
                className="shrink-0 rounded-full border-emerald-200"
                style={{ width: RING_SIZE, height: RING_SIZE, borderWidth: RING_STROKE }}
              />
              <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                <div className="h-[26px] w-[110px] rounded-full bg-black/10" />
                <div className="h-3 w-[150px] rounded-md bg-black/10" />
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/55 px-5 text-center">
              <span className="mb-2 grid h-11 w-11 place-items-center rounded-full bg-violet-100 text-violet-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              </span>
              <p className="text-[15px] font-bold text-[#111111]">Ta compatibilité</p>
              <p className="mt-1 max-w-sm text-[13px] text-ink-subtle">
                Découvre à quel point ce produit te correspond.
              </p>
              <span className="mt-3 inline-flex items-center rounded-full bg-[#8B5CF6] px-5 py-2 text-[14px] font-semibold text-white">
                Débloquer avec Premium
              </span>
            </div>
          </div>
        </button>
      ) : null}

      {state.status === "ready" && state.compatibility ? (
        <>
          {/* Phrase-verdict (chip tonale) SOUS le titre, avant le cercle. */}
          <span
            className={`inline-flex max-w-full items-center truncate rounded-lg px-3 py-[5px] text-[13px] font-semibold ${TONE[state.compatibility.tone].chip}`}
          >
            {state.compatibility.label}
          </span>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-4 flex w-full items-center gap-5 text-left"
            aria-label="Voir ce qu'il faut retenir"
          >
            {/* Anneau 3D à GAUCHE, % dedans, remplissage animé */}
            <FillRing score={state.compatibility.score} tone={state.compatibility.tone} />
            {/* Textes à DROITE, centrés VERTICALEMENT par rapport au cercle */}
            <span className="flex min-w-0 flex-1 flex-col items-start justify-center gap-3">
              {state.compatibility.subtitle ? (
                <span className="text-[13px] leading-[18px] text-ink-subtle">
                  {/* 1re lettre en MAJUSCULE (maquette) — l'IA renvoie en minuscule. */}
                  {state.compatibility.subtitle.charAt(0).toUpperCase() + state.compatibility.subtitle.slice(1)}
                </span>
              ) : null}
              {retainRow}
            </span>
          </button>
        </>
      ) : null}

      {state.status === "ready" && !state.compatibility ? (
        <button type="button" onClick={() => setModalOpen(true)} className="flex w-full flex-col items-center py-3 text-center">
          <p className="text-[15px] font-bold text-[#111111]">Analyse personnalisée</p>
          <p className="mt-1 text-[13px] text-ink-subtle">Découvre ce qu&apos;il faut retenir pour toi.</p>
          {retainRow}
        </button>
      ) : null}

      {/* Ligne restrictions — toujours présente, sous le score (parité mobile) */}
      <div className="my-4 h-px bg-black/[0.06]" />
      {restrictionLine}

      {/* Modal « Ce qu'il faut retenir » — rendu en PORTAIL sur <body> pour passer
          AU-DESSUS de la bottom nav (z-[80]) et du bouton advisor (z-[75]). */}
      {mounted && modalOpen && state.status === "ready" ? createPortal((
        <div
          // Fenêtre FLOTTANTE centrée au-dessus de la page (demande user) :
          // arrière-plan ASSOMBRI + FLOUTÉ (backdrop-blur), plus de bottom sheet.
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-md p-4"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#FAFAFA] p-5 shadow-[0_24px_70px_-20px_rgba(15,23,42,0.45)] animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-ink">Ce qu&apos;il faut retenir</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Fermer"
                className="grid h-9 w-9 place-items-center rounded-full bg-black/[0.06] text-ink"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            {state.compatibility?.breakdown ? (
              <article className="card-white mb-3 p-4">
                <h3 className="mb-2 text-[15px] font-bold text-[#111111]">Le calcul de ton score</h3>
                {/* Puces QUALITATIVES (choix user) : le POURQUOI, sans chiffres ;
                    seul le total est chiffré. Le dot coloré porte le sens. */}
                <div className="flex items-center gap-2 py-1">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1F2937]" />
                  <span className="min-w-0 flex-1 text-[13px] text-ink-subtle">
                    Point de départ : la qualité de la formule
                  </span>
                </div>
                {state.compatibility.relevance === "product_only" ? (
                  <div className="flex items-center gap-2 py-1">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                    <span className="min-w-0 flex-1 text-[13px] text-ink-subtle">
                      Produit du quotidien : le score suit la qualité de la formule
                    </span>
                  </div>
                ) : state.compatibility.breakdown.lines.length === 0 ? (
                  <div className="flex items-center gap-2 py-1">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                    <span className="min-w-0 flex-1 text-[13px] text-ink-subtle">
                      Aucun actif marquant pour ton profil : ni bonus ni malus
                    </span>
                  </div>
                ) : null}
                {/* Lignes signées (bonus/malus). La ligne « Plafond : … » est
                    MASQUÉE à l'affichage (demande user 16 juil 2026) : le plafond
                    reste appliqué au calcul, invisible ici. */}
                {state.compatibility.breakdown.lines.filter((l) => !/^Plafond\b/i.test(l.label)).map((l, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        l.points >= 0 ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />
                    <span className="min-w-0 flex-1 text-[13px] leading-snug text-ink-subtle">{l.label}</span>
                  </div>
                ))}
                <div className="my-1.5 h-px bg-black/[0.06]" />
                <div className="flex items-center justify-between gap-3 py-1">
                  <span className="text-[14px] font-bold text-[#111111]">Ton score</span>
                  <span className={`text-[18px] font-bold ${TONE[state.compatibility.tone].text}`}>
                    {state.compatibility.score}%
                  </span>
                </div>
              </article>
            ) : null}
            <PersonalBlocksList
              blocks={state.blocks}
              hideSkin={(state.compatibility?.score ?? 100) < 60}
            />
          </div>
        </div>
      ), document.body) : null}
    </article>
  );
}
