"use client";

import { useState, useTransition } from "react";
import { deleteCoherenceAnalysis } from "@/app/promesses/actions";

/**
 * Three-dot menu button for a coherence analysis row. Shows a tiny popover
 * with a single "Supprimer" action (with native confirm). Mirrors the same
 * pattern as HistoryItemActions but stripped of the rename feature since
 * coherence analyses are tied to a parent INCI analysis name.
 *
 * Click on the dots stops propagation so the user doesn't accidentally
 * navigate into the row's <Link> wrapper.
 */
export function CoherenceItemActions({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Supprimer définitivement cette analyse de cohérence ?")) return;
    startTransition(async () => {
      await deleteCoherenceAnalysis(id);
    });
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((s) => !s);
        }}
        aria-label="Plus d'actions"
        className="neu-sm rounded-full h-9 w-9 inline-flex items-center justify-center text-[#6B7280] hover:text-[#111111] transition"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>

      {open && (
        <div
          className="neu-menu absolute right-0 top-11 z-30 w-52 p-2"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#E11D48] hover:bg-rose-50 flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            </svg>
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}
