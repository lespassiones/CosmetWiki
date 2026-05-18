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

const TITLE = "Lip oils : la vraie différence avec un gloss (et lesquels choisir)";
const DESCRIPTION =
  "Les huiles à lèvres ont explosé sur les réseaux sociaux. Voici ce qui les différencie d'un gloss classique, comment lire l'INCI et les références qui tiennent vraiment leurs promesses.";
const URL = "/blog/lip-oils-huiles-levres";
const PUBLISHED = "2026-05-14";
const HERO_IMAGE = "/image/blog/lip-oils/hero.webp";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "lip oil",
    "huile à lèvres",
    "lip oil avis",
    "Dior lip glow oil",
    "lip oil teinté",
    "soin lèvres naturel",
    "meilleur lip oil",
    "lèvres gercées",
    "gloss vs huile lèvres",
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
  { id: "difference-gloss", label: "1. Différence avec un gloss" },
  { id: "benefices", label: "2. Ce que ça apporte vraiment" },
  { id: "inci", label: "3. Que regarder dans l'INCI" },
  { id: "marques", label: "4. Les marques du moment" },
  { id: "resume", label: "En résumé" },
];

export default function LipOilsArticlePage() {
  return (
    <BlogArticleShell
      title={TITLE}
      description={DESCRIPTION}
      url={URL}
      published={PUBLISHED}
      heroImage={HERO_IMAGE}
      category="Routines"
      date="14 mai 2026"
      readingTime="3 min"
      toc={TOC}
    >
      <section id="introduction" className="scroll-mt-28">
        <p className="text-[17px] leading-relaxed text-ink-muted">
          Les <strong className="text-ink">lip oils</strong> sont devenus
          virales sur TikTok, et ont propulsé Dior, Rhode et Clarins en tête
          des ventes lèvres. Promesse : la brillance d&apos;un gloss avec le
          soin d&apos;un baume. <Underline>Vrai sur le papier</Underline>,
          mais à condition de bien choisir.
        </p>
      </section>

      <section id="difference-gloss" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          1. Différence avec un gloss classique
        </h2>
        <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-black/[0.06]">
          <table className="w-full text-[14.5px]">
            <thead className="bg-rose-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-ink">Critère</th>
                <th className="px-4 py-3 font-semibold text-ink">Gloss</th>
                <th className="px-4 py-3 font-semibold text-ink">Lip oil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] bg-white">
              <tr>
                <td className="px-4 py-3 font-semibold text-ink">Base</td>
                <td className="px-4 py-3 text-ink">Polymères + silicones</td>
                <td className="px-4 py-3 text-ink">
                  Huiles végétales (jojoba, ricin...)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-ink">Texture</td>
                <td className="px-4 py-3 text-ink">Collante, épaisse</td>
                <td className="px-4 py-3 text-ink">
                  Fluide, légère, non collante
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-ink">Effet</td>
                <td className="px-4 py-3 text-ink">
                  Brillance pure
                </td>
                <td className="px-4 py-3 text-ink">
                  Brillance + nutrition
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-ink">Tenue</td>
                <td className="px-4 py-3 text-ink">2-3 h</td>
                <td className="px-4 py-3 text-ink">1-2 h (à réappliquer)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="benefices" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          2. Ce que ça apporte vraiment
        </h2>
        <CheckList
          items={[
            <>
              <strong>Nutrition immédiate :</strong> les huiles végétales
              colmatent les micro-fissures des lèvres et limitent
              l&apos;évaporation de l&apos;eau.
            </>,
            <>
              <strong>Confort durable :</strong> les versions sérieuses
              comprennent du beurre de karité, du squalane végétal ou de
              l&apos;huile de jojoba.
            </>,
            <>
              <strong>Effet plump léger :</strong> certaines formules
              ajoutent de la <em>menthe poivrée</em> ou un dérivé de
              capsicum pour gonfler temporairement la lèvre. Joli sur
              Instagram, parfois irritant.
            </>,
          ]}
        />
        <Callout title="À retenir" tone="rose">
          Le lip oil <Highlight>remplace souvent le baume</Highlight> au
          quotidien, mais ne remplace pas un baume très occlusif type
          Cicaplast en cas de lèvres gercées profondes.
        </Callout>
      </section>

      <section id="inci" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          3. Que regarder dans l&apos;INCI
        </h2>
        <CheckList
          items={[
            <>
              <strong>Premiers ingrédients = vraies huiles :</strong>{" "}
              <em>Helianthus annuus oil, Ricinus communis oil, Jojoba
              esters, Squalane, Butyrospermum parkii butter</em>.
            </>,
            <>
              <strong>Pas que des esters :</strong> certains lip oils ne
              contiennent que <em>Polybutene, Hydrogenated Polyisobutene</em>
              {" "}(huiles synthétiques imitatrices). Brillant, mais pas
              nourrissant.
            </>,
            <>
              <strong>Vitamine E (<em>Tocopherol</em>) :</strong> bon
              indicateur de qualité, antioxydant qui protège les huiles de
              l&apos;oxydation.
            </>,
          ]}
        />
        <WarnList
          items={[
            <>
              <strong>Parfums forts</strong> et arômes (
              <em>cinnamon, peppermint oil</em>) : risque d&apos;allergie
              ou de tiraillement.
            </>,
            <>
              <strong>Colorants alimentaires douteux</strong> (
              <em>CI 15850, CI 15985</em>) : préférez des pigments minéraux
              ou des nacres si vous voulez une version teintée.
            </>,
          ]}
        />
      </section>

      <ArticleImage
        src="/image/blog/lip-oils/image1.webp"
        alt="Application d'une huile à lèvres teintée avec applicateur, mise en avant de la texture brillante et fluide"
      />

      <section id="marques" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          4. Les marques du moment (et notre lecture INCI)
        </h2>
        <CheckList
          items={[
            <>
              <strong>Dior Addict Lip Glow Oil :</strong> base d&apos;huile
              de cerise + ricin. INCI propre, parfum présent.{" "}
              <Highlight>La référence luxe.</Highlight>
            </>,
            <>
              <strong>Clarins Lip Comfort Oil :</strong> huile de noisette,
              de tournesol. Confortable, INCI cohérent avec la promesse.
            </>,
            <>
              <strong>Kosas LipFuel Hyaluronic :</strong> huile + acide
              hyaluronique. Effet plus aqueux. Bonne option clean.
            </>,
            <>
              <strong>Rhode Peptide Lip Tint :</strong> huile + peptides.
              Tendance, formule INCI très soignée.
            </>,
            <>
              <strong>Bourjois Healthy Mix Lip Oil :</strong> alternative
              accessible (10-15 €), INCI correct mais avec des huiles
              minérales (<em>Mineral oil</em>) en première position.
            </>,
          ]}
        />

        <BlogCTA
          title="Vérifiez vos huiles à lèvres en 10 secondes"
          description="Scannez votre lip oil avec Cosme Check : note ingrédient par ingrédient, alerte sur les parfums irritants et les huiles synthétiques."
        />
      </section>

      <section id="resume" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          En résumé
        </h2>
        <CheckList
          items={[
            <>
              <strong>Gloss</strong> = brillance pure.{" "}
              <strong>Lip oil</strong> = brillance + nutrition.
            </>,
            <>
              Cherchez <Highlight>une vraie huile végétale</Highlight> dans
              les 3 premiers ingrédients de l&apos;INCI.
            </>,
            <>
              Évitez les arômes forts (menthe, cannelle) si vous avez les
              lèvres sensibles.
            </>,
            <>
              Tenue 1-2 h : c&apos;est normal, on réapplique. Pas un défaut
              produit.
            </>,
          ]}
        />
      </section>
    </BlogArticleShell>
  );
}
