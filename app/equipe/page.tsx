import type { Metadata } from "next";
import Image from "next/image";
import { PublicHeader } from "@/components/PublicHeader";

const TITLE = "Notre équipe";
const DESCRIPTION =
  "Découvrez l'équipe passionnée derrière Cosme Check — trois co-fondateurs unis par une même conviction : vous méritez une information cosmétique claire et indépendante.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/equipe" },
  openGraph: {
    title: `${TITLE} · Cosme Check`,
    description: DESCRIPTION,
    url: "/equipe",
    type: "website",
  },
};

type Member = {
  name: string;
  role: string;
  tagline: string;
  src: string;
  bio: string[];
};

const TEAM: Member[] = [
  {
    name: "Stela",
    role: "Co-fondatrice",
    tagline: "L'étoile créative et engagée.",
    src: "/image/section3/stela.webp",
    bio: [
      "Ingénieure chimiste depuis 11 ans, Stela est la source d'idées derrière Cosme Check, toujours animée par une même vision : rendre notre mode de vie plus sain, plus conscient et plus joyeux. Passionnée par les cheveux et la beauté consciente, elle développe également sa propre marque de cosmétiques capillaires inspirée de la flore médicinale africaine.",
      "Fière de ses origines camerounaises et profondément attachée à son village Balengou, elle puise dans sa culture une grande partie de son inspiration. Entre deux idées de projets, Stela aime partager de bons repas, danser avec ses enfants et prendre du temps pour méditer et se reconnecter à l'essentiel.",
    ],
  },
  {
    name: "Brian",
    role: "Co-fondateur",
    tagline: "L'architecte technologique et visionnaire.",
    src: "/image/section3/brian.webp",
    bio: [
      "Ingénieur passionné par les nouvelles technologies, Brian aime transformer les idées en solutions concrètes qui simplifient la vie et créent un réel impact. Curieux et toujours en quête d'innovation, il évolue à la croisée de la technologie, de la santé connectée et des applications intelligentes.",
      "Cofondateur de Cosme Check, il apporte une vision tournée vers l'avenir, en imaginant des outils accessibles capables de rapprocher technologie et bien-être. Pour lui, la technologie n'a de sens que lorsqu'elle est au service des personnes.",
    ],
  },
  {
    name: "Georges",
    role: "Co-fondateur",
    tagline: "L'âme festive et humaine.",
    src: "/image/section3/georges.webp",
    bio: [
      "Pharmacien depuis 11 ans, Georges a d'abord exercé en tant que pharmacien qualité avant de choisir définitivement l'officine, au plus proche des personnes et de leurs besoins. Passionné par l'humain, il possède un vrai sens du contact, du conseil et de l'écoute, et apporte sa vision stratégique et marketing à Cosme Check.",
      "Mais Georges, c'est aussi une énergie incroyable en dehors de la pharmacie : DJ talentueux et apprécié de son public, il voyage à travers le monde pour faire vibrer les plus grands événements de la vie. Il incarne la joie, le partage et cette capacité rare à créer du lien partout où il passe.",
    ],
  },
];

export default function EquipePage() {
  return (
    <>
      <PublicHeader />
      <main className="relative min-h-screen w-full bg-[#FAFAFA]">
        <section className="mx-auto w-full max-w-[1280px] px-6 pb-20 pt-28 sm:px-8 lg:pt-32">
          <h1 className="text-center text-[24px] font-bold leading-[1.15] tracking-tight text-ink sm:text-[30px] lg:text-[38px]">
            Une équipe engagée,
            <br />
            au service d&apos;un projet porteur de sens
          </h1>
          <p className="mx-auto mt-4 max-w-[38rem] text-center text-[13px] leading-relaxed text-ink-muted lg:text-[14px]">
            Trois co-fondateurs unis par une même conviction : vous méritez une
            information cosmétique claire, scientifique et indépendante.
          </p>

          <div className="mt-16 grid gap-14 sm:grid-cols-3 sm:gap-10 lg:gap-16">
            {TEAM.map((member) => (
              <article
                key={member.name}
                className="flex flex-col items-center text-center"
              >
                <div className="relative h-[180px] w-[180px] overflow-hidden rounded-full ring-4 ring-[#E5D8F0] sm:h-[160px] sm:w-[160px] lg:h-[180px] lg:w-[180px]">
                  <Image
                    src={member.src}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="180px"
                  />
                </div>

                <h2 className="mt-5 text-[20px] font-bold text-ink">
                  {member.name}
                </h2>
                <p className="font-serif text-[16px] italic text-ink-muted">
                  {member.role}
                </p>
                <p className="mt-1 text-[12px] font-semibold uppercase tracking-wide text-[#F43F5E]">
                  {member.tagline}
                </p>
                <span
                  aria-hidden
                  className="mt-3 block h-[3px] w-8 rounded-full bg-[#F43F5E] opacity-60"
                />

                <div className="mt-5 space-y-3 text-center text-[11px] leading-relaxed text-ink-muted sm:text-[12px]">
                  {member.bio.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
