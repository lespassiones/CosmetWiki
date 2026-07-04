"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { RoutineMetrics } from "@/lib/routine/engine";
import { GLASS_CARD_EMERALD } from "@/lib/ui/glass";

type ColorTone = "Rouge" | "Orange" | "Jaune" | "Vert" | null;

const TAG_LABELS: Record<string, string> = {
  paraben: "Parabens",
  silicone: "Silicones",
  sulfate: "Sulfates",
  "huile-minerale": "Huiles minérales",
  ethoxyle: "Composés éthoxylés",
  "colorant-synthese": "Colorants de synthèse",
  "ammonium-quaternaire": "Ammoniums quaternaires",
  "allergene-parfumant": "Allergènes parfumants",
  conservateur: "Conservateurs",
  "parfum-synthese": "Parfums de synthèse",
  "huile-essentielle": "Huiles essentielles",
};

/**
 * What the user might EXPERIENCE if they keep using a product flagged for
 * each tag. Plain-French, action-oriented, no chemistry jargon. Used to
 * fill the "Conséquences possibles" section so the simulation reads as
 * "if you keep using this, here's what could happen" rather than a dry
 * list of categories.
 */
const TAG_CONSEQUENCES: Record<string, string> = {
  sulfate: "Cuir chevelu desséché, cheveux qui ternissent et perdent en volume à long terme.",
  silicone: "Cheveux plus lourds avec un effet « film » qui s'accumule lavage après lavage.",
  paraben: "Conservateurs régulièrement pointés du doigt comme perturbateurs endocriniens présumés.",
  "huile-minerale": "Pores qui s'obstruent et peau qui peine à respirer sur la durée.",
  ethoxyle: "Procédé de fabrication qui peut laisser des traces de résidus indésirables.",
  "colorant-synthese": "Risque d'allergie ou de sensibilisation cutanée, surtout sur peau réactive.",
  "ammonium-quaternaire": "Effet doux immédiat mais irritation et accumulation possibles à long terme.",
  "allergene-parfumant": "Risque accru d'allergie ou de réaction cutanée, surtout sur peau sensible.",
  "parfum-synthese": "Fréquente source d'irritation, notamment chez les peaux réactives ou atopiques.",
  conservateur: "Certains conservateurs sont irritants ou allergisants après un usage prolongé.",
  "huile-essentielle": "Peut sensibiliser la peau, à éviter sur peaux fragiles ou pendant la grossesse.",
};

const RATING_RANK: Record<string, number> = {
  Rouge: 4,
  Orange: 3,
  Jaune: 2,
  Vert: 1,
};

type TagAggregate = {
  tag: string;
  /** Pire couleur trouvée parmi les ingrédients du produit qui portent ce tag. */
  worstColor: ColorTone;
  /** Combien d'ingrédients du produit portent ce tag. */
  count: number;
};

function aggregateTagsByWorst(
  worstIngredients: { colorRating: ColorTone; tags: string[] }[],
): TagAggregate[] {
  const map = new Map<string, TagAggregate>();
  for (const ing of worstIngredients) {
    for (const t of ing.tags) {
      const existing = map.get(t);
      if (!existing) {
        map.set(t, { tag: t, worstColor: ing.colorRating, count: 1 });
      } else {
        existing.count += 1;
        if (
          (RATING_RANK[ing.colorRating ?? ""] ?? 0)
          > (RATING_RANK[existing.worstColor ?? ""] ?? 0)
        ) {
          existing.worstColor = ing.colorRating;
        }
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const sa = RATING_RANK[a.worstColor ?? ""] ?? 0;
    const sb = RATING_RANK[b.worstColor ?? ""] ?? 0;
    if (sa !== sb) return sb - sa;
    return b.count - a.count;
  });
}

function tagPillClasses(color: ColorTone): string {
  switch (color) {
    case "Rouge":
      return "bg-rose-100/80 text-rose-800 ring-rose-200/80";
    case "Orange":
      return "bg-orange-100/80 text-orange-800 ring-orange-200/80";
    case "Jaune":
      return "bg-amber-100/80 text-amber-800 ring-amber-200/80";
    case "Vert":
      return "bg-emerald-100/80 text-emerald-800 ring-emerald-200/80";
    default:
      return "bg-[#F3F4F6] text-[#4B5563] ring-[#E5E7EB]";
  }
}

const TAG_BROAD_TIPS: Record<string, string> = {
  "allergene-parfumant": "Privilégier des soins sans parfum, ou marqués « peaux sensibles ».",
  "parfum-synthese": "Privilégier des soins sans parfum, ou un parfum d'origine naturelle.",
  conservateur: "Privilégier des soins avec conservateurs doux, ou des produits certifiés bio.",
  paraben: "Privilégier des produits affichés « sans paraben ».",
  sulfate: "Privilégier des shampoings et nettoyants moussants doux.",
  silicone: "Privilégier des soins sans silicone si tes cheveux s'alourdissent vite.",
  "huile-minerale": "Privilégier des huiles végétales aux huiles minérales / paraffine.",
  ethoxyle: "Privilégier des formules courtes, idéalement certifiées clean ou bio.",
  "ammonium-quaternaire": "Privilégier des après-shampoings doux, sans agents adoucissants agressifs.",
  "colorant-synthese": "Privilégier des produits sans colorant ajouté.",
  "huile-essentielle": "Si peau sensible, éviter les soins riches en huiles essentielles.",
};

function buildBroadTips(allTags: Set<string>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of allTags) {
    const tip = TAG_BROAD_TIPS[t];
    if (!tip || seen.has(tip)) continue;
    seen.add(tip);
    out.push(tip);
    if (out.length >= 4) break;
  }
  if (out.length === 0) {
    out.push("Cibler des formules courtes (< 20 ingrédients) avec une bonne note d'analyse.");
  }
  return out;
}

/** Pick up to 3 consequence sentences from the tags involved in this product. */
function consequencesFor(tagAggregates: TagAggregate[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  // Iterate severity-first (aggregates are already sorted that way).
  for (const t of tagAggregates) {
    const c = TAG_CONSEQUENCES[t.tag];
    if (!c || seen.has(c)) continue;
    seen.add(c);
    out.push(c);
    if (out.length >= 3) break;
  }
  return out;
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

  const allTagsInPlay = useMemo(() => {
    const s = new Set<string>();
    for (const p of worst) {
      for (const ing of p.worstIngredients) {
        for (const t of ing.tags) s.add(t);
      }
    }
    return s;
  }, [worst]);

  const tips = useMemo(() => buildBroadTips(allTagsInPlay), [allTagsInPlay]);

  const canSimulate = worst.length > 0;
  const isSingle = worst.length === 1;

  const trigger = (
    <button
      type="button"
      onClick={() => canSimulate && setOpen(true)}
      disabled={!canSimulate}
      className="neu-shadow inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 text-white px-5 py-2.5 text-sm font-semibold hover:brightness-105 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
    >
      Simuler
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  );

  // ── Shared visual tokens for the modal - neutral white glassmorphism,
  // no pink wash, lots of soft shadow so the cards feel raised.
  const SHELL_CLASSES = [
    "relative w-full max-w-xl max-h-[90vh] overflow-y-auto",
    "rounded-3xl bg-white/85 backdrop-blur-2xl backdrop-saturate-150",
    "ring-1 ring-white/70",
    "shadow-[0_40px_100px_-20px_rgba(15,23,42,0.45),0_8px_24px_-8px_rgba(15,23,42,0.20),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(15,23,42,0.04)]",
  ].join(" ");

  // Pill-shaped product cards (rounded-[28px], deeper drop shadow, slight
  // saturation lift on the translucent surface).
  const PRODUCT_CARD = [
    "rounded-[28px] bg-white/75 backdrop-blur-xl backdrop-saturate-150",
    "ring-1 ring-white/80",
    "shadow-[0_18px_36px_-14px_rgba(15,23,42,0.18),0_4px_10px_-2px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]",
    "p-4",
  ].join(" ");

  const modal = open ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Détails de la simulation"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className={SHELL_CLASSES}>
        {/* Sticky header - same glass as the body so close button stays
            legible while scrolling. Neutre, plus de teinte rose. */}
        <div className="sticky top-0 bg-white/85 backdrop-blur-xl backdrop-saturate-150 border-b border-white/70 px-5 py-4 flex items-start gap-3 z-10 rounded-t-3xl">
          <div className="flex-1 min-w-0">
            <h2 className="text-[17px] font-bold text-ink leading-tight">
              {isSingle
                ? "Retirer ce produit pour gagner des points"
                : "Retirer ces 2 produits pour gagner des points"}
            </h2>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-baseline gap-1 rounded-full bg-white/80 ring-1 ring-black/[0.06] backdrop-blur-md px-2.5 py-0.5 text-[12px] text-[#6B7280] shadow-[0_2px_6px_-1px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]">
                <span className="font-semibold text-ink tabular-nums">{currentScore.toFixed(1)}</span>
                <span className="text-[10px]">/20</span>
              </span>
              <span aria-hidden className="text-[#9CA3AF] text-sm">→</span>
              <span className="inline-flex items-baseline gap-1 rounded-full bg-emerald-100/80 ring-1 ring-emerald-200/80 backdrop-blur-md px-2.5 py-0.5 text-[12px] text-emerald-800 shadow-[0_2px_6px_-1px_rgba(5,150,105,0.18),inset_0_1px_0_rgba(255,255,255,0.6)]">
                <span className="font-semibold tabular-nums">{newScore.toFixed(1)}</span>
                <span className="text-[10px]">/20</span>
              </span>
              <span className="text-emerald-700 font-semibold text-[12px] tabular-nums">
                +{delta.toFixed(1)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer"
            className="shrink-0 h-9 w-9 rounded-full text-[#6B7280] hover:text-ink hover:bg-black/[0.05] backdrop-blur-md inline-flex items-center justify-center transition"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <ul className="space-y-3.5">
            {worst.map((p) => {
              const tagAggregates = aggregateTagsByWorst(p.worstIngredients);
              const consequences = consequencesFor(tagAggregates);
              return (
                <li key={p.id} className={PRODUCT_CARD}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <Link
                      href={`/history/${p.id}`}
                      className="text-[15px] font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4 decoration-blue-300 hover:decoration-blue-500 transition truncate min-w-0"
                    >
                      {p.name}
                    </Link>
                    <span className="shrink-0 inline-flex items-baseline gap-1 rounded-full bg-rose-50/80 ring-1 ring-rose-200/80 backdrop-blur-md px-2 py-0.5 text-[11px] text-rose-700 shadow-[0_2px_6px_-1px_rgba(244,63,94,0.15)]">
                      <span className="font-semibold tabular-nums">
                        {p.score !== null ? p.score.toFixed(1) : "-"}
                      </span>
                      <span className="text-[10px] opacity-80">/20</span>
                    </span>
                  </div>

                  {tagAggregates.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[10px] uppercase tracking-wider text-ink-subtle mb-1.5">
                        Pourquoi le retirer
                      </div>
                      <ul className="flex flex-wrap gap-1.5">
                        {tagAggregates.slice(0, 6).map((t) => (
                          <li key={t.tag}>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ${tagPillClasses(t.worstColor)}`}
                            >
                              {TAG_LABELS[t.tag] ?? t.tag}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {consequences.length > 0 && (
                    <div className="mt-3 rounded-2xl bg-amber-50/60 ring-1 ring-amber-200/60 backdrop-blur-md px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                      <div className="text-[10px] uppercase tracking-wider text-amber-800/90 mb-1 font-semibold">
                        Conséquences possibles à long terme
                      </div>
                      <ul className="space-y-1 text-[12px] text-amber-900 leading-relaxed">
                        {consequences.map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span aria-hidden className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-600" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {tips.length > 0 && (
            <section className={`${GLASS_CARD_EMERALD} p-4`}>
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-emerald-800 mb-2">
                À privilégier pour la suite
              </h3>
              <ul className="space-y-1.5 text-[13px] text-emerald-900/90 leading-relaxed">
                {tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-[10px] text-ink-subtle leading-relaxed text-center">
            Conseils indicatifs basés sur ta routine actuelle. Aucun conseil médical.
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
