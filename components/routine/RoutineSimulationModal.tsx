"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { RoutineMetrics } from "@/lib/routine/engine";

const TAG_LABELS: Record<string, string> = {
  paraben: "parabens",
  silicone: "silicones",
  sulfate: "sulfates",
  "huile-minerale": "huiles minérales",
  ethoxyle: "composés éthoxylés",
  "colorant-synthese": "colorants de synthèse",
  "ammonium-quaternaire": "ammoniums quaternaires",
  "allergene-parfumant": "allergènes parfumants",
  conservateur: "conservateurs",
  "parfum-synthese": "parfums de synthèse",
  "huile-essentielle": "huiles essentielles",
};

const RATING_DOT: Record<string, string> = {
  Rouge: "bg-rose-500",
  Orange: "bg-orange-400",
  Jaune: "bg-amber-400",
  Vert: "bg-emerald-500",
};

/**
 * Build a short list of "what to look for instead" tips based on the tags
 * we saw in the worst products. Purely deterministic — no AI call.
 */
function buildAlternatives(
  worst: RoutineMetrics["simulation"]["worstProducts"],
): string[] {
  const tagBag = new Set<string>();
  for (const p of worst) {
    for (const ing of p.worstIngredients) {
      for (const t of ing.tags) tagBag.add(t);
    }
  }
  const tips: string[] = [];
  if (tagBag.has("allergene-parfumant") || tagBag.has("parfum-synthese")) {
    tips.push("Privilégier les versions « sans parfum » ou « fragrance free ».");
  }
  if (tagBag.has("conservateur")) {
    tips.push("Chercher des conservateurs doux (sodium benzoate, geogard) plutôt que MIT/MCI.");
  }
  if (tagBag.has("paraben")) {
    tips.push("Éviter les parabens (butyl-, propyl-, isobutyl- en tête).");
  }
  if (tagBag.has("sulfate")) {
    tips.push("Préférer un tensioactif doux (coco-glucoside, decyl glucoside) à un SLS/SLES.");
  }
  if (tagBag.has("silicone")) {
    tips.push("Choisir une formule sans silicones occlusifs (dimethicone, cyclopentasiloxane) si tu as la peau qui s'encrasse vite.");
  }
  if (tagBag.has("huile-minerale")) {
    tips.push("Remplacer les huiles minérales par des huiles végétales (jojoba, squalane).");
  }
  if (tagBag.has("ethoxyle")) {
    tips.push("Éviter les ingrédients « -eth- » et PEG si tu privilégies les formules clean.");
  }
  if (tagBag.has("ammonium-quaternaire")) {
    tips.push("Ammoniums quaternaires : irritants à long terme, préférer une formule sans.");
  }
  if (tips.length === 0) {
    tips.push("Cibler des formules courtes (< 20 ingrédients) avec une note ≥ 17/20.");
  }
  return tips.slice(0, 4);
}

export function RoutineSimulationModal({
  metrics,
  currentScore,
}: {
  metrics: RoutineMetrics;
  currentScore: number;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    // Lock scroll on body while modal is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const worst = metrics.simulation.worstProducts;
  const delta = metrics.simulation.minus2.exposureScore - currentScore;
  const newScore = metrics.simulation.minus2.exposureScore;
  const tips = buildAlternatives(worst);

  const canSimulate = worst.length > 0;
  const isSingle = worst.length === 1;

  const trigger = (
    <button
      type="button"
      onClick={() => canSimulate && setOpen(true)}
      disabled={!canSimulate}
      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white px-5 py-2.5 text-sm font-semibold shadow-[0_10px_24px_-8px_rgba(244,63,94,0.55),inset_0_1px_0_rgba(255,255,255,0.4)] hover:brightness-105 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
    >
      Simuler
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  );

  const modal = open ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Détails de la simulation"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-[0_30px_80px_-20px_rgba(15,23,42,0.40)] ring-1 ring-black/[0.06]">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-black/[0.06] px-5 py-4 flex items-start gap-3 z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-[17px] font-bold text-[#111111]">
              {isSingle
                ? "Simulation : retirer le produit pénalisant"
                : "Simulation : retirer les produits pénalisants"}
            </h2>
            <p className="text-[12px] text-[#6B7280] mt-0.5">
              Score actuel <span className="font-semibold text-[#111111] tabular-nums">{currentScore.toFixed(1)}/20</span>
              {" → "}
              Nouveau score <span className="font-semibold text-emerald-600 tabular-nums">{newScore.toFixed(1)}/20</span>
              <span className="ml-2 text-emerald-600 font-medium">+{delta.toFixed(1)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer"
            className="shrink-0 h-9 w-9 rounded-full text-[#6B7280] hover:text-[#111111] hover:bg-black/[0.05] inline-flex items-center justify-center"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          <section>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[#6B7280] mb-3">
              {isSingle ? "Produit à retirer" : "Produits à retirer"}
            </h3>
            <ul className="space-y-4">
              {worst.map((p) => (
                <li
                  key={p.id}
                  className="rounded-2xl ring-1 ring-black/[0.06] bg-white p-4 shadow-[0_2px_6px_-2px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-[#111111] truncate">{p.name}</div>
                      <div className="text-[12px] text-[#6B7280] mt-0.5">
                        Note actuelle : <span className="font-semibold text-rose-600 tabular-nums">
                          {p.score !== null ? p.score.toFixed(1) : "—"}/20
                        </span>
                      </div>
                    </div>
                  </div>
                  {p.worstIngredients.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[11px] uppercase tracking-wide text-[#9CA3AF] mb-1.5">
                        Pourquoi le retirer
                      </div>
                      <ul className="space-y-1.5">
                        {p.worstIngredients.map((ing, idx) => (
                          <li key={`${ing.slug ?? ing.name}-${idx}`} className="flex items-start gap-2 text-[13px]">
                            <span aria-hidden className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${RATING_DOT[ing.colorRating ?? ""] ?? "bg-gray-300"}`} />
                            <div className="min-w-0">
                              <span className="font-medium text-[#111111]">{ing.name}</span>
                              {ing.tags.length > 0 && (
                                <span className="text-[#6B7280]">
                                  {" — "}
                                  {ing.tags
                                    .map((t) => TAG_LABELS[t] ?? t)
                                    .slice(0, 3)
                                    .join(", ")}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {tips.length > 0 && (
            <section className="rounded-2xl bg-gradient-to-br from-[#FFE4E6]/60 to-[#FFF1F2]/40 ring-1 ring-rose-200/60 p-4">
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[#9F1239] mb-2.5">
                À privilégier dans une alternative
              </h3>
              <ul className="space-y-1.5 text-[13px] text-[#9F1239]">
                {tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
            Conseils génériques basés sur les ingrédients détectés dans tes produits. Aucun conseil médical ; cette simulation
            est indicative et n&apos;engage que ton propre arbitrage.
          </p>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {trigger}
      {typeof document !== "undefined" && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
