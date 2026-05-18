"use client";

import { useState, type CSSProperties } from "react";

/**
 * Wraps content with a collapse + "Voir plus" toggle.
 *
 * By default the collapse is mobile-only (≥ lg the children are always shown
 * in full). Pass `desktopCollapsedMaxHeight` to also clamp on desktop - the
 * button then shows on every viewport. Useful for the synthesis, which can
 * be a bit long on the analysis page even on desktop.
 */
export function MobileExpander({
  children,
  expandLabel,
  collapseLabel = "Réduire ↑",
  collapsedMaxHeight = 110,
  desktopCollapsedMaxHeight,
}: {
  children: React.ReactNode;
  expandLabel: string;
  collapseLabel?: string;
  /** Max height (px) when collapsed on mobile. */
  collapsedMaxHeight?: number;
  /**
   * Max height (px) when collapsed on desktop. Omit to keep the current
   * mobile-only behaviour (children rendered in full on lg+).
   */
  desktopCollapsedMaxHeight?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDesktopCollapse = desktopCollapsedMaxHeight !== undefined;

  // CSS variables let us use different max-heights at mobile vs lg+ via
  // Tailwind arbitrary values (max-h-[var(--…)] + lg:max-h-[var(--…)]).
  const style: CSSProperties = {
    "--cw-m-h": expanded ? "none" : `${collapsedMaxHeight}px`,
    "--cw-d-h": expanded
      ? "none"
      : hasDesktopCollapse
        ? `${desktopCollapsedMaxHeight}px`
        : "none",
  } as CSSProperties;

  const fadeClass = hasDesktopCollapse
    ? "pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent"
    : "pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent lg:hidden";

  const buttonClass = hasDesktopCollapse
    ? "mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-[#F43F5E] hover:underline"
    : "lg:hidden mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-[#F43F5E] hover:underline";

  return (
    <div>
      <div
        style={style}
        className="relative overflow-hidden max-h-[var(--cw-m-h)] lg:max-h-[var(--cw-d-h)] transition-[max-height] duration-300 ease-out"
      >
        {children}
        {!expanded && <div aria-hidden className={fadeClass} />}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className={buttonClass}
      >
        {expanded ? collapseLabel : `${expandLabel} →`}
      </button>
    </div>
  );
}
