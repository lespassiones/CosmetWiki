"use client";

import { useState } from "react";

/**
 * Wraps content with a mobile-only collapse + "Voir plus" toggle.
 * On viewports ≥ lg, the wrapper is transparent: children are always shown
 * in full and no button is rendered.
 *
 * Usage:
 *   <MobileExpander expandLabel="Voir la synthèse complète" collapseLabel="Réduire" collapsedMaxHeight={120}>
 *     {children}
 *   </MobileExpander>
 */
export function MobileExpander({
  children,
  expandLabel,
  collapseLabel = "Réduire ↑",
  collapsedMaxHeight = 110,
}: {
  children: React.ReactNode;
  expandLabel: string;
  collapseLabel?: string;
  collapsedMaxHeight?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div
        className="relative overflow-hidden lg:max-h-none lg:overflow-visible transition-[max-height] duration-300 ease-out"
        style={{ maxHeight: expanded ? "none" : `${collapsedMaxHeight}px` }}
      >
        {children}
        {!expanded && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent lg:hidden"
          />
        )}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="lg:hidden mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-[#F43F5E] hover:underline"
      >
        {expanded ? collapseLabel : `${expandLabel} →`}
      </button>
    </div>
  );
}
