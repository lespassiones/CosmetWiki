"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/Logo";

const NAV_ITEMS = [
  { href: "/fonctionnalites", label: "Fonctionnalités" },
  { href: "/en-savoir-plus", label: "En savoir plus" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const ariaExpanded: "true" | "false" = open ? "true" : "false";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close the drawer whenever the user navigates (including when the click
  // happens on a link inside the drawer itself).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Track scroll so the header switches from transparent (over the hero) to
  // a solid blurred background as soon as the user starts scrolling.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-md border-b border-black/[0.06] shadow-[0_2px_12px_-6px_rgba(0,0,0,0.10)]"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-[77px] w-full max-w-[1280px] items-center justify-between px-6 sm:px-8">
          <Link
            href="/"
            aria-label="Cosme Check, accueil"
            className="flex flex-col items-center gap-1 font-bold leading-none tracking-tight"
          >
            {/* Logo de marque : les 3 pastilles EN HAUT, « Cosme Check » en
                dessous (lockup vertical). Pastilles réduites de ~20 %
                (h-6/h-7 → h-[19px]/h-[22px]).
                Texte calé sur la MÊME largeur que les pastilles (~63/73 px) :
                d'où les tailles réduites text-[10px]/sm:text-[12px]. */}
            <LogoMark className="h-[19px] w-auto shrink-0 sm:h-[22px]" />
            <span className="text-[10px] sm:text-[12px]">
              <span className="text-[#111111]">Cosme </span>
              <span className="text-[#F43F5E]">Check</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-4 py-2 text-[15px] font-medium transition-colors ${
                    active
                      ? "text-[#F43F5E]"
                      : "text-[#374151] hover:text-[#111111] hover:bg-black/[0.04]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/auth/sign-in"
              className="hidden rounded-full bg-[#F43F5E] px-5 py-2 text-[14px] font-semibold text-white transition hover:bg-[#E11D48] sm:px-6 lg:inline-flex"
            >
              Se connecter
            </Link>

            <button
              type="button"
              aria-label="Ouvrir le menu"
              aria-expanded={ariaExpanded}
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-md text-[#374151] hover:bg-black/[0.04] hover:text-[#111111] lg:hidden"
            >
              <BurgerIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Overlay sombre */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
      />

      {/* Drawer plein écran depuis la droite */}
      <nav
        aria-label="Menu principal"
        className={`fixed inset-y-0 right-0 z-[70] flex w-full max-w-[320px] flex-col bg-white shadow-[−20px_0_60px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* En-tête du drawer */}
        <div className="flex h-[64px] items-center justify-between border-b border-black/[0.06] px-6">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            aria-label="Cosme Check, accueil"
            className="flex flex-col items-center gap-1 font-bold leading-none tracking-tight"
          >
            <LogoMark className="h-4 w-auto shrink-0" />
            <span className="text-[9px]">
              <span className="text-[#111111]">Cosme </span>
              <span className="text-[#F43F5E]">Check</span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-full text-[#374151] hover:bg-black/[0.05] hover:text-[#111111]"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Liens de navigation */}
        <ul className="flex-1 overflow-y-auto px-4 py-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-[16px] font-medium transition-colors ${
                    active
                      ? "text-[#F43F5E] bg-rose-50"
                      : "text-[#111111] hover:bg-black/[0.03]"
                  }`}
                >
                  {item.label}
                  <ArrowIcon className="h-4 w-4 text-[#9CA3AF]" />
                </Link>
              </li>
            );
          })}
        </ul>

        {/* CTA bas du drawer */}
        <div className="border-t border-black/[0.06] px-5 py-5">
          <Link
            href="/auth/sign-in"
            className="flex w-full items-center justify-center rounded-full bg-[#F43F5E] py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(244,63,94,0.45)] transition hover:bg-[#E11D48]"
          >
            Se connecter
          </Link>
        </div>
      </nav>
    </>
  );
}

function BurgerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
