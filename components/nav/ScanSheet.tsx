"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BarcodeScannerInput } from "../BarcodeScannerInput";
import { ProcessingOverlay, randomProcessingTotal } from "../ProcessingOverlay";
import { ProductSearchInput } from "../ProductSearchInput";
import { SearchBar } from "../SearchBar";
import { BarcodeIcon, CameraIcon, ClipboardIcon, SearchIcon } from "./NavIcons";

type View = "picker" | "paste" | "search" | "barcode";

type FoundPayload = {
  ingredientsText: string;
  brand: string | null;
  productName: string | null;
  source: string;
  sourceUrl: string | null;
};

// Same key HomeShell reads on mount to render the ProductHero (brand + name)
// on top of the analysis result. We bridge across navigation via sessionStorage.
const PENDING_SOURCE_KEY = "cw:pendingProductSource";
// Authoritative INCI handoff. AnalysisRunner reads this on mount and trusts
// it over the URL searchParam — necessary because Next.js can serve a
// prefetched `/analyse` shell where `searchParams.inci` is undefined, which
// otherwise bounces the user back to the home page mid-analyse.
const PENDING_INCI_KEY = "cw:pendingInci";

type TileAction =
  | { kind: "view"; view: Exclude<View, "picker"> }
  | { kind: "route"; href: string };

const TILES: {
  action: TileAction;
  title: string;
  subtitle: string;
  icon: (p: { className?: string }) => React.JSX.Element;
  isNew?: boolean;
}[] = [
  { action: { kind: "view", view: "barcode" }, title: "Code-barres", subtitle: "Scan rapide en magasin", icon: BarcodeIcon },
  { action: { kind: "view", view: "paste" }, title: "Coller la composition", subtitle: "Liste INCI texte", icon: ClipboardIcon },
  { action: { kind: "route", href: "/scan/photo" }, title: "Photo de la composition", subtitle: "OCR automatique", icon: CameraIcon, isNew: true },
  { action: { kind: "view", view: "search" }, title: "Rechercher un produit", subtitle: "Par nom ou marque", icon: SearchIcon },
];

export function ScanSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useState<View>("picker");
  const sheetRef = useRef<HTMLDivElement>(null);
  // Soft-nav bridge: when the user submits, we paint the ProcessingOverlay
  // RIGHT AWAY (before router.push resolves). Without this, the 1–2 s Next.js
  // round-trip to /analyse leaves the user staring at the still-open sheet
  // with no feedback. AnalysisRunner picks up with its own overlay on mount,
  // so the transition is seamless.
  const [navigating, setNavigating] = useState<{ active: boolean; budget: number }>({
    active: false,
    budget: 0,
  });
  // Pathname when the sheet was opened. When it changes, the nav has landed
  // and we can fold the sheet (and our bridge overlay) away.
  const openedAtRef = useRef<string | null>(null);

  // Reset the inner view to the tile picker each time the sheet opens fresh.
  // Also prefetch /analyse so when the user submits a flow (barcode lookup,
  // INCI paste, product search), the destination page is already in cache and
  // its ProcessingOverlay paints in the same frame as `router.push` —
  // otherwise the user briefly sees the underlying page (home / dashboard)
  // before /analyse mounts, which feels like "the click did nothing".
  useEffect(() => {
    if (open) {
      setView("picker");
      router.prefetch("/analyse");
    }
  }, [open, router]);

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

  // Auto-close the sheet once the route has changed (= AnalysisRunner has
  // mounted and is rendering its own overlay). Until then we keep the bridge
  // overlay on screen so the user never sees the underlying page flash through.
  useEffect(() => {
    if (!open) {
      openedAtRef.current = null;
      return;
    }
    if (openedAtRef.current === null) {
      openedAtRef.current = pathname;
      return;
    }
    if (pathname !== openedAtRef.current) {
      openedAtRef.current = null;
      setNavigating({ active: false, budget: 0 });
      onClose();
    }
  }, [pathname, open, onClose]);

  function pickTile(tile: (typeof TILES)[number]) {
    if (tile.action.kind === "route") {
      onClose();
      router.push(tile.action.href);
      return;
    }
    setView(tile.action.view);
  }

  /** Submit the INCI text + optional product source, then close. */
  function submitForAnalysis(input: FoundPayload | { ingredientsText: string }) {
    const ingredientsText = input.ingredientsText.trim();
    if (!ingredientsText) return;
    // Stash the INCI in sessionStorage BEFORE navigating. This is the
    // authoritative handoff — the URL searchParam is kept as a secondary
    // hint but can be dropped by Next.js when serving a prefetched shell.
    try {
      sessionStorage.setItem(PENDING_INCI_KEY, ingredientsText);
    } catch {
      /* ignore */
    }
    if ("brand" in input && (input.brand || input.productName)) {
      try {
        sessionStorage.setItem(
          PENDING_SOURCE_KEY,
          JSON.stringify({
            source: input.source,
            sourceUrl: input.sourceUrl,
            brand: input.brand,
            productName: input.productName,
          }),
        );
      } catch {
        /* ignore */
      }
    }
    // Paint the overlay BEFORE the navigation kicks off, so the user sees
    // "On décode la composition…" in the same frame they pressed the button.
    // Don't call onClose() here — the route-change effect above will fold the
    // sheet once /analyse has actually taken over.
    setNavigating({ active: true, budget: randomProcessingTotal() });
    // Dedicated analysis page — AnalysisRunner picks up the payload (and the
    // optional product source from sessionStorage), runs analyse, then
    // renders the result panel full-width without the dashboard underneath.
    router.push(`/analyse?inci=${encodeURIComponent(ingredientsText.slice(0, 6000))}`);
  }

  if (!open) return null;

  // Soft-nav in flight: cover the sheet with the same overlay AnalysisRunner
  // will paint once it mounts. The two share an identical look so the user
  // can't tell where one ends and the other begins.
  if (navigating.active) {
    return (
      <ProcessingOverlay
        totalMs={navigating.budget}
        headline="On décode la composition…"
      />
    );
  }

  const isPicker = view === "picker";
  const heading = isPicker
    ? "Comment veux-tu analyser ?"
    : view === "paste"
      ? "Colle ta liste INCI"
      : view === "search"
        ? "Cherche ton produit"
        : "Scanne le code-barres";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center bg-[rgba(17,17,17,0.45)] animate-[fadeIn_180ms_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={heading}
    >
      <div
        ref={sheetRef}
        className="w-full lg:max-w-lg bg-white rounded-t-3xl lg:rounded-3xl shadow-xl pb-6 lg:pb-6 pt-3 lg:pt-6 animate-[slideUp_220ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:hidden mx-auto h-1 w-10 rounded-full bg-[#D1D5DB] mb-4" aria-hidden />

        <div className="flex items-center justify-center relative px-5 mb-5">
          {!isPicker && (
            <button
              type="button"
              onClick={() => setView("picker")}
              aria-label="Retour aux options"
              className="absolute left-5 grid h-8 w-8 place-items-center rounded-full text-[#6B7280] hover:bg-black/[0.04] hover:text-ink"
            >
              <span aria-hidden className="text-lg leading-none">←</span>
            </button>
          )}
          <h2 className="text-center text-[17px] font-semibold">{heading}</h2>
        </div>

        <div className="px-5">
          {isPicker ? (
            <div className="grid grid-cols-2 gap-3">
              {TILES.map((tile) => (
                <button
                  key={tile.title}
                  type="button"
                  onClick={() => pickTile(tile)}
                  className="relative flex flex-col items-center text-center bg-white border border-[#E5E7EB] rounded-2xl p-4 hover:border-[#111111] transition"
                >
                  {tile.isNew && (
                    <span className="absolute top-2 right-2 bg-[#F43F5E] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      NEW
                    </span>
                  )}
                  <tile.icon className="h-7 w-7 text-[#111111] mb-2" />
                  <div className="text-[14px] font-semibold leading-snug">{tile.title}</div>
                  <div className="text-[12px] text-[#6B7280] mt-1 leading-snug">{tile.subtitle}</div>
                </button>
              ))}
            </div>
          ) : view === "paste" ? (
            <div className="space-y-3">
              <p className="text-[13px] text-[#6B7280]">
                Colle la liste d&apos;ingrédients (INCI) telle qu&apos;elle apparaît sur l&apos;emballage.
              </p>
              <SearchBar
                autoFocus
                size="lg"
                onAnalyseList={(text) => submitForAnalysis({ ingredientsText: text })}
              />
            </div>
          ) : view === "search" ? (
            <div className="space-y-3">
              <p className="text-[13px] text-[#6B7280]">
                Tape la marque et le nom du produit. On retrouve sa composition.
              </p>
              <ProductSearchInput
                onFound={(payload) => submitForAnalysis(payload)}
                onFallbackToManual={() => setView("paste")}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[13px] text-[#6B7280]">
                Place le code-barres dans le cadre. La caméra s&apos;ouvre directement.
              </p>
              <BarcodeScannerInput
                onFound={(payload) => submitForAnalysis(payload)}
                onFallbackToManual={() => setView("paste")}
                onFallbackToProductSearch={() => setView("search")}
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="block mx-auto mt-4 text-sm text-[#6B7280] hover:text-black px-4 py-2"
        >
          {isPicker ? "Annuler" : "Fermer"}
        </button>
      </div>
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  );
}
