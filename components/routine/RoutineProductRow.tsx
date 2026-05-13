"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { removeFromRoutine, setRoutineFrequency } from "@/app/routine/actions";
import { IngredientBlob, type BlobCounts } from "@/components/blob/IngredientBlob";

export function RoutineProductRow({
  routineItemId,
  analysisId,
  name,
  counts,
  frequency,
}: {
  routineItemId: string;
  analysisId: string;
  name: string;
  counts: BlobCounts | null;
  frequency: "daily" | "weekly" | "monthly";
}) {
  const [pending, startTransition] = useTransition();
  const [localFreq, setLocalFreq] = useState(frequency);
  const router = useRouter();

  function changeFreq(next: string) {
    setLocalFreq(next as typeof localFreq);
    startTransition(async () => {
      await setRoutineFrequency(routineItemId, next);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm("Retirer ce produit de ta routine ?")) return;
    startTransition(async () => {
      await removeFromRoutine(routineItemId);
      router.refresh();
    });
  }

  return (
    <li className="flex items-center gap-3 py-3">
      <div className="h-10 w-14 shrink-0">
        <IngredientBlob
          counts={counts ?? { vert: 0, jaune: 0, orange: 0, rouge: 0 }}
          variant="sm"
        />
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/history/${analysisId}`} className="block font-semibold truncate hover:underline">
          {name}
        </Link>
      </div>
      <select
        value={localFreq}
        onChange={(e) => changeFreq(e.target.value)}
        disabled={pending}
        aria-label="Fréquence d'usage"
        className="rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[12px] font-medium outline-none focus:border-[#111111]"
      >
        <option value="daily">Quotidien</option>
        <option value="weekly">Hebdo</option>
        <option value="monthly">Mensuel</option>
      </select>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        aria-label="Retirer de la routine"
        className="h-8 w-8 rounded-full text-[#9CA3AF] hover:text-[#E11D48] hover:bg-rose-50 inline-flex items-center justify-center disabled:opacity-40"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        </svg>
      </button>
    </li>
  );
}
