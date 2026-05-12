"use client";

import { useEffect, useId, useRef, useState } from "react";

type Placement = "top" | "bottom";

/**
 * Minimal accessible tooltip — hover on desktop, tap-to-toggle on touch.
 * The trigger is the single child element; we attach the handlers via cloning
 * a wrapper span (kept simple — no portal, no Radix).
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
  /** px — caps the tooltip width so long strings wrap nicely. */
  maxWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(e.target as Node)) return;
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
        // Tap on touch devices toggles — desktop already handled by hover.
        onClick={(e) => {
          // Don't swallow buttons' own onClick; just toggle.
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-describedby={open ? id : undefined}
        className="inline-flex"
      >
        {children}
      </span>
      {open ? (
        <span
          id={id}
          role="tooltip"
          style={{ maxWidth }}
          className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-normal rounded-xl bg-[#111111] px-3 py-2 text-[12px] font-medium text-white shadow-[0_10px_24px_-10px_rgba(15,23,42,0.45)] ring-1 ring-white/[0.08] ${
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {content}
          <span
            aria-hidden
            className={`absolute left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-[#111111] ${
              placement === "top" ? "-bottom-1" : "-top-1"
            }`}
          />
        </span>
      ) : null}
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
