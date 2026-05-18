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

const TITLE = "Masque LED visage : effet réel ou simple tendance TikTok ?";
const DESCRIPTION =
  "Boom des masques LED en 2026 : ce que disent vraiment les études, à quoi sert chaque couleur de lumière, et les précautions à connaître avant d'investir.";
const URL = "/blog/masque-led-visage";
const PUBLISHED = "2026-05-17";
const HERO_IMAGE = "/image/blog/led/hero.webp";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "masque LED visage",
    "masque LED",
    "LED rouge peau",
    "LED bleue acné",
    "luminothérapie visage",
    "photobiomodulation",
    "masque LED avis",
    "meilleur masque LED",
    "masque LED maison",
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
  { id: "principe", label: "1. Le principe" },
  { id: "couleurs", label: "2. Que fait chaque couleur" },
  { id: "benefices", label: "3. Bénéfices documentés" },
  { id: "limites", label: "4. Limites et précautions" },
  { id: "choisir", label: "5. Comment choisir" },
  { id: "resume", label: "En résumé" },
];

export default function LedMaskArticlePage() {
  return (
    <BlogArticleShell
      title={TITLE}
      description={DESCRIPTION}
      url={URL}
      published={PUBLISHED}
      heroImage={HERO_IMAGE}
      category="Routines"
      date="17 mai 2026"
      readingTime="4 min"
      toc={TOC}
    >
      <section id="introduction" className="scroll-mt-28">
        <p className="text-[17px] leading-relaxed text-ink-muted">
          Les masques LED ont explosé sur TikTok et chez les marques de
          skincare premium. Derrière l&apos;effet «&nbsp;ovni&nbsp;» sur
          le visage, il y a une vraie technologie médicale (la{" "}
          <strong className="text-ink">photobiomodulation</strong>),
          aujourd&apos;hui rendue accessible à la maison. Mais{" "}
          <Underline>tous les masques ne se valent pas</Underline>, et le
          marketing va souvent plus vite que les études.
        </p>
      </section>

      <section id="principe" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          1. Le principe : la photobiomodulation
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          Des LED émettent une lumière à <strong>longueur d&apos;onde
          précise</strong>. Chaque longueur pénètre la peau à une
          profondeur différente et déclenche une réaction biologique :
          stimulation des mitochondries, production de collagène,
          réduction de l&apos;inflammation.
        </p>
        <Callout title="À retenir" tone="indigo">
          La technique est utilisée en dermatologie hospitalière{" "}
          <Highlight>depuis les années 2000</Highlight>. Les versions
          maison sont moins puissantes mais reposent sur le même principe.
        </Callout>
      </section>

      <section id="couleurs" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          2. Que fait chaque couleur
        </h2>
        <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-black/[0.06]">
          <table className="w-full text-[14.5px]">
            <thead className="bg-rose-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-ink">Couleur</th>
                <th className="px-4 py-3 font-semibold text-ink">
                  Longueur d&apos;onde
                </th>
                <th className="px-4 py-3 font-semibold text-ink">Effet ciblé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] bg-white">
              <tr>
                <td className="px-4 py-3 font-semibold text-rose-600">
                  Rouge
                </td>
                <td className="px-4 py-3 text-ink">630-660 nm</td>
                <td className="px-4 py-3 text-ink">
                  Anti-âge, collagène, fermeté
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-indigo-600">
                  Bleue
                </td>
                <td className="px-4 py-3 text-ink">415-465 nm</td>
                <td className="px-4 py-3 text-ink">
                  Acné, bactérie <em>P. acnes</em>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-amber-600">
                  Infrarouge
                </td>
                <td className="px-4 py-3 text-ink">830-940 nm</td>
                <td className="px-4 py-3 text-ink">
                  Cicatrisation, douleurs profondes
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-emerald-600">
                  Verte
                </td>
                <td className="px-4 py-3 text-ink">520-560 nm</td>
                <td className="px-4 py-3 text-ink">
                  Taches pigmentaires (preuve faible)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <ArticleImage
        src="/image/blog/led/image1.webp"
        alt="Femme portant un masque LED rouge pour un soin photobiomodulation à domicile"
      />

      <section id="benefices" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          3. Bénéfices documentés
        </h2>
        <CheckList
          items={[
            <>
              <strong>LED rouge :</strong> études cliniques montrent une
              augmentation visible du collagène et une réduction des rides
              fines après <Highlight>8 à 12 semaines</Highlight> à raison de
              3 à 5 séances de 10 minutes par semaine.
            </>,
            <>
              <strong>LED bleue :</strong> efficacité prouvée contre
              l&apos;acné inflammatoire légère à modérée. Souvent comparable
              à une crème topique à base de peroxyde de benzoyle.
            </>,
            <>
              <strong>LED infrarouge :</strong> accélère la cicatrisation,
              utilisée en clinique post-laser ou post-microneedling.
            </>,
            <>
              Aucune douleur, aucune éviction sociale, pas de
              photosensibilisation.
            </>,
          ]}
        />
      </section>

      <section id="limites" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          4. Limites et précautions
        </h2>
        <WarnList
          items={[
            <>
              <strong>Régularité essentielle :</strong> 3-5 séances par
              semaine pendant 2 à 3 mois minimum. Un masque utilisé
              «&nbsp;de temps en temps&nbsp;» ne donne rien.
            </>,
            <>
              <strong>Qualité variable :</strong> beaucoup de masques low
              cost ont une puissance trop faible (irradiance) pour produire
              un effet biologique réel. Cherchez la mention de la longueur
              d&apos;onde précise et de la densité de LED.
            </>,
            <>
              <strong>Contre-indications :</strong> épilepsie photosensible,
              certains traitements photosensibilisants (rétinoïdes oraux,
              tétracyclines), grossesse (par prudence). Demandez avis
              médical en cas de doute.
            </>,
            <>
              <strong>Protection oculaire :</strong> portez les lunettes
              fournies. Ne regardez jamais les LED directement.
            </>,
          ]}
        />
      </section>

      <section id="choisir" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          5. Comment choisir son masque
        </h2>
        <CheckList
          items={[
            <>
              <strong>Marquage CE médical</strong> (CE 0123 ou équivalent),
              pas seulement CE jouet.
            </>,
            <>
              Longueur d&apos;onde précise indiquée :{" "}
              <Highlight>633 nm ou 660 nm</Highlight> pour le rouge, 415 nm
              pour le bleu.
            </>,
            <>
              <strong>Densité de LED :</strong> au moins 150 LED pour un
              visage complet.
            </>,
            <>
              <strong>Irradiance</strong> (intensité) annoncée par le
              fabricant. En-dessous de 20 mW/cm², l&apos;effet est
              probablement négligeable.
            </>,
            <>
              Marques de référence : <em>CurrentBody, Dr. Dennis Gross,
              Omnilux, Foreo</em>.
            </>,
          ]}
        />

        <BlogCTA
          title="Vérifiez votre routine soin"
          description="Cosme Check analyse vos crèmes et sérums pour qu'ils accompagnent au mieux votre routine LED, sans interaction avec des actifs photosensibilisants."
        />
      </section>

      <section id="resume" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          En résumé
        </h2>
        <CheckList
          items={[
            <>
              Technologie médicale réelle, pas de la magie TikTok.
            </>,
            <>
              <strong>Rouge</strong> = anti-âge,{" "}
              <strong>bleue</strong> = acné, <strong>infrarouge</strong> =
              cicatrisation.
            </>,
            <>
              Régularité {">"} fréquence d&apos;achat : 3-5 séances /
              semaine pendant <Highlight>8-12 semaines</Highlight>.
            </>,
            <>
              Choisir un masque <strong>certifié CE médical</strong>, avec
              longueur d&apos;onde et irradiance précisées.
            </>,
            <>
              Compatible avec une routine skincare normale ; éviter sur peau
              sous traitement photosensibilisant.
            </>,
          ]}
        />
      </section>
    </BlogArticleShell>
  );
}
