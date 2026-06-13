"use client";

import type { ComponentType, CSSProperties } from "react";
import type { ConcernTier, EssentielData, VerdictTone } from "@/lib/essentiel/engine";

/** CSS variable consumed by the `.stagger-up` keyframe (defined in
 *  globals.css). Returned typed as CSSProperties so TS accepts the custom
 *  property name. */
function staggerDelay(delayMs: number): CSSProperties {
  return { ["--stagger-delay" as string]: `${delayMs}ms` } as CSSProperties;
}

/**
 * The "essentiel" 3-card snapshot rendered ABOVE the full analysis grid.
 *
 *  - Card 1 "L'essentiel" : a one-sentence verdict + tone-coloured pastille.
 *  - Card 2 "Ce qui est bien" : top 3 green ingredients with a short action
 *    verb derived from their primaryFunction (no LLM).
 *  - Card 3 "À surveiller" : one line per problematic tier (jaune/orange/rouge),
 *    each citing the ingredient FAMILY + a plain-French EFFECT, never the
 *    individual ingredient name. Falls back to "Tout va bien" when no
 *    flagged ingredient is present.
 *
 *  All data comes from the rules engine in `lib/essentiel/engine.ts` — fully
 *  deterministic, instant, no AI roundtrip.
 */
export function EssentielView({
  data,
  expanded,
  onToggle,
  hideToggle = false,
  scoreTone,
}: {
  data: EssentielData;
  expanded: boolean;
  onToggle: () => void;
  /** When true, the "Voir l'analyse complète" / "Masquer le détail" toggle
   *  button is NOT rendered inside this section. The parent is expected to
   *  render it separately (typically below the flex row that pairs the cards
   *  with the desktop verdict gauge — keeps the gauge's `items-stretch`
   *  matching only the 3 cards' height, not including the toggle). */
  hideToggle?: boolean;
  /** When provided, overrides the badge icon of the VerdictCard with the
   *  score-derived tone so it stays identical to the VerdictGauge. */
  scoreTone?: VerdictTone;
}) {
  return (
    <section className="mt-4 space-y-3 lg:max-w-3xl" aria-label="Aperçu essentiel de l'analyse">
      {/* Each card uses the `.stagger-up` animation (defined in globals.css)
          with an incremental --stagger-delay so the 3 blocks fade-up one
          after the other on mount. The animation only runs on the first
          render — subsequent re-renders (toggle expand/collapse) keep the
          cards visible. */}
      <div className="stagger-up" style={staggerDelay(0)}>
        <VerdictCard verdict={data.verdict} scoreTone={scoreTone} />
      </div>
      {data.positives.length > 0 ? (
        <div className="stagger-up" style={staggerDelay(120)}>
          <PositivesCard positives={data.positives} />
        </div>
      ) : null}
      <div className="stagger-up" style={staggerDelay(240)}>
        {data.concerns.length > 0 ? (
          <ConcernsCard concerns={data.concerns} />
        ) : (
          <AllClearCard />
        )}
      </div>

      {hideToggle ? null : (
        <div className="stagger-up flex justify-center pt-2" style={staggerDelay(360)}>
          <EssentielToggleButton expanded={expanded} onToggle={onToggle} />
        </div>
      )}
    </section>
  );
}

/**
 * The "Voir l'analyse complète" / "Masquer le détail" toggle button extracted
 * as its own component so callers can render it OUTSIDE `EssentielView` when
 * they need the desktop verdict gauge to match only the cards' height
 * (the gauge uses `items-stretch`, and keeping the toggle inside the same
 * flex item would make the gauge taller than the cards).
 */
export function EssentielToggleButton({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="neu-sm-white inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-medium text-[#374151] hover:text-[#111111] transition"
    >
      {expanded ? "Masquer le détail" : "Voir l'analyse complète"}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
}

// ─── Cards ────────────────────────────────────────────────────────────────

function VerdictCard({ verdict, scoreTone }: { verdict: EssentielData["verdict"]; scoreTone?: VerdictTone }) {
  const badgeTone = scoreTone ?? verdict.tone;
  const v = VERDICT_VISUAL[badgeTone];
  const Icon = v.Icon;
  return (
    <article className="neu flex items-center gap-4 p-4">
      <div
        className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${v.badgeClass}`}
        aria-hidden
      >
        <Icon className={`h-5 w-5 ${v.iconClass}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-[#6B7280] mb-1">
          L&apos;essentiel
        </div>
        <p className="text-[14px] font-semibold text-[#111111] leading-snug">
          {verdict.phrase}
        </p>
      </div>
    </article>
  );
}

function PositivesCard({ positives }: { positives: EssentielData["positives"] }) {
  return (
    <article className="neu flex items-start gap-4 p-4">
      <div
        className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500 flex items-center justify-center mt-0.5"
        aria-hidden
      >
        <ShieldCheckIcon className="h-[18px] w-[18px] text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-[#6B7280] mb-1.5">
          Ce qui est bien
        </div>
        <ul className="space-y-1.5">
          {positives.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] leading-snug">
              <CheckIcon className="h-3.5 w-3.5 shrink-0 mt-1 text-emerald-500" />
              <span className="text-[#111111]">
                <span className="font-semibold">{p.name}</span>
                <span className="text-[#6B7280]"> -&gt; {p.verb}</span>
                {p.secondary ? (
                  <span className="text-[#9CA3AF]"> · {p.secondary}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function ConcernsCard({ concerns }: { concerns: EssentielData["concerns"] }) {
  // The pastille is tinted to the WORST tier present. `concerns` is already
  // ordered rouge → orange → jaune by the engine, so the first entry wins.
  const worst = concerns[0];
  const v = CONCERN_VISUAL[worst.tier];
  const Icon = v.Icon;
  return (
    <article className="neu flex items-start gap-4 p-4">
      <div
        className={`h-10 w-10 shrink-0 rounded-full ${v.badgeClass} flex items-center justify-center mt-0.5`}
        aria-hidden
      >
        <Icon className={`h-5 w-5 ${v.iconClass}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-[#6B7280] mb-1.5">
          À surveiller
        </div>
        <ul className="space-y-1.5">
          {concerns.map((c, i) => {
            const cv = CONCERN_VISUAL[c.tier];
            return (
              <li key={i} className="flex items-start gap-2 text-[13px] leading-snug">
                <span
                  aria-hidden
                  className={`h-2 w-2 shrink-0 mt-1.5 rounded-full ${cv.dotClass}`}
                />
                <span className="text-[#111111]">
                  <span className="font-semibold">{c.family}</span>
                  <span className="text-[#6B7280]"> -&gt; {c.effect}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}

function AllClearCard() {
  return (
    <article className="neu flex items-center gap-4 p-4">
      <div
        className="h-10 w-10 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center"
        aria-hidden
      >
        <CheckIcon className="h-5 w-5 text-emerald-600" strokeWidth={2.6} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-[#6B7280] mb-1">
          Tout va bien
        </div>
        <p className="text-[14px] font-semibold text-[#111111] leading-snug">
          Aucun ingrédient à signaler dans cette formule.
        </p>
      </div>
    </article>
  );
}

// ─── Icons (line-based stroke style to match the rest of the app) ─────────

type IconProps = { className?: string; strokeWidth?: number };

function HeartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function LeafIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M11 20A7 7 0 0 1 4 13V8a7 7 0 0 1 7-7h7v6a7 7 0 0 1-7 7h-3" />
      <path d="M2 21c4-5 7-7 14-9" />
    </svg>
  );
}

function EyeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function AlertTriangleIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  );
}

function StopOctagonIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function BanIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

function QuestionIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  );
}

function CheckIcon({ className, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

// ─── Visual maps ──────────────────────────────────────────────────────────

const VERDICT_VISUAL: Record<
  VerdictTone,
  { Icon: ComponentType<IconProps>; badgeClass: string; iconClass: string }
> = {
  "very-safe": { Icon: HeartIcon, badgeClass: "bg-emerald-100", iconClass: "text-emerald-600" },
  safe: { Icon: LeafIcon, badgeClass: "bg-emerald-100", iconClass: "text-emerald-600" },
  caution: { Icon: EyeIcon, badgeClass: "bg-amber-100", iconClass: "text-amber-600" },
  warning: { Icon: AlertTriangleIcon, badgeClass: "bg-orange-100", iconClass: "text-orange-600" },
  danger: { Icon: StopOctagonIcon, badgeClass: "bg-rose-100", iconClass: "text-rose-600" },
  "high-risk": { Icon: BanIcon, badgeClass: "bg-rose-200", iconClass: "text-rose-700" },
  unknown: { Icon: QuestionIcon, badgeClass: "bg-gray-100", iconClass: "text-gray-500" },
};

const CONCERN_VISUAL: Record<
  ConcernTier,
  {
    Icon: ComponentType<IconProps>;
    badgeClass: string;
    iconClass: string;
    dotClass: string;
  }
> = {
  jaune: {
    Icon: EyeIcon,
    badgeClass: "bg-amber-100",
    iconClass: "text-amber-600",
    dotClass: "bg-amber-400",
  },
  orange: {
    Icon: AlertTriangleIcon,
    badgeClass: "bg-orange-100",
    iconClass: "text-orange-600",
    dotClass: "bg-orange-500",
  },
  rouge: {
    Icon: StopOctagonIcon,
    badgeClass: "bg-rose-100",
    iconClass: "text-rose-600",
    dotClass: "bg-rose-500",
  },
};
