"use client";

/**
 * GoalsCoverageCard (web) — bloc « Couverture de tes objectifs » de la page
 * routine. Twin du composant mobile : jauges horizontales par objectif, calculées
 * par la MÊME Edge Function `goals-coverage` (invoquée directement, session via
 * cookies) selon tous les produits de la routine + le profil.
 *
 * États : no_goals (→ /profile/beauty) · empty_routine · needs_eval (bouton
 * « Évaluer », 3 crédits) · ready (jauges + reload conditionnel) · crédits
 * épuisés (→ /offre). Lecture initiale = ligne routine_goal_coverage passée par
 * le serveur (0 appel edge pour l'affichage).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CoverageItem,
  type CoverageTone,
  type GoalCoverageRow,
  GOALS_COVERAGE_VERSION,
} from "@/lib/routine/goalsCoverage";

const EVAL_COST = 3;

const SHORT_GOAL_LABEL: Record<string, string> = {
  peau_douce: "Peau douce",
  teint_uniforme: "Teint uniforme",
  attenuer_boutons: "Anti-imperfections",
  reduire_rides: "Anti-âge",
  calmer_rougeurs: "Anti-rougeurs",
  hydrater_profondeur: "Hydratation",
  reduire_taches: "Anti-taches",
  renforcer_barriere: "Barrière cutanée",
  adoucir_corps: "Douceur du corps",
  reduire_vergetures: "Vergetures",
  proteger_soleil: "Protection solaire",
  cheveux_brillants: "Brillance cheveux",
  renforcer_cheveux: "Cheveux renforcés",
  definir_boucles: "Boucles définies",
  cuir_chevelu_sain: "Cuir chevelu",
  reduire_chute: "Anti-chute",
  simplifier_routine: "Routine simple",
  decouvrir_clean: "Produits clean",
  comprendre_produits: "Comprendre",
  eviter_risques: "Éviter les risques",
  alternatives_adaptees: "Alternatives",
  construire_routine: "Ma routine",
};

const TONE_HEX: Record<CoverageTone, string> = {
  vert: "#16A34A",
  jaune: "#CA8A04",
  orange: "#EA580C",
  rouge: "#DC2626",
};

function shortLabel(item: CoverageItem): string {
  return item.isCustom ? item.label : SHORT_GOAL_LABEL[item.key] ?? item.label;
}

type InvokeResult = {
  state?: string;
  coverage?: CoverageItem[];
  routineSignature?: string;
  goalsSignature?: string;
  productCount?: number;
  /** true = renvoyé depuis le cache (routine inchangée) → aucun crédit débité. */
  cached?: boolean;
};

type Props = {
  goalCount: number;
  productCount: number;
  goalsSig: string;
  routineSig: string;
  initial: GoalCoverageRow | null;
};

export function GoalsCoverageCard({ goalCount, productCount, goalsSig, initial }: Props) {
  const router = useRouter();
  const [row, setRow] = useState<GoalCoverageRow | null>(initial);
  const [evaluating, setEvaluating] = useState(false);
  const [noCredits, setNoCredits] = useState(false);
  const [errored, setErrored] = useState(false);

  // « Voir tous mes objectifs » : masque les 0 % par défaut ; déplié au tap, se
  // replie tout seul après 8 s (transition d'enroulement), minuteur en pause dès
  // qu'on interagit avec la zone dépliée.
  const [expanded, setExpanded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearT = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);
  const bumpTimer = useCallback(() => {
    clearT();
    timer.current = setTimeout(() => setExpanded(false), 8000);
  }, [clearT]);
  useEffect(() => {
    if (expanded) bumpTimer();
    else clearT();
    return clearT;
  }, [expanded, bumpTimer, clearT]);

  const isFresh =
    !!row && row.model_version === GOALS_COVERAGE_VERSION && row.goals_signature === goalsSig;
  const state =
    goalCount === 0
      ? "no_goals"
      : productCount === 0
      ? "empty_routine"
      : isFresh
      ? "ready"
      : "needs_eval";
  const goalsChanged = !!row && goalCount > 0 && productCount > 0 && row.goals_signature !== goalsSig;
  const coverage = state === "ready" && row ? row.coverage : [];

  async function evaluate(force: boolean) {
    if (evaluating) return;
    setEvaluating(true);
    setErrored(false);
    setNoCredits(false);
    try {
      // Proxy Next serveur→edge (pas d'appel navigateur→edge : le preflight CORS
      // échoue car l'apikey ne peut pas voyager sur un OPTIONS). Cf. app/api/goals-coverage.
      const res = await fetch("/api/goals-coverage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(force ? { force: true } : {}),
      });
      if (!res.ok) {
        if (res.status === 429) setNoCredits(true);
        else setErrored(true);
        return;
      }
      const d = (await res.json()) as InvokeResult;
      if (d.state === "ok") {
        setRow({
          coverage: d.coverage ?? [],
          routine_signature: d.routineSignature ?? "",
          goals_signature: d.goalsSignature ?? "",
          model_version: GOALS_COVERAGE_VERSION,
          product_count: d.productCount ?? productCount,
          updated_at: new Date().toISOString(),
        });
      }
      // Rechargement à vide (routine inchangée → cache) = 0 crédit : inutile de
      // rafraîchir le rendu serveur (crédits). On ne le fait qu'en cas de recalcul.
      if (!d.cached) router.refresh();
    } catch {
      setErrored(true);
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <div className="card-white p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-[15px] font-semibold text-[#1F2937]">Couverture de tes objectifs</h2>
        {state === "ready" && (
          <button
            type="button"
            onClick={() => !evaluating && evaluate(false)}
            disabled={evaluating}
            aria-label="Recharger la couverture"
            className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 transition hover:bg-gray-200 disabled:cursor-default"
          >
            {evaluating ? <Spinner /> : <RefreshIcon className="h-4 w-4 text-[#F43F5E]" />}
          </button>
        )}
      </div>

      {renderBody()}
    </div>
  );

  function renderBody() {
    if (state === "no_goals") {
      return (
        <Link
          href="/profile/beauty"
          className="flex flex-col items-center gap-2 py-1 text-center transition hover:opacity-90"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#EDE9FE]">
            <FlagIcon className="h-5 w-5 text-[#8B5CF6]" />
          </span>
          <span className="text-[13px] text-[#6B7280] leading-snug">
            Remplis tes objectifs pour voir leur couverture par ta routine.
          </span>
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#8B5CF6]">
            Renseigner mes objectifs <span aria-hidden>›</span>
          </span>
        </Link>
      );
    }

    if (state === "empty_routine") {
      return (
        <p className="text-[13px] text-[#6B7280] leading-relaxed">
          Ajoute des produits à ta routine pour évaluer la couverture de tes objectifs.
        </p>
      );
    }

    if (evaluating && state !== "ready") {
      return (
        <div className="flex flex-col items-center gap-2 py-3">
          <Spinner />
          <span className="text-[13px] text-[#6B7280]">Analyse de ta routine en cours…</span>
        </div>
      );
    }

    if (noCredits) {
      return (
        <Link
          href="/offre"
          className="flex flex-col items-center gap-2 py-1 text-center transition hover:opacity-90"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#FFE4E6]">
            <LockIcon className="h-5 w-5 text-[#F43F5E]" />
          </span>
          <span className="text-[13px] text-[#6B7280] leading-snug">
            Tu as utilisé tous tes crédits. Passe à Premium pour évaluer la couverture de tes objectifs.
          </span>
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#F43F5E]">
            Voir l&apos;offre <span aria-hidden>›</span>
          </span>
        </Link>
      );
    }

    if (state === "ready") {
      const shown = coverage.filter((c) => c.percent > 0);
      const hidden = coverage.filter((c) => c.percent === 0);
      // Si rien n'est couvert, on affiche tout (ne pas replier un bloc vide).
      const base = shown.length > 0 ? shown : coverage;
      const extra = shown.length > 0 ? hidden : [];
      const hasExtra = extra.length > 0;
      return (
        <div className="flex flex-col gap-3">
          {base.map((item) => (
            <GaugeRow key={item.key} item={item} />
          ))}
          {hasExtra && (
            <div
              onPointerDown={bumpTimer}
              onWheel={bumpTimer}
              className={`flex flex-col gap-3 overflow-hidden transition-all duration-300 ease-out ${
                expanded ? "max-h-[1200px] opacity-100 mt-0" : "max-h-0 opacity-0"
              }`}
            >
              {extra.map((item) => (
                <GaugeRow key={item.key} item={item} />
              ))}
            </div>
          )}
          {hasExtra && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-0.5 inline-flex items-center justify-center gap-1 text-[12.5px] font-semibold text-[#8B5CF6]"
            >
              {expanded ? "Réduire" : `Voir tous mes objectifs (${extra.length} à 0 %)`}
              <ChevronIcon up={expanded} className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      );
    }

    // needs_eval
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[13px] text-[#6B7280] leading-relaxed">
          {goalsChanged
            ? "Tes objectifs ont changé. Réévalue la couverture de ta routine."
            : "Découvre à quel point ta routine couvre chacun de tes objectifs."}
        </p>
        {errored && (
          <p className="text-[12px] text-[#DC2626]">Un souci est survenu. Réessaie dans un instant.</p>
        )}
        <button
          type="button"
          onClick={() => evaluate(false)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F43F5E] px-4 py-3 text-[13.5px] font-semibold text-white transition hover:bg-[#E11D48]"
        >
          <SparkIcon className="h-4 w-4" />
          Évaluer la couverture de mes objectifs
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10.5px] font-semibold">
            {EVAL_COST} crédits
          </span>
        </button>
      </div>
    );
  }
}

function GaugeRow({ item }: { item: CoverageItem }) {
  const color = TONE_HEX[item.tone] ?? TONE_HEX.rouge;
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-[108px] shrink-0 truncate text-[12.5px] font-medium text-[#1F2937]">
        {shortLabel(item)}
      </span>
      <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200">
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${Math.max(2, item.percent)}%`, backgroundColor: color }}
        />
      </span>
      <span className="w-10 shrink-0 text-right text-[12.5px] font-semibold" style={{ color }}>
        {item.percent}%
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#F43F5E] border-t-transparent" />
  );
}
function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M23 4v6h-6" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}
function FlagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}
function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function ChevronIcon({ up, className }: { up?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {up ? <path d="m18 15-6-6-6 6" /> : <path d="m6 9 6 6 6-6" />}
    </svg>
  );
}
function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  );
}
