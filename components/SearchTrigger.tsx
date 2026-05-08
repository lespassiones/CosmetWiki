"use client";

import { useEffect, useState } from "react";
import { SearchBar } from "./SearchBar";

export function SearchTrigger() {
  const [open, setOpen] = useState(false);

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
        aria-label="Rechercher un ingrédient"
        onClick={() => setOpen(true)}
        className="group grid h-12 w-12 place-items-center rounded-2xl bg-white/55 text-ink ring-1 ring-white/80 shadow-[0_8px_30px_-6px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl transition-all hover:-translate-y-0.5 hover:bg-white/75 hover:shadow-[0_14px_36px_-8px_rgba(139,92,246,0.25),inset_0_1px_0_rgba(255,255,255,1)] active:translate-y-0"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 transition-transform group-hover:scale-110"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-20 backdrop-blur-sm animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-2xl">
            <SearchBar autoFocus size="lg" />
          </div>
        </div>
      ) : null}
    </>
  );
}
