"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
            className="text-[24px] font-bold tracking-tight sm:text-[26px]"
          >
            <span className="text-[#111111]">Cosme </span>
            <span className="text-[#F43F5E]">Check</span>
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

      {open ? (
        <div
          className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm lg:hidden"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <nav
            aria-label="Menu principal"
            className="absolute right-4 top-4 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-white/95 shadow-[0_18px_48px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between px-5 pb-3 pt-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
                Menu
              </span>
              <button
                type="button"
                aria-label="Fermer le menu"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-muted hover:bg-black/[0.04] hover:text-ink"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <ul className="px-2 pb-3">
              {NAV_ITEMS.map((item) => {
                const active = pathname?.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between rounded-2xl px-3.5 py-3 text-[15px] font-medium transition-colors ${
                        active
                          ? "bg-rose-50/70 text-rose-700"
                          : "text-ink hover:bg-black/[0.03]"
                      }`}
                    >
                      {item.label}
                      <ArrowIcon className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="px-3 pb-4">
              <Link
                href="/auth/sign-in"
                className="flex w-full items-center justify-center rounded-full bg-[#F43F5E] px-5 py-3 text-[15px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(244,63,94,0.5)] transition hover:bg-[#E11D48]"
              >
                Se connecter
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
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
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
