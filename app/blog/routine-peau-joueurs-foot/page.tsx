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
  "Skincare des stars du foot : la routine de Ronaldo, Mbappé & co décryptée";
const DESCRIPTION =
  "Coupe du monde oblige, leurs visages sont partout. Quelle routine peau suivent vraiment les stars du ballon, quels ingrédients privilégier et la version simple à copier en 3 minutes par jour.";
const URL = "/blog/routine-peau-joueurs-foot";
const PUBLISHED = "2026-06-17";
const HERO_IMAGE = "/image/blog/foot-skincare/hero.webp";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "routine peau footballeur",
    "skincare Ronaldo",
    "routine visage Mbappé",
    "soin visage homme",
    "routine peau homme simple",
    "crème homme footballeur",
    "skincare homme coupe du monde",
    "David Beckham House 99",
    "soin peau sportif",
    "routine peau homme 2026",
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
  { id: "pourquoi", label: "1. Pourquoi ils soignent leur peau" },
  { id: "vraiment", label: "2. Ce qu'ils utilisent vraiment" },
  { id: "routine", label: "3. La routine simple à copier" },
  { id: "inci", label: "4. Les ingrédients qui comptent" },
  { id: "resume", label: "En résumé" },
];

export default function FootSkincareArticlePage() {
  return (
    <BlogArticleShell
      title={TITLE}
      description={DESCRIPTION}
      url={URL}
      published={PUBLISHED}
      heroImage={HERO_IMAGE}
      category="Routines"
      date="17 juin 2026"
      readingTime="4 min"
      toc={TOC}
    >
      <section id="introduction" className="scroll-mt-28">
        <p className="text-[17px] leading-relaxed text-ink-muted">
          Pendant la <strong className="text-ink">Coupe du monde</strong>, leurs
          visages passent en gros plan des centaines de fois par match. Et
          beaucoup l&apos;ont compris : une peau nette, c&apos;est aussi une
          image de marque. Mais derrière les routines impressionnantes des
          stars, <Underline>l&apos;essentiel tient en 3 gestes</Underline>{" "}
          accessibles à tout le monde — pas besoin d&apos;un contrat à
          200 millions.
        </p>
      </section>

      <section id="pourquoi" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          1. Pourquoi les joueurs soignent (vraiment) leur peau
        </h2>
        <CheckList
          items={[
            <>
              <strong>Le soleil et la sueur :</strong> entraînements en plein
              air, transpiration permanente, douches répétées… la barrière
              cutanée prend cher. Sans protection, ça donne teint terne,
              déshydratation et imperfections.
            </>,
            <>
              <strong>Les voyages incessants :</strong> avion, décalage horaire,
              air sec des hôtels. La peau se déshydrate vite, exactement comme
              pour n&apos;importe quel grand voyageur.
            </>,
            <>
              <strong>L&apos;exposition médiatique :</strong> caméras 4K,
              sponsoring beauté, réseaux sociaux. Plusieurs stars ont lancé ou
              prêté leur image à des marques de soin —{" "}
              <Highlight>David Beckham avec House 99</Highlight> en est
              l&apos;exemple le plus connu.
            </>,
          ]}
        />
        <Callout title="Le vrai parallèle" tone="rose">
          Ce que vit la peau d&apos;un joueur (soleil + sueur + fatigue) est
          exactement ce que vit la tienne en été, à la salle de sport ou en
          festival. La routine est <Highlight>transposable à 100 %</Highlight>.
        </Callout>
      </section>

      <section id="vraiment" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          2. Ce qu&apos;ils utilisent vraiment (sans le marketing)
        </h2>
        <p className="mt-3 text-[15.5px] leading-relaxed text-ink">
          Au-delà des marques de stars, les routines partagées par les
          dermatologues du sport et les préparateurs reviennent toujours aux
          mêmes familles de produits :
        </p>
        <CheckList
          items={[
            <>
              <strong>Un nettoyant doux</strong> matin et soir pour éliminer
              sueur et sébum sans décaper.
            </>,
            <>
              <strong>Une crème hydratante légère</strong> — souvent un gel ou
              une émulsion non grasse, adaptée aux peaux qui transpirent.
            </>,
            <>
              <strong>Une protection solaire SPF 50</strong> systématique :
              c&apos;est <Underline>le geste anti-âge n°1</Underline>, et le plus
              négligé chez les hommes.
            </>,
            <>
              <strong>Parfois un actif ciblé :</strong> vitamine C le matin
              (éclat), rétinol ou acide le soir (texture, marques).
            </>,
          ]}
        />
        <WarnList
          items={[
            <>
              Méfie-toi des routines <strong>« 10 étapes »</strong> postées sur
              les réseaux : spectaculaires, mais souvent du contenu sponsorisé.
              Plus de produits ≠ meilleure peau.
            </>,
            <>
              Les <strong>parfums forts</strong> dans les soins masculins
              (after-shave, gels « fraîcheur ») irritent les peaux déjà
              agressées par la sueur.
            </>,
          ]}
        />
      </section>

      <ArticleImage
        src="/image/blog/foot-skincare/image1.webp"
        alt="Routine de soin du visage masculine simple : nettoyant, crème hydratante et protection solaire posés côte à côte"
      />

      <section id="routine" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          3. La routine « niveau pro » en 3 minutes par jour
        </h2>
        <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-black/[0.06]">
          <table className="w-full text-[14.5px]">
            <thead className="bg-rose-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-ink">Moment</th>
                <th className="px-4 py-3 font-semibold text-ink">Geste</th>
                <th className="px-4 py-3 font-semibold text-ink">Pourquoi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] bg-white">
              <tr>
                <td className="px-4 py-3 font-semibold text-ink">Matin</td>
                <td className="px-4 py-3 text-ink">
                  Nettoyant + hydratant + SPF 50
                </td>
                <td className="px-4 py-3 text-ink">
                  Protège du soleil et de la pollution toute la journée
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-ink">Après sport</td>
                <td className="px-4 py-3 text-ink">
                  Rinçage à l&apos;eau + hydratant léger
                </td>
                <td className="px-4 py-3 text-ink">
                  Évite boutons et tiraillements liés à la sueur
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-ink">Soir</td>
                <td className="px-4 py-3 text-ink">
                  Nettoyant + (1 soir / 2) actif
                </td>
                <td className="px-4 py-3 text-ink">
                  Régénération nocturne, texture et marques
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Callout title="Astuce terrain" tone="rose">
          Tu transpires beaucoup ? Garde un <Highlight>SPF en stick</Highlight>{" "}
          ou une brume dans ton sac pour réappliquer à la mi-temps — exactement
          ce que font les staffs médicaux pour les joueurs sur le banc.
        </Callout>
      </section>

      <section id="inci" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          4. Les ingrédients qui comptent vraiment
        </h2>
        <CheckList
          items={[
            <>
              <strong>Niacinamide :</strong> régule le sébum et apaise —
              parfait pour les peaux qui transpirent.
            </>,
            <>
              <strong>Acide hyaluronique :</strong> réhydrate sans graisser,
              idéal après l&apos;effort et les voyages.
            </>,
            <>
              <strong>Filtres solaires modernes</strong> (
              <em>Tinosorb, Uvinul</em>) : large spectre, texture légère, pas
              d&apos;effet blanc.
            </>,
            <>
              <strong>Vitamine C (<em>Ascorbic acid</em>) :</strong> coup
              d&apos;éclat anti-teint terne, antioxydant.
            </>,
          ]}
        />
        <WarnList
          items={[
            <>
              <strong>Alcool dénaturé (<em>Alcohol denat.</em>) en tête de
              liste :</strong> dessèche, fréquent dans les soins « pour
              hommes ».
            </>,
            <>
              <strong>Parfum (<em>Parfum / Fragrance</em>) très présent :</strong>{" "}
              première cause d&apos;allergie cosmétique.
            </>,
          ]}
        />

        <BlogCTA
          title="Scanne le soin que tu utilises déjà"
          description="Avant d'acheter la crème « du joueur préféré », vérifie sa vraie composition avec Cosme Check : note ingrédient par ingrédient, alerte sur l'alcool et les parfums, et alternatives plus propres."
        />
      </section>

      <section id="resume" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          En résumé
        </h2>
        <CheckList
          items={[
            <>
              La peau nette des stars du foot tient à{" "}
              <Highlight>3 gestes</Highlight>, pas à 10 produits hors de prix.
            </>,
            <>
              <strong>Nettoyant doux + hydratant léger + SPF 50</strong> : la
              base qui marche pour 90 % des hommes.
            </>,
            <>
              Soleil et sueur abîment ta peau exactement comme la leur — la
              protection solaire est non négociable.
            </>,
            <>
              Méfie-toi du marketing « star » : c&apos;est l&apos;INCI qui
              compte, pas le nom sur le flacon.
            </>,
          ]}
        />
      </section>
    </BlogArticleShell>
  );
}
