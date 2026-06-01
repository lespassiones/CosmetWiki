"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ProcessingOverlay, randomProcessingTotal } from "../ProcessingOverlay";
import { ProductSearchInput } from "../ProductSearchInput";
import { ProductUrlInput } from "../ProductUrlInput";
import { SearchBar } from "../SearchBar";
import { BarcodeIcon, CameraIcon, ClipboardIcon, LinkIcon, SearchIcon } from "./NavIcons";

// Lazy-load : MediaStream + BarcodeDetector, payload ~80 kb. Pas utile tant
// que l'utilisateur n'ouvre pas l'onglet « code-barres » dans la feuille scan.
const BarcodeScannerInput = dynamic(
  () => import("../BarcodeScannerInput").then((m) => m.BarcodeScannerInput),
  { ssr: false },
);

type View = "picker" | "paste" | "search" | "barcode" | "url";

type FoundPayload = {
  ingredientsText: string;
  brand: string | null;
  productName: string | null;
  source: string;
  sourceUrl: string | null;
  ean?: string | null;
};

// Same key HomeShell reads on mount to render the ProductHero (brand + name)
// on top of the analysis result. We bridge across navigation via sessionStorage.
const PENDING_SOURCE_KEY = "cw:pendingProductSource";
// Authoritative INCI handoff. AnalysisRunner reads this on mount and trusts
// it over the URL searchParam - necessary because Next.js can serve a
// prefetched `/analyse` shell where `searchParams.inci` is undefined, which
// otherwise bounces the user back to the home page mid-analyse.
const PENDING_INCI_KEY = "cw:pendingInci";

type TileAction =
  | { kind: "view"; view: Exclude<View, "picker"> }
  | { kind: "route"; href: string };

type Tile = {
  action: TileAction;
  title: string;
  subtitle?: string;
  icon: (p: { className?: string }) => React.JSX.Element;
  isNew?: boolean;
};

// Asymmetric 2+3 layout: the two "physical-product" entry points (real
// camera/scanner interactions) get the large left column; the three
// "data-only" entries (paste text, paste URL, name search) fit in the
// compact right column. NEW badge stays on the latest addition (URL).
const LEFT_TILES: Tile[] = [
  { action: { kind: "view", view: "barcode" }, title: "Code-barres", subtitle: "Scan rapide en magasin", icon: BarcodeIcon },
  { action: { kind: "route", href: "/scan/photo" }, title: "Photo de la composition", subtitle: "OCR de l'étiquette", icon: CameraIcon },
];

const RIGHT_TILES: Tile[] = [
  { action: { kind: "view", view: "paste" }, title: "Coller la composition", icon: ClipboardIcon },
  { action: { kind: "view", view: "url" }, title: "Coller le lien", icon: LinkIcon, isNew: true },
  { action: { kind: "route", href: "/produits" }, title: "Rechercher un produit", icon: SearchIcon },
];

export function ScanSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useState<View>("picker");
  const sheetRef = useRef<HTMLDivElement>(null);
  // Optional "C'est quel produit ?" - collected on the paste view so the
  // analyser can use it as productLabel and the post-analysis "Analyser la
  // promesse" button can hit the web-search identification step with a real
  // hint instead of just the INCI.
  const [pasteProductName, setPasteProductName] = useState("");
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
  // its ProcessingOverlay paints in the same frame as `router.push` -
  // otherwise the user briefly sees the underlying page (home / dashboard)
  // before /analyse mounts, which feels like "the click did nothing".
  useEffect(() => {
    if (open) {
      setView("picker");
      setPasteProductName("");
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

  function pickTile(tile: Tile) {
    if (tile.action.kind === "route") {
      onClose();
      router.push(tile.action.href);
      return;
    }
    setView(tile.action.view);
  }

  /** Submit the INCI text + optional product source, then close. */
  function submitForAnalysis(
    input:
      | FoundPayload
      | { ingredientsText: string; productNameHint?: string | null },
  ) {
    const ingredientsText = input.ingredientsText.trim();
    if (!ingredientsText) return;
    // Stash the INCI in sessionStorage BEFORE navigating. This is the
    // authoritative handoff - the URL searchParam is kept as a secondary
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
            ean: input.ean ?? null,
          }),
        );
      } catch {
        /* ignore */
      }
    } else if ("productNameHint" in input && input.productNameHint && input.productNameHint.trim()) {
      // Paste flow with a manual "C'est quel produit ?" hint - we stash it
      // under the same key so AnalysisRunner picks it up as productLabel and
      // the post-analysis "Analyser la promesse" button can feed it to the
      // identification step.
      const hint = input.productNameHint.trim().slice(0, 200);
      try {
        sessionStorage.setItem(
          PENDING_SOURCE_KEY,
          JSON.stringify({
            source: "manual",
            sourceUrl: null,
            brand: null,
            productName: hint,
          }),
        );
      } catch {
        /* ignore */
      }
    }
    // Paint the overlay BEFORE the navigation kicks off, so the user sees
    // "On décode la composition…" in the same frame they pressed the button.
    // Don't call onClose() here - the route-change effect above will fold the
    // sheet once /analyse has actually taken over.
    setNavigating({ active: true, budget: randomProcessingTotal() });
    // Dedicated analysis page - AnalysisRunner picks up the payload (and the
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
        : view === "url"
          ? "Colle le lien du produit"
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
        // max-h + overflow-y-auto so a tall result list (e.g. 5+ web fallback
        // candidates) stays scrollable inside the sheet instead of being
        // clipped by the viewport. overscroll-contain prevents touch scrolls
        // from leaking to the body underneath.
        className="w-full lg:max-w-lg bg-white rounded-t-3xl lg:rounded-3xl shadow-xl pb-6 lg:pb-6 pt-3 lg:pt-6 max-h-[92vh] overflow-y-auto overscroll-contain animate-[slideUp_220ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:hidden mx-auto h-1 w-10 rounded-full bg-[#D1D5DB] mb-4" aria-hidden />

        <div className="flex items-center justify-center relative px-5 mb-5">
          {!isPicker && (
            <button
              type="button"
              onClick={() => setView("picker")}
              aria-label="Retour aux options"
              className="absolute left-5 flex items-center gap-1 text-[#1E3A8A] hover:text-[#1a3070] transition text-[13px] font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 18l-6-6 6-6"/></svg>
              Retour
            </button>
          )}
          <h2 className="text-center text-[20px] font-bold text-[#1E3A8A] pl-16 lg:pl-0">{heading}</h2>
        </div>

        <div className="px-5">
          {isPicker ? (
            // Asymmetric 2+3 grid: two large square tiles on the left for the
            // "physical product in hand" flows (barcode + photo), three
            // compact tiles on the right for the "data-only" flows (paste,
            // URL, search). Both columns share the same height via the
            // outer grid so the layout stays balanced regardless of how
            // many subtitles render.
            <div className="grid grid-cols-2 gap-3">
              {/* Left column — 2 large tiles */}
              <div className="grid grid-rows-2 gap-3">
                {LEFT_TILES.map((tile) => (
                  <button
                    key={tile.title}
                    type="button"
                    onClick={() => pickTile(tile)}
                    className="relative flex flex-col items-center justify-center text-center bg-white border border-[#E5E7EB] rounded-2xl p-4 hover:border-[#111111] transition"
                  >
                    {tile.isNew && (
                      <span className="absolute top-2 right-2 bg-[#F43F5E] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        NEW
                      </span>
                    )}
                    <tile.icon className="h-8 w-8 text-[#111111] mb-2" />
                    <div className="text-[14px] font-semibold leading-snug">{tile.title}</div>
                    {tile.subtitle && (
                      <div className="text-[12px] text-[#6B7280] mt-1 leading-snug">{tile.subtitle}</div>
                    )}
                  </button>
                ))}
              </div>

              {/* Right column — 3 compact tiles. Horizontal layout
                  (icon + title) so the rows stay short. */}
              <div className="grid grid-rows-3 gap-3">
                {RIGHT_TILES.map((tile) => (
                  <button
                    key={tile.title}
                    type="button"
                    onClick={() => pickTile(tile)}
                    className="relative flex flex-row items-center text-left gap-3 bg-white border border-[#E5E7EB] rounded-2xl p-3 hover:border-[#111111] transition"
                  >
                    {tile.isNew && (
                      <span className="absolute top-1.5 right-1.5 bg-[#F43F5E] text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                        NEW
                      </span>
                    )}
                    <tile.icon className="h-5 w-5 shrink-0 text-[#111111]" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold leading-snug">{tile.title}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : view === "paste" ? (
            <div className="space-y-3">
              <p className="text-[13px] text-[#475569]">
                Colle la liste d&apos;ingrédients (INCI) telle qu&apos;elle apparaît sur l&apos;emballage.
              </p>

              <div className="rounded-2xl bg-[#ECFDF4] border border-[#BBF7D0] p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <LeafIcon className="h-4 w-4 text-[#047857] shrink-0" />
                  <span className="text-[14px] font-semibold text-[#047857]">
                    Colle ta liste d&apos;ingrédients (INCI)
                  </span>
                </div>
                <SearchBar
                  size="md"
                  alwaysAsList
                  onAnalyseList={(text) =>
                    submitForAnalysis({
                      ingredientsText: text,
                      productNameHint: pasteProductName || null,
                    })
                  }
                />
              </div>

              <div className="rounded-2xl bg-[#EEF3FB] border border-[#DDE5F0] p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <TagIcon className="h-4 w-4 text-[#1E3A8A] shrink-0" />
                  <label htmlFor="paste-product-name" className="text-[14px] font-semibold text-[#1E3A8A]">
                    C&apos;est quel produit&nbsp;?
                    <span className="text-[#6B7280] font-normal ml-1">- optionnel mais recommandé</span>
                  </label>
                </div>
                <input
                  id="paste-product-name"
                  type="text"
                  value={pasteProductName}
                  onChange={(e) => setPasteProductName(e.target.value.slice(0, 200))}
                  placeholder="Ex : CeraVe Foaming Cleanser"
                  className="w-full rounded-xl bg-white border border-[#DDE5F0] px-4 py-3 text-[14px] text-ink placeholder:text-[#9CA3AF] outline-none transition shadow-sm focus:border-[#6189C9] focus:ring-2 focus:ring-[#BFD2EE]"
                  autoComplete="off"
                />
                <p className="mt-2 text-[12px] text-[#475569]">
                  Le nom permet d&apos;identifier le produit et de récupérer sa promesse marketing.
                </p>
              </div>
            </div>
          ) : view === "search" ? (
            <div className="space-y-3">
              <p className="text-[13px] text-[#475569]">
                Tape la marque et le nom du produit. On retrouve sa composition.
              </p>
              <ProductSearchInput
                onFound={(payload) => submitForAnalysis(payload)}
                onFallbackToManual={() => setView("paste")}
              />
            </div>
          ) : view === "url" ? (
            <div className="space-y-3">
              <ProductUrlInput
                onFound={(payload) => submitForAnalysis(payload)}
                onFallbackToManual={() => setView("paste")}
              />
              <p className="text-[13px] text-[#475569]">
                Colle le lien d&apos;une page produit. On récupère le nom, la marque et la composition,
                puis on lance l&apos;analyse une fois que tu as confirmé.
              </p>
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
          className="block mx-auto mt-5 rounded-full bg-[#F3F4F6] px-5 py-2 text-[13px] font-medium text-[#6B7280] hover:bg-[#E5E7EB] transition"
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

function TagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96c1.4-.96 2.43-2.04 2.5-2.46.36 6.05-2.32 12.46-7.5 14.5A7 7 0 0 1 11 20Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </svg>
  );
}
