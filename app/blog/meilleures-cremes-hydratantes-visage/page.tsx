import type { Metadata } from "next";
import Link from "next/link";
import { BlogCTA } from "@/components/blog/BlogCTA";
import { BlogArticleShell } from "@/components/blog/BlogArticleShell";
import {
  Callout,
  CheckList,
  Highlight,
  Underline,
  WarnList,
} from "@/components/blog/BlogElements";
import { SITE_URL } from "@/lib/siteUrl";

const TITLE =
  "Meilleures crèmes hydratantes visage : la sélection par type de peau";
const DESCRIPTION =
  "Peau grasse, sèche, mixte, sensible ou mature : les crèmes hydratantes visage souvent recommandées, ce qui fait une bonne formule, et comment vérifier laquelle est vraiment faite pour toi.";
const URL = "/blog/meilleures-cremes-hydratantes-visage";
const PUBLISHED = "2026-07-20";
const HERO_IMAGE = "/image/blog/meilleures-cremes-hydratantes-visage/hero.webp";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "meilleure crème hydratante visage",
    "crème hydratante peau grasse",
    "crème hydratante peau sèche",
    "crème hydratante peau sensible",
    "meilleure crème visage",
    "crème hydratante pas chère efficace",
    "céramides acide hyaluronique",
    "crème hydratante non comédogène",
  ],
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    type: "article",
    images: [{ url: HERO_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [HERO_IMAGE],
  },
};

const TOC = [
  { id: "en-bref", label: "En bref" },
  { id: "bonne-creme", label: "1. Ce qui fait une bonne crème" },
  { id: "selection", label: "2. La sélection par type de peau" },
  { id: "prix", label: "3. Prix : ça change quoi ?" },
  { id: "compatibilite", label: "4. Laquelle est faite pour toi" },
  { id: "faq", label: "FAQ" },
  { id: "resume", label: "En résumé" },
];

// FAQPage : réponses courtes, extractibles par les moteurs de réponse IA (GEO).
const FAQ: { q: string; a: string }[] = [
  {
    q: "Quelle est la meilleure crème hydratante visage ?",
    a: "Il n'y en a pas une seule : la meilleure dépend de ton type de peau. Une bonne crème combine des humectants (glycérine, acide hyaluronique), des émollients (squalane, céramides) et, pour les peaux sèches, des occlusifs. Des références reconnues existent par type de peau (CeraVe, La Roche-Posay Toleriane, Avène, Bioderma), mais la seule façon de trancher est de vérifier la compatibilité de la formule avec ton profil.",
  },
  {
    q: "Une crème hydratante chère est-elle meilleure ?",
    a: "Non. Le prix ne fait pas la qualité de la formule. Des produits abordables comme CeraVe, The Ordinary ou Nivea rivalisent avec des crèmes de luxe sur les actifs qui comptent. Ce qui compte, c'est la composition, pas le flacon.",
  },
  {
    q: "Quelle crème hydratante pour peau grasse ?",
    a: "Une texture gel ou fluide non comédogène, à base de glycérine, d'acide hyaluronique et de niacinamide, sans huiles lourdes ni beurres occlusifs. Même une peau grasse a besoin d'être hydratée : la priver d'eau accentue le sébum.",
  },
];

function buildFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}${URL}#faq`,
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export default function MeilleuresCremesHydratantesArticlePage() {
  const faqJsonLd = buildFaqJsonLd();
  return (
    <BlogArticleShell
      title={TITLE}
      description={DESCRIPTION}
      url={URL}
      published={PUBLISHED}
      heroImage={HERO_IMAGE}
      category="Routines"
      date="20 juillet 2026"
      readingTime="7 min"
      toc={TOC}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e"),
        }}
      />

      <section id="en-bref" className="scroll-mt-28">
        <Callout title="En bref" tone="rose">
          Il n&apos;existe pas <em>une</em> meilleure crème hydratante, mais la
          meilleure <Highlight>pour ta peau</Highlight>. Vite dit : texture{" "}
          <strong>fluide non comédogène</strong> pour peau grasse,{" "}
          <strong>riche aux céramides</strong> pour peau sèche,{" "}
          <strong>minimaliste sans parfum</strong> pour peau sensible. Les
          références citées ici sont souvent recommandées, mais la seule façon
          de trancher reste de <Underline>vérifier la compatibilité</Underline>{" "}
          de la formule avec ton profil.
        </Callout>
      </section>

      <section id="bonne-creme" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          1. Ce qui fait une bonne crème hydratante
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          Une formule solide combine trois familles d&apos;ingrédients :
        </p>
        <CheckList
          items={[
            <>
              <strong>Humectants</strong> (attirent l&apos;eau) : glycérine,
              acide hyaluronique, urée, panthénol.
            </>,
            <>
              <strong>Émollients</strong> (lissent, assouplissent) : squalane,
              céramides, esters, beurres végétaux.
            </>,
            <>
              <strong>Occlusifs</strong> (limitent la perte en eau) : cires,
              certaines huiles, silicones. Surtout utiles aux peaux sèches.
            </>,
          ]}
        />
        <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
          Pour le détail (hydratation vs nutrition, quel actif pour quoi), vois
          le guide complet :{" "}
          <Link
            href="/blog/cremes-hydratantes-reparatrices"
            className="font-semibold text-rose-600 hover:text-rose-700"
          >
            Crèmes hydratantes et réparatrices, le guide pour choisir
          </Link>
          .
        </p>
      </section>

      <section id="selection" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          2. La sélection par type de peau
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
          Des références fréquemment recommandées, à titre indicatif. Une formule
          peut évoluer et une même crème ne convient pas à tout le monde :
          considère-les comme des points de départ, pas comme un verdict.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
              Peau grasse / mixte
            </div>
            <div className="mt-2 text-[16px] font-bold text-ink">
              Gel-crème léger, non comédogène
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
              Cherche glycérine + acide hyaluronique + niacinamide, texture
              fluide. Références souvent citées : La Roche-Posay Effaclar,
              CeraVe lotion hydratante, Bioderma Sébium. Évite les huiles lourdes
              et beurres occlusifs.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
              Peau sèche
            </div>
            <div className="mt-2 text-[16px] font-bold text-ink">
              Riche, céramides + beurres
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
              Céramides, squalane, beurre de karité, glycérine. Références :
              CeraVe crème hydratante (pot), La Roche-Posay Toleriane Sensible,
              Avène Hydrance riche, Embryolisse Lait-Crème Concentré.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
              Peau sensible / réactive
            </div>
            <div className="mt-2 text-[16px] font-bold text-ink">
              Minimaliste, sans parfum
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
              Panthénol, céramides, niacinamide ; sans parfum, sans huiles
              essentielles, sans alcool dénaturé. Références : La Roche-Posay
              Cicaplast Baume B5, Avène Tolérance Control, Bioderma Hydrabio.{" "}
              <Highlight>Plus court = mieux toléré.</Highlight>
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
              Peau mature
            </div>
            <div className="mt-2 text-[16px] font-bold text-ink">
              Riche + actifs ciblés
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
              Céramides + peptides + acide hyaluronique pour la fermeté et le
              confort. Si la peau tolère, un rétinol le soir, séparément. La
              protection solaire au quotidien reste le premier geste anti-âge.
            </p>
          </div>
        </div>

        <WarnList
          items={[
            <>
              «&nbsp;Naturel&nbsp;» ou «&nbsp;hypoallergénique&nbsp;» ne sont pas
              des garanties : <Highlight>la formule seule fait foi</Highlight>.
            </>,
            <>
              Une peau grasse peut être déshydratée. Ne saute jamais
              l&apos;hydratation en pensant «&nbsp;ma peau brille déjà&nbsp;».
            </>,
          ]}
        />
      </section>

      <section id="prix" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          3. Prix : est-ce que ça change quelque chose ?
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          Peu. Sur une crème hydratante, <strong>le prix ne fait pas la
          formule</strong>. Des produits abordables (CeraVe, The Ordinary
          Natural Moisturizing Factors, Nivea, Embryolisse) tiennent tête à des
          crèmes de luxe sur les actifs qui comptent vraiment. Le marketing et le
          packaging expliquent souvent l&apos;écart de prix, pas l&apos;efficacité.
        </p>
      </section>

      <section id="compatibilite" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          4. Laquelle est vraiment faite pour toi
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          Une liste de «&nbsp;meilleures crèmes&nbsp;» reste générale. Ta peau,
          elle, est précise. Avant d&apos;acheter, la vraie question est :{" "}
          <Underline>cette crème est-elle compatible avec MON profil</Underline>{" "}
          (type de peau, objectifs, ingrédients que j&apos;évite) ? C&apos;est
          l&apos;approche détaillée dans notre article pilier :{" "}
          <Link
            href="/blog/cosmetique-fait-pour-toi"
            className="font-semibold text-rose-600 hover:text-rose-700"
          >
            comment savoir si un cosmétique est fait pour toi
          </Link>
          .
        </p>
        <BlogCTA
          title="Vérifie si une crème est faite pour toi"
          description="Scanne une crème ou colle sa liste INCI : Cosme Check calcule ton score de compatibilité, analyse la formule derrière les promesses et signale les ingrédients à éviter selon ton profil."
        />
      </section>

      <section id="faq" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">FAQ</h2>
        <div className="mt-5 flex flex-col gap-5">
          {FAQ.map((item) => (
            <div
              key={item.q}
              className="rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]"
            >
              <h3 className="text-[16px] font-bold text-ink">{item.q}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="resume" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          En résumé
        </h2>
        <CheckList
          items={[
            <>
              Pas de crème miracle universelle :{" "}
              <strong>la meilleure dépend de ta peau</strong>.
            </>,
            <>
              Texture <strong>fluide</strong> (peau grasse),{" "}
              <strong>riche</strong> (peau sèche),{" "}
              <strong>minimaliste sans parfum</strong> (peau sensible).
            </>,
            <>
              Actifs à repérer : glycérine, acide hyaluronique, céramides,
              niacinamide, squalane, panthénol.
            </>,
            <>
              <strong>Le prix ne fait pas la formule</strong> : des références
              abordables valent le luxe.
            </>,
            <>
              Avant d&apos;acheter,{" "}
              <Highlight>vérifie la compatibilité</Highlight> de la crème avec
              ton profil sur Cosme Check.
            </>,
          ]}
        />
      </section>
    </BlogArticleShell>
  );
}
