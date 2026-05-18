"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Placement = "top" | "bottom";

// Minimum gap between the tooltip and the viewport edges. Even when the
// trigger sits right next to the screen border (e.g. an InfoBadge in a
// narrow card on mobile), the tooltip never visually touches the edge.
const SAFE_MARGIN = 14;

/**
 * Minimal accessible tooltip - hover on desktop, tap-to-toggle on touch.
 * The tooltip body is rendered through a portal so it escapes any clipping
 * or stacking-context issues created by ancestor cards/animations.
 *
 * Width is clamped to the viewport (minus SAFE_MARGIN on each side) so the
 * box never collides with the screen edges on phones - independently of the
 * configured `maxWidth`. The horizontal position is computed to keep the
 * tooltip fully visible, with the arrow re-anchored under the trigger center.
 *
 * Tap-outside / Escape both dismiss. The tooltip is `role="tooltip"` with
 * `aria-describedby` wired so screen readers announce it on focus.
 */
export function Tooltip({
  children,
  content,
  placement = "top",
  maxWidth = 240,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  placement?: Placement;
  maxWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [layout, setLayout] = useState<{
    left: number;
    top: number;
    maxW: number;
    arrowLeft: number;
  } | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset the layout when the tooltip closes so the next opening is always
  // hidden until a fresh measurement is done - avoids a flash at the previous
  // position when the trigger has scrolled.
  useEffect(() => {
    if (!open) setLayout(null);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !wrapperRef.current) return;
    const update = () => {
      if (!wrapperRef.current || !tooltipRef.current) return;
      const trig = wrapperRef.current.getBoundingClientRect();
      const triggerCenterX = trig.left + trig.width / 2;
      const top = placement === "top" ? trig.top - 8 : trig.bottom + 8;

      // Cap the tooltip's max width to whatever fits inside the viewport
      // safe area - guarantees a SAFE_MARGIN gap on both sides on phones.
      const vw = window.innerWidth;
      const maxW = Math.min(maxWidth, Math.max(0, vw - 2 * SAFE_MARGIN));

      // Read the tooltip's actual rendered width (may be less than maxW when
      // content is short). We re-clamp to maxW because the first paint of
      // the tooltip used `maxWidth: maxWidth` (the prop), not yet our
      // viewport-aware cap - so on very narrow screens the rect can briefly
      // exceed maxW.
      const tipRect = tooltipRef.current.getBoundingClientRect();
      const actualW = Math.min(tipRect.width, maxW);

      // Centred under the trigger, clamped so the tooltip stays fully inside
      // the safe area. arrowLeft re-anchors the arrow under the real trigger
      // centre even when the box itself was pushed left or right.
      const idealLeft = triggerCenterX - actualW / 2;
      const left = Math.max(SAFE_MARGIN, Math.min(idealLeft, vw - SAFE_MARGIN - actualW));
      const arrowLeft = triggerCenterX - left;

      setLayout({ left, top, maxW, arrowLeft });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, placement, maxWidth]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(e.target as Node)) return;
      if (tooltipRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // The tooltip is rendered immediately when open, but kept invisible until
  // the layout effect computes its position (next synchronous tick, before
  // paint). This avoids any flash at a stale or off-screen position.
  const tooltipNode = open ? (
    <span
      ref={tooltipRef}
      id={id}
      role="tooltip"
      style={{
        maxWidth: layout?.maxW ?? maxWidth,
        position: "fixed",
        left: layout?.left ?? 0,
        top: layout?.top ?? 0,
        transform: placement === "top" ? "translateY(-100%)" : "none",
        visibility: layout ? "visible" : "hidden",
        zIndex: 9999,
      }}
      className="pointer-events-none whitespace-normal rounded-xl bg-[#111111] px-3 py-2 text-[12px] font-medium text-white shadow-[0_10px_24px_-10px_rgba(15,23,42,0.45)] ring-1 ring-white/[0.08]"
    >
      {content}
      {layout && (
        <span
          aria-hidden
          style={{
            // Clamp the arrow inside the rounded body so the diamond never
            // overlaps the corner radius.
            left: Math.max(14, Math.min(layout.arrowLeft, (tooltipRef.current?.offsetWidth ?? layout.maxW) - 14)),
            transform: "translateX(-50%)",
          }}
          className={`absolute h-2 w-2 rotate-45 bg-[#111111] ${
            placement === "top" ? "-bottom-1" : "-top-1"
          }`}
        />
      )}
    </span>
  ) : null;

  return (
    <span
      ref={wrapperRef}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-describedby={open ? id : undefined}
        className="inline-flex"
      >
        {children}
      </span>
      {mounted && tooltipNode ? createPortal(tooltipNode, document.body) : null}
    </span>
  );
}

/**
 * Small (i) icon button - pair with `<Tooltip>` to add inline help next to
 * a section heading.
 */
export function InfoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`grid h-4 w-4 place-items-center rounded-full bg-black/[0.06] text-[10px] font-semibold text-ink-muted ring-1 ring-black/[0.04] ${className}`}
    >
      i
    </span>
  );
}
