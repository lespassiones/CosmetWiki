"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AnalyseItem, AnalyseResponse, Observation } from "@/lib/analyseTypes";
import type { ColorRating } from "@/lib/supabase";
import { Reveal } from "./Reveal";

// Delay (ms) after panel mount before each block becomes visible.
// Synthesis streaming and score animation start at the same time as their
// Reveal so the motion is seen as the user looks at the block.
const REVEAL_SCORE_MS = 750;
const REVEAL_SYNTHESIS_MS = 1100;

export function AnalyseResultPanel({
  result,
  originalText,
}: {
  result: AnalyseResponse;
  originalText: string;
}) {
  return (
    <section id="analyse-results" className="pt-2">
      <div data-pdf-hide className="flex flex-wrap items-center justify-end gap-2 pt-4">
        <ToolbarButton onClick={() => downloadPdf(result, originalText)}>
          <DownloadIcon className="h-3.5 w-3.5" /> Télécharger en PDF
        </ToolbarButton>
        <ToolbarButton onClick={() => shareReport(originalText)}>
          <ShareIcon className="h-3.5 w-3.5" /> Partager
        </ToolbarButton>
      </div>

      {/* Mobile-only bento layout : Score on top full-width, then 2 big
          boxes (Ingrédients identifiés + Rouge) on the left and 3 small
          boxes (Vert / Jaune / Orange) stacked on the right. */}
      <div className="mt-6 sm:hidden">
        <Reveal delayMs={0}>
          <ScoreCard
            score={result.score}
            label={result.scoreLabel}
            tone={result.scoreTone}
            startDelayMs={REVEAL_SCORE_MS}
          />
        </Reveal>
        <div className="mt-3 grid grid-cols-2 items-stretch gap-3">
          <div className="flex flex-col gap-3">
            <Reveal delayMs={0} className="flex flex-1 flex-col">
              <StatCard
                label="Ingrédients identifiés"
                muted
                className="flex-1"
              >
                <p className="text-3xl font-semibold tabular-nums text-ink">
                  {result.counts.matched}
                </p>
                <p className="mt-0.5 text-[12px] text-ink-subtle">
                  sur {result.counts.total} ingrédients
                </p>
              </StatCard>
            </Reveal>
            <Reveal delayMs={600} className="flex flex-1 flex-col">
              <StatCard
                label="Rouge"
                dot="bg-rose-500"
                className="flex-1"
              >
                <p className="text-3xl font-semibold tabular-nums text-ink">
                  {result.counts.rouge}
                </p>
                <p className="mt-0.5 text-[12px] text-ink-subtle">
                  {pct(result.counts.rouge, result.counts.total)} %
                </p>
              </StatCard>
            </Reveal>
          </div>
          <div className="flex flex-col gap-3">
            <Reveal delayMs={150} className="flex flex-1 flex-col">
              <SmallStatCard
                label="Vert"
                dot="bg-emerald-500"
                count={result.counts.vert}
                pct={pct(result.counts.vert, result.counts.total)}
              />
            </Reveal>
            <Reveal delayMs={300} className="flex flex-1 flex-col">
              <SmallStatCard
                label="Jaune"
                dot="bg-amber-400"
                count={result.counts.jaune}
                pct={pct(result.counts.jaune, result.counts.total)}
              />
            </Reveal>
            <Reveal delayMs={450} className="flex flex-1 flex-col">
              <SmallStatCard
                label="Orange"
                dot="bg-orange-500"
                count={result.counts.orange}
                pct={pct(result.counts.orange, result.counts.total)}
              />
            </Reveal>
          </div>
        </div>
      </div>

      {/* sm+ layout : 6 cards in a horizontal row (3 cols on tablet,
          5+1 on desktop). Same as before. */}
      <div className="mt-6 hidden gap-3 sm:grid sm:grid-cols-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_1.3fr]">
        <Reveal delayMs={0}>
          <StatCard label="Ingrédients identifiés" muted>
            <p className="text-3xl font-semibold tabular-nums text-ink">
              {result.counts.matched}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-subtle">
              sur {result.counts.total} ingrédients
            </p>
          </StatCard>
        </Reveal>
        <Reveal delayMs={150}>
          <StatCard label="Vert" dot="bg-emerald-500">
            <p className="text-3xl font-semibold tabular-nums text-ink">
              {result.counts.vert}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-subtle">
              {pct(result.counts.vert, result.counts.total)} %
            </p>
          </StatCard>
        </Reveal>
        <Reveal delayMs={300}>
          <StatCard label="Jaune" dot="bg-amber-400">
            <p className="text-3xl font-semibold tabular-nums text-ink">
              {result.counts.jaune}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-subtle">
              {pct(result.counts.jaune, result.counts.total)} %
            </p>
          </StatCard>
        </Reveal>
        <Reveal delayMs={450}>
          <StatCard label="Orange" dot="bg-orange-500">
            <p className="text-3xl font-semibold tabular-nums text-ink">
              {result.counts.orange}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-subtle">
              {pct(result.counts.orange, result.counts.total)} %
            </p>
          </StatCard>
        </Reveal>
        <Reveal delayMs={600}>
          <StatCard label="Rouge" dot="bg-rose-500">
            <p className="text-3xl font-semibold tabular-nums text-ink">
              {result.counts.rouge}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-subtle">
              {pct(result.counts.rouge, result.counts.total)} %
            </p>
          </StatCard>
        </Reveal>
        <Reveal delayMs={REVEAL_SCORE_MS}>
          <ScoreCard
            score={result.score}
            label={result.scoreLabel}
            tone={result.scoreTone}
            startDelayMs={REVEAL_SCORE_MS}
          />
        </Reveal>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Reveal delayMs={950}>
          <ObservationsCard observations={result.observations} aliasesUsed={result.aliasesUsed} />
        </Reveal>
        <Reveal delayMs={REVEAL_SYNTHESIS_MS}>
          <SynthesisCard
            synthesis={result.synthesis}
            items={result.items}
            streamDelayMs={REVEAL_SYNTHESIS_MS}
          />
        </Reveal>
      </div>

      <Reveal delayMs={1300} className="mt-4 block">
        <ItemsTable items={result.items} counts={result.counts} />
      </Reveal>
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
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  dot?: string;
  muted?: boolean;
  className?: string;
}) {
  return (
    <article
      className={`flex flex-col rounded-2xl bg-white/65 p-4 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl ${className}`}
    >
      <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-ink-subtle">
        {dot ? <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden /> : null}
        {label}
      </p>
      <div className={`mt-2 ${muted ? "text-ink-muted" : ""}`}>{children}</div>
    </article>
  );
}

// Compact card used in the mobile bento layout : label on top, then number
// + percentage on the same baseline (left/right justified).
function SmallStatCard({
  label,
  dot,
  count,
  pct,
}: {
  label: string;
  dot: string;
  count: number;
  pct: string;
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl bg-white/65 p-4 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl">
      <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-ink-subtle">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
        {label}
      </p>
      <div className="mt-auto flex items-baseline justify-between gap-2 pt-2">
        <p className="text-2xl font-semibold tabular-nums text-ink">{count}</p>
        <p className="text-[12px] text-ink-subtle tabular-nums">{pct} %</p>
      </div>
    </article>
  );
}

function ScoreCard({
  score,
  label,
  tone,
  startDelayMs = 0,
}: {
  score: number;
  label: string;
  tone: "green" | "amber" | "orange" | "rose";
  startDelayMs?: number;
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

  // Animate progress from 0 → 1 with an ease-out cubic, after `startDelayMs`.
  // Drives both the SVG fill and the displayed number.
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let rafId = 0;
    let started: number | null = null;
    const DURATION = 1500;
    const tick = (now: number) => {
      if (started === null) started = now;
      const elapsed = now - started;
      const t = Math.min(1, elapsed / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    const startId = window.setTimeout(() => {
      rafId = requestAnimationFrame(tick);
    }, startDelayMs);
    return () => {
      window.clearTimeout(startId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [startDelayMs]);

  const animFilled = filled * progress;
  const animScore = score * progress;

  return (
    <article className="flex items-center gap-3 rounded-2xl bg-white/65 p-4 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl">
      <div className="flex flex-1 flex-col">
        <p className="text-[11px] font-medium tracking-wide text-ink-subtle">
          Note globale
        </p>
        <p className="mt-1 flex items-baseline gap-1">
          <span className="text-3xl font-semibold tabular-nums text-ink">
            {animScore.toFixed(1)}
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
            className={`fill-none ${TONE_RING[tone]}`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - animFilled}
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
          const showCount = expandable && (o.status === "present" || o.status === "warn");
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
                  <ObservationLabel obs={o} />
                  {showCount ? (
                    <span className="rounded-full bg-black/[0.04] px-2 py-0.5 font-mono text-[11px] text-ink-muted">
                      {o.count}
                    </span>
                  ) : null}
                  <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 text-ink-subtle transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
              ) : (
                <div className="flex w-full items-center gap-2.5 px-1.5 py-1 text-[14px]">
                  <ObservationIcon obs={o} />
                  <ObservationLabel obs={o} />
                </div>
              )}

              {expandable && isOpen ? (
                <ul className="ml-9 mt-1.5 space-y-1 border-l border-black/[0.06] pl-3 animate-fade-in">
                  {items.map((it, idx) => (
                    <li key={idx} className="text-[13px]">
                      {it.slug ? (
                        <Link
                          href={`/i/${it.slug}?from=home`}
                          className="inline-flex items-center gap-1.5 text-ink hover:text-rose-700"
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
          className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-rose-700 hover:text-rose-900"
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
  if (obs.status === "absent") {
    return (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-50 ring-1 ring-emerald-100 text-emerald-600">
        <CheckIcon className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (obs.status === "info") {
    return (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-50 ring-1 ring-sky-100 text-sky-600">
        <InfoIcon className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (obs.status === "warn") {
    return (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-50 ring-1 ring-amber-100 text-amber-700">
        <WarnIcon className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black/[0.03] ring-1 ring-black/[0.04] text-ink-muted">
      <DotIcon className={`h-2.5 w-2.5 ${tagColor(obs.tag)}`} />
    </span>
  );
}

function ObservationLabel({ obs }: { obs: Observation }) {
  if (obs.message) {
    const tone =
      obs.status === "absent"
        ? "text-emerald-700"
        : obs.status === "warn"
          ? "text-amber-700"
          : obs.status === "info"
            ? "text-sky-700"
            : "text-ink-muted";
    return (
      <span className="flex-1 text-ink">
        {obs.label}{" "}
        <span className={tone}>{obs.message}</span>
      </span>
    );
  }
  const suffix = obs.status === "absent" ? "absents" : "présents";
  const suffixTone = obs.status === "absent" ? "text-emerald-700" : "text-ink-muted";
  return (
    <span className="flex-1 text-ink">
      {obs.label}{" "}
      <span className={suffixTone}>{suffix}</span>
    </span>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="8" />
      <line x1="12" y1="11" x2="12" y2="16" />
    </svg>
  );
}

function WarnIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12" y2="17" />
    </svg>
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
function SynthesisCard({
  synthesis,
  items,
  streamDelayMs = 0,
}: {
  synthesis: string | null;
  items: AnalyseItem[];
  streamDelayMs?: number;
}) {
  const fullText = synthesis ?? "";
  // Build a name → colorRating lookup so bold INCI names in the synthesis
  // can be tinted with their rating colour. Indexed on both the canonical
  // name and the user-typed token so spelling variants resolve.
  const colorByName = useMemo(() => {
    const m = new Map<string, ColorRating>();
    for (const it of items) {
      if (!it.colorRating) continue;
      if (it.name) m.set(normaliseSynthesisToken(it.name), it.colorRating);
      if (it.input) m.set(normaliseSynthesisToken(it.input), it.colorRating);
    }
    return m;
  }, [items]);
  // Characters revealed so far (the streaming effect). Starts at 0 once we
  // have text, gets incremented on a timer until we reach the full length.
  const [shown, setShown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setShown(0);
    if (!fullText) return;

    const TARGET_DURATION = 3500; // total streaming time, ms
    const TICK = 22;
    const charsPerTick = Math.max(2, Math.ceil(fullText.length / (TARGET_DURATION / TICK)));

    const start = window.setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setShown((prev) => {
          const next = prev + charsPerTick;
          if (next >= fullText.length) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return fullText.length;
          }
          return next;
        });
      }, TICK);
    }, streamDelayMs);

    return () => {
      window.clearTimeout(start);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fullText, streamDelayMs]);

  const visible = fullText.slice(0, shown);
  // While streaming we may be in the middle of a `**bold**` span — close it
  // temporarily so the markdown renderer doesn't break on an unmatched `**`.
  const safeVisible = balanceBold(visible);
  const blocks = parseSynthesisBlocks(safeVisible);
  const streaming = fullText.length > 0 && shown < fullText.length;

  return (
    <article className="rounded-2xl bg-white/65 p-5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl">
      <h2 className="text-base font-semibold text-ink">Synthèse</h2>
      {fullText ? (
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink">
          {blocks.map((block, i) => {
            const isLast = i === blocks.length - 1;
            const showCursor = streaming && isLast;
            if (block.type === "p") {
              return (
                <p key={i}>
                  {renderBoldMarkdown(block.text, colorByName)}
                  {showCursor ? <StreamCursor /> : null}
                </p>
              );
            }
            return (
              <ul key={i} className="space-y-1.5 pl-1">
                {block.items.map((item, j) => {
                  const lastItem = j === block.items.length - 1;
                  return (
                    <li key={j} className="flex gap-2">
                      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                      <span className="flex-1">
                        {renderBoldMarkdown(item, colorByName)}
                        {showCursor && lastItem ? <StreamCursor /> : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-muted">
          Synthèse temporairement indisponible. Consulte le détail des
          observations et le tableau ci-dessous pour interpréter les résultats.
        </p>
      )}
    </article>
  );
}

function StreamCursor() {
  return (
    <span className="ml-0.5 inline-block h-[1em] w-[2px] -mb-[2px] animate-pulse bg-rose-500/70 align-middle" />
  );
}

type SynthesisBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

const BULLET_RE = /^[-•*]\s+(.+)$/;

function parseSynthesisBlocks(text: string): SynthesisBlock[] {
  const blocks: SynthesisBlock[] = [];
  for (const chunk of text.split(/\n{2,}/)) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    const lines = trimmed.split("\n");

    let pBuffer: string[] = [];
    let ulBuffer: string[] = [];

    const flushP = () => {
      if (pBuffer.length === 0) return;
      blocks.push({ type: "p", text: pBuffer.join(" ") });
      pBuffer = [];
    };
    const flushUl = () => {
      if (ulBuffer.length === 0) return;
      blocks.push({ type: "ul", items: ulBuffer });
      ulBuffer = [];
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      const m = BULLET_RE.exec(line);
      if (m) {
        flushP();
        ulBuffer.push(m[1]!.trim());
      } else {
        flushUl();
        pBuffer.push(line);
      }
    }
    flushP();
    flushUl();
  }
  return blocks;
}

function balanceBold(text: string): string {
  const stars = (text.match(/\*\*/g) || []).length;
  return stars % 2 === 1 ? text + "**" : text;
}

function renderBoldMarkdown(
  s: string,
  colorByName?: Map<string, ColorRating>,
): React.ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) {
      const inner = p.slice(2, -2);
      const rating = colorByName?.get(normaliseSynthesisToken(inner));
      const tone = rating ? colorForRating(rating) : "text-ink";
      return (
        <strong key={i} className={`font-semibold ${tone}`}>
          {inner}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

function normaliseSynthesisToken(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();
}

function colorForRating(r: ColorRating): string {
  switch (r) {
    case "Vert":
      return "text-emerald-600";
    case "Jaune":
      return "text-amber-600";
    case "Orange":
      return "text-orange-600";
    case "Rouge":
      return "text-rose-600";
  }
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
    <article className="rounded-2xl bg-white/65 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl">
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
            className="w-full rounded-full bg-white/80 py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-subtle outline-none ring-1 ring-black/[0.06] focus:ring-2 focus:ring-rose-200"
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
                <tr key={`${i.position}-${i.input}`} className="border-t border-black/[0.04] transition-colors hover:bg-rose-50/30">
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
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-muted transition hover:bg-rose-50 hover:text-rose-700"
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
// PDF download — captures the rendered result panel (DOM) so the PDF matches
// the on-screen layout pixel-for-pixel rather than re-rendering with custom
// jsPDF primitives.
// ============================================================
async function downloadPdf(result: AnalyseResponse, originalText: string) {
  // Capture the whole pdf-root (product hero + analyse panel), not just the
  // analyse section — the hero shows the product name and source.
  const el =
    document.getElementById("pdf-root") ??
    document.getElementById("analyse-results");
  if (!el) return;

  // Hide elements flagged as PDF-irrelevant (toolbar buttons) during capture.
  const hidden = Array.from(el.querySelectorAll<HTMLElement>("[data-pdf-hide]"));
  const restore = hidden.map((h) => ({ el: h, prev: h.style.display }));
  hidden.forEach((h) => {
    h.style.display = "none";
  });
  // Mark the section as capturing — the .pdf-capturing CSS rule (in
  // globals.css) forces all Reveal animations to their final state and
  // disables backdrop-filter, transitions and translucent surfaces — none
  // of which html2canvas can render reliably.
  el.classList.add("pdf-capturing");
  // Wait two frames so the browser commits the style change before
  // html2canvas reads computed styles.
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: "#FAFAFA",
      logging: false,
      useCORS: true,
      // Mirror the in-place state in the clone html2canvas builds in its
      // hidden iframe — this is what guarantees all Reveal blocks render
      // visible in the snapshot.
      onclone: (clonedDoc, clonedEl) => {
        clonedEl.classList.add("pdf-capturing");
        clonedDoc
          .querySelectorAll<HTMLElement>(".reveal-on-mount")
          .forEach((node) => {
            node.style.opacity = "1";
            node.style.transform = "none";
            node.style.animation = "none";
          });
      },
    });

    const doc = new jsPDF({
      unit: "pt",
      format: "a4",
      orientation: "portrait",
      compress: true,
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Leave a small margin for breathing room.
    const margin = 24;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    let yOffset = 0;
    let pageIdx = 0;
    while (yOffset < imgHeight) {
      if (pageIdx > 0) doc.addPage();
      doc.addImage(imgData, "JPEG", margin, margin - yOffset, imgWidth, imgHeight);
      yOffset += pageHeight - margin * 2;
      pageIdx++;
    }

    const filename = `cosmetwiki-analyse-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  } finally {
    el.classList.remove("pdf-capturing");
    restore.forEach(({ el: h, prev }) => {
      h.style.display = prev;
    });
  }
  void result;
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
