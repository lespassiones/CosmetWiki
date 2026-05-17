"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GLASS_CARD, GLASS_PILL, GLASS_PILL_DARK } from "@/lib/ui/glass";

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

const MIN_DESCRIPTION = 30;
const MAX_DESCRIPTION = 6000;

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
  // Pre-fill flow: if we got both an analysis id (matching one of the
  // user's analyses) AND a non-empty description, drop the user straight on
  // "confirm". If only the description is provided, the user still has to
  // pick the matching analyse first. If only the id, they still have to
  // type the description.
  const hasPrefilledDescription =
    typeof initialDescription === "string" && initialDescription.trim().length >= MIN_DESCRIPTION;
  const hasPrefilledAnalysis =
    typeof initialAnalysisId === "string" && options.some((o) => o.id === initialAnalysisId);
  const initialStep: Step = hasPrefilledDescription && hasPrefilledAnalysis
    ? "confirm"
    : hasPrefilledDescription
      ? "pickProduct"
      : "description";

  const [step, setStep] = useState<Step>(initialStep);
  const [description, setDescription] = useState(initialDescription?.trim() ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(
    hasPrefilledAnalysis ? initialAnalysisId : null,
  );
  const [error, setError] = useState<string | null>(null);

  const selected = options.find((o) => o.id === selectedId) ?? null;

  function next() {
    setError(null);
    if (step === "description") {
      const trimmed = description.trim();
      if (trimmed.length < MIN_DESCRIPTION) {
        setError(`Colle une description un peu plus complète (au moins ${MIN_DESCRIPTION} caractères).`);
        return;
      }
      setStep("pickProduct");
      return;
    }
    if (step === "pickProduct") {
      if (!selected) {
        setError("Choisis le produit à comparer.");
        return;
      }
      setStep("confirm");
      return;
    }
    if (step === "confirm") {
      void launch();
    }
  }

  function back() {
    setError(null);
    if (step === "pickProduct") setStep("description");
    else if (step === "confirm") setStep("pickProduct");
  }

  async function launch() {
    if (!selected) return;
    setStep("running");
    setError(null);
    try {
      const r = await fetch("/api/coherence", {
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
      <Stepper step={step} />

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
            Sélectionne l&apos;analyse INCI correspondant au produit dont tu as collé la description.
          </p>
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
                    onClick={() => setSelectedId(o.id)}
                    aria-pressed={isSel}
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
                  {selected.top3.length > 0 ? selected.top3.join(", ") : "—"}
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
              className={`${GLASS_PILL} px-4 py-2 text-[13px] font-semibold text-ink`}
            >
              Retour
            </button>
          ) : (
            <span aria-hidden className="hidden sm:block" />
          )}
          <button
            type="button"
            onClick={next}
            className={`${GLASS_PILL_DARK} flex-1 px-4 py-2.5 text-[13px] font-semibold`}
          >
            {step === "confirm" ? "Lancer l'analyse" : "Continuer"}
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

function Stepper({ step }: { step: Step }) {
  const steps = [
    { key: "description" as const, label: "Description" },
    { key: "pickProduct" as const, label: "Produit" },
    { key: "confirm" as const, label: "Vérification" },
  ];
  const idx = steps.findIndex((s) => s.key === step);
  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, i) => {
        const active = i === idx;
        const done = i < idx;
        return (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold ${
                active
                  ? "bg-[#111111] text-white"
                  : done
                    ? "bg-emerald-500 text-white"
                    : "bg-[#F3F4F6] text-[#6B7280]"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={`text-[12px] font-medium ${
                active ? "text-ink" : done ? "text-emerald-700" : "text-[#9CA3AF]"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span aria-hidden className="mx-1 h-px w-6 bg-[#E5E7EB]" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
