"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { GLASS_PILL, GLASS_PILL_DARK } from "@/lib/ui/glass";
import { decodeHtml } from "@/lib/decodeHtml";
import { addToRoutine } from "@/app/routine/actions";

export type EligibleAnalysis = {
  id: string;
  name: string | null;
  product_label: string | null;
  score: number | null;
  created_at: string;
};

type Step = "choice" | "pickExisting";

/**
 * Modal opened by AddProductButton. Lets the user pick between two flows:
 *   - "Déjà scanné" : pick one of the existing analyses (instant, no scan)
 *   - "Nouveau produit" : opens the scan sheet like before
 *
 * The "Déjà scanné" path uses the addToRoutine server action directly so the
 * upsert lands in cosme_check.routine_items + revalidatePath flips the
 * /routine page to show the new product on the next paint.
 */
export function AddProductChoiceModal({
  open,
  onClose,
  onPickNew,
  eligibleAnalyses,
}: {
  open: boolean;
  onClose: () => void;
  /** Called when the user picks "Nouveau produit" - caller opens the scan sheet. */
  onPickNew: () => void;
  eligibleAnalyses: EligibleAnalysis[];
}) {
  const [step, setStep] = useState<Step>("choice");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");

  // Reset internal state every time the modal re-opens - otherwise an
  // ESC-then-reopen would land the user on the previous sub-step.
  useEffect(() => {
    if (open) {
      setStep("choice");
      setPendingId(null);
      setError(null);
      setQuery("");
    }
  }, [open]);

  // Trap Esc + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return eligibleAnalyses;
    return eligibleAnalyses.filter((a) => {
      const label = (a.product_label ?? a.name ?? "").toLowerCase();
      return label.includes(q);
    });
  }, [eligibleAnalyses, query]);

  function pickExisting(id: string) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const res = await addToRoutine(id);
      setPendingId(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onClose();
    });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end lg:items-center justify-center bg-[rgba(17,17,17,0.55)] animate-[fadeIn_180ms_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-label="Ajouter un produit à la routine"
      onClick={onClose}
    >
      <div
        className="w-full lg:max-w-lg bg-white rounded-t-3xl lg:rounded-3xl shadow-xl pb-6 pt-3 lg:pt-6 max-h-[88vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:hidden mx-auto h-1 w-10 rounded-full bg-[#D1D5DB] mb-4" aria-hidden />

        <div className="px-5 lg:px-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-[18px] font-semibold text-ink">
                {step === "choice" ? "Ajouter à ma routine" : "Choisir une analyse"}
              </h2>
              <p className="text-[12px] text-[#6B7280] mt-0.5">
                {step === "choice"
                  ? "Analyse un nouveau produit ou choisis-en un dans ton historique."
                  : "Sélectionne une analyse de ton historique."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="shrink-0 grid h-8 w-8 place-items-center rounded-full text-[#6B7280] hover:bg-black/[0.04] hover:text-ink"
            >
              <span aria-hidden className="text-lg leading-none">×</span>
            </button>
          </div>

          {step === "choice" && (
            <div className="flex flex-col gap-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPickNew();
                }}
                className="flex items-center gap-3 text-left rounded-2xl ring-1 ring-[#E5E7EB] hover:ring-[#111111] bg-white p-4 transition group"
              >
                <span
                  aria-hidden
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-rose-50 text-xl"
                >
                  📷
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold text-ink">
                    Analyser un nouveau produit
                  </div>
                  <p className="text-[12px] text-[#6B7280] leading-relaxed">
                    Scanne ou colle une composition à analyser.
                  </p>
                </div>
                <span aria-hidden className="text-[#9CA3AF]">›</span>
              </button>
              <button
                type="button"
                onClick={() => setStep("pickExisting")}
                disabled={eligibleAnalyses.length === 0}
                className="flex items-center gap-3 text-left rounded-2xl ring-1 ring-[#E5E7EB] hover:ring-[#111111] bg-white p-4 transition group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span
                  aria-hidden
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-violet-50 text-xl"
                >
                  🕐
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold text-ink">
                    Choisir dans mon historique
                  </div>
                  <p className="text-[12px] text-[#6B7280] leading-relaxed">
                    {eligibleAnalyses.length === 0
                      ? "Toutes tes analyses sont déjà dans la routine."
                      : "Ajoute une analyse déjà réalisée, sans la refaire."}
                  </p>
                </div>
                <span aria-hidden className="text-[#9CA3AF]">›</span>
              </button>
            </div>
          )}

          {step === "pickExisting" && (
            <div>
              {eligibleAnalyses.length > 4 && (
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher dans tes analyses…"
                  className="w-full rounded-xl bg-white ring-1 ring-[#E5E7EB] px-3 py-2.5 text-[13px] outline-none transition focus:ring-2 focus:ring-rose-300 mb-3"
                  autoComplete="off"
                />
              )}

              {filtered.length === 0 ? (
                <p className="text-[13px] text-[#9CA3AF] text-center py-6">
                  Aucune analyse ne correspond à ta recherche.
                </p>
              ) : (
                <ul className="space-y-1.5 max-h-[420px] overflow-auto pr-1">
                  {filtered.map((a) => {
                    const label = decodeHtml(
                      a.product_label
                      ?? a.name
                      ?? `Analyse du ${formatDate(a.created_at)}`,
                    );
                    const score = typeof a.score === "number" ? a.score.toFixed(1) : "-";
                    const isPendingThis = pendingId === a.id && isPending;
                    return (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => pickExisting(a.id)}
                          disabled={isPending}
                          className="w-full text-left rounded-xl ring-1 ring-[#E5E7EB] hover:ring-[#111111] bg-white px-3 py-2.5 transition disabled:opacity-50 disabled:cursor-wait"
                        >
                          <div className="flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="text-[13px] font-semibold text-ink truncate">
                                {label}
                              </div>
                              <div className="text-[11px] text-[#6B7280]">
                                Score {score}/20 · {formatDate(a.created_at)}
                              </div>
                            </div>
                            {isPendingThis ? (
                              <span className="text-[11px] text-[#6B7280]">Ajout…</span>
                            ) : (
                              <span aria-hidden className="text-[#9CA3AF]">→</span>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("choice")}
                  className={`${GLASS_PILL} px-4 py-2 text-[13px] font-medium`}
                  disabled={isPending}
                >
                  ← Retour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPickNew();
                  }}
                  className={`${GLASS_PILL_DARK} flex-1 px-4 py-2 text-[13px] font-semibold`}
                  disabled={isPending}
                >
                  Scanner un nouveau produit
                </button>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-3 text-[12px] text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
