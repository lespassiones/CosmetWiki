"use client";

import { useState } from "react";
import { TierDots } from "./TierDots";

/** Alternative produit telle que renvoyée par /api/routine/catalog-suggestions. */
export type DeckAlternative = {
  ean: string;
  name: string | null;
  brand: string | null;
  image_url: string | null;
  ingredients_text: string | null;
  /** Score plafonné (affichage). */
  score: number;
  score_label: string;
  score_tone: string;
};

type Props = {
  productTitle: string;
  /** Score plafonné du produit à optimiser. */
  productScore: number | null;
  dangerColor: "rouge" | "orange" | null;
  alternative: DeckAlternative;
  /** Justification IA personnalisée (« pour ta peau sensible… »). */
  reason?: string | null;
  keeping: boolean;
  /** Déjà ajouté en favori → bouton verrouillé (anti-doublon). */
  kept: boolean;
  onKeep: () => void;
  onCompare: () => void;
  onOpenAlternative: () => void;
};

/**
 * SuggestionCard — carte « Meilleur choix pour toi » (avant → après), twin web
 * du mobile CosmeCheck-App/components/routine/SuggestionCard.tsx. Ton produit
 * (gauche, le plus pénalisant) → alternative (droite, respecte les restrictions).
 * Pastilles de tier (pas de note chiffrée). Bouton « Garder en favori ».
 */
export function SuggestionCard({
  productTitle,
  productScore,
  dangerColor,
  alternative,
  reason,
  keeping,
  kept,
  onKeep,
  onCompare,
  onOpenAlternative,
}: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const altTitle = alternative.name ?? "Alternative";
  const showImage = alternative.image_url && !imgFailed;

  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_12px_24px_-6px_rgba(15,23,42,0.18)]">
      {/* En-tête */}
      <div className="mb-2 flex items-center justify-center gap-2 rounded-full bg-[#F3EEFF] px-4 py-2">
        <SparklesIcon className="h-[15px] w-[15px] text-violet-600" />
        <span className="text-[13px] font-semibold text-violet-600">Meilleur choix pour toi</span>
        <TrendingUpIcon className="h-4 w-4 text-emerald-500" />
      </div>

      {reason ? (
        <p className="mb-4 text-center text-[12px] leading-snug text-ink-muted">{reason}</p>
      ) : null}

      {/* Avant → Après */}
      <div className="flex items-start gap-2">
        {/* Produit à optimiser */}
        <div className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-[158px] w-[104px] items-center justify-center rounded-xl bg-[#F3F4F6]">
            <CubeIcon className="h-7 w-7 text-[#9CA3AF]" />
          </div>
          <p className="min-h-[34px] text-center text-[11px] font-semibold leading-snug text-ink line-clamp-2">
            {productTitle}
          </p>
          <TierDots score={productScore} />
          {dangerColor ? (
            <span
              className={`max-w-full truncate rounded-full px-2 py-1 text-[11px] font-semibold text-white ${
                dangerColor === "rouge" ? "bg-rose-500" : "bg-orange-500"
              }`}
            >
              {dangerColor === "rouge" ? "À éviter" : "À surveiller"}
            </span>
          ) : null}
        </div>

        {/* Flèche */}
        <div className="mt-[50px] flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.10)]">
          <ArrowRightIcon className="h-5 w-5 text-rose-500" />
        </div>

        {/* Alternative (cliquable → ouvre l'analyse) */}
        <button
          type="button"
          onClick={onOpenAlternative}
          className="flex flex-1 flex-col items-center gap-2 text-left"
        >
          <div className="flex h-[158px] w-[104px] items-center justify-center overflow-hidden rounded-xl bg-[#F3F4F6]">
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={alternative.image_url!}
                alt=""
                className="h-full w-full object-contain"
                loading="lazy"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <LeafIcon className="h-7 w-7 text-emerald-500" />
            )}
          </div>
          <p className="min-h-[34px] text-center text-[11px] font-semibold leading-snug text-ink line-clamp-2">
            {altTitle}
          </p>
          <TierDots score={alternative.score} />
          <span className="max-w-full truncate rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
            Respecte tes restrictions
          </span>
        </button>
      </div>

      {/* Bouton garder en favori (verrouillé une fois ajouté → anti-doublon) */}
      <button
        type="button"
        onClick={onKeep}
        disabled={keeping || kept}
        className={`mt-5 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold text-white transition ${
          kept ? "bg-emerald-500" : "bg-emerald-600 hover:bg-emerald-700"
        } ${keeping ? "opacity-60" : ""}`}
      >
        {keeping ? (
          <Spinner />
        ) : kept ? (
          <>
            <CheckCircleIcon className="h-[17px] w-[17px]" />
            Ajouté en favori
          </>
        ) : (
          <>
            <BookmarkIcon className="h-4 w-4" />
            Garder en favori
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onCompare}
        className="mx-auto mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[#6B7280] underline"
      >
        <CompareIcon className="h-[13px] w-[13px]" />
        Comparer les deux produits
      </button>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────
function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2l1.6 4.6L18 8l-4.4 1.4L12 14l-1.6-4.6L6 8l4.4-1.4L12 2zm6 10l.9 2.6L21 16l-2.1.7L18 19l-.9-2.3L15 16l2.1-1.4L18 12zM6 14l.9 2.6L9 17l-2.1.7L6 20l-.9-2.3L3 17l2.1-.4L6 14z" />
    </svg>
  );
}
function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
function CubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
function LeafIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </svg>
  );
}
function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M6 2a2 2 0 0 0-2 2v18l8-5.6 8 5.6V4a2 2 0 0 0-2-2H6z" />
    </svg>
  );
}
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
function CompareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M13 6h3a2 2 0 0 1 2 2v7" />
      <path d="M11 18H8a2 2 0 0 1-2-2V9" />
    </svg>
  );
}
function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}
