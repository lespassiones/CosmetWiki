"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Detail = { used?: number; limit?: number; isPremium?: boolean };

export function CreditsExhaustedModal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Detail>({});
  const [buyLoading, setBuyLoading] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  const goPremium = useCallback(() => {
    try {
      sessionStorage.setItem(
        "returnAfterPaywall",
        window.location.pathname + window.location.search,
      );
    } catch { /* sessionStorage indisponible */ }
    setOpen(false);
  }, []);

  const buyCredits = useCallback(async () => {
    setBuyLoading(true);
    try {
      const res = await fetch("/api/checkout/credits", { method: "POST" });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Une erreur est survenue.");
        setBuyLoading(false);
      }
    } catch {
      alert("Une erreur est survenue. Vérifie ta connexion.");
      setBuyLoading(false);
    }
  }, []);

  useEffect(() => {
    const onShow = (e: Event) => {
      const ev = e as CustomEvent<Detail>;
      setDetail(ev.detail ?? {});
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("cosmecheck:credits-exhausted", onShow as EventListener);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("cosmecheck:credits-exhausted", onShow as EventListener);
      document.removeEventListener("keydown", onKey);
    };
  }, [close]);

  if (!open) return null;

  const isPremium = detail.isPremium === true;

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

        {isPremium ? (
          <>
            <h2 id="credits-exhausted-title" className="text-center text-[17px] font-semibold tracking-tight">
              Tes 100 crédits du mois sont épuisés
            </h2>
            <p className="mt-2 text-center text-[13px] leading-relaxed text-[#6B7280]">
              Tu peux acheter un pack de 50 crédits supplémentaires, valables 30 jours.
            </p>

            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={buyCredits}
                disabled={buyLoading}
                className="flex w-full items-center justify-between rounded-xl bg-[#111111] px-4 py-3 text-sm font-semibold text-white hover:brightness-110 transition disabled:opacity-60"
              >
                <span>{buyLoading ? "Chargement…" : "Acheter 50 crédits"}</span>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[12px] font-bold">4,99 €</span>
              </button>
              <button
                type="button"
                onClick={close}
                className="block w-full rounded-xl bg-white py-3 text-center text-sm font-medium text-[#6B7280] hover:text-[#111111] transition"
              >
                Plus tard
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="credits-exhausted-title" className="text-center text-[17px] font-semibold tracking-tight">
              Tu as utilisé tes crédits du jour
            </h2>
            <p className="mt-2 text-center text-[13px] leading-relaxed text-[#6B7280]">
              Reviens demain pour de nouveaux crédits, ou passe Premium pour 100 crédits par mois.
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
          </>
        )}
      </div>
    </div>
  );
}
