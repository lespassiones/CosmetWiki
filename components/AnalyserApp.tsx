"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type ColorRating = "Vert" | "Jaune" | "Orange" | "Rouge";
type MatchKind = "exact" | "alias" | "fuzzy" | null;

type AnalyseItem = {
  position: number;
  input: string;
  slug: string | null;
  name: string | null;
  colorRating: ColorRating | null;
  casNumber: string | null;
  translationFr: string | null;
  primaryFunction: string | null;
  tags: string[] | null;
  matchKind: MatchKind;
};

type Observation = {
  tag: string;
  label: string;
  status: "present" | "absent";
  count: number;
};

type AnalyseResponse = {
  counts: {
    total: number;
    matched: number;
    vert: number;
    jaune: number;
    orange: number;
    rouge: number;
    unknown: number;
  };
  score: number;
  scoreLabel: string;
  scoreTone: "green" | "amber" | "orange" | "rose";
  items: AnalyseItem[];
  observations: Observation[];
  aliasesUsed: { from: string; to: string | null }[];
  synthesis: string | null;
};

const SAMPLE = `AQUA, GLYCERIN, CETEARYL ALCOHOL, SIMMONDSIA CHINENSIS SEED OIL,
BEHENTRIMONIUM METHOSULFATE, ALOE BARBADENSIS LEAF JUICE POWDER,
PANTHENOL, PRUNUS AMYGDALUS DULCIS OIL, CITRUS PARADISI PEEL OIL,
BENZYL ALCOHOL, DEHYDROACETIC ACID, SODIUM HYDROXIDE, LIMONENE`;

export function AnalyserApp({ initialText = "" }: { initialText?: string }) {
  const [text, setText] = useState(initialText);
  const [hp, setHp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyseResponse | null>(null);
  const triggeredRef = useRef(false);

  // Auto-analyse on mount if initialText is provided (e.g., coming from SearchBar)
  useEffect(() => {
    if (initialText && !triggeredRef.current) {
      triggeredRef.current = true;
      void analyze(initialText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function analyze(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Colle une liste INCI avant de lancer l'analyse.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/analyser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, hp, withSynthesis: true }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j?.error ?? `Erreur ${r.status}`);
        setResult(null);
      } else {
        const data = (await r.json()) as AnalyseResponse;
        setResult(data);
        // Smooth-scroll to results once they appear
        requestAnimationFrame(() => {
          const el = document.getElementById("analyse-results");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    } catch (e) {
      setError((e as Error).message ?? "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setText("");
    triggeredRef.current = false;
  }

  return (
    <div>
      {/* INPUT state — always visible at top, shrinks to a small recap when results exist */}
      {!result ? (
        <InputBlock
          text={text}
          setText={setText}
          loading={loading}
          error={error}
          onSubmit={() => analyze(text)}
          onLoadSample={() => setText(SAMPLE)}
          hp={hp}
          setHp={setHp}
        />
      ) : (
        <ResultBlock result={result} originalText={text} onReset={reset} />
      )}
    </div>
  );
}

// ============================================================
// INPUT
// ============================================================
function InputBlock({
  text,
  setText,
  loading,
  error,
  onSubmit,
  onLoadSample,
  hp,
  setHp,
}: {
  text: string;
  setText: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: () => void;
  onLoadSample: () => void;
  hp: string;
  setHp: (v: string) => void;
}) {
  return (
    <section className="mx-auto w-full max-w-3xl pt-6 sm:pt-12">
      <p className="text-[13px] font-medium uppercase tracking-wider text-ink-subtle">
        Analyseur de composition
      </p>
      <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Colle la liste INCI d&apos;un produit. <br className="hidden sm:block" />
        On la décode en 3 secondes.
      </h1>
      <p className="mt-3 max-w-xl text-[15px] text-ink-muted">
        Astérisques, parenthèses, doublons FR/EN — tout est géré
        automatiquement. Notre analyseur identifie les ingrédients,
        attribue une couleur de tolérance, calcule une note globale et
        rédige une synthèse.
      </p>

      <div className="mt-8 rounded-3xl bg-white/65 p-5 shadow-[0_18px_44px_-18px_rgba(15,23,42,0.18)] ring-1 ring-white/70 backdrop-blur-2xl sm:p-6">
        <label className="block text-[13px] font-semibold text-ink">
          Liste d&apos;ingrédients
        </label>

        {/* Honeypot */}
        <input
          type="text"
          name="email_confirm"
          autoComplete="off"
          tabIndex={-1}
          value={hp}
          onChange={(e) => setHp(e.target.value)}
          aria-hidden="true"
          className="pointer-events-none absolute -left-[9999px] h-px w-px opacity-0"
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          maxLength={6000}
          spellCheck={false}
          placeholder="AQUA, GLYCERIN, CETEARYL ALCOHOL, SIMMONDSIA CHINENSIS SEED OIL, ..."
          className="mt-2 w-full resize-y rounded-2xl border-0 bg-white/70 p-4 font-mono text-[13px] leading-relaxed text-ink placeholder:text-ink-subtle outline-none ring-1 ring-black/[0.06] focus:ring-2 focus:ring-violet-200"
        />

        <div className="mt-4 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onLoadSample}
            className="text-[13px] font-medium text-ink-muted hover:text-ink"
          >
            Charger un exemple
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !text.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_28px_-8px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-[0_14px_36px_-10px_rgba(139,92,246,0.7)] disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0"
          >
            {loading ? (
              <>
                <Spinner className="h-4 w-4" />
                Analyse en cours…
              </>
            ) : (
              <>
                Analyser la composition
                <span aria-hidden>→</span>
              </>
            )}
          </button>
        </div>

        {error ? (
          <p className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2 text-sm text-rose-700 ring-1 ring-rose-100">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}

// ============================================================
// RESULT
// ============================================================
function ResultBlock({
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
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
        >
          <span aria-hidden>←</span> Nouvelle analyse
        </button>
        <div className="flex items-center gap-2">
          <ToolbarButton onClick={() => printReport()}>
            <DownloadIcon className="h-3.5 w-3.5" /> Télécharger le rapport
          </ToolbarButton>
          <ToolbarButton onClick={() => shareReport(originalText)}>
            <ShareIcon className="h-3.5 w-3.5" /> Partager
          </ToolbarButton>
        </div>
      </div>

      {/* 6 stat cards */}
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
        <ScoreCard score={result.score} label={result.scoreLabel} tone={result.scoreTone} />
      </div>

      {/* Observations + Synthesis */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <ObservationsCard observations={result.observations} aliasesUsed={result.aliasesUsed} />
        <SynthesisCard synthesis={result.synthesis} />
      </div>

      {/* Filtered table */}
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
    <article className="col-span-2 flex items-center gap-4 rounded-2xl bg-white/65 p-4 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl sm:col-span-1">
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
      <div className="relative h-14 w-14 shrink-0">
        <svg viewBox="0 0 60 60" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="30" cy="30" r={radius} className="fill-none stroke-black/[0.05]" strokeWidth="5" />
          <circle
            cx="30"
            cy="30"
            r={radius}
            className={`fill-none ${TONE_RING[tone]} transition-[stroke-dashoffset] duration-700`}
            strokeWidth="5"
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
  const visible = expanded ? observations : observations.slice(0, 5);

  return (
    <article className="rounded-2xl bg-white/65 p-5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl">
      <h2 className="text-base font-semibold text-ink">Observations</h2>
      <ul className="mt-3 space-y-2">
        {visible.map((o) => (
          <li
            key={o.tag}
            className="flex items-center gap-2.5 text-[14px]"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black/[0.03] ring-1 ring-black/[0.04] text-ink-muted">
              {o.status === "absent" ? (
                <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <DotIcon className={`h-2.5 w-2.5 ${tagColor(o.tag)}`} />
              )}
            </span>
            <span className="flex-1 text-ink">
              {o.label}{" "}
              <span className={o.status === "absent" ? "text-emerald-700" : "text-ink-muted"}>
                {o.status === "absent" ? "absents" : "présents"}
              </span>
            </span>
            {o.count > 0 ? (
              <span className="rounded-full bg-black/[0.04] px-2 py-0.5 font-mono text-[11px] text-ink-muted">
                {o.count}
              </span>
            ) : null}
          </li>
        ))}
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
          Synthèse IA temporairement indisponible. Consulte le détail des
          observations et le tableau ci-dessous pour interpréter les résultats.
        </p>
      )}
      <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-subtle">
        <span aria-hidden>✦</span> Synthèse générée par IA
      </p>
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
function ItemsTable({
  items,
  counts,
}: {
  items: AnalyseItem[];
  counts: AnalyseResponse["counts"];
}) {
  const [filter, setFilter] = useState<"all" | ColorRating | "unknown">("all");
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
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-ink text-white"
                    : "text-ink-muted hover:bg-black/[0.04] hover:text-ink"
                }`}
              >
                {t.label}
                <span
                  className={`rounded-full px-1.5 text-[11px] tabular-nums ${
                    active ? "bg-white/20 text-white" : "bg-black/[0.05] text-ink-muted"
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
                        href={`/i/${i.slug}?from=analyser`}
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

function printReport() {
  if (typeof window !== "undefined") window.print();
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
function Spinner({ className }: { className?: string }) {
  return (
    <svg className={`${className ?? ""} animate-spin`} fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

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
