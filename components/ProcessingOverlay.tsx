"use client";

import { useEffect, useState } from "react";

const DEFAULT_STEPS = [
  "Lecture de la liste",
  "Identification des ingrédients",
  "Détection des catégories",
  "Évaluation des ingrédients",
  "Génération de la synthèse",
];

/** Random duration between 5000 and 6000 ms — used for both list analysis and single-ingredient lookups. */
export function randomProcessingTotal(): number {
  return Math.round(5000 + Math.random() * 1000);
}

/**
 * Random per-step durations, summing to `totalMs`.
 *  - each weight ∈ [0.4, 1.6]
 *  - normalized so the sum equals `totalMs - 200` (last 200ms reserved as visible end-state)
 *  - never less than 200ms per step
 */
function generateStepDurations(totalMs: number, n: number): number[] {
  const weights = Array.from({ length: n }, () => 0.4 + Math.random() * 1.2);
  const sum = weights.reduce((a, b) => a + b, 0);
  const usable = Math.max(totalMs - 200, n * 200);
  const durations = weights.map((w) => Math.max(200, Math.round((w / sum) * usable)));
  const drift = usable - durations.reduce((a, b) => a + b, 0);
  durations[durations.length - 1] += drift;
  return durations;
}

export type ProcessingOverlayProps = {
  /** Total duration in ms. Use `randomProcessingTotal()` to vary it between runs. */
  totalMs: number;
  /** Optional custom step labels. Defaults to the list-analysis steps. */
  steps?: string[];
  /** Heading text. Defaults to "On décode la composition…". */
  headline?: string;
  /** Eyebrow text above the headline. Defaults to "Analyse en cours". */
  eyebrow?: string;
};

export function ProcessingOverlay({
  totalMs,
  steps = DEFAULT_STEPS,
  headline = "On décode la composition…",
  eyebrow = "Analyse en cours",
}: ProcessingOverlayProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const durations = generateStepDurations(totalMs, steps.length);
    let cancelled = false;
    let cumulative = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    durations.forEach((d, idx) => {
      cumulative += d;
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          setStep(Math.min(idx + 1, steps.length - 1));
        }, cumulative),
      );
    });
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [totalMs, steps.length]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-[min(28rem,calc(100vw-2rem))] rounded-3xl bg-white/90 p-7 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.20)] ring-1 ring-white/80 backdrop-blur-2xl">
        <div className="pl-[1.875rem]">
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
            {eyebrow}
          </p>
          <p className="text-[15px] font-semibold text-ink">{headline}</p>
        </div>

        <ul className="mt-5 space-y-2 text-[13px]">
          {steps.map((label, i) => {
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
                        ? "bg-white ring-2 ring-rose-300"
                        : "bg-black/[0.05] ring-1 ring-black/[0.05]"
                  }`}
                >
                  {state === "done" ? (
                    <CheckIcon className="h-3 w-3" />
                  ) : state === "active" ? (
                    <span className="block h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" aria-hidden />
                  ) : null}
                </span>
                <span>{label}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-black/[0.05]">
          <span className="block h-full w-1/3 animate-[shimmer_1.4s_linear_infinite] rounded-full bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
