"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { FadeInSection } from "@/components/FadeInSection";

type Slide = {
  titleNode: ReactNode;
  subtitle: string;
  description: string;
  image: string;
  alt: string;
  imageAspect: string;
  imageMaxW?: string;
};

const SLIDES: Slide[] = [
  {
    titleNode: (
      <>
        Comment <span className="text-[#F43F5E]">Cosme Check</span> vérifie les
        promesses de tes produits
      </>
    ),
    subtitle: "Analyse de promesses marketing",
    description:
      "Cosme Check identifie chaque promesse marketing affichée sur le produit, puis croise ces affirmations avec la liste complète des ingrédients (INCI) pour évaluer leur véracité.",
    image: "/image/landing2/section2.webp",
    alt: "Écran d'analyse des promesses marketing dans l'application Cosme Check",
    imageAspect: "966/1629",
  },
  {
    titleNode: (
      <>
        Ta routine beauté, analysée{" "}
        <span className="text-[#F43F5E]">intelligemment</span>
      </>
    ),
    subtitle: "Comprends ce que ta routine contient vraiment",
    description:
      "CosmeCheck analyse tes produits, leurs compositions et les familles d'ingrédients auxquelles tu es exposé(e) et te propose des alternatives plus adaptées pour une routine plus saine.",
    image: "/image/landing2/section22.webp",
    alt: "Écran de routine quotidienne dans l'application Cosme Check",
    imageAspect: "966/1629",
  },
  {
    titleNode: (
      <>
        Des produits adaptés à ton{" "}
        <span className="text-[#F43F5E]">profil cosmétique</span>
      </>
    ),
    subtitle: "Le meilleur choix pour toi",
    description:
      "CosmeCheck compare chaque formule à ton profil cosmétique pour mesurer sa compatibilité et t'aider à choisir les produits les plus adaptés à tes besoins.",
    image: "/image/landing2/section3.webp",
    alt: "Écran de comparaison de produits cosmétiques dans l'application Cosme Check",
    imageAspect: "1122/1402",
    imageMaxW: "max-w-[325px] sm:max-w-[375px] lg:max-w-[425px]",
  },
];

export function LandingSteps() {
  const [active, setActive] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const total = SLIDES.length;

  const goTo = (next: number) => {
    if (next === active) return;
    setIsFading(true);
    window.setTimeout(() => {
      setActive(next);
      setIsFading(false);
    }, 200);
  };

  const switchTo = (delta: number) => {
    const next = ((active + delta) % total + total) % total;
    goTo(next);
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
          <FadeInSection>
            <h2 className="mx-auto max-w-[44rem] text-center text-[28px] font-bold leading-[1.15] tracking-tight text-ink sm:text-[34px] lg:text-[44px]">
              {slide.titleNode}
            </h2>
          </FadeInSection>

          <FadeInSection
            delay={100}
            className="mt-12 flex flex-col items-center gap-12 lg:mt-20 lg:flex-row lg:items-start lg:gap-8"
          >
            {/* Image téléphone — aspect ratio adapté par slide */}
            <div className="flex flex-1 items-start justify-center">
              <div
                className={`relative w-full ${slide.imageMaxW ?? "max-w-[260px] sm:max-w-[300px] lg:max-w-[340px]"}`}
                style={{ aspectRatio: slide.imageAspect }}
              >
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  sizes="(min-width: 1024px) 340px, (min-width: 640px) 300px, 260px"
                  className="object-contain"
                />
              </div>
            </div>

            {/* Bloc texte + navigation */}
            <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
              {/* Indicateur de pagination — 3 cercles numérotés reliés */}
              <div className="flex items-center">
                {SLIDES.map((_, i) => (
                  <div key={i} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`Aller à l'étape ${i + 1}`}
                      className={`relative grid h-11 w-11 place-items-center rounded-full border-2 text-[15px] font-semibold transition-all duration-300 ${
                        i === active
                          ? "border-[#F43F5E] bg-[#F43F5E] text-white shadow-[0_4px_14px_-4px_rgba(244,63,94,0.55)] scale-110"
                          : "border-[#F43F5E]/35 bg-white text-[#F43F5E]/55 hover:border-[#F43F5E]/65 hover:text-[#F43F5E]/80"
                      }`}
                    >
                      {i + 1}
                    </button>
                    {i < SLIDES.length - 1 && (
                      <div
                        className={`h-[2px] w-9 transition-all duration-500 ${
                          i < active ? "bg-[#F43F5E]" : "bg-[#F43F5E]/18"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <h3 className="mt-6 text-[24px] font-bold leading-tight tracking-tight text-ink sm:text-[28px] lg:text-[30px]">
                {slide.subtitle}
              </h3>
              <p className="mt-4 max-w-[34rem] text-[15px] leading-relaxed text-ink-muted lg:text-[16px]">
                {slide.description}
              </p>

              {/* Flèches */}
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
          </FadeInSection>
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
