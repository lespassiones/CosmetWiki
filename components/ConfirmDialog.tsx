"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * In-app confirmation pop-up — a styled replacement for the native
 * `window.confirm()` dialog. Renders a dimmed backdrop + a centred white card
 * via a portal on `document.body` so it always covers the viewport regardless
 * of where the trigger sits in the tree.
 *
 * Backdrop click and the Escape key both cancel; while `pending` is true the
 * dialog stays open and locks its buttons so the action can't be fired twice.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  // Portals need `document`, which only exists after the first client render.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onCancel();
    };
    document.addEventListener("keydown", onKey);
    // Focus the safe (cancel) button so an accidental Enter never deletes.
    cancelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, pending, onCancel]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-5 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={() => {
        if (!pending) onCancel();
      }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 ring-1 ring-rose-100">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-rose-500"
            aria-hidden
          >
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
        </div>

        <h2
          id={titleId}
          className="text-center text-[17px] font-semibold tracking-tight text-[#111111]"
        >
          {title}
        </h2>
        {message ? (
          <p className="mt-2 text-center text-[13px] leading-relaxed text-[#6B7280]">
            {message}
          </p>
        ) : null}

        <div className="mt-5 flex gap-2.5">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="neu-btn flex-1 rounded-xl py-2.5 text-sm text-[#374151] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 transition disabled:opacity-60"
          >
            {pending ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
