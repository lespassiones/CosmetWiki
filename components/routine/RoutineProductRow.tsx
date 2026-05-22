"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { removeFromRoutine, setRoutineFrequency } from "@/app/routine/actions";
import { IngredientBlob, type BlobCounts } from "@/components/blob/IngredientBlob";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Frequency = "daily" | "weekly" | "monthly";

const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: "Quotidien",
  weekly: "Hebdo",
  monthly: "Mensuel",
};

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
  frequency: Frequency;
}) {
  const [pending, startTransition] = useTransition();
  const [localFreq, setLocalFreq] = useState<Frequency>(frequency);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();

  function changeFreq(next: Frequency) {
    setLocalFreq(next);
    startTransition(async () => {
      await setRoutineFrequency(routineItemId, next);
      router.refresh();
    });
  }

  function confirmRemove() {
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
      <FrequencyDropdown
        value={localFreq}
        disabled={pending}
        onChange={changeFreq}
      />
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={pending}
        aria-label="Retirer de la routine"
        className="neu-sm-white h-9 w-9 text-rose-500 hover:text-rose-600 inline-flex items-center justify-center disabled:opacity-40"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        </svg>
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Retirer ce produit ?"
        message={`Veux-tu vraiment retirer « ${name} » de ta routine ?`}
        confirmLabel="Retirer"
        pending={pending}
        onConfirm={confirmRemove}
        onCancel={() => setConfirmOpen(false)}
      />
    </li>
  );
}

function FrequencyDropdown({
  value,
  onChange,
  disabled,
}: {
  value: Frequency;
  onChange: (next: Frequency) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click + on Escape so the menu behaves like a real <select>.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open ? "true" : "false"}
        aria-label="Fréquence d'usage"
        onClick={() => setOpen((v) => !v)}
        className="neu-sm-white inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#111111] disabled:opacity-50"
      >
        {FREQUENCY_LABELS[value]}
        <svg className="h-3 w-3 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Fréquence d'usage"
          className="neu-menu absolute right-0 top-full mt-2 min-w-[120px] py-1.5 z-20"
        >
          {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((opt) => {
            const selected = opt === value;
            return (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={selected ? "true" : "false"}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`block w-full text-left px-3 py-1.5 text-[12px] font-medium transition ${
                  selected
                    ? "bg-[#F3F4F6] text-[#111111]"
                    : "text-[#374151] hover:bg-[#F3F4F6]"
                }`}
              >
                {FREQUENCY_LABELS[opt]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
