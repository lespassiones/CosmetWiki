"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { removeFromRoutine, setRoutineFrequency } from "@/app/routine/actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Frequency = "daily" | "weekly" | "monthly";

const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: "Quotidien",
  weekly: "Hebdo",
  monthly: "Mensuel",
};

/**
 * RoutineItemSettings — bloc d'édition d'un produit de routine (twin web de
 * app/routine/item/[id].tsx mobile) : fréquence d'utilisation, voir l'analyse,
 * retirer de la routine. Le hero produit (photo + nom + donut) est rendu par la
 * page serveur ; ce composant client ne porte que les interactions.
 */
export function RoutineItemSettings({
  routineItemId,
  analysisId,
  frequency,
}: {
  routineItemId: string;
  analysisId: string;
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
      router.push("/routine/produits");
      router.refresh();
    });
  }

  return (
    <div className="mt-6 space-y-3">
      {/* Fréquence d'utilisation */}
      <div className="neu flex items-center justify-between gap-3 p-4">
        <span className="text-[14px] font-semibold text-[#111111]">Fréquence d&apos;utilisation</span>
        <FrequencyDropdown value={localFreq} disabled={pending} onChange={changeFreq} />
      </div>

      {/* Voir l'analyse */}
      <Link
        href={`/history/${analysisId}`}
        className="neu-shadow flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M9 13h6M9 17h6" />
        </svg>
        Voir l&apos;analyse
      </Link>

      {/* Retirer de ma routine */}
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        </svg>
        Retirer de ma routine
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Retirer ce produit ?"
        message="Ce produit sera retiré de ta routine."
        confirmLabel="Retirer"
        pending={pending}
        onConfirm={confirmRemove}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
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
                  selected ? "bg-[#F3F4F6] text-[#111111]" : "text-[#374151] hover:bg-[#F3F4F6]"
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
