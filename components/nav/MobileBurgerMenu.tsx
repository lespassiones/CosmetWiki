"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { CloseIcon, MenuIcon } from "./NavIcons";
import { PremiumCard } from "./PremiumCard";

type NavItem = {
  href: string;
  label: string;
  icon: (p: { className?: string }) => React.JSX.Element;
};

/**
 * Floating burger button (top-right on mobile) that opens a slide-in drawer
 * mirroring the desktop sidebar's NAV_ITEMS. Lets the user reach pages that
 * don't fit in the bottom nav (Profil, Skin advisor) without sacrificing the
 * 5 prime slots of the bottom bar.
 *
 * - Hidden entirely on lg+ (desktop already has the persistent sidebar).
 * - Click outside / Escape / link tap → closes the drawer.
 * - Body scroll-lock while open so the page underneath doesn't scroll
 *   through the overlay.
 */
export function MobileBurgerMenu({
  pathname,
  items,
}: {
  pathname: string;
  items: ReadonlyArray<NavItem>;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close the drawer whenever the user navigates (route change)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Floating burger button — top-right, mobile only.
          Sits above the page content and below modals (z-40 vs ScanSheet at z-100). */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="lg:hidden fixed top-3 right-3 z-40 h-11 w-11 rounded-full bg-white/85 backdrop-blur-md ring-1 ring-black/[0.06] shadow-[0_4px_14px_-4px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.95)] flex items-center justify-center text-ink hover:bg-white transition active:scale-95"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {/* Overlay + drawer */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-[90]"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation"
        >
          {/* Dimmed backdrop — tap to close */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-black/45 animate-[fadeIn_180ms_ease-out]"
          />

          {/* Drawer — slides in from the right */}
          <aside
            className="absolute top-0 right-0 h-full w-[78%] max-w-[320px] bg-[#FAFAFA] shadow-[-12px_0_40px_-8px_rgba(15,23,42,0.30)] animate-[slideInRight_220ms_ease-out] flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.04]">
              <span className="text-[15px] font-bold tracking-tight">
                <span className="text-[#111111]">Cosme </span>
                <span className="text-[#F43F5E]">Check</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/[0.04] text-ink"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col">
              <ul className="space-y-1">
                {items.map(({ href, label, icon: Icon }) => {
                  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[14px] transition ${
                          active
                            ? "bg-white text-[#111111] font-semibold ring-1 ring-black/[0.06] shadow-[0_4px_14px_-4px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95)]"
                            : "text-[#4B5563] font-medium hover:bg-black/[0.04]"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Bottom block — Premium upsell + sign-out button, pinned to
                  the bottom of the drawer (above the safe area). The sign-out
                  button is intentionally placed here so it's reachable in one
                  tap from any page, instead of buried under /profile. */}
              <div className="mt-auto pt-4 space-y-3">
                {!pathname.startsWith("/offre") && <PremiumCard />}
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100 active:scale-[0.98]"
                  >
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <path d="m16 17 5-5-5-5" />
                      <path d="M21 12H9" />
                    </svg>
                    Se déconnecter
                  </button>
                </form>
              </div>
            </nav>
          </aside>

          <style jsx>{`
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
          `}</style>
        </div>
      )}
    </>
  );
}
