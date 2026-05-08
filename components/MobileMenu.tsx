"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Accueil" },
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/about", label: "À propos" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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

  return (
    <>
      <button
        type="button"
        aria-label="Ouvrir le menu"
        aria-expanded={open ? "true" : "false"}
        onClick={() => setOpen(true)}
        className="group grid h-12 w-12 place-items-center rounded-2xl bg-white/55 text-ink ring-1 ring-white/80 shadow-[0_8px_30px_-6px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl transition-all hover:-translate-y-0.5 hover:bg-white/75 hover:shadow-[0_14px_36px_-8px_rgba(139,92,246,0.25),inset_0_1px_0_rgba(255,255,255,1)] active:translate-y-0 sm:hidden"
      >
        <BurgerIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm animate-fade-in sm:hidden"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <nav
            aria-label="Menu principal"
            className="absolute right-4 top-4 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-white/85 shadow-[0_18px_48px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl animate-slide-down"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
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
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname?.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center justify-between rounded-2xl px-3.5 py-3 text-[15px] font-medium transition-colors ${
                        active
                          ? "bg-violet-50/70 text-violet-700"
                          : "text-ink hover:bg-black/[0.03]"
                      }`}
                    >
                      {item.label}
                      <ArrowIcon
                        className={`h-3.5 w-3.5 transition-transform ${
                          active ? "translate-x-0.5" : ""
                        }`}
                      />
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
