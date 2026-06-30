"use client";

import { useEffect, useState } from "react";
import { colorCapScore } from "@/lib/essentiel/engine";
import { scoreLabel } from "@/lib/inciParser";
import type { AnalyseResponse } from "@/lib/analyseTypes";

type Props = {
  result: AnalyseResponse;
  productLabel: string | null;
  onClose: () => void;
};

type CategoryStats = {
  avg_score: number | null;
  product_count: number;
};

const SCORE_MAX = 20;

const BADGE: Record<string, { bg: string; text: string }> = {
  green:  { bg: "bg-emerald-100", text: "text-emerald-700" },
  amber:  { bg: "bg-green-100",   text: "text-green-700" },
  orange: { bg: "bg-amber-100",   text: "text-amber-700" },
  rose:   { bg: "bg-rose-100",    text: "text-rose-700" },
};

const COLOR_ROWS: { key: keyof AnalyseResponse["counts"]; label: string; dot: string; desc: string }[] = [
  { key: "vert",    label: "Vert",   dot: "bg-emerald-500", desc: "Rien à signaler dans nos références." },
  { key: "jaune",   label: "Jaune",  dot: "bg-yellow-400",  desc: "À surveiller, parfois irritant ou allergène." },
  { key: "orange",  label: "Orange", dot: "bg-orange-500",  desc: "Synthèse ou pétrochimie, impact à considérer." },
  { key: "rouge",   label: "Rouge",  dot: "bg-rose-500",    desc: "Controversé, potentiellement à risque." },
  { key: "unknown", label: "Gris",   dot: "bg-gray-300",    desc: "Non reconnu dans notre base." },
];

const METHODOLOGY = [
  "La note reflète les ingrédients présents et leur place dans la liste : un ingrédient en tête de formule a plus de poids qu'un ingrédient de fin de liste.",
  "Chaque ingrédient est apprécié au regard du Règlement (CE) 1223/2009 et de plusieurs organismes de référence (ANSES, ANSM, SCCS, ECHA).",
  "Plus un ingrédient est encadré ou discuté par ces organismes, plus il influence la note.",
  "Une note basse ne signifie pas que le produit est « mauvais » : la tolérance de chacun reste personnelle.",
];

const OFFICIAL_SOURCES = [
  { label: "Règlement (CE) 1223/2009", href: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223" },
  { label: "ANSES", href: "https://www.anses.fr" },
  { label: "ANSM", href: "https://ansm.sante.fr" },
  { label: "SCCS (Comité scientifique sur la sécurité des consommateurs)", href: "https://health.ec.europa.eu/scientific-committees/scientific-committee-consumer-safety-sccs_en" },
  { label: "ECHA", href: "https://echa.europa.eu/fr" },
];

function scoreToPercent(score: number): number {
  return Math.min(100, Math.max(0, (score / SCORE_MAX) * 100));
}

function comparisonPhrase(productScore: number, avgScore: number): string {
  const diff = productScore - avgScore;
  if (diff > 2) return "mieux noté que la majorité des produits similaires";
  if (diff < -2) return "moins bien noté que la majorité des produits similaires";
  return "dans la moyenne des produits similaires";
}

export function ScoreExplanationModal({ result, productLabel, onClose }: Props) {
  const cappedScore = colorCapScore(result.score, result.counts);
  const { label: badgeLabel, tone } = scoreLabel(cappedScore);
  const badgeCfg = BADGE[tone] ?? BADGE.orange;
  const category = result.catalogCategory ?? null;

  const [stats, setStats] = useState<CategoryStats | null>(null);

  useEffect(() => {
    if (!category) return;
    fetch(`/api/tools/category-stats?category=${encodeURIComponent(category)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: CategoryStats | null) => { if (d) setStats(d); })
      .catch(() => {});
  }, [category]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const counts = result.counts;
  const colorTotal = Math.max(
    1,
    (counts.vert ?? 0) + (counts.jaune ?? 0) + (counts.orange ?? 0) + (counts.rouge ?? 0) + (counts.unknown ?? 0),
  );
  const colorBars = COLOR_ROWS.map((r) => ({ ...r, count: (counts[r.key] as number) ?? 0 })).filter((b) => b.count > 0);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-label="Comment cette note est calculée ?"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden />

      <div
        className="relative z-10 w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl animate-[fadeIn_180ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-black/10" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-4 sm:pt-5">
          <h2 className="text-[15px] font-bold text-ink">Comment cette note est calculée ?</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-black/[0.06] text-ink-subtle hover:bg-black/[0.10] transition"
            aria-label="Fermer"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-7">

          {/* a) La note de ce produit */}
          <section>
            <SectionTitle>La note de ce produit</SectionTitle>
            <div className="flex items-center gap-2.5 mb-3">
              <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-[13px] font-semibold ${badgeCfg.bg} ${badgeCfg.text}`}>
                {badgeLabel}
              </span>
              {productLabel ? (
                <span className="text-[12px] text-ink-subtle truncate max-w-[200px]">{productLabel}</span>
              ) : null}
            </div>
            <p className="text-[13px] leading-relaxed text-ink-muted">
              Ce produit reçoit le badge{" "}
              <span className={`font-semibold ${badgeCfg.text}`}>{badgeLabel}</span>.
              {" "}Chaque produit reçoit un badge coloré, du rouge (à éviter) au vert (très bien) :
              plus il est vert, plus la formule est jugée sûre au regard de ses ingrédients.
            </p>
          </section>

          {/* b) Face aux produits similaires — uniquement si catégorie connue */}
          {category ? (
            <section>
              <SectionTitle>Face aux produits similaires</SectionTitle>
              {stats === null ? (
                <div className="space-y-2">
                  <div className="h-4 w-full rounded-full bg-black/[0.06] animate-pulse" />
                  <div className="h-3 w-2/3 rounded-full bg-black/[0.04] animate-pulse" />
                </div>
              ) : stats.avg_score !== null && stats.product_count >= 3 ? (
                <ComparisonGauge
                  cappedScore={cappedScore}
                  avgScore={stats.avg_score as number}
                  productCount={stats.product_count}
                />
              ) : (
                <p className="text-[13px] text-ink-subtle">
                  Pas encore assez de données pour comparer dans cette catégorie.
                </p>
              )}
            </section>
          ) : null}

          {/* c) Composition en un coup d'oeil */}
          <section>
            <SectionTitle>Sa composition en un coup d'oeil</SectionTitle>
            <div className="flex rounded-full overflow-hidden h-3 mb-3 gap-px">
              {colorBars.map((b) => (
                <div
                  key={b.key}
                  className={b.dot}
                  style={{ width: `${(b.count / colorTotal) * 100}%` }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {colorBars.map((b) => (
                <span key={b.key} className="flex items-center gap-1.5 text-[12px] text-ink-muted">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${b.dot}`} aria-hidden />
                  {b.label} : {b.count}
                </span>
              ))}
            </div>
          </section>

          {/* d) Ce que veulent dire les couleurs */}
          <section>
            <SectionTitle>Ce que veulent dire les couleurs</SectionTitle>
            <ul className="space-y-2.5">
              {COLOR_ROWS.map((r) => (
                <li key={r.key} className="flex items-start gap-2.5 text-[13px]">
                  <span className={`mt-0.5 inline-block h-2.5 w-2.5 rounded-full shrink-0 ${r.dot}`} aria-hidden />
                  <span>
                    <span className="font-medium text-ink">{r.label}</span>
                    <span className="text-ink-muted"> : {r.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* e) Sur quoi repose cette note */}
          <section>
            <SectionTitle>Sur quoi repose cette note</SectionTitle>
            <ul className="space-y-2.5">
              {METHODOLOGY.map((text, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] text-ink-muted">
                  <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0" aria-hidden />
                  {text}
                </li>
              ))}
            </ul>
          </section>

          {/* f) Sources officielles */}
          <section>
            <SectionTitle>Sources officielles</SectionTitle>
            <ul className="space-y-2">
              {OFFICIAL_SOURCES.map((src) => (
                <li key={src.href}>
                  <a
                    href={src.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-sky-600 hover:text-sky-700 hover:underline inline-flex items-center gap-1"
                  >
                    {src.label}
                    <ExternalLinkIcon />
                  </a>
                </li>
              ))}
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}

function ComparisonGauge({
  cappedScore,
  avgScore,
  productCount,
}: {
  cappedScore: number;
  avgScore: number;
  productCount: number;
}) {
  const productPct = scoreToPercent(cappedScore);
  const avgPct = scoreToPercent(avgScore);
  const phrase = comparisonPhrase(cappedScore, avgScore);

  return (
    <div>
      {/* Bar */}
      <div
        className="relative h-4 rounded-full overflow-visible mb-1"
        style={{ background: "linear-gradient(to right, #f43f5e 0%, #f97316 25%, #f59e0b 50%, #84cc16 75%, #10b981 100%)" }}
      >
        {/* Filet moyen */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/60"
          style={{ left: `${avgPct}%` }}
          aria-hidden
        />
        {/* Repère produit */}
        <div
          className="absolute -top-1 h-6 w-2.5 -translate-x-1/2 rounded bg-white shadow border border-gray-200"
          style={{ left: `${productPct}%` }}
          aria-hidden
        />
      </div>

      {/* Extrémités */}
      <div className="flex justify-between text-[10px] text-ink-subtle mt-1 mb-3">
        <span>Faible</span>
        <span>Très bien</span>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-4 text-[12px] text-ink-muted mb-3">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-px bg-gray-400 rounded" aria-hidden />
          Moyenne de la catégorie
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-2.5 rounded bg-white border border-gray-300 shadow-sm" aria-hidden />
          Ce produit
        </span>
      </div>

      <p className="text-[13px] text-ink-muted">
        Ce produit est{" "}
        <span className="font-medium text-ink">{phrase}</span>
        {" "}({productCount} produits comparés).
      </p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle mb-3">
      {children}
    </h3>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 shrink-0" aria-hidden>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
