"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Detail = { used?: number; limit?: number };

/**
 * Listens for a `cosmecheck:credits-exhausted` event and opens a modal.
 * Dispatch it from anywhere in the client after a 429 response with a
 * `credits` payload, e.g.:
 *
 *   const data = await res.json();
 *   if (res.status === 429 && data.credits) {
 *     window.dispatchEvent(new CustomEvent("cosmecheck:credits-exhausted", {
 *       detail: data.credits,
 *     }));
 *   }
 *
 * Closing the modal (backdrop click, Escape, "Plus tard") simply dismisses it
 * and KEEPS the user exactly where they were. "Découvrir Premium" pushes to
 * /offre (so a browser back returns to the origin page) and records the origin
 * in `returnAfterPaywall` so OffrePageClient can offer a direct "Retour".
 */
export function CreditsExhaustedModal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Detail>({});

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const goPremium = useCallback(() => {
    try {
      sessionStorage.setItem(
        "returnAfterPaywall",
        window.location.pathname + window.location.search,
      );
    } catch {
      /* sessionStorage indisponible */
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    const onShow = (e: Event) => {
      const ev = e as CustomEvent<Detail>;
      setDetail(ev.detail ?? {});
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("cosmecheck:credits-exhausted", onShow as EventListener);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("cosmecheck:credits-exhausted", onShow as EventListener);
      document.removeEventListener("keydown", onKey);
    };
  }, [close]);

  if (!open) return null;

  const limit = detail.limit ?? 100;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="credits-exhausted-title"
      onClick={close}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 ring-1 ring-rose-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6 text-rose-500">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
        </div>

        <h2 id="credits-exhausted-title" className="text-center text-[17px] font-semibold tracking-tight">
          Tu as utilisé tes {limit} crédits du jour
        </h2>
        <p className="mt-2 text-center text-[13px] leading-relaxed text-[#6B7280]">
          Reviens demain pour de nouveaux crédits, ou passe Premium pour des analyses illimitées.
        </p>

        <div className="mt-5 space-y-2">
          <Link
            href="/offre"
            onClick={goPremium}
            className="block w-full rounded-xl bg-[#111111] py-3 text-center text-sm font-semibold text-white hover:brightness-110 transition"
          >
            Découvrir Premium
          </Link>
          <button
            type="button"
            onClick={close}
            className="block w-full rounded-xl bg-white py-3 text-center text-sm font-medium text-[#6B7280] hover:text-[#111111] transition"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
