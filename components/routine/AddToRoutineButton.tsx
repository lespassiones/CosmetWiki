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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[12px] font-medium px-2.5 py-1">
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
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
      className={`${GLASS_PILL} inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 disabled:opacity-50`}
    >
      <span aria-hidden>＋</span>
      {pending ? "Ajout…" : "Ajouter à ma routine"}
    </button>
  );
}
