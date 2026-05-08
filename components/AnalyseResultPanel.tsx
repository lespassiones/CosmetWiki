"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AnalyseItem, AnalyseResponse, Observation } from "@/lib/analyseTypes";
import type { ColorRating } from "@/lib/supabase";

export function AnalyseResultPanel({
  result,
  originalText,
  onReset,
}: {
  result: AnalyseResponse;
  originalText: string;
  onReset: () => void;
}) {
  return (
    <section id="analyse-results" className="pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
        >
          <span aria-hidden>←</span> Nouvelle analyse
        </button>
        <div className="flex items-center gap-2">
          <ToolbarButton onClick={() => downloadPdf(result, originalText)}>
            <DownloadIcon className="h-3.5 w-3.5" /> Télécharger en PDF
          </ToolbarButton>
          <ToolbarButton onClick={() => shareReport(originalText)}>
            <ShareIcon className="h-3.5 w-3.5" /> Partager
          </ToolbarButton>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Ingrédients identifiés" muted>
          <p className="text-3xl font-semibold tabular-nums text-ink">
            {result.counts.matched}
          </p>
          <p className="mt-0.5 text-[12px] text-ink-subtle">
            sur {result.counts.total} ingrédients
          </p>
        </StatCard>
        <StatCard label="Vert" dot="bg-emerald-500">
          <p className="text-3xl font-semibold tabular-nums text-ink">
            {result.counts.vert}
          </p>
          <p className="mt-0.5 text-[12px] text-ink-subtle">
            {pct(result.counts.vert, result.counts.total)} %
          </p>
        </StatCard>
        <StatCard label="Jaune" dot="bg-amber-400">
          <p className="text-3xl font-semibold tabular-nums text-ink">
            {result.counts.jaune}
          </p>
          <p className="mt-0.5 text-[12px] text-ink-subtle">
            {pct(result.counts.jaune, result.counts.total)} %
          </p>
        </StatCard>
        <StatCard label="Orange" dot="bg-orange-500">
          <p className="text-3xl font-semibold tabular-nums text-ink">
            {result.counts.orange}
          </p>
          <p className="mt-0.5 text-[12px] text-ink-subtle">
            {pct(result.counts.orange, result.counts.total)} %
          </p>
        </StatCard>
        <StatCard label="Rouge" dot="bg-rose-500">
          <p className="text-3xl font-semibold tabular-nums text-ink">
            {result.counts.rouge}
          </p>
          <p className="mt-0.5 text-[12px] text-ink-subtle">
            {pct(result.counts.rouge, result.counts.total)} %
          </p>
        </StatCard>
        <ScoreCard
          score={result.score}
          label={result.scoreLabel}
          tone={result.scoreTone}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <ObservationsCard observations={result.observations} aliasesUsed={result.aliasesUsed} />
        <SynthesisCard synthesis={result.synthesis} />
      </div>

      <ItemsTable items={result.items} counts={result.counts} />
    </section>
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
}: {
  label: string;
  children: React.ReactNode;
  dot?: string;
  muted?: boolean;
}) {
  return (
    <article className="flex flex-col rounded-2xl bg-white/65 p-4 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl">
      <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-ink-subtle">
        {dot ? <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden /> : null}
        {label}
      </p>
      <div className={`mt-2 ${muted ? "text-ink-muted" : ""}`}>{children}</div>
    </article>
  );
}

function ScoreCard({
  score,
  label,
  tone,
}: {
  score: number;
  label: string;
  tone: "green" | "amber" | "orange" | "rose";
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

  return (
    <article className="col-span-2 flex items-center gap-3 rounded-2xl bg-white/65 p-4 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl sm:col-span-1">
      <div className="flex flex-1 flex-col">
        <p className="text-[11px] font-medium tracking-wide text-ink-subtle">
          Note globale
        </p>
        <p className="mt-1 flex items-baseline gap-1">
          <span className="text-3xl font-semibold tabular-nums text-ink">
            {score.toFixed(1)}
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
            className={`fill-none ${TONE_RING[tone]} transition-[stroke-dashoffset] duration-700`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - filled}
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
  aliasesUsed,
}: {
  observations: Observation[];
  aliasesUsed: { from: string; to: string | null }[];
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
          return (
            <li key={o.tag}>
              {expandable ? (
                <button
                  type="button"
                  onClick={() => toggleTag(o.tag)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-2.5 rounded-xl px-1.5 py-1 text-left text-[14px] transition-colors hover:bg-black/[0.025]"
                >
                  <ObservationIcon obs={o} />
                  <span className="flex-1 text-ink">
                    {o.label}{" "}
                    <span className={o.status === "absent" ? "text-emerald-700" : "text-ink-muted"}>
                      {o.status === "absent" ? "absents" : "présents"}
                    </span>
                  </span>
                  <span className="rounded-full bg-black/[0.04] px-2 py-0.5 font-mono text-[11px] text-ink-muted">
                    {o.count}
                  </span>
                  <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 text-ink-subtle transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
              ) : (
                <div className="flex w-full items-center gap-2.5 px-1.5 py-1 text-[14px]">
                  <ObservationIcon obs={o} />
                  <span className="flex-1 text-ink">
                    {o.label}{" "}
                    <span className={o.status === "absent" ? "text-emerald-700" : "text-ink-muted"}>
                      {o.status === "absent" ? "absents" : "présents"}
                    </span>
                  </span>
                </div>
              )}

              {expandable && isOpen ? (
                <ul className="ml-9 mt-1.5 space-y-1 border-l border-black/[0.06] pl-3 animate-fade-in">
                  {items.map((it, idx) => (
                    <li key={idx} className="text-[13px]">
                      {it.slug ? (
                        <Link
                          href={`/i/${it.slug}?from=home`}
                          className="inline-flex items-center gap-1.5 text-ink hover:text-violet-700"
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
          className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-violet-700 hover:text-violet-900"
        >
          {expanded ? "Réduire" : `Voir le détail des observations`}{" "}
          <span aria-hidden>→</span>
        </button>
      ) : null}

      {aliasesUsed.length > 0 ? (
        <div className="mt-5 border-t border-black/[0.06] pt-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
            Doublons FR/EN détectés
          </p>
          <ul className="mt-2 space-y-1 text-[13px] text-ink-muted">
            {aliasesUsed.map((a, i) => (
              <li key={i} className="font-mono">
                {prettyName(a.from)} → <span className="text-ink">{prettyName(a.to ?? "")}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function ObservationIcon({ obs }: { obs: Observation }) {
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black/[0.03] ring-1 ring-black/[0.04] text-ink-muted">
      {obs.status === "absent" ? (
        <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <DotIcon className={`h-2.5 w-2.5 ${tagColor(obs.tag)}`} />
      )}
    </span>
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
function SynthesisCard({ synthesis }: { synthesis: string | null }) {
  return (
    <article className="rounded-2xl bg-white/65 p-5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl">
      <h2 className="text-base font-semibold text-ink">Synthèse</h2>
      {synthesis ? (
        <p className="mt-3 text-[15px] leading-relaxed text-ink">
          {renderBoldMarkdown(synthesis)}
        </p>
      ) : (
        <p className="mt-3 text-sm text-ink-muted">
          Synthèse temporairement indisponible. Consulte le détail des
          observations et le tableau ci-dessous pour interpréter les résultats.
        </p>
      )}
    </article>
  );
}

function renderBoldMarkdown(s: string): React.ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) {
      return (
        <strong key={i} className="font-semibold text-ink">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
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
}: {
  items: AnalyseItem[];
  counts: AnalyseResponse["counts"];
}) {
  const [filter, setFilter] = useState<TabKey>("all");
  const [search, setSearch] = useState("");

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
    <article className="mt-4 rounded-2xl bg-white/65 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl">
      <div className="flex flex-col gap-3 border-b border-black/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mb-px flex flex-wrap gap-1 overflow-x-auto">
          {tabs.map((t) => {
            const active = t.key === filter;
            const tone = TAB_TONE[t.key];
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
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

        <label className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle" aria-hidden />
          <input
            type="search"
            placeholder="Rechercher un ingrédient"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full bg-white/80 py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-subtle outline-none ring-1 ring-black/[0.06] focus:ring-2 focus:ring-violet-200"
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
              filtered.map((i) => (
                <tr key={`${i.position}-${i.input}`} className="border-t border-black/[0.04] transition-colors hover:bg-violet-50/30">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-ink">
                      {prettyName(i.name ?? i.input)}
                    </div>
                    {i.translationFr ? (
                      <div className="text-[12px] text-ink-muted">{i.translationFr}</div>
                    ) : i.matchKind === null ? (
                      <div className="text-[12px] text-ink-subtle">Non reconnu</div>
                    ) : null}
                  </td>
                  <td className="px-5 py-3 text-ink-muted max-md:hidden">
                    {i.primaryFunction || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <ColorChip rating={i.colorRating} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {i.slug ? (
                      <Link
                        href={`/i/${i.slug}?from=home`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-muted transition hover:bg-violet-50 hover:text-violet-700"
                        aria-label={`Voir la fiche de ${i.name}`}
                      >
                        <ArrowRightIcon className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <span className="inline-flex h-7 w-7 items-center justify-center text-ink-subtle">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function ColorChip({ rating }: { rating: ColorRating | null }) {
  if (!rating) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-subtle">
        <span className="h-1.5 w-1.5 rounded-full bg-black/[0.2]" aria-hidden /> —
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
// PDF download
// ============================================================
async function downloadPdf(result: AnalyseResponse, originalText: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usable = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (h: number) => {
    if (y + h > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(31, 41, 55);
  doc.text("CosmetWiki", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text("Analyse de composition INCI", margin, y + 16);
  y += 36;

  const now = new Date();
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text(
    `Généré le ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
    margin,
    y,
  );
  y += 24;

  ensureSpace(70);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, y, usable, 60, 6, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(31, 41, 55);
  doc.text(`${result.score.toFixed(1)} / 20`, margin + 16, y + 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(107, 114, 128);
  doc.text(`Note globale — ${result.scoreLabel}`, margin + 16, y + 52);
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  const countsLine = `Vert ${result.counts.vert}  ·  Jaune ${result.counts.jaune}  ·  Orange ${result.counts.orange}  ·  Rouge ${result.counts.rouge}`;
  const countsW = doc.getTextWidth(countsLine);
  doc.text(countsLine, margin + usable - countsW - 16, y + 24);
  doc.text(
    `${result.counts.matched} ingrédients identifiés sur ${result.counts.total}`,
    margin + usable - doc.getTextWidth(`${result.counts.matched} ingrédients identifiés sur ${result.counts.total}`) - 16,
    y + 40,
  );
  y += 80;

  if (result.synthesis) {
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.text("Synthèse", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    const cleanSynth = result.synthesis.replace(/\*\*/g, "");
    const lines = doc.splitTextToSize(cleanSynth, usable);
    ensureSpace(lines.length * 13 + 8);
    doc.text(lines, margin, y);
    y += lines.length * 13 + 12;
  }

  if (result.observations.length) {
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.text("Observations", margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const obs of result.observations) {
      ensureSpace(14);
      const status = obs.status === "absent" ? "absents" : `présents (${obs.count})`;
      doc.setTextColor(75, 85, 99);
      doc.text(`• ${obs.label} : ${status}`, margin, y);
      y += 13;
    }
    y += 8;
  }

  ensureSpace(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text("Détail des ingrédients", margin, y);
  y += 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text("Ingrédient", margin, y);
  doc.text("Fonction", margin + 220, y);
  doc.text("Tolérance", margin + 380, y);
  y += 6;
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, margin + usable, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  for (const item of result.items) {
    ensureSpace(16);
    doc.setTextColor(31, 41, 55);
    const name = prettyName(item.name ?? item.input);
    doc.text(name.length > 40 ? name.slice(0, 38) + "…" : name, margin, y);
    if (item.translationFr) {
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(8);
      doc.text(item.translationFr.slice(0, 30), margin, y + 9);
      doc.setFontSize(9);
    }
    doc.setTextColor(107, 114, 128);
    doc.text((item.primaryFunction ?? "—").slice(0, 28), margin + 220, y);
    if (item.colorRating) {
      const colorMap: Record<ColorRating, [number, number, number]> = {
        Vert: [22, 163, 74],
        Jaune: [202, 138, 4],
        Orange: [234, 88, 12],
        Rouge: [220, 38, 38],
      };
      const [r, g, b] = colorMap[item.colorRating];
      doc.setFillColor(r, g, b);
      doc.circle(margin + 386, y - 3, 3, "F");
      doc.setTextColor(r, g, b);
      doc.text(item.colorRating, margin + 396, y);
    } else {
      doc.setTextColor(156, 163, 175);
      doc.text("Non reconnu", margin + 380, y);
    }
    y += 18;
  }

  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `cosmetwiki.com  ·  Page ${p} / ${totalPages}`,
      margin,
      pageHeight - 20,
    );
    doc.text(
      "Données indicatives, ne remplace pas un avis médical.",
      pageWidth - margin - doc.getTextWidth("Données indicatives, ne remplace pas un avis médical."),
      pageHeight - 20,
    );
  }

  const filename = `cosmetwiki-analyse-${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
  void originalText;
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
        title: "Mon analyse CosmetWiki",
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

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
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
