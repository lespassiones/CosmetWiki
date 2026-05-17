"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { RoutineMetrics } from "@/lib/routine/engine";
import { GLASS_CARD, GLASS_CARD_EMERALD } from "@/lib/ui/glass";

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
 * Generic "what to favour" guidance keyed by tag. Deliberately broad and
 * jargon-free — the previous version cited specific ingredients (sodium
 * benzoate, geogard, MIT/MCI, coco-glucoside…) which only resonate with
 * chemistry-literate users. Now the tips speak in product-shopping terms.
 */
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
  /** Combien d'ingrédients du produit portent ce tag (utile pour le tri). */
  count: number;
};

/**
 * Roll the worst ingredients of a product into a list of (tag, worstColor,
 * count) so the UI can show coloured pills by role/function rather than by
 * raw INCI name. The pill takes the colour of the most severe ingredient
 * carrying that tag in this product.
 */
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
  // Sort by severity descending, then by count descending.
  return Array.from(map.values()).sort((a, b) => {
    const sa = RATING_RANK[a.worstColor ?? ""] ?? 0;
    const sb = RATING_RANK[b.worstColor ?? ""] ?? 0;
    if (sa !== sb) return sb - sa;
    return b.count - a.count;
  });
}

/** Tailwind classes for a tag pill based on its worst-colour. */
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

/** Build a deduplicated, scoped list of broad tips from all the worst tags
 *  seen across the products to remove. Returns up to 4 entries. */
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

  // Aggregate all tag-buckets across the worst products → broad tips source.
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
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-gradient-to-br from-black/45 via-rose-950/30 to-pink-950/30 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      {/* Modal shell — proper glassmorphism: translucent surface over the
          backdrop's blur, soft outer drop shadow, thin white ring + inner
          highlight, with a discreet rose tint to keep the warm context. */}
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-white/85 via-white/80 to-rose-50/75 backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-white/70 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.40),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(15,23,42,0.04)]">
        {/* Sticky header — same glass as the body so close button stays
            legible while scrolling. */}
        <div className="sticky top-0 bg-white/75 backdrop-blur-xl backdrop-saturate-150 border-b border-white/60 px-5 py-4 flex items-start gap-3 z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-[17px] font-bold text-ink leading-tight">
              {isSingle
                ? "Retirer ce produit pour gagner des points"
                : "Retirer ces 2 produits pour gagner des points"}
            </h2>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-baseline gap-1 rounded-full bg-white/70 ring-1 ring-white/80 backdrop-blur-md px-2.5 py-0.5 text-[12px] text-[#6B7280] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <span className="font-semibold text-ink tabular-nums">{currentScore.toFixed(1)}</span>
                <span className="text-[10px]">/20</span>
              </span>
              <span aria-hidden className="text-[#9CA3AF] text-sm">→</span>
              <span className="inline-flex items-baseline gap-1 rounded-full bg-emerald-100/80 ring-1 ring-emerald-200/80 backdrop-blur-md px-2.5 py-0.5 text-[12px] text-emerald-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
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
            className="shrink-0 h-9 w-9 rounded-full text-[#6B7280] hover:text-ink hover:bg-white/60 backdrop-blur-md inline-flex items-center justify-center transition"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <ul className="space-y-3">
            {worst.map((p) => {
              const tagAggregates = aggregateTagsByWorst(p.worstIngredients);
              return (
                <li key={p.id} className={`${GLASS_CARD} p-4`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <Link
                      href={`/history/${p.id}`}
                      className="text-[15px] font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4 decoration-blue-300 hover:decoration-blue-500 transition truncate min-w-0"
                    >
                      {p.name}
                    </Link>
                    <span className="shrink-0 inline-flex items-baseline gap-1 rounded-full bg-rose-50/80 ring-1 ring-rose-200/80 backdrop-blur-md px-2 py-0.5 text-[11px] text-rose-700">
                      <span className="font-semibold tabular-nums">
                        {p.score !== null ? p.score.toFixed(1) : "—"}
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
