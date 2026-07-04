"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToRoutine } from "@/app/routine/actions";

export function AddToRoutineButton({
  analysisId,
  alreadyInRoutine = false,
  className = "",
}: {
  analysisId: string;
  alreadyInRoutine?: boolean;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(alreadyInRoutine);
  const router = useRouter();

  function add() {
    startTransition(async () => {
      const r = await addToRoutine(analysisId);
      if (r.ok) {
        setDone(true);
        router.refresh();
      }
    });
  }

  if (done) {
    return (
      <span
        className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[13px] font-medium px-3 sm:px-3.5 py-1.5 ring-1 ring-emerald-100 ${className}`}
      >
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
          <path d="M5 12l5 5 9-12" />
        </svg>
        <span className="min-w-0 truncate">Dans ta routine</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={pending}
      // Rose CTA matching the site accent (#F43F5E) with a rose-tinted
      // neumorphic lift (.neu-shadow-rose). Hover darkens slightly; the
      // class already handles translateY on hover and inset press on active.
      // min-w-0 + truncate on the label so the button can shrink in flex-1
      // slots (analyse header on mobile) without breaking the row.
      className={`neu-shadow inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-500 text-white text-xs sm:text-[13px] font-semibold px-3 sm:px-3.5 py-1.5 transition hover:bg-emerald-600 disabled:opacity-60 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      <span className="min-w-0 truncate">
        {pending ? "Ajout…" : "Ajouter à ma routine"}
      </span>
    </button>
  );
}
