"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";

/**
 * The bottom-of-sidebar profile pill, upgraded to a click-to-open menu so the
 * "Se déconnecter" action is reachable without leaving the current page.
 *
 * Closes on outside click and on Escape. Logout is a `<form action={...}>`
 * targeting the existing signOut server action — no client-side fetch needed.
 */
export function SidebarProfileMenu({ firstName }: { firstName?: string | null }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const initial = (firstName ?? "U").slice(0, 1).toUpperCase();
  const display = firstName ?? "Utilisateur";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-full flex items-center gap-3 rounded-full bg-white/55 ring-1 ring-white/80 backdrop-blur-xl shadow-[0_8px_22px_-8px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.9)] px-2.5 py-2 hover:bg-white/75 transition text-left"
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1F2937] to-[#0A0A0A] text-white flex items-center justify-center text-xs font-semibold ring-1 ring-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate">{display}</div>
          <div className="text-[11px] text-[#6B7280]">Mon compte</div>
        </div>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className={`h-4 w-4 text-[#6B7280] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 12 5-5 5 5" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl bg-white/95 backdrop-blur-xl ring-1 ring-black/[0.06] shadow-[0_18px_40px_-12px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.95)] overflow-hidden"
        >
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink hover:bg-black/[0.04] transition"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 text-[#6B7280]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
            Mon compte
          </Link>
          <div className="h-px bg-black/[0.05]" />
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-rose-700 hover:bg-rose-50 transition text-left"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="m16 17 5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              Se déconnecter
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
