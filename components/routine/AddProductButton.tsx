"use client";

import { GLASS_PILL_DARK } from "@/lib/ui/glass";

/** sessionStorage key — consumed by AnalysisRunner to flip on `addToRoutine`
 *  when calling /api/analyser. Stamped with a timestamp so a stale flag (user
 *  cancels the ScanSheet then analyses something else 1h later) is ignored. */
export const PENDING_ADD_TO_ROUTINE_KEY = "cw:pendingAddToRoutine";

/**
 * Opens the global ScanSheet (handled by AppShell) via a custom DOM event.
 * The button also stamps a sessionStorage flag so the upcoming analyse (which
 * runs in /analyse via AnalysisRunner) auto-adds its result to the user's
 * routine. The flag is consumed exactly once.
 */
export function AddProductButton({
  variant = "primary",
  className = "",
  label = "+ Ajouter un produit",
}: {
  variant?: "primary" | "ghost";
  className?: string;
  label?: string;
}) {
  function open() {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(PENDING_ADD_TO_ROUTINE_KEY, String(Date.now()));
    }
    window.dispatchEvent(new CustomEvent("cosmecheck:open-scan"));
  }
  if (variant === "ghost") {
    return (
      <button
        type="button"
        onClick={open}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#F43F5E] hover:bg-rose-50 transition ${className}`}
      >
        {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={open}
      className={`${GLASS_PILL_DARK} inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold ${className}`}
    >
      {label}
    </button>
  );
}
