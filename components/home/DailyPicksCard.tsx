"use client";

import { useEffect, useState } from "react";
import type { DailyPickItem } from "@/lib/dailyPicks/select";

/**
 * Daily quizz + myth carousel for the home dashboard.
 *
 * UX:
 *   - Loads the 10 items of the day from /api/daily-picks (same for all users).
 *   - Tracks per-user progress in localStorage keyed by today's UTC date so
 *     the user picks up where they left off, and so we know when they've
 *     done all 10 ("come back tomorrow").
 *   - Each item is interactive: user picks a stance (the answer for a quiz,
 *     true/false/nuancé for a myth) → a reveal panel appears with the
 *     explanation → user clicks "Suivant" to move on.
 *   - When today's 10 are done, we show a friendly "come back tomorrow" state.
 */

const STORAGE_PREFIX = "cw:dailyPicks";

function todayKey(): string {
  // ISO date in UTC (YYYY-MM-DD) so all users in all timezones share the
  // same key boundary and we don't get weird midnight-local behaviour.
  return new Date().toISOString().slice(0, 10);
}

type DailyState = { index: number; score: number };

function readLocalState(): DailyState {
  if (typeof window === "undefined") return { index: 0, score: 0 };
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}:${todayKey()}`);
    if (raw === null) return { index: 0, score: 0 };
    const parsed = JSON.parse(raw) as Partial<DailyState>;
    const idx = typeof parsed.index === "number" && parsed.index >= 0 ? parsed.index : 0;
    const sc = typeof parsed.score === "number" && parsed.score >= 0 ? parsed.score : 0;
    return { index: idx, score: sc };
  } catch {
    return { index: 0, score: 0 };
  }
}

function writeLocalState(state: DailyState): void {
  if (typeof window === "undefined") return;
  try {
    // Garbage-collect old keys (different days) so we don't accumulate
    // localStorage entries indefinitely.
    const today = todayKey();
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(`${STORAGE_PREFIX}:`) && !k.endsWith(today)) {
        window.localStorage.removeItem(k);
        // Re-iterate from the start since we mutated the list.
        i = -1;
      }
    }
    window.localStorage.setItem(`${STORAGE_PREFIX}:${today}`, JSON.stringify(state));
  } catch {
    // ignore (private mode, quota, …)
  }
}

export function DailyPicksCard() {
  const [items, setItems] = useState<DailyPickItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  // Hydration: read localStorage AFTER mount so we don't desync with SSR.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const s = readLocalState();
    setIndex(s.index);
    setScore(s.score);
    void (async () => {
      try {
        // Let the browser cache honour /api/daily-picks' Cache-Control
        // (public, max-age=3600, stale-while-revalidate=300) - the daily
        // catalog only changes at the UTC day flip.
        const r = await fetch("/api/daily-picks");
        if (!r.ok) throw new Error(`Erreur ${r.status}`);
        const data = (await r.json()) as { items: DailyPickItem[] };
        setItems(data.items);
      } catch (e) {
        setError((e as Error).message ?? "Erreur réseau");
      }
    })();
  }, []);

  function next(wasCorrect: boolean) {
    const newIndex = index + 1;
    const newScore = wasCorrect ? score + 1 : score;
    setIndex(newIndex);
    setScore(newScore);
    writeLocalState({ index: newIndex, score: newScore });
    setPicked(null);
  }

  function reset() {
    setIndex(0);
    setScore(0);
    writeLocalState({ index: 0, score: 0 });
    setPicked(null);
  }

  // Loading skeleton
  if (!hydrated || items === null) {
    if (error) {
      return (
        <article className={"neu p-5"}>
          <p className="text-[12px] text-rose-700">{error}</p>
        </article>
      );
    }
    return (
      <article className={"neu p-5 lg:p-6"}>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle mb-3">
          Quizz & idées reçues du jour
        </div>
        <div className="space-y-2">
          <div className="h-4 w-3/4 rounded bg-[#F0F0F0] animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-[#F3F4F6] animate-pulse" />
        </div>
      </article>
    );
  }

  if (items.length === 0) {
    return (
      <article className={"neu p-5"}>
        <p className="text-[13px] text-[#6B7280]">
          Pas de contenu disponible aujourd&apos;hui. Reviens bientôt.
        </p>
      </article>
    );
  }

  // All 10 done for today → friendly empty state with score + reset.
  if (index >= items.length) {
    const total = items.length;
    const ratio = score / total;
    const scoreTone =
      ratio >= 0.8
        ? "bg-emerald-50 ring-emerald-200 text-emerald-700"
        : ratio >= 0.5
          ? "bg-amber-50 ring-amber-200 text-amber-700"
          : "bg-rose-50 ring-rose-200 text-rose-700";
    const scoreMessage =
      ratio === 1
        ? "Sans-faute, bravo ! 🎉"
        : ratio >= 0.8
          ? "Excellent score !"
          : ratio >= 0.5
            ? "Pas mal, continue comme ça."
            : "Tu feras mieux la prochaine fois.";
    return (
      <article className={"neu p-5 lg:p-6 text-center"}>
        <div aria-hidden className="text-3xl mb-2">✨</div>
        <h3 className="text-[15px] font-semibold mb-2">
          C&apos;est tout pour aujourd&apos;hui !
        </h3>

        <div
          className={`inline-flex items-baseline gap-1 rounded-xl ring-1 px-4 py-1.5 mb-2 ${scoreTone}`}
        >
          <span className="text-[20px] font-bold tabular-nums">{score}</span>
          <span className="text-[13px] font-medium opacity-70">/ {total}</span>
        </div>

        <p className="text-[12px] text-[#6B7280] mb-1">{scoreMessage}</p>
        <p className="text-[12px] text-[#6B7280] mb-4">
          10 nouveaux quizz et idées reçues t&apos;attendent demain.
        </p>
        <button
          type="button"
          onClick={reset}
          className="text-[11px] text-[#F43F5E] font-medium hover:underline"
        >
          Recommencer la série du jour
        </button>
      </article>
    );
  }

  const item = items[index];
  const isQuiz = item.kind === "quiz";
  const correctIdx = item.correct_index;

  return (
    <article className={"neu p-5 lg:p-6"}>
      {/* Header row: progress + kind tag */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
          {isQuiz ? "Quizz du jour" : "Idée reçue du jour"}
        </div>
        <div className="text-[11px] text-ink-subtle tabular-nums">
          {index + 1} / {items.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-[#d8dde6] overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full transition-[width] duration-500"
          style={{ width: `${((index + (picked !== null ? 1 : 0)) / items.length) * 100}%` }}
        />
      </div>

      {/* Question / affirmation */}
      <p className="text-[15px] lg:text-[16px] font-semibold text-ink leading-snug mb-4">
        {isQuiz ? "❓" : "⚖️"} {item.question}
      </p>

      {/* Answer choices */}
      <ul className="space-y-2">
        {item.options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = i === correctIdx;
          // After the user picks, we colour both their choice and the
          // correct choice. Untouched options fade.
          const showResult = picked !== null;
          let cls = "neu-sm";
          if (showResult) {
            if (isCorrect) {
              cls = "rounded-[12px] bg-emerald-50 text-emerald-800";
            } else if (isPicked) {
              cls = "rounded-[12px] bg-rose-50 text-rose-700";
            } else {
              cls = "neu-sm opacity-50";
            }
          }
          return (
            <li key={i}>
              <button
                type="button"
                disabled={picked !== null}
                onClick={() => setPicked(i)}
                className={`w-full rounded-[12px] px-4 py-3 text-left text-[14px] font-medium transition disabled:cursor-default ${cls}`}
              >
                <span className="inline-flex items-center gap-2">
                  {showResult && isCorrect && <span aria-hidden>✓</span>}
                  {showResult && isPicked && !isCorrect && <span aria-hidden>✗</span>}
                  {opt}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Reveal panel - only after the user has picked */}
      {picked !== null && (
        <div className="mt-4 rounded-xl bg-sky-50 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-600 mb-1">
            Réponse
          </div>
          <p className="text-[13px] leading-relaxed text-ink">{item.reveal}</p>
          <button
            type="button"
            onClick={() => next(picked === correctIdx)}
            className="neu-btn-primary mt-4 w-full text-[13px] py-2.5"
          >
            {index + 1 < items.length ? "Suivant →" : "Voir mon score"}
          </button>
        </div>
      )}

      {item.category && picked === null && (
        <p className="mt-3 text-[10px] text-[#9CA3AF] uppercase tracking-wide text-right">
          {item.category}
        </p>
      )}
    </article>
  );
}
