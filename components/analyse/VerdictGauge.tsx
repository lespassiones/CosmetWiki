"use client";

import type { ComponentType } from "react";
import type { VerdictTone } from "@/lib/essentiel/engine";

/**
 * Horizontal "verdict gauge" — five pastilles (cœur / feuille / œil /
 * triangle / stop) on the same row as the "Partager" button (the parent in
 * TitleBar groups them in a single white pill).
 *
 * Visual contract :
 *  - All 5 pastilles ALWAYS keep their tone colour (no greyscale state) so
 *    the user reads the full vert → rouge scale at a glance.
 *  - Inactive pastilles : pastel tone background at very low opacity (≈35 %)
 *    so the gradient stays visible but clearly recedes.
 *  - Active pastille : SATURATED tone (`bg-*-400`), much larger than
 *    inactive (h-12 vs h-5 = nearly 2.5× the body diameter), wrapped in
 *    a WHITE `ring-4` (the "halo" that frames the pop), centred so the
 *    ring overflows symmetrically ABOVE and BELOW the parent pill — the
 *    active pastille intentionally bleeds out of the bandeau's rounded
 *    edge to read as a 3D "lifted" badge. `z-10` keeps it above neighbours
 *    when the ring spills into adjacent slots.
 *  - Inactive pastilles : tiny (`h-5`), `saturate-50` + `opacity-40` so
 *    only the FAINTEST hint of each tone survives — visually they read as
 *    a near-grayscale row, making the active pastille's colour the only
 *    one that screams.
 */
export function VerdictGauge({
  tone,
  orientation = "horizontal",
  className = "",
}: {
  tone: VerdictTone;
  /** "horizontal" (default) keeps the 5 pastilles on a single row — used
   *  inside the toolbar pill on mobile. "vertical" stacks them top-to-bottom,
   *  used as a side column next to the EssentielView cards on desktop. */
  orientation?: "horizontal" | "vertical";
  className?: string;
}) {
  const activeIdx = ACTIVE_INDEX_BY_TONE[tone];
  const isVertical = orientation === "vertical";
  return (
    <div
      role="meter"
      aria-label="Niveau global de la formule"
      aria-valuemin={1}
      aria-valuemax={5}
      aria-valuenow={activeIdx === -1 ? undefined : activeIdx + 1}
      aria-valuetext={
        activeIdx === -1 ? "Indéterminé" : SLOTS[activeIdx].srLabel
      }
      // `overflow-visible` is critical : the active pastille is intentionally
      // TALLER than its slot (h-12 vs h-9) and wrapped in a `ring-4 ring-white`
      // that itself extends another 4 px on each side — clipping would crush
      // the "popping out of the pill" effect the design hinges on.
      className={`flex ${isVertical ? "flex-col" : ""} items-center overflow-visible ${className}`}
    >
      {SLOTS.map((slot, i) => {
        const active = i === activeIdx;
        const Icon = slot.Icon;
        return (
          <div
            key={slot.key}
            title={slot.srLabel}
            // Slot keeps a stable footprint (h-9) so the gauge row never jumps
            // when the active index changes. The active pastille overflows
            // this footprint vertically AND its ring spills into the adjacent
            // slots horizontally — both rely on the parent's `overflow-visible`.
            className="relative flex h-9 w-9 shrink-0 items-center justify-center"
          >
            <span
              aria-hidden
              // `shrink-0` is CRITICAL on the active variant: without it
              // the flex parent (the slot, only h-9 w-9) would horizontally
              // compress the h-12 w-12 span down to the slot's width while
              // keeping its full height → the pastille rendered as a
              // vertical capsule instead of a round circle.
              className={`flex shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                active
                  ? `relative z-10 h-12 w-12 ring-4 ring-white ${slot.activeBadge} shadow-[0_10px_24px_-6px_rgba(15,23,42,0.45)]`
                  : `h-7 w-7 ${slot.inactiveBadge} saturate-50 opacity-40`
              }`}
            >
              <Icon
                className={`${active ? "h-5 w-5" : "h-4 w-4"} ${
                  active ? slot.activeIcon : slot.inactiveIcon
                }`}
              />
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Slots + tone resolution ───────────────────────────────────────────────

type Slot = {
  key: "very-safe" | "safe" | "caution" | "warning" | "danger";
  Icon: ComponentType<{ className?: string }>;
  /** Active state — saturated tone background. */
  activeBadge: string;
  activeIcon: string;
  /** Inactive state — same tone family but pale, with `opacity-40` from the
   *  wrapper class so the user still sees which colour each slot belongs
   *  to (never grey). */
  inactiveBadge: string;
  inactiveIcon: string;
  /** Screen-reader / tooltip label for this slot. */
  srLabel: string;
};

const SLOTS: Slot[] = [
  {
    key: "very-safe",
    Icon: HeartIcon,
    activeBadge: "bg-emerald-400",
    activeIcon: "text-emerald-950",
    inactiveBadge: "bg-emerald-100",
    inactiveIcon: "text-emerald-500",
    srLabel: "Formule très douce",
  },
  {
    key: "safe",
    Icon: LeafIcon,
    activeBadge: "bg-emerald-400",
    activeIcon: "text-emerald-950",
    inactiveBadge: "bg-emerald-100",
    inactiveIcon: "text-emerald-500",
    srLabel: "Formule globalement saine",
  },
  {
    key: "caution",
    Icon: EyeIcon,
    activeBadge: "bg-amber-400",
    activeIcon: "text-amber-950",
    inactiveBadge: "bg-amber-100",
    inactiveIcon: "text-amber-500",
    srLabel: "Formule à surveiller",
  },
  {
    key: "warning",
    Icon: AlertTriangleIcon,
    activeBadge: "bg-orange-500",
    activeIcon: "text-white",
    inactiveBadge: "bg-orange-100",
    inactiveIcon: "text-orange-500",
    srLabel: "Formule moyenne",
  },
  {
    key: "danger",
    Icon: StopOctagonIcon,
    activeBadge: "bg-rose-500",
    activeIcon: "text-white",
    inactiveBadge: "bg-rose-100",
    inactiveIcon: "text-rose-500",
    srLabel: "Formule à examiner attentivement",
  },
];

const ACTIVE_INDEX_BY_TONE: Record<VerdictTone, number> = {
  "very-safe": 0,
  safe: 1,
  caution: 2,
  warning: 3,
  danger: 4,
  // High-risk shares the rightmost (stop) slot — visually identical to a
  // single rouge but always at the danger end of the gauge.
  "high-risk": 4,
  // Unknown leaves the gauge fully dimmed (sentinel value, no active pastille).
  unknown: -1,
};

// ─── Icons (mirror of EssentielView's set so the gauge stays self-contained) ─

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function LeafIcon({ className }: { className?: string }) {
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

function EyeIcon({ className }: { className?: string }) {
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

function AlertTriangleIcon({ className }: { className?: string }) {
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

function StopOctagonIcon({ className }: { className?: string }) {
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
