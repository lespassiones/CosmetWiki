"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/fonctionnalites", label: "Fonctionnalités" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
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

  return (
    <>
      <header className="fixed inset-x-0 top-3 z-50 px-3 sm:px-5">
        <div className="relative mx-auto flex items-center justify-between overflow-hidden rounded-full bg-white/30 px-5 py-2.5 ring-1 ring-white/40 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl backdrop-saturate-150 sm:px-7 sm:py-3">
          {/* Liquid glass highlight overlay - subtle top reflection */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/40 via-white/10 to-transparent"
          />

          <Link
            href="/"
            className="relative text-[20px] font-bold tracking-tight sm:text-[24px]"
          >
            <span className="text-[#111111]">Cosme </span>
            <span className="text-[#F43F5E]">Check</span>
          </Link>

          <nav className="relative hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-[16px] font-medium transition-colors ${
                    active
                      ? "text-[#F43F5E]"
                      : "text-ink/80 hover:text-ink hover:bg-white/40"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="relative flex items-center gap-2">
            <Link
              href="/auth/sign-in"
              className="rounded-full bg-gradient-to-br from-[#F43F5E] to-[#E11D48] px-5 py-2.5 text-[15px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(244,63,94,0.45),inset_0_1px_0_rgba(255,255,255,0.35)] transition hover:brightness-110 sm:px-6"
            >
              Se connecter
            </Link>

            <button
              type="button"
              aria-label="Ouvrir le menu"
              aria-expanded={ariaExpanded}
              onClick={() => setOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-full text-ink/80 hover:bg-white/40 hover:text-ink lg:hidden"
            >
              <BurgerIcon className="h-5 w-5" />
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
