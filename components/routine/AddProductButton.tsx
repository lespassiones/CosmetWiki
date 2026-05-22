"use client";

import { useState } from "react";
import { AddProductChoiceModal, type EligibleAnalysis } from "./AddProductChoiceModal";

/** sessionStorage key - consumed by AnalysisRunner to flip on `addToRoutine`
 *  when calling /api/analyser. Stamped with a timestamp so a stale flag (user
 *  cancels the ScanSheet then analyses something else 1h later) is ignored. */
export const PENDING_ADD_TO_ROUTINE_KEY = "cw:pendingAddToRoutine";

/**
 * Entry point to add a product to the routine. Opens a small modal that
 * offers two paths:
 *   1. "Déjà scanné" → pick from an existing analyse (no re-scan, instant)
 *   2. "Nouveau produit" → opens the global ScanSheet (legacy flow)
 *
 * The "Nouveau produit" branch keeps the original sessionStorage flag so
 * AnalysisRunner still auto-adds the freshly-analysed product to the
 * routine when the analyse completes.
 */
export function AddProductButton({
  variant = "primary",
  className = "",
  label = "+ Ajouter un produit",
  eligibleAnalyses,
}: {
  variant?: "primary" | "ghost";
  className?: string;
  label?: string;
  /** Analyses the user has already saved but which aren't yet in the routine.
   *  Empty array disables the "Déjà scanné" choice in the modal. */
  eligibleAnalyses: EligibleAnalysis[];
}) {
  const [open, setOpen] = useState(false);

  function openScanSheet() {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(PENDING_ADD_TO_ROUTINE_KEY, String(Date.now()));
      window.dispatchEvent(new CustomEvent("cosmecheck:open-scan"));
    }
  }

  const ButtonChrome =
    variant === "ghost"
      ? `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#F43F5E] hover:bg-rose-50 transition ${className}`
      : `neu-shadow inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#1F2937] via-[#111111] to-[#0A0A0A] hover:brightness-110 transition ${className}`;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={ButtonChrome}>
        {label}
      </button>
      <AddProductChoiceModal
        open={open}
        onClose={() => setOpen(false)}
        onPickNew={openScanSheet}
        eligibleAnalyses={eligibleAnalyses}
      />
    </>
  );
}
