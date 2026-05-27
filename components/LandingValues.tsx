import Image from "next/image";
import Link from "next/link";

type Value = {
  image: string;
  alt: string;
  title: string;
  subtitle: string;
};

const VALUES: Value[] = [
  {
    image: "/image/section3/image1.webp",
    alt: "Illustration : décodage ingrédient par ingrédient d'une formule cosmétique",
    title: "Au-delà des notes",
    subtitle:
      "On ne te colle pas une étiquette. On décode chaque ingrédient de ta formule, un par un.",
  },
  {
    image: "/image/section3/image2.webp",
    alt: "Illustration : deux profils de peau différents, deux analyses personnalisées",
    title: "Personnalisé pour toi",
    subtitle:
      "Le même produit n'agit pas pareil sur tout le monde. Ton analyse dépend de ton profil.",
  },
  {
    image: "/image/section3/image3.webp",
    alt: "Illustration : indépendance vis-à-vis des marques cosmétiques",
    title: "100% indépendant",
    subtitle:
      "Aucune marque ne nous paie. On suit la réglementation européenne, point.",
  },
  {
    image: "/image/section3/image4.webp",
    alt: "Illustration : sources scientifiques et réglementaires en français simple",
    title: "La science, en clair",
    subtitle:
      "Règlement européen, études publiques, données ouvertes. Le tout expliqué simplement.",
  },
];

export function LandingValues() {
  return (
    <section
      aria-labelledby="values-heading"
      className="relative w-full bg-[#FAFAFA] pb-20 lg:pb-28"
    >
      <SectionDivider />

      <div className="mx-auto w-full max-w-[1280px] px-6 sm:px-8">
        <h2
          id="values-heading"
          className="mx-auto max-w-[44rem] text-center text-[28px] font-bold leading-[1.15] tracking-tight text-ink sm:text-[34px] lg:text-[44px]"
        >
          La méthode <span className="text-[#F43F5E]">Cosme Check</span>
        </h2>
        <p className="mx-auto mt-4 max-w-[36rem] text-center text-[15px] leading-relaxed text-ink-muted lg:text-[16px]">
          Quatre engagements simples, qui guident chaque analyse.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-10 sm:gap-12 lg:mt-20 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-20">
          {VALUES.map((v) => (
            <ValueCard key={v.title} value={v} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ValueCard({ value }: { value: Value }) {
  return (
    <article className="flex flex-col items-center text-center">
      <div className="relative w-full max-w-[320px] sm:max-w-[360px] lg:max-w-[380px]">
        <div className="relative aspect-square">
          <Image
            src={value.image}
            alt={value.alt}
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 360px, 320px"
            className="object-contain"
          />
        </div>
      </div>

      <h3 className="mt-6 text-[22px] font-bold leading-tight tracking-tight text-ink sm:text-[26px] lg:text-[28px]">
        {value.title}
      </h3>
      <p className="mt-3 max-w-[28rem] text-[14px] leading-relaxed text-ink-muted sm:text-[15px]">
        {value.subtitle}
      </p>

      <Link
        href="/auth/sign-in"
        className="group mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#F43F5E] to-[#E11D48] px-6 py-2.5 text-[14px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(244,63,94,0.5),inset_0_1px_0_rgba(255,255,255,0.30)] transition hover:brightness-110 active:scale-[0.98]"
      >
        Commencer gratuitement
        <span aria-hidden className="transition group-hover:translate-x-0.5">
          →
        </span>
      </Link>
    </article>
  );
}

/**
 * Séparateur "hand-drawn" entre la section 2 (LandingSteps) et la section 3.
 * Compose : squiggle SVG plein-largeur (rappel du underline du hero) +
 * eyebrow centré "♡ Nos engagements" + feuilles vertes/violettes (rappel
 * des illustrations) + petits dots colorés. Décoratif uniquement.
 */
function SectionDivider() {
  return (
    <div
      aria-hidden
      className="relative mx-auto flex h-24 w-full max-w-[1280px] items-center justify-center px-6 sm:h-28 sm:px-8 lg:h-32"
    >
      {/* Squiggle horizontal traversant — réutilise le même style que
          l'underline rose du hero pour une cohérence DA. */}
      <svg
        viewBox="0 0 1200 24"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-1/2 h-3 w-full -translate-y-1/2 text-[#F43F5E]/55 sm:h-3.5"
      >
        <path
          d="M0,14 Q75,2 150,12 T300,12 T450,12 T600,12 T750,12 T900,12 T1050,12 T1200,12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Feuille verte à gauche */}
      <svg
        viewBox="0 0 40 40"
        className="absolute left-[14%] top-1/2 hidden h-7 w-7 -translate-y-1/2 -rotate-[18deg] text-emerald-500/60 sm:block lg:left-[18%] lg:h-8 lg:w-8"
      >
        <path
          d="M20 4 C30 8 34 18 34 28 C24 30 14 26 8 18 C10 12 14 6 20 4 Z"
          fill="currentColor"
        />
        <path
          d="M20 6 L20 32"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>

      {/* Feuille violette à droite */}
      <svg
        viewBox="0 0 40 40"
        className="absolute right-[14%] top-1/2 hidden h-7 w-7 -translate-y-1/2 rotate-[22deg] text-purple-500/55 sm:block lg:right-[18%] lg:h-8 lg:w-8"
      >
        <path
          d="M20 4 C30 8 34 18 34 28 C24 30 14 26 8 18 C10 12 14 6 20 4 Z"
          fill="currentColor"
        />
        <path
          d="M20 6 L20 32"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>

      {/* Petits dots colorés flottants */}
      <span className="absolute left-[8%] top-[28%] h-1.5 w-1.5 rounded-full bg-emerald-400/70 sm:left-[10%]" />
      <span className="absolute left-[26%] bottom-[22%] h-1 w-1 rounded-full bg-[#F43F5E]/70 sm:left-[30%]" />
      <span className="absolute right-[8%] bottom-[26%] h-1.5 w-1.5 rounded-full bg-purple-400/70 sm:right-[10%]" />
      <span className="absolute right-[28%] top-[22%] h-1 w-1 rounded-full bg-[#F43F5E]/70 sm:right-[30%]" />

      {/* Eyebrow centré, par-dessus le squiggle (le bg masque le trait dessous) */}
      <span className="relative z-10 inline-flex items-center gap-2 rounded-full bg-[#FAFAFA] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F43F5E] ring-1 ring-[#F43F5E]/25 sm:px-6 sm:text-[12px]">
        <Heart />
        Nos engagements
        <Heart />
      </span>
    </div>
  );
}

function Heart() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current" aria-hidden>
      <path d="M8 14s-5-3.2-5-7.2C3 4.4 4.8 3 6.6 3c1 0 1.8.5 2.4 1.3C9.6 3.5 10.4 3 11.4 3 13.2 3 15 4.4 15 6.8 15 10.8 8 14 8 14z" />
    </svg>
  );
}
