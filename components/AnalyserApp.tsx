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

const STORAGE_KEY = "cw:lastAnalysis";
const MIN_PROCESSING_MS = 3000;

type CachedAnalysis = {
  text: string;
  result: AnalyseResponse;
  ts: number;
};

function readCache(): CachedAnalysis | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedAnalysis;
    if (!data || typeof data !== "object" || !data.result) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(text: string, result: AnalyseResponse) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ text, result, ts: Date.now() } satisfies CachedAnalysis),
    );
  } catch {
    /* quota / disabled — ignore */
  }
}

function clearCache() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function AnalyserApp({ initialText = "" }: { initialText?: string }) {
  const [text, setText] = useState(initialText);
  const [hp, setHp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyseResponse | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const triggeredRef = useRef(false);

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    const cached = readCache();
    if (cached) {
      const sameText = !initialText || cached.text.trim() === initialText.trim();
      if (sameText) {
        setText(cached.text);
        setResult(cached.result);
        setHydrated(true);
        return;
      }
    }
    setHydrated(true);
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
    const startedAt = Date.now();
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
        // Ensure the processing overlay is shown long enough for credibility
        const elapsed = Date.now() - startedAt;
        if (elapsed < MIN_PROCESSING_MS) {
          await new Promise((res) => setTimeout(res, MIN_PROCESSING_MS - elapsed));
        }
        setResult(data);
        writeCache(trimmed, data);
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
    clearCache();
    setResult(null);
    setError(null);
    setText("");
    triggeredRef.current = false;
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("inci");
      window.history.replaceState({}, "", url.toString());
    }
  }

  if (!hydrated) {
    return null;
  }

  return (
    <div>
      {loading ? <ProcessingOverlay /> : null}

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
// Processing overlay
// ============================================================
function ProcessingOverlay() {
  const STEPS = [
    "Lecture de la liste",
    "Identification des ingrédients",
    "Détection des catégories",
    "Calcul de la note globale",
    "Génération de la synthèse",
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 600);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-[min(28rem,calc(100vw-2rem))] rounded-3xl bg-white/90 p-7 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.20)] ring-1 ring-white/80 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-violet-50 ring-1 ring-violet-100">
            <span className="block h-2 w-2 animate-pulse rounded-full bg-violet-600" aria-hidden />
          </span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
              Analyse en cours
            </p>
            <p className="text-[15px] font-semibold text-ink">
              On décode la composition…
            </p>
          </div>
        </div>

        <ul className="mt-5 space-y-2 text-[13px]">
          {STEPS.map((label, i) => {
            const state = i < step ? "done" : i === step ? "active" : "pending";
            return (
              <li
                key={label}
                className={`flex items-center gap-2.5 transition-colors ${
                  state === "active"
                    ? "text-ink"
                    : state === "done"
                      ? "text-ink-muted"
                      : "text-ink-subtle"
                }`}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                    state === "done"
                      ? "bg-ink text-white"
                      : state === "active"
                        ? "bg-white ring-2 ring-violet-300"
                        : "bg-black/[0.05] ring-1 ring-black/[0.05]"
                  }`}
                >
                  {state === "done" ? (
                    <CheckIcon className="h-3 w-3" />
                  ) : state === "active" ? (
                    <span className="block h-1.5 w-1.5 rounded-full bg-violet-600 animate-ping" aria-hidden />
                  ) : null}
                </span>
                <span>{label}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-black/[0.05]">
          <span className="block h-full w-1/3 animate-[shimmer_1.4s_linear_infinite] rounded-full bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
        </div>
      </div>
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

      <div className="relative mt-8 rounded-3xl bg-white/65 p-5 shadow-[0_18px_44px_-18px_rgba(15,23,42,0.18)] ring-1 ring-white/70 backdrop-blur-2xl sm:p-6">
        <label className="block text-[13px] font-semibold text-ink">
          Liste d&apos;ingrédients
        </label>

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
            Analyser la composition
            <span aria-hidden>→</span>
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
  const visible = expanded ? observations : observations.slice(0, 5);

  return (
    <article className="rounded-2xl bg-white/65 p-5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl">
      <h2 className="text-base font-semibold text-ink">Observations</h2>
      <ul className="mt-3 space-y-2">
        {visible.map((o) => (
          <li key={o.tag} className="flex items-center gap-2.5 text-[14px]">
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

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(31, 41, 55);
  doc.text("CosmetWiki", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text("Analyse de composition INCI", margin, y + 16);
  y += 36;

  // Date
  const now = new Date();
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text(
    `Généré le ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
    margin,
    y,
  );
  y += 24;

  // Score block
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
  // Counters on the right
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

  // Synthèse
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

  // Observations
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

  // Items table
  ensureSpace(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text("Détail des ingrédients", margin, y);
  y += 14;

  // Header row
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

  // Footer on each page
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
  // Suppress unused warning when originalText isn't used in PDF body
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
