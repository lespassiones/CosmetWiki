"use client";

/**
 * Modale « télécharge l'app ».
 *
 * Elle s'affiche quand il n'y a pas de store à ouvrir, autrement dit sur
 * ordinateur, et quand un ancien lien de la web app est rouvert. Sur mobile les
 * CTA redirigent directement vers le bon store et cette modale ne s'affiche
 * jamais (cf. `DownloadAppProvider.goToApp`).
 *
 * Contenu : les deux badges stores, et le QR code du lien intelligent `/dl`
 * pour que quelqu'un devant son ordinateur puisse passer sur son téléphone sans
 * retaper d'URL. Le QR pointe sur `/dl`, donc c'est le serveur qui choisit le
 * store selon le téléphone qui scanne.
 */

import Image from "next/image";
import { useEffect, useRef } from "react";

import { StoreBadges } from "./StoreBadges";

type Props = {
  title: string;
  subtitle: string;
  campaign: string;
  onClose: () => void;
};

export function DownloadAppModal({ title, subtitle, campaign, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Échap pour fermer, scroll de la page verrouillé, focus amené sur la modale.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  // Piège de focus : la tabulation reste dans la modale tant qu'elle est
  // ouverte, sinon le focus part sur la page derrière, qui est masquée.
  useEffect(() => {
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onTab);
    return () => window.removeEventListener("keydown", onTab);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-5 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-modal-title"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-black/50 backdrop-blur-[3px] animate-[fadeIn_180ms_ease-out]"
        onMouseDown={onClose}
      />

      <div
        ref={panelRef}
        className="relative w-full max-w-[460px] overflow-hidden rounded-3xl bg-white p-6 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.45)] sm:p-8"
      >
        <button
          ref={closeRef}
          type="button"
          aria-label="Fermer"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-[#6B7280] transition hover:bg-black/[0.05] hover:text-[#111111]"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <span className="text-[20px] font-bold tracking-tight">
            <span className="text-[#111111]">Cosme </span>
            <span className="text-[#F43F5E]">Check</span>
          </span>

          <h2
            id="download-modal-title"
            className="mt-4 text-[22px] font-bold leading-tight tracking-tight text-[#111111] sm:text-[25px]"
          >
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-[36ch] text-[14px] leading-relaxed text-[#6B7280]">
            {subtitle}
          </p>
        </div>

        <StoreBadges campaign={campaign} className="mt-6" />

        {/* QR : passerelle ordinateur vers téléphone. Il pointe sur /dl, donc
            c'est le téléphone qui scanne qui décide du store. */}
        <div className="mt-6 flex items-center gap-4 rounded-2xl bg-[#FAFAFA] p-4 ring-1 ring-black/[0.05]">
          <Image
            src="/image/download/qr-smartlink.png"
            alt="QR code vers le téléchargement de Cosme Check"
            width={96}
            height={96}
            className="h-[88px] w-[88px] shrink-0 rounded-xl bg-white object-contain"
          />
          <div className="text-left">
            <p className="text-[13px] font-semibold text-[#111111]">
              Tu es sur ordinateur ?
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#6B7280]">
              Scanne ce code avec ton téléphone : il ouvre directement le bon
              store, App Store ou Google Play.
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-[12px] leading-relaxed text-[#9CA3AF]">
          Application gratuite. Le compte se crée directement dans l&apos;app,
          en quelques secondes.
        </p>
      </div>
    </div>
  );
}
