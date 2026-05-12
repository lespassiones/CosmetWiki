"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BarcodeIcon, CameraIcon, ClipboardIcon, SearchIcon } from "./NavIcons";

type Mode = "barcode" | "paste" | "photo" | "search";

const TILES: { mode: Mode; title: string; subtitle: string; icon: (p: { className?: string }) => React.JSX.Element; isNew?: boolean }[] = [
  { mode: "barcode", title: "Code-barres", subtitle: "Scan rapide en magasin", icon: BarcodeIcon },
  { mode: "paste", title: "Coller la composition", subtitle: "Liste INCI texte", icon: ClipboardIcon },
  { mode: "photo", title: "Photo de la composition", subtitle: "OCR automatique", icon: CameraIcon, isNew: true },
  { mode: "search", title: "Rechercher un produit", subtitle: "Par nom ou marque", icon: SearchIcon },
];

export function ScanSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  function pick(mode: Mode) {
    onClose();
    // Routes: /?mode=paste|barcode|search land on the home with a preselected tab.
    // /scan/photo is a dedicated full-screen flow (handled later).
    switch (mode) {
      case "barcode":
        router.push("/?mode=barcode");
        break;
      case "paste":
        router.push("/?mode=paste");
        break;
      case "search":
        router.push("/?mode=search");
        break;
      case "photo":
        router.push("/scan/photo");
        break;
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center bg-[rgba(17,17,17,0.45)] animate-[fadeIn_180ms_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Comment veux-tu analyser ?"
    >
      <div
        ref={sheetRef}
        className="w-full lg:max-w-md bg-white rounded-t-3xl lg:rounded-3xl shadow-xl pb-6 lg:pb-6 pt-3 lg:pt-6 animate-[slideUp_220ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:hidden mx-auto h-1 w-10 rounded-full bg-[#D1D5DB] mb-4" aria-hidden />
        <h2 className="text-center text-[17px] font-semibold mb-5">Comment veux-tu analyser ?</h2>
        <div className="grid grid-cols-2 gap-3 px-5">
          {TILES.map(({ mode, title, subtitle, icon: Icon, isNew }) => (
            <button
              key={mode}
              type="button"
              onClick={() => pick(mode)}
              className="relative flex flex-col items-center text-center bg-white border border-[#E5E7EB] rounded-2xl p-4 hover:border-[#111111] transition"
            >
              {isNew && (
                <span className="absolute top-2 right-2 bg-[#F43F5E] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  NEW
                </span>
              )}
              <Icon className="h-7 w-7 text-[#111111] mb-2" />
              <div className="text-[14px] font-semibold leading-snug">{title}</div>
              <div className="text-[12px] text-[#6B7280] mt-1 leading-snug">{subtitle}</div>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="block mx-auto mt-4 text-sm text-[#6B7280] hover:text-black px-4 py-2"
        >
          Annuler
        </button>
      </div>
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  );
}
