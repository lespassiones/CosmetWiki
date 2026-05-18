import type { Metadata } from "next";
import { BlogCTA } from "@/components/blog/BlogCTA";
import { BlogArticleShell } from "@/components/blog/BlogArticleShell";
import {
  ArticleImage,
  Callout,
  CheckList,
  Highlight,
  Underline,
  WarnList,
} from "@/components/blog/BlogElements";

const TITLE =
  "Crèmes hydratantes et réparatrices : le guide pour choisir selon sa peau";
const DESCRIPTION =
  "Hydratation vs nutrition, actifs qui marchent vraiment, et la bonne crème pour chaque type de peau (grasse, sèche, mixte, sensible). Le guide simple pour ne plus se tromper.";
const URL = "/blog/cremes-hydratantes-reparatrices";
const PUBLISHED = "2026-05-13";
const HERO_IMAGE = "/image/blog/cremes-hydratantes/hero.webp";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "crème hydratante visage",
    "crème réparatrice",
    "crème pour peau sèche",
    "crème pour peau grasse",
    "crème pour peau sensible",
    "céramides visage",
    "niacinamide crème",
    "panthénol",
    "crème hydratante anti-âge",
    "hydratation vs nutrition peau",
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
  { id: "introduction", label: "Introduction" },
  { id: "hydratation-nutrition", label: "1. Hydratation vs nutrition" },
  { id: "actifs", label: "2. Les actifs qui marchent" },
  { id: "type-peau", label: "3. Selon votre type de peau" },
  { id: "erreurs", label: "4. Les erreurs fréquentes" },
  { id: "resume", label: "En résumé" },
];

export default function CremesHydratantesArticlePage() {
  return (
    <BlogArticleShell
      title={TITLE}
      description={DESCRIPTION}
      url={URL}
      published={PUBLISHED}
      heroImage={HERO_IMAGE}
      category="Routines"
      date="13 mai 2026"
      readingTime="5 min"
      toc={TOC}
    >
      <section id="introduction" className="scroll-mt-28">
        <p className="text-[17px] leading-relaxed text-ink-muted">
          La crème hydratante reste le produit{" "}
          <strong className="text-ink">le plus essentiel</strong> de toute
          routine skincare. Avant le sérum, avant le rétinol, avant tout
          marketing. Encore faut-il <Underline>la bonne crème pour la
          bonne peau</Underline>, et savoir ce que veut dire
          «&nbsp;hydrater&nbsp;» vraiment.
        </p>
      </section>

      <section id="hydratation-nutrition" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          1. Hydratation vs nutrition : la confusion classique
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          Deux problèmes différents, deux solutions différentes :
        </p>
        <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-black/[0.06]">
          <table className="w-full text-[14.5px]">
            <thead className="bg-rose-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-ink">
                  Problème
                </th>
                <th className="px-4 py-3 font-semibold text-ink">
                  Symptômes
                </th>
                <th className="px-4 py-3 font-semibold text-ink">
                  Solution
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] bg-white">
              <tr>
                <td className="px-4 py-3 font-semibold text-ink">
                  Manque d&apos;eau
                </td>
                <td className="px-4 py-3 text-ink">
                  Tiraillements, ridules de déshydratation, teint terne
                </td>
                <td className="px-4 py-3 text-ink">
                  Humectants : <em>glycérine, acide hyaluronique, urée</em>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-ink">
                  Manque de lipides
                </td>
                <td className="px-4 py-3 text-ink">
                  Peau rugueuse, squameuse, qui «&nbsp;tire&nbsp;» après
                  le nettoyage
                </td>
                <td className="px-4 py-3 text-ink">
                  Émollients : <em>céramides, squalane, beurres végétaux</em>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Callout title="À retenir" tone="rose">
          Une peau peut être <Highlight>grasse ET déshydratée</Highlight> en
          même temps. Sébum et eau sont deux choses différentes. Ne
          confondez pas brillance et hydratation.
        </Callout>
      </section>

      <section id="actifs" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          2. Les actifs qui marchent vraiment
        </h2>
        <CheckList
          items={[
            <>
              <strong>Glycérine</strong> : l&apos;humectant n°1, présent
              dans 90 % des bonnes crèmes. Souvent dans les 5 premiers
              ingrédients.
            </>,
            <>
              <strong>Acide hyaluronique (<em>Sodium Hyaluronate</em>)</strong>{" "}
              : retient jusqu&apos;à <Highlight>1 000 fois son poids en
              eau</Highlight>. Effet rebond immédiat.
            </>,
            <>
              <strong>Céramides</strong> : réparent la barrière cutanée,
              indispensables pour les peaux sèches, sensibles ou
              atopiques.
            </>,
            <>
              <strong>Niacinamide</strong> (vitamine B3, 2 à 5 %) :
              renforce la barrière, anti-rougeurs, anti-tâches, polyvalent.
            </>,
            <>
              <strong>Panthénol</strong> (provitamine B5) : apaisant,
              cicatrisant. Star des soins post-procédures (laser,
              microneedling).
            </>,
            <>
              <strong>Squalane</strong> : émollient d&apos;origine
              végétale, ressemble au sébum naturel, non comédogène.
            </>,
          ]}
        />
      </section>

      <ArticleImage
        src="/image/blog/cremes-hydratantes/image1.webp"
        alt="Application d'une crème hydratante visage le matin, illustration d'une routine skincare quotidienne"
      />

      <section id="type-peau" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          3. Selon votre type de peau
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
              Peau grasse / mixte
            </div>
            <div className="mt-2 text-[16px] font-bold text-ink">
              Texture gel ou fluide
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
              Glycérine + acide hyaluronique + niacinamide. Mention{" "}
              <strong>«&nbsp;non comédogène&nbsp;»</strong>. Évitez les
              huiles minérales et beurres lourds.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
              Peau sèche
            </div>
            <div className="mt-2 text-[16px] font-bold text-ink">
              Texture riche, baume
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
              Céramides + squalane + beurre de karité + glycérine. Visez
              les listes courtes type CeraVe, La Roche-Posay
              Toleriane, Avène Tolérance.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
              Peau sensible / réactive
            </div>
            <div className="mt-2 text-[16px] font-bold text-ink">
              Formule minimaliste
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
              Panthénol + céramides + niacinamide. Sans parfum, sans huiles
              essentielles, sans alcool dénaturé.{" "}
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
              Céramides + peptides + acide hyaluronique. Si tolérance,
              ajouter un rétinol le soir (séparément).
            </p>
          </div>
        </div>
      </section>

      <section id="erreurs" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          4. Les erreurs fréquentes
        </h2>
        <WarnList
          items={[
            <>
              <strong>Ne pas hydrater une peau grasse.</strong> Le manque
              d&apos;eau accentue justement la production de sébum.
            </>,
            <>
              <strong>Changer de crème trop souvent.</strong> Il faut au
              moins <Highlight>3 à 4 semaines</Highlight> pour voir
              l&apos;effet réel d&apos;un produit.
            </>,
            <>
              <strong>Multiplier les actifs forts.</strong> Une bonne
              crème hydratante n&apos;a pas besoin de 12 actifs. Mieux
              vaut un sérum ciblé + une crème simple.
            </>,
            <>
              <strong>Oublier le cou et les mains.</strong> Ce sont eux qui
              vieillissent en premier.
            </>,
          ]}
        />

        <BlogCTA
          title="Trouvez la bonne crème selon votre peau"
          description="Cosme Check analyse l'INCI de vos crèmes pour identifier les actifs efficaces, vérifier la cohérence avec votre type de peau et signaler les ingrédients potentiellement irritants."
        />
      </section>

      <section id="resume" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          En résumé
        </h2>
        <CheckList
          items={[
            <>
              <strong>Hydratation</strong> = eau (glycérine, AH).{" "}
              <strong>Nutrition</strong> = lipides (céramides, beurres).
            </>,
            <>
              Une peau grasse peut être déshydratée.{" "}
              <Highlight>Toujours hydrater.</Highlight>
            </>,
            <>
              Actifs stars : glycérine, acide hyaluronique, céramides,
              niacinamide, panthénol, squalane.
            </>,
            <>
              Texture <strong>fluide</strong> pour peau grasse,{" "}
              <strong>riche</strong> pour peau sèche,{" "}
              <strong>minimaliste</strong> pour peau sensible.
            </>,
            <>
              Patience : 3-4 semaines pour juger un produit, pas 3 jours.
            </>,
          ]}
        />
      </section>
    </BlogArticleShell>
  );
}
