"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GLASS_CARD, GLASS_PILL, GLASS_PILL_DARK } from "@/lib/ui/glass";
import { apiFetch } from "@/lib/clientApi";
import type { AnalyseResponse } from "@/lib/analyseTypes";

export type AnalysisOption = {
  id: string;
  title: string;
  score: number | null;
  createdAt: string;
  totalIngredients: number;
  matchedIngredients: number;
  counts: { vert: number; jaune: number; orange: number; rouge: number };
  top3: string[];
};

type Step = "description" | "pickProduct" | "confirm" | "running";

/** On the "Produit" step, the user can either pick an existing analyse from
 *  their history or paste a fresh INCI list (which will be analysed on the
 *  fly via /api/analyser and added to history). */
type PickMode = "history" | "paste";

const MIN_DESCRIPTION = 30;
const MAX_DESCRIPTION = 6000;
const MIN_INCI = 20;
const MAX_INCI = 12000;

// Ordered list used to compute "is the user allowed to jump back/forward to
// this step?". `running` isn't included - it's a transient state during the
// API call, not a user-navigable step. Typed as Step[] (with the missing
// "running" slot returning -1 from indexOf) so callers can pass any Step
// without a narrow cast.
const STEP_ORDER: Step[] = ["description", "pickProduct", "confirm"];

export function CoherenceWizard({
  options,
  initialAnalysisId = null,
  initialDescription = null,
}: {
  options: AnalysisOption[];
  /** When provided (via ?analysisId on the URL), the wizard skips the
   *  product-picker step and lands the user directly on "confirm". */
  initialAnalysisId?: string | null;
  /** When provided (via ?description), the wizard pre-fills the description
   *  textarea so the "Analyser la promesse" flow can hand off the
   *  web-search-derived promise without forcing the user to retype it. */
  initialDescription?: string | null;
}) {
  const router = useRouter();
  // Pre-fill flow: when arriving from the PromesseFlowModal with both an
  // analysis id (matching one of the user's analyses) AND a description, we
  // still LAND on "description" - not "confirm" - so the user can sanity-
  // check the web-search-fetched description before launching. Both prior
  // steps are silently marked as "visited" (see maxStepReached below) so
  // the user can also jump straight to Vérification via the stepper.
  const hasPrefilledDescription =
    typeof initialDescription === "string" && initialDescription.trim().length >= MIN_DESCRIPTION;
  const hasPrefilledAnalysis =
    typeof initialAnalysisId === "string" && options.some((o) => o.id === initialAnalysisId);
  const initialStep: Step = "description";
  // Which step the user can jump to via the stepper. "confirm" when
  // everything is pre-filled (both description and product), "pickProduct"
  // when only the description is pre-filled, "description" otherwise.
  const initialMaxStep: Step = hasPrefilledDescription && hasPrefilledAnalysis
    ? "confirm"
    : hasPrefilledDescription
      ? "pickProduct"
      : "description";

  const [step, setStep] = useState<Step>(initialStep);
  const [maxStepReached, setMaxStepReached] = useState<Step>(initialMaxStep);
  const [description, setDescription] = useState(initialDescription?.trim() ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(
    hasPrefilledAnalysis ? initialAnalysisId : null,
  );
  // Paste-INCI branch: when the user pastes a list rather than picking from
  // history, we run /api/analyser to materialise a real analyse row (also
  // saved in their history) and keep it here so the "Vérification" step can
  // display the same metadata as for picked-from-history options.
  const [pickMode, setPickMode] = useState<PickMode>(
    options.length === 0 ? "paste" : "history",
  );
  const [pastedOption, setPastedOption] = useState<AnalysisOption | null>(null);
  const [pasteName, setPasteName] = useState("");
  const [pasteInci, setPasteInci] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected =
    pastedOption && pastedOption.id === selectedId
      ? pastedOption
      : options.find((o) => o.id === selectedId) ?? null;

  function advanceTo(target: Step) {
    setStep(target);
    if (STEP_ORDER.indexOf(target) > STEP_ORDER.indexOf(maxStepReached)) {
      setMaxStepReached(target);
    }
  }

  /** Jump to any previously-visited step via the stepper. */
  function jumpToStep(target: Step) {
    if (STEP_ORDER.indexOf(target) > STEP_ORDER.indexOf(maxStepReached)) return;
    setError(null);
    setStep(target);
  }

  function next() {
    setError(null);
    if (step === "description") {
      const trimmed = description.trim();
      if (trimmed.length < MIN_DESCRIPTION) {
        setError(`Colle une description un peu plus complète (au moins ${MIN_DESCRIPTION} caractères).`);
        return;
      }
      // Skip pickProduct entirely if we arrived with a pre-selected analyse -
      // re-picking it would be pure friction.
      if (selected && STEP_ORDER.indexOf(maxStepReached) >= STEP_ORDER.indexOf("confirm")) {
        advanceTo("confirm");
        return;
      }
      advanceTo("pickProduct");
      return;
    }
    if (step === "pickProduct") {
      if (pickMode === "history") {
        if (!selected) {
          setError("Choisis le produit à comparer.");
          return;
        }
        advanceTo("confirm");
        return;
      }
      // Paste mode: run /api/analyser to create a fresh analyse row, then
      // promote it as the selected option for the confirm step.
      void runPasteAnalysis();
      return;
    }
    if (step === "confirm") {
      void launch();
    }
  }

  async function runPasteAnalysis() {
    const inci = pasteInci.trim();
    if (inci.length < MIN_INCI) {
      setError(`Colle une liste INCI complète (au moins ${MIN_INCI} caractères).`);
      return;
    }
    if (inci.length > MAX_INCI) {
      setError(`Liste trop longue (max ${MAX_INCI} caractères).`);
      return;
    }
    const label = pasteName.trim().slice(0, 200);
    setAnalysing(true);
    setError(null);
    try {
      const r = await apiFetch("/api/analyser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inci,
          ...(label ? { productLabel: label } : {}),
        }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setError(j?.error ?? `Erreur ${r.status} lors de l'analyse INCI.`);
        return;
      }
      const data = (await r.json()) as AnalyseResponse & { analysisId?: string | null };
      const newId = typeof data.analysisId === "string" ? data.analysisId : null;
      if (!newId) {
        setError("L'analyse INCI a été produite mais n'a pas pu être sauvegardée.");
        return;
      }
      const top3 = (data.items ?? [])
        .slice()
        .sort((a, b) => a.position - b.position)
        .slice(0, 3)
        .map((it) => it.name ?? it.input);
      const opt: AnalysisOption = {
        id: newId,
        title: label || `Analyse du ${new Date().toLocaleDateString("fr-FR")}`,
        score: typeof data.score === "number" ? data.score : null,
        createdAt: new Date().toISOString(),
        totalIngredients: data.counts?.total ?? 0,
        matchedIngredients: data.counts?.matched ?? 0,
        counts: {
          vert: data.counts?.vert ?? 0,
          jaune: data.counts?.jaune ?? 0,
          orange: data.counts?.orange ?? 0,
          rouge: data.counts?.rouge ?? 0,
        },
        top3,
      };
      setPastedOption(opt);
      setSelectedId(newId);
      advanceTo("confirm");
    } catch (err) {
      setError((err as Error).message ?? "Erreur réseau pendant l'analyse INCI.");
    } finally {
      setAnalysing(false);
    }
  }

  function back() {
    setError(null);
    if (step === "pickProduct") setStep("description");
    else if (step === "confirm") {
      // If pickProduct was originally skipped (pre-selected), go all the way
      // back to description rather than dumping the user on a step they
      // didn't see on the way in.
      setStep(maxStepReached === "confirm" && hasPrefilledAnalysis ? "description" : "pickProduct");
    }
  }

  async function launch() {
    if (!selected) return;
    setStep("running");
    setError(null);
    try {
      const r = await apiFetch("/api/coherence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis_id: selected.id,
          description: description.trim(),
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError((j as { error?: string }).error ?? `Erreur ${r.status}`);
        setStep("confirm");
        return;
      }
      const data = (await r.json()) as { id: string };
      router.push(`/promesses/${data.id}`);
    } catch (err) {
      setError((err as Error).message ?? "Erreur réseau");
      setStep("confirm");
    }
  }

  return (
    <div>
      <Stepper step={step} maxStepReached={maxStepReached} onJump={jumpToStep} />

      {step === "description" && (
        <article className={`${GLASS_CARD} p-5 lg:p-6 mt-6`}>
          <h2 className="text-[15px] font-semibold mb-1">1. Colle la description du produit</h2>
          <p className="text-[12px] text-[#6B7280] mb-4">
            Le texte marketing tel qu&apos;il apparaît sur l&apos;emballage ou sur la fiche produit en ligne.
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
            rows={8}
            placeholder="Ex : Cette crème densifiante anti-chute booste la pousse, renforce l'ancrage du cheveu et hydrate intensément. Formule à base d'huile d'argan, panthénol et caféine. Naturel à 96 %."
            className="w-full rounded-2xl bg-white ring-1 ring-[#E5E7EB] px-4 py-3 text-[13px] outline-none transition focus:ring-2 focus:ring-rose-300"
          />
          <div className="mt-2 flex items-center justify-between text-[11px] text-[#9CA3AF]">
            <span>{description.trim().length} caractères</span>
            <span>min {MIN_DESCRIPTION} · max {MAX_DESCRIPTION}</span>
          </div>
        </article>
      )}

      {step === "pickProduct" && (
        <article className={`${GLASS_CARD} p-5 lg:p-6 mt-6`}>
          <h2 className="text-[15px] font-semibold mb-1">2. Choisis le produit à comparer</h2>
          <p className="text-[12px] text-[#6B7280] mb-4">
            Sélectionne une analyse INCI déjà sauvegardée, ou colle la liste INCI d&apos;un produit non analysé.
          </p>

          <div
            role="tablist"
            aria-label="Choix du produit"
            className="mb-4 inline-flex rounded-full bg-[#F3F4F6] p-1 text-[12px] font-semibold"
          >
            <button
              type="button"
              role="tab"
              aria-selected={pickMode === "history" ? "true" : "false"}
              onClick={() => {
                setError(null);
                setPickMode("history");
              }}
              disabled={options.length === 0}
              className={`rounded-full px-3 py-1.5 transition ${
                pickMode === "history"
                  ? "bg-white text-ink shadow-sm"
                  : "text-[#6B7280] hover:text-ink disabled:text-[#D1D5DB] disabled:hover:text-[#D1D5DB]"
              }`}
            >
              Depuis l&apos;historique
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={pickMode === "paste" ? "true" : "false"}
              onClick={() => {
                setError(null);
                setPickMode("paste");
              }}
              className={`rounded-full px-3 py-1.5 transition ${
                pickMode === "paste"
                  ? "bg-white text-ink shadow-sm"
                  : "text-[#6B7280] hover:text-ink"
              }`}
            >
              Coller une liste INCI
            </button>
          </div>

          {pickMode === "history" && (
            options.length === 0 ? (
              <p className="text-[13px] text-[#6B7280]">
                Tu n&apos;as encore aucune analyse INCI sauvegardée. Colle la liste INCI ci-dessous pour comparer.
              </p>
            ) : (
              <ul className="space-y-2 max-h-[420px] overflow-auto pr-1">
                {options.map((o) => {
                  const isSel = selectedId === o.id;
                  const date = new Date(o.createdAt).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setPastedOption(null);
                          setSelectedId(o.id);
                        }}
                        aria-pressed={isSel ? "true" : "false"}
                        className={`w-full text-left rounded-2xl ring-1 transition p-3 ${
                          isSel
                            ? "bg-rose-50 ring-rose-300"
                            : "bg-white ring-[#E5E7EB] hover:ring-[#111111]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-ink truncate">{o.title}</div>
                            <div className="text-[12px] text-[#6B7280] mt-0.5">
                              {o.matchedIngredients} / {o.totalIngredients} ingrédients · {date}
                            </div>
                          </div>
                          {isSel && (
                            <span aria-hidden className="shrink-0 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-white">
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                <path d="M5 12l5 5 9-12" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )
          )}

          {pickMode === "paste" && (
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-[#6B7280] mb-1" htmlFor="paste-name">
                  Nom du produit <span className="text-[#9CA3AF]">(optionnel)</span>
                </label>
                <input
                  id="paste-name"
                  type="text"
                  value={pasteName}
                  onChange={(e) => setPasteName(e.target.value.slice(0, 200))}
                  placeholder="Ex : Mon savon à froid lavande"
                  className="w-full rounded-2xl bg-white ring-1 ring-[#E5E7EB] px-4 py-2.5 text-[13px] outline-none transition focus:ring-2 focus:ring-rose-300"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#6B7280] mb-1" htmlFor="paste-inci">
                  Liste INCI
                </label>
                <textarea
                  id="paste-inci"
                  value={pasteInci}
                  onChange={(e) => setPasteInci(e.target.value.slice(0, MAX_INCI))}
                  rows={8}
                  placeholder="Aqua, Sodium Olivate, Sodium Cocoate, Sodium Castorate, Glycerin, Lavandula Angustifolia Oil…"
                  className="w-full rounded-2xl bg-white ring-1 ring-[#E5E7EB] px-4 py-3 text-[13px] outline-none transition focus:ring-2 focus:ring-rose-300"
                />
                <div className="mt-2 flex items-center justify-between text-[11px] text-[#9CA3AF]">
                  <span>{pasteInci.trim().length} caractères</span>
                  <span>min {MIN_INCI} · max {MAX_INCI}</span>
                </div>
              </div>
              <p className="text-[11px] text-[#6B7280] bg-[#FFF7ED] ring-1 ring-amber-100 rounded-xl px-3 py-2 leading-snug">
                Cette liste sera analysée puis ajoutée à ton historique. Coût total de l&apos;opération&nbsp;: 2 crédits (1 pour l&apos;analyse INCI + 1 pour la cohérence).
              </p>
            </div>
          )}
        </article>
      )}

      {step === "confirm" && selected && (
        <article className={`${GLASS_CARD} p-5 lg:p-6 mt-6`}>
          <h2 className="text-[15px] font-semibold mb-1">3. Vérifie le produit choisi</h2>
          <p className="text-[12px] text-[#6B7280] mb-4">
            ⚠️ Si l&apos;analyse INCI sélectionnée ne correspond pas au produit
            dont tu as collé la description, le résultat sera incorrect.
          </p>

          <div className="rounded-2xl bg-white ring-1 ring-[#E5E7EB] p-4">
            <div className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-1">
              Produit sélectionné
            </div>
            <div className="text-[16px] font-bold text-ink mb-3">{selected.title}</div>
            <dl className="space-y-2 text-[13px]">
              <div className="flex items-baseline justify-between">
                <dt className="text-[#6B7280]">Ingrédients</dt>
                <dd className="font-medium text-ink">
                  {selected.matchedIngredients} reconnus sur {selected.totalIngredients}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[#6B7280] shrink-0">3 premiers ingrédients</dt>
                <dd className="font-medium text-ink text-right truncate">
                  {selected.top3.length > 0 ? selected.top3.join(", ") : "-"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-[#6B7280]">Répartition</dt>
                <dd className="font-medium text-ink flex items-center gap-2">
                  <Dot color="bg-emerald-500" /> {selected.counts.vert}
                  <Dot color="bg-amber-400" /> {selected.counts.jaune}
                  <Dot color="bg-orange-400" /> {selected.counts.orange}
                  <Dot color="bg-rose-500" /> {selected.counts.rouge}
                </dd>
              </div>
            </dl>
          </div>

          <p className="mt-4 text-[12px] text-[#6B7280]">
            C&apos;est bien ce produit ? Si oui, lance l&apos;analyse de cohérence.
            Sinon, reviens en arrière pour en choisir un autre.
          </p>
        </article>
      )}

      {step === "running" && (
        <article className={`${GLASS_CARD} p-8 mt-6 text-center`}>
          <div className="mx-auto mb-3 h-10 w-10 rounded-full border-2 border-rose-200 border-t-rose-500 animate-spin" />
          <p className="text-[14px] font-semibold text-ink">Analyse en cours…</p>
          <p className="text-[12px] text-[#6B7280] mt-1">
            On lit la description, on identifie les promesses, on vérifie la formule.
          </p>
        </article>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 text-[13px] text-[#E11D48] bg-rose-50 border border-rose-100 rounded-xl px-3 py-2"
        >
          {error}
        </p>
      )}

      {step !== "running" && (
        <div className="mt-5 flex flex-col-reverse sm:flex-row sm:items-center gap-2">
          {step !== "description" ? (
            <button
              type="button"
              onClick={back}
              disabled={analysing}
              className={`${GLASS_PILL} px-4 py-2 text-[13px] font-semibold text-ink disabled:opacity-50`}
            >
              Retour
            </button>
          ) : (
            <span aria-hidden className="hidden sm:block" />
          )}
          <button
            type="button"
            onClick={next}
            disabled={analysing}
            className={`${GLASS_PILL_DARK} flex-1 px-4 py-2.5 text-[13px] font-semibold disabled:opacity-60`}
          >
            {analysing
              ? "Analyse INCI en cours…"
              : step === "confirm"
                ? "Lancer l'analyse"
                : "Continuer"}
          </button>
        </div>
      )}
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${color} mr-0.5`} />
  );
}

function Stepper({
  step,
  maxStepReached,
  onJump,
}: {
  step: Step;
  maxStepReached: Step;
  onJump: (s: Exclude<Step, "running">) => void;
}) {
  const steps = [
    { key: "description" as const, label: "Description" },
    { key: "pickProduct" as const, label: "Produit" },
    { key: "confirm" as const, label: "Vérification" },
  ];
  const idx = steps.findIndex((s) => s.key === step);
  const maxIdx = steps.findIndex((s) => s.key === maxStepReached);
  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, i) => {
        const active = i === idx;
        // "Reached" = the user has at least visited this step on the way to
        // their current position. The pre-fill flow marks steps as reached
        // up-front so the user can jump directly into Vérification without
        // having to walk through the wizard.
        const reached = i <= maxIdx;
        const done = i < idx && reached;
        const clickable = reached && !active;
        const Cell = (
          <>
            <span
              className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold transition ${
                active
                  ? "bg-[#111111] text-white"
                  : reached
                    ? "bg-emerald-500 text-white"
                    : "bg-[#F3F4F6] text-[#6B7280]"
              }`}
            >
              {done || (reached && !active) ? "✓" : i + 1}
            </span>
            <span
              className={`text-[12px] font-medium transition ${
                active ? "text-ink" : reached ? "text-emerald-700" : "text-[#9CA3AF]"
              }`}
            >
              {s.label}
            </span>
          </>
        );
        return (
          <li key={s.key} className="flex items-center gap-2">
            {clickable ? (
              <button
                type="button"
                onClick={() => onJump(s.key)}
                className="flex items-center gap-2 rounded-full hover:bg-black/[0.04] -mx-1 px-1 py-0.5 transition"
                aria-label={`Revenir à l'étape ${s.label}`}
              >
                {Cell}
              </button>
            ) : (
              <div className="flex items-center gap-2 -mx-1 px-1 py-0.5">{Cell}</div>
            )}
            {i < steps.length - 1 && (
              <span aria-hidden className="mx-1 h-px w-6 bg-[#E5E7EB]" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
