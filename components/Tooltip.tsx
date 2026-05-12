"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Placement = "top" | "bottom";

/**
 * Minimal accessible tooltip — hover on desktop, tap-to-toggle on touch.
 * The tooltip body is rendered through a portal so it escapes any clipping
 * or stacking-context issues created by ancestor cards/animations.
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
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !wrapperRef.current) return;
    const update = () => {
      if (!wrapperRef.current) return;
      const r = wrapperRef.current.getBoundingClientRect();
      const left = r.left + r.width / 2;
      const top = placement === "top" ? r.top - 8 : r.bottom + 8;
      setCoords({ left, top });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, placement]);

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

  const tooltipNode = open && coords ? (
    <span
      ref={tooltipRef}
      id={id}
      role="tooltip"
      style={{
        maxWidth,
        position: "fixed",
        left: coords.left,
        top: coords.top,
        transform: placement === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
        zIndex: 9999,
      }}
      className="pointer-events-none whitespace-normal rounded-xl bg-[#111111] px-3 py-2 text-[12px] font-medium text-white shadow-[0_10px_24px_-10px_rgba(15,23,42,0.45)] ring-1 ring-white/[0.08]"
    >
      {content}
      <span
        aria-hidden
        className={`absolute left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-[#111111] ${
          placement === "top" ? "-bottom-1" : "-top-1"
        }`}
      />
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
 * Small (i) icon button — pair with `<Tooltip>` to add inline help next to
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
