"use client";

/**
 * WeeklyPicksCarousel (web) — rendu client des « Pépites du jour ».
 *
 * Reçoit des picks DÉJÀ sélectionnés + résolus par le server component
 * WeeklyPicksCard (0 calcul ici). Rôle : afficher le carrousel horizontal de
 * cartes produit (image, marque, nom, pastille + libellé) et, au clic, lancer
 * l'analyse via le handoff sessionStorage `cw:pendingInci` / `cw:pendingProductSource`
 * + `/analyse?inci=…` (MÊME convention que AlternativesCarousel, ScanSheet, etc.).
 *
 * Pastille alignée sur le mobile (CatalogPastille) : cercle vert #34D399, cœur
 * (≥17 « Très bien ») ou feuille (≥13 « Bien »). Jamais de note chiffrée.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";

// sessionStorage keys — miroir de AlternativesCarousel / ScanSheet.
const PENDING_INCI_KEY = "cw:pendingInci";
const PENDING_SOURCE_KEY = "cw:pendingProductSource";

export type WeeklyPickView = {
  ean: string;
  brand: string | null;
  name: string | null;
  imageUrl: string | null;
  ingredientsText: string;
  /** Note PLAFONNÉE (détermine la pastille affichée = celle vue au clic). */
  score: number;
  label: string;
  tone: "green" | "amber" | "orange" | "rose";
};

const TONE_TEXT: Record<WeeklyPickView["tone"], string> = {
  green: "text-emerald-700",
  amber: "text-amber-700",
  orange: "text-orange-600",
  rose: "text-rose-600",
};

const TONE_BG: Record<WeeklyPickView["tone"], string> = {
  green: "bg-emerald-400",
  amber: "bg-amber-400",
  orange: "bg-orange-500",
  rose: "bg-rose-500",
};

export function WeeklyPicksCarousel({ picks }: { picks: WeeklyPickView[] }) {
  const router = useRouter();

  function handleSelect(p: WeeklyPickView) {
    try {
      sessionStorage.setItem(PENDING_INCI_KEY, p.ingredientsText);
      sessionStorage.setItem(
        PENDING_SOURCE_KEY,
        JSON.stringify({
          source: "catalog",
          sourceUrl: null,
          brand: p.brand ?? null,
          productName: p.name,
          ean: p.ean,
        }),
      );
    } catch {
      /* ignore storage errors */
    }
    router.push(`/analyse?inci=${encodeURIComponent(p.ingredientsText.slice(0, 6000))}`);
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {picks.map((p) => (
        <WeeklyPickCard key={p.ean} pick={p} onSelect={handleSelect} />
      ))}
    </div>
  );
}

function WeeklyPickCard({
  pick,
  onSelect,
}: {
  pick: WeeklyPickView;
  onSelect: (p: WeeklyPickView) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = pick.imageUrl && !imgFailed;

  return (
    <button
      type="button"
      onClick={() => onSelect(pick)}
      className="shrink-0 w-[132px] flex flex-col rounded-2xl bg-white/75 ring-1 ring-white/80 backdrop-blur-sm shadow-sm p-2.5 text-left transition-all hover:bg-white hover:shadow-md hover:ring-rose-200 active:scale-[0.97]"
    >
      <div className="h-[76px] w-full rounded-xl overflow-hidden bg-gradient-to-br from-violet-50 to-pink-50 mb-2 flex items-center justify-center">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pick.imageUrl!}
            alt=""
            className="h-full w-full object-contain"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <ProductPlaceholderIcon />
        )}
      </div>

      {pick.brand ? (
        <p className="text-[9px] font-semibold uppercase tracking-wider text-pink-500/80 truncate w-full mb-0.5">
          {pick.brand}
        </p>
      ) : null}

      <p className="text-[11.5px] font-medium text-ink leading-snug line-clamp-2 flex-1 mb-1.5">
        {pick.name}
      </p>

      <div className={`flex items-center gap-1.5 text-[10.5px] font-semibold ${TONE_TEXT[pick.tone]}`}>
        <Pastille tone={pick.tone} kind={pick.score >= 17 ? "heart" : "leaf"} />
        <span className="truncate">{pick.label}</span>
      </div>
    </button>
  );
}

/** Cercle coloré + icône cœur/feuille — miroir de CatalogPastille (mobile). */
function Pastille({ tone, kind }: { tone: WeeklyPickView["tone"]; kind: "heart" | "leaf" }) {
  return (
    <span
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${TONE_BG[tone]}`}
      aria-hidden
    >
      {kind === "heart" ? (
        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="#022C22">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-2.5 w-2.5"
          fill="none"
          stroke="#022C22"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 20A7 7 0 0 1 4 13V8a7 7 0 0 1 7-7h7v6a7 7 0 0 1-7 7h-3" />
          <path d="M2 21c4-5 7-7 14-9" />
        </svg>
      )}
    </span>
  );
}

function ProductPlaceholderIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8 text-violet-300"
    >
      <path d="M9 2h6v3a2 2 0 0 0 .6 1.4L17 7.8A4 4 0 0 1 18 10.6V19a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-8.4a4 4 0 0 1 1-2.8l1.4-1.4A2 2 0 0 0 9 5z" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}
