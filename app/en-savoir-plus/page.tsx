import type { Metadata } from "next";
import Image from "next/image";
import { PublicHeader } from "@/components/PublicHeader";

const TITLE = "En savoir plus";
const DESCRIPTION =
  "Cosme Check informe les consommateurs avec pédagogie, au-delà des simples notes souvent dénuées de fondement scientifique, pour des choix plus conscients, pour ta santé comme pour l'environnement.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/en-savoir-plus" },
  openGraph: {
    title: `${TITLE} · Cosme Check`,
    description: DESCRIPTION,
    url: "/en-savoir-plus",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} · Cosme Check`,
    description: DESCRIPTION,
  },
};

type TeamMember = {
  name: string;
  src: string;
};

const TEAM: TeamMember[] = [
  { name: "Stela", src: "/image/section3/stela.webp" },
  { name: "Brian", src: "/image/section3/brian.webp" },
  { name: "Georges", src: "/image/section3/georges.webp" },
];

type Pillar = {
  title: string;
  accent: string;
  description: string;
};

const PILLARS: Pillar[] = [
  {
    title: "Aucune publicité",
    accent: "#F43F5E", // rose
    description:
      "Cosme Check n'affiche aucune publicité dans l'application. Aucune marque ne peut nous rémunérer pour mettre ses produits en avant, c'est un engagement que nous prenons dès le départ et que nous tiendrons sur le long terme.",
  },
  {
    title: "Notation scientifique",
    accent: "#10B981", // vert
    description:
      "Les produits sont évalués uniquement sur la base de la réglementation cosmétique en vigueur et des données scientifiques disponibles. Aucune influence commerciale, aucune subjectivité, juste les faits.",
  },
  {
    title: "Données protégées",
    accent: "#A855F7", // violet
    description:
      "Tes données personnelles restent strictement confidentielles. Cosme Check n'exploite ni ne revend aucune donnée utilisateur, conformément au RGPD.",
  },
];

export default function EnSavoirPlusPage() {
  return (
    <>
      <PublicHeader />
      <main className="relative min-h-screen w-full bg-white">
        <section className="mx-auto w-full max-w-[1280px] px-6 pb-12 pt-24 sm:px-8 lg:pb-16 lg:pt-24">
          {/* Grand titre */}
          <h1 className="text-center text-[22px] font-bold leading-[1.15] tracking-tight text-ink sm:text-[28px] lg:text-[36px]">
            L&apos;information consciente
            <br className="hidden sm:block" />
            au cœur de notre mission
          </h1>

          {/* Description courte */}
          <p className="mx-auto mt-3 max-w-[40rem] text-center text-[12px] leading-relaxed text-ink-muted sm:text-[13px] lg:mt-4 lg:text-[14px]">
            Cosme Check informe les consommateurs avec pédagogie, au-delà des
            simples notes souvent dénuées de fondement scientifique, pour des
            choix plus conscients, pour ta santé comme pour l&apos;environnement.
          </p>

          {/* Image centrale - réduite de 30% */}
          <div className="mt-4 flex justify-center lg:mt-6">
            <div className="relative w-full max-w-[252px] sm:max-w-[280px] lg:max-w-[322px]">
              <div className="relative aspect-square">
                <Image
                  src="/image/section3/ensavoirplus.webp"
                  alt="Une scientifique Cosme Check entourée de produits cosmétiques, illustrant la rigueur de l'analyse"
                  fill
                  priority
                  sizes="(min-width: 1024px) 322px, (min-width: 640px) 280px, 252px"
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* 3 piliers - remontés pour rester dans le premier viewport */}
          <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6 lg:mt-8 lg:gap-10">
            {PILLARS.map((p) => (
              <article key={p.title} className="text-center">
                {/* Sous-titre style "script" avec trait coloré dessous */}
                <h2 className="inline-block">
                  <span className="relative font-serif text-[22px] italic text-ink lg:text-[24px]">
                    {p.title}
                    <span
                      aria-hidden
                      className="absolute -bottom-1.5 left-0 right-0 h-[3px] rounded-full"
                      style={{ backgroundColor: p.accent, opacity: 0.7 }}
                    />
                  </span>
                </h2>
                <p className="mx-auto mt-4 max-w-[20rem] text-[13px] leading-relaxed text-ink-muted lg:text-[14px]">
                  {p.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Section équipe — vague + grain unifiés, aucun raccord visible */}
        <section className="relative w-full overflow-hidden bg-[#E8E1F5] pb-20 lg:pb-28">
          {/* Grain — même texture que la page contact, couvre la vague ET la section */}
          <div
            aria-hidden
            className="grain-overlay pointer-events-none absolute inset-0 z-0 opacity-[0.22] mix-blend-multiply"
          />
          {/* Vague blanche au sommet — prolonge la section blanche du dessus, au-dessus du grain */}
          <div aria-hidden className="relative z-10 w-full overflow-hidden leading-none">
            <svg
              viewBox="0 0 1440 72"
              xmlns="http://www.w3.org/2000/svg"
              className="block w-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0,24 C240,72 480,0 720,36 C960,72 1200,8 1440,40 L1440,0 L0,0 Z"
                fill="white"
              />
            </svg>
          </div>
          <div className="relative z-10 mx-auto max-w-[1280px] px-6 pt-4 sm:px-8">
            <h2 className="text-center font-serif text-[26px] italic text-ink sm:text-[30px] lg:text-[34px]">
              Ceux qui font Cosme Check
            </h2>
            <p className="mx-auto mt-3 max-w-[36rem] text-center text-[12px] leading-relaxed text-ink-muted sm:text-[13px] lg:text-[14px]">
              Chaque analyse, chaque fonctionnalité naît d&apos;une conviction
              commune&nbsp;: vous méritez une information cosmétique claire,
              scientifique et indépendante.
            </p>

            {/* Disposition triangulaire : Stela + Brian en haut, Georges en bas au centre */}
            <div className="mt-10 flex flex-col items-center gap-3">
              <div className="flex gap-5 sm:gap-8">
                {TEAM.slice(0, 2).map((member) => (
                  <div
                    key={member.name}
                    className="relative h-[130px] w-[130px] overflow-hidden rounded-full ring-4 ring-white sm:h-[150px] sm:w-[150px]"
                  >
                    <Image
                      src={member.src}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="150px"
                    />
                  </div>
                ))}
              </div>
              <div className="relative h-[130px] w-[130px] overflow-hidden rounded-full ring-4 ring-white sm:h-[150px] sm:w-[150px]">
                <Image
                  src={TEAM[2].src}
                  alt={TEAM[2].name}
                  fill
                  className="object-cover"
                  sizes="150px"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <a
                href="/equipe"
                className="text-[15px] font-bold text-[#22C55E] transition-opacity hover:opacity-75"
              >
                Découvrir l&apos;équipe &rarr;
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
