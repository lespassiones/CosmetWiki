"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

type Slide = {
  titleNode: ReactNode;
  step: string;
  subtitle: string;
  description: string;
  image: string;
  alt: string;
};

const SLIDES: Slide[] = [
  {
    titleNode: (
      <>
        Comment <span className="text-[#F43F5E]">Cosme Check</span> vérifie les
        promesses de tes produits
      </>
    ),
    step: "1",
    subtitle: "Analyse de promesses marketing",
    description:
      "Cosme Check identifie chaque promesse marketing affichée sur le produit, puis croise ces affirmations avec la liste complète des ingrédients (INCI) pour évaluer leur véracité.",
    image: "/image/landing2/section2.webp",
    alt: "Écran d'analyse des promesses marketing dans l'application Cosme Check",
  },
  {
    titleNode: (
      <>
        Ta routine beauté, construite{" "}
        <span className="text-[#F43F5E]">intelligemment</span>
      </>
    ),
    step: "2",
    subtitle: "Une routine adaptée à ta peau",
    description:
      "Cosme Check analyse ton profil de peau, tes objectifs et tes préférences pour te proposer une routine 100% personnalisée avec des produits sûrs et efficaces.",
    image: "/image/landing2/section22.webp",
    alt: "Écran de routine quotidienne dans l'application Cosme Check",
  },
];

export function LandingSteps() {
  const [active, setActive] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const total = SLIDES.length;

  const switchTo = (delta: number) => {
    const next = ((active + delta) % total + total) % total;
    if (next === active) return;
    setIsFading(true);
    window.setTimeout(() => {
      setActive(next);
      setIsFading(false);
    }, 200);
  };

  const slide = SLIDES[active];

  return (
    <section className="relative w-full bg-[#FAFAFA] py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1280px] px-6 sm:px-8">
        <div
          className={`transition-opacity duration-200 ease-out ${
            isFading ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Grand titre — change par slide */}
          <h2 className="mx-auto max-w-[44rem] text-center text-[28px] font-bold leading-[1.15] tracking-tight text-ink sm:text-[34px] lg:text-[44px]">
            {slide.titleNode}
          </h2>

          {/* Bloc principal : image gauche + (texte + flèches) droite (desktop) /
              image en haut + (texte + flèches) en bas (mobile).
              `lg:items-start` => le bloc texte est aligné en haut, pas centré
              verticalement sur l'image. */}
          <div className="mt-12 flex flex-col items-center gap-12 lg:mt-20 lg:flex-row lg:items-start lg:gap-8">
            {/* Image (téléphone) — réduite de ~30% par rapport à la version
                précédente. */}
            <div className="flex flex-1 items-start justify-center">
              <div
                className="relative w-full max-w-[210px] sm:max-w-[240px] lg:max-w-[280px]"
                style={{ aspectRatio: "966 / 1629" }}
              >
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  sizes="(min-width: 1024px) 280px, (min-width: 640px) 240px, 210px"
                  className="object-contain"
                />
              </div>
            </div>

            {/* Bloc texte + flèches, aligné en haut côté desktop */}
            <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
              <div className="grid h-12 w-12 place-items-center rounded-full border border-[#F43F5E] text-[20px] font-medium text-[#F43F5E]">
                {slide.step}
              </div>
              <h3 className="mt-6 text-[24px] font-bold leading-tight tracking-tight text-ink sm:text-[28px] lg:text-[30px]">
                {slide.subtitle}
              </h3>
              <p className="mt-4 max-w-[34rem] text-[15px] leading-relaxed text-ink-muted lg:text-[16px]">
                {slide.description}
              </p>

              {/* Flèches : juste sous le titre + description, dans la même
                  colonne. En mobile, restent centrées via `items-center`
                  du parent. */}
              <div className="mt-8 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => switchTo(-1)}
                  aria-label="Slide précédent"
                  className="grid h-12 w-12 place-items-center rounded-full border border-[#F43F5E]/40 text-[#F43F5E] transition hover:border-[#F43F5E] hover:bg-[#F43F5E]/10"
                >
                  <ArrowLeft />
                </button>
                <button
                  type="button"
                  onClick={() => switchTo(1)}
                  aria-label="Slide suivant"
                  className="grid h-12 w-12 place-items-center rounded-full bg-[#F43F5E] text-white shadow-[0_8px_20px_-6px_rgba(244,63,94,0.45)] transition hover:bg-[#E11D48]"
                >
                  <ArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArrowLeft() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
