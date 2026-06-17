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
  "Déodorant ou anti-transpirant : faut-il vraiment fuir les sels d'aluminium ?";
const DESCRIPTION =
  "Cancer, Alzheimer, déos « naturels »… on démêle ce que dit vraiment la science sur les sels d'aluminium, la différence déodorant / anti-transpirant et comment lire l'INCI de ton déo cet été.";
const URL = "/blog/deodorant-sels-aluminium-verite";
const PUBLISHED = "2026-06-17";
const HERO_IMAGE = "/image/blog/deodorant-aluminium/hero.webp";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "sels d'aluminium danger",
    "déodorant sans aluminium",
    "anti-transpirant cancer",
    "déodorant naturel avis",
    "aluminium déodorant",
    "meilleur déodorant sans aluminium",
    "déodorant vs anti-transpirant",
    "transpiration excessive",
    "déodorant bicarbonate irritation",
    "déodorant été",
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
  { id: "difference", label: "1. Déodorant ≠ anti-transpirant" },
  { id: "science", label: "2. Sels d'aluminium : ce que dit la science" },
  { id: "alternatives", label: "3. Les alternatives « sans aluminium »" },
  { id: "inci", label: "4. Lire l'INCI de ton déo" },
  { id: "resume", label: "En résumé" },
];

export default function DeodorantAluminiumArticlePage() {
  return (
    <BlogArticleShell
      title={TITLE}
      description={DESCRIPTION}
      url={URL}
      published={PUBLISHED}
      heroImage={HERO_IMAGE}
      category="Ingrédients"
      date="17 juin 2026"
      readingTime="4 min"
      toc={TOC}
    >
      <section id="introduction" className="scroll-mt-28">
        <p className="text-[17px] leading-relaxed text-ink-muted">
          Dès les premières chaleurs, la même question revient :{" "}
          <strong className="text-ink">
            les sels d&apos;aluminium sont-ils dangereux ?
          </strong>{" "}
          Entre les rumeurs de cancer, les déos « naturels » qui ne tiennent pas
          la journée et les irritations au bicarbonate,{" "}
          <Underline>on fait le tri, preuves à l&apos;appui</Underline>.
        </p>
      </section>

      <section id="difference" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          1. Déodorant ≠ anti-transpirant
        </h2>
        <p className="mt-3 text-[15.5px] leading-relaxed text-ink">
          C&apos;est <Highlight>la confusion n°1</Highlight>, et elle change
          tout :
        </p>
        <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-black/[0.06]">
          <table className="w-full text-[14.5px]">
            <thead className="bg-emerald-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-ink">&nbsp;</th>
                <th className="px-4 py-3 font-semibold text-ink">Déodorant</th>
                <th className="px-4 py-3 font-semibold text-ink">
                  Anti-transpirant
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] bg-white">
              <tr>
                <td className="px-4 py-3 font-semibold text-ink">Rôle</td>
                <td className="px-4 py-3 text-ink">
                  Masque / neutralise l&apos;odeur
                </td>
                <td className="px-4 py-3 text-ink">
                  Réduit le flux de sueur
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-ink">Comment</td>
                <td className="px-4 py-3 text-ink">
                  Antibactériens + parfum
                </td>
                <td className="px-4 py-3 text-ink">
                  Sels d&apos;aluminium qui resserrent les pores
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-ink">Tu transpires</td>
                <td className="px-4 py-3 text-ink">Oui (mais sans odeur)</td>
                <td className="px-4 py-3 text-ink">Beaucoup moins</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Callout title="À retenir" tone="emerald">
          Seuls les <strong>anti-transpirants</strong> contiennent des sels
          d&apos;aluminium. Un déodorant peut très bien en être totalement
          dépourvu — <Highlight>ce n&apos;est pas « tout ou rien »</Highlight>.
        </Callout>
      </section>

      <section id="science" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          2. Sels d&apos;aluminium : ce que dit (et ne dit pas) la science
        </h2>
        <p className="mt-3 text-[15.5px] leading-relaxed text-ink">
          La rumeur cancer du sein / Alzheimer circule depuis des années. À ce
          jour, <Underline>aucun lien de cause à effet n&apos;est établi</Underline>{" "}
          :
        </p>
        <CheckList
          items={[
            <>
              Les grandes autorités sanitaires (dont l&apos;
              <strong>ANSES</strong> en France) estiment qu&apos;il n&apos;existe{" "}
              <strong>pas de preuve solide</strong> reliant les déodorants au
              cancer du sein ou à la maladie d&apos;Alzheimer.
            </>,
            <>
              Les études « alarmistes » étaient surtout{" "}
              <em>in vitro</em> (sur cellules), à des doses sans rapport avec un
              usage réel.
            </>,
            <>
              La seule réserve sérieuse de l&apos;ANSES :{" "}
              <strong>éviter l&apos;application sur peau lésée</strong> (juste
              après le rasage, micro-coupures) car l&apos;absorption augmente.
            </>,
          ]}
        />
        <WarnList
          items={[
            <>
              « Sans aluminium » est avant tout un{" "}
              <strong>argument marketing</strong>. Ça ne rend pas un produit
              « sain » par magie — un déo naturel peut être très irritant.
            </>,
            <>
              Ne change pas de produit dans la panique : si ton
              anti-transpirant te convient, l&apos;
              <Highlight>usage normal est considéré comme sûr</Highlight>.
            </>,
          ]}
        />
      </section>

      <ArticleImage
        src="/image/blog/deodorant-aluminium/image1.webp"
        alt="Plusieurs déodorants et anti-transpirants alignés : stick, roll-on et spray, avec étiquettes INCI visibles"
      />

      <section id="alternatives" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          3. Les alternatives « sans aluminium » (et leurs limites)
        </h2>
        <CheckList
          items={[
            <>
              <strong>Bicarbonate de soude :</strong> efficace contre
              l&apos;odeur, mais <Underline>pH élevé</Underline> = irritations
              et rougeurs fréquentes sous les aisselles.
            </>,
            <>
              <strong>Pierre d&apos;alun :</strong> souvent vendue « naturelle »
              … alors qu&apos;elle contient elle-même de l&apos;aluminium (
              <em>Potassium alum</em>). Paradoxe complet.
            </>,
            <>
              <strong>Oxyde de zinc / ricinoléate de zinc :</strong> neutralise
              les odeurs en douceur, bonne option peaux sensibles.
            </>,
            <>
              <strong>Amidons + huiles végétales :</strong> absorbent
              l&apos;humidité sans bloquer la sueur. Confort, mais tenue plus
              courte en pleine chaleur.
            </>,
          ]}
        />
        <Callout title="Le vrai critère" tone="emerald">
          La question n&apos;est pas « avec ou sans aluminium », mais{" "}
          <Highlight>« est-ce que la formule est bien tolérée par TA
          peau ? »</Highlight> C&apos;est là que lire l&apos;INCI devient utile.
        </Callout>
      </section>

      <section id="inci" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          4. Lire l&apos;INCI de ton déo en 10 secondes
        </h2>
        <CheckList
          items={[
            <>
              <strong>Sels d&apos;aluminium :</strong>{" "}
              <em>Aluminum chlorohydrate, Aluminum zirconium…</em> → tu tiens un
              anti-transpirant (réduit la sueur).
            </>,
            <>
              <strong>Actifs anti-odeur doux :</strong>{" "}
              <em>Zinc ricinoleate, Triethyl citrate</em> → bonne tolérance.
            </>,
          ]}
        />
        <WarnList
          items={[
            <>
              <strong>Sodium bicarbonate</strong> en tête de liste : à éviter si
              tu as la peau réactive.
            </>,
            <>
              <strong>Alcohol denat.</strong> en première position : pique sur
              peau rasée, dessèche.
            </>,
            <>
              <strong>Parfum / Fragrance</strong> abondant + allergènes (
              <em>Limonene, Linalool</em>) : cause fréquente d&apos;eczéma des
              aisselles.
            </>,
          ]}
        />

        <BlogCTA
          title="Ton déo te convient-il vraiment ?"
          description="Scanne ton déodorant ou anti-transpirant avec Cosme Check : détection des sels d'aluminium, de l'alcool et des parfums allergènes, note ingrédient par ingrédient et alternatives mieux tolérées."
        />
      </section>

      <section id="resume" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          En résumé
        </h2>
        <CheckList
          items={[
            <>
              <strong>Déodorant</strong> = anti-odeur. <strong>Anti-transpirant</strong>{" "}
              = anti-sueur (sels d&apos;aluminium).
            </>,
            <>
              À ce jour, <Highlight>aucun lien prouvé</Highlight> entre sels
              d&apos;aluminium et cancer ou Alzheimer. Seule réserve : peau
              lésée.
            </>,
            <>
              « Sans aluminium » ≠ « sans risque » : le bicarbonate et la pierre
              d&apos;alun ont aussi leurs défauts.
            </>,
            <>
              Le bon réflexe : <strong>lire l&apos;INCI</strong> et choisir une
              formule tolérée par ta peau, pas un slogan.
            </>,
          ]}
        />
      </section>
    </BlogArticleShell>
  );
}
