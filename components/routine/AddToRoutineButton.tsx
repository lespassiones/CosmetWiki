"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToRoutine } from "@/app/routine/actions";
import { GLASS_PILL } from "@/lib/ui/glass";

export function AddToRoutineButton({
  analysisId,
  alreadyInRoutine = false,
}: {
  analysisId: string;
  alreadyInRoutine?: boolean;
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[13px] font-medium px-3.5 py-1.5 ring-1 ring-emerald-100">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
          <path d="M5 12l5 5 9-12" />
        </svg>
        Dans ta routine
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={pending}
      className={`${GLASS_PILL} inline-flex items-center gap-1.5 text-[13px] font-medium px-3.5 py-1.5 text-ink disabled:opacity-50`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      {pending ? "Ajout…" : "Ajouter à ma routine"}
    </button>
  );
}
