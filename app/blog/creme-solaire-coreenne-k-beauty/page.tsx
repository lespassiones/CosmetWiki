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
  "Crèmes solaires coréennes (K-Beauty) : pourquoi elles cartonnent et comment bien choisir";
const DESCRIPTION =
  "Beauty of Joseon, Round Lab, Anua, COSRX... les SPF coréens explosent en France. Avantages, différences réglementaires avec l'EU et les précautions à connaître avant de commander.";
const URL = "/blog/creme-solaire-coreenne-k-beauty";
const PUBLISHED = "2026-05-11";
const HERO_IMAGE = "/image/blog/k-beauty/hero.webp";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "crème solaire coréenne",
    "K-Beauty SPF",
    "Beauty of Joseon Relief Sun",
    "Round Lab SPF",
    "Anua SPF",
    "COSRX SPF",
    "SPF coréen France",
    "filtres UV coréens",
    "SPF asiatique non gras",
    "meilleur SPF coréen",
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
  { id: "pourquoi", label: "1. Pourquoi le boom" },
  { id: "differences", label: "2. EU vs Corée : les filtres" },
  { id: "textures", label: "3. Texture et innovation" },
  { id: "top-marques", label: "4. Top marques disponibles" },
  { id: "precautions", label: "5. Précautions" },
  { id: "resume", label: "En résumé" },
];

export default function KBeautyArticlePage() {
  return (
    <BlogArticleShell
      title={TITLE}
      description={DESCRIPTION}
      url={URL}
      published={PUBLISHED}
      heroImage={HERO_IMAGE}
      category="Marques"
      date="11 mai 2026"
      readingTime="5 min"
      toc={TOC}
    >
      <section id="introduction" className="scroll-mt-28">
        <p className="text-[17px] leading-relaxed text-ink-muted">
          Les SPF coréens dominent aujourd&apos;hui le top des ventes sur
          Yesstyle, Olive Young, et de plus en plus en parapharmacie
          française. <strong className="text-ink">Beauty of Joseon Relief
          Sun</strong> est devenu un phénomène TikTok. Mais pourquoi sont-ils
          si différents de nos SPF européens, et{" "}
          <Underline>peut-on les acheter sans risque</Underline> ?
        </p>
      </section>

      <section id="pourquoi" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          1. Pourquoi le boom en 2026 ?
        </h2>
        <CheckList
          items={[
            <>
              <strong>Texture :</strong> les SPF coréens sont
              traditionnellement <Highlight>légers, non gras, sans fini
              blanc</Highlight>. La culture skincare asiatique impose des
              produits agréables à porter au quotidien.
            </>,
            <>
              <strong>Innovation rapide :</strong> nouvelles formules tous
              les 6-12 mois, là où une marque européenne peut mettre 3-5
              ans à renouveler une gamme.
            </>,
            <>
              <strong>Prix :</strong> 10 à 20 € pour une protection souvent
              meilleure qu&apos;un SPF européen à 30 €.
            </>,
            <>
              <strong>Effet «&nbsp;glass skin&nbsp;» :</strong> beaucoup de
              SPF coréens jouent un rôle d&apos;hybride entre soin
              hydratant et écran solaire.
            </>,
          ]}
        />
      </section>

      <section id="differences" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          2. EU vs Corée : la différence des filtres
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          La Corée autorise des <strong>filtres UV modernes</strong>{" "}
          (Tinosorb, Uvinul, Mexoryl) que la FDA américaine n&apos;a
          toujours pas approuvés, et qui sont aussi autorisés en Europe.
          C&apos;est pour ça que les SPF coréens et européens partagent les
          mêmes molécules de pointe.
        </p>
        <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-black/[0.06]">
          <table className="w-full text-[14.5px]">
            <thead className="bg-violet-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-ink">Marché</th>
                <th className="px-4 py-3 font-semibold text-ink">
                  Filtres modernes
                </th>
                <th className="px-4 py-3 font-semibold text-ink">
                  Approche
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] bg-white">
              <tr>
                <td className="px-4 py-3 font-semibold text-ink">
                  Corée
                </td>
                <td className="px-4 py-3 text-ink">
                  Tinosorb, Uvinul, Mexoryl, Iscotrizinol
                </td>
                <td className="px-4 py-3 text-ink">
                  Texture + innovation rapide
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-ink">
                  Europe
                </td>
                <td className="px-4 py-3 text-ink">
                  Mêmes filtres (Annexe VI)
                </td>
                <td className="px-4 py-3 text-ink">
                  Cycles de validation plus longs
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-ink">
                  États-Unis
                </td>
                <td className="px-4 py-3 text-ink">
                  Anciens uniquement (Avobenzone...)
                </td>
                <td className="px-4 py-3 text-ink">
                  Filtres modernes <em>non approuvés</em>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Callout title="À retenir" tone="violet">
          Un SPF coréen importé en France est donc{" "}
          <Highlight>cohérent avec la réglementation EU</Highlight> sur les
          filtres. C&apos;est la grosse différence avec un SPF américain
          qui peut contenir uniquement des filtres anciens (oxybenzone,
          octocrylène).
        </Callout>
      </section>

      <section id="textures" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          3. Texture et innovation
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          La force des SPF coréens, c&apos;est l&apos;ergonomie. Vous
          trouverez :
        </p>
        <CheckList
          items={[
            <>
              Des <strong>essences</strong> hybrides (entre lotion et
              sérum) avec SPF intégré, idéales pour les peaux mixtes.
            </>,
            <>
              Des <strong>fluids invisibles</strong> qui se posent sous le
              maquillage sans pilling.
            </>,
            <>
              Des <strong>sticks</strong> ultra-pratiques pour la
              réapplication en journée par-dessus le maquillage.
            </>,
            <>
              Des ajouts d&apos;actifs cosmétiques :{" "}
              <em>niacinamide, panthénol, centella asiatica, propolis</em>,
              qui apportent un vrai bénéfice soin en plus du SPF.
            </>,
          ]}
        />
      </section>

      <ArticleImage
        src="/image/blog/k-beauty/image1.webp"
        alt="Femme appliquant une crème solaire coréenne légère, illustration de la K-Beauty et de sa texture invisible"
      />

      <section id="top-marques" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          4. Les marques à connaître (disponibles en France)
        </h2>
        <CheckList
          items={[
            <>
              <strong>Beauty of Joseon Relief Sun Rice + Probiotics</strong>
              {" "}(SPF 50+ PA++++) : la star TikTok. Texture chimique
              transparente, riz fermenté, INCI court.{" "}
              <Highlight>Excellent rapport qualité-prix</Highlight> (~13 €).
            </>,
            <>
              <strong>Round Lab Birch Juice Moisturizing Sunscreen</strong>{" "}
              (SPF 50+ PA++++) : sève de bouleau, très hydratant, idéal
              peaux sèches ou matures.
            </>,
            <>
              <strong>Anua Heartleaf Silky Moisture Sun Cream</strong>
              {" "}(SPF 50+ PA++++) : centella et heartleaf, apaisant,
              recommandé pour peaux sensibles ou sujettes à
              l&apos;acné.
            </>,
            <>
              <strong>COSRX Aloe Soothing Sun Cream</strong> (SPF 50+
              PA+++) : aloe vera, classique abordable.
            </>,
            <>
              <strong>Innisfree Daily UV Defense Invisible Serum</strong>
              {" "}(SPF 36 PA+++) : fini invisible parfait sous maquillage.
            </>,
          ]}
        />
      </section>

      <section id="precautions" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          5. Précautions avant d&apos;acheter
        </h2>
        <WarnList
          items={[
            <>
              <strong>Vérifier la version :</strong> certaines marques
              vendent des <em>«&nbsp;US versions&nbsp;»</em> avec filtres
              différents (et souvent moins bons). Préférez la version{" "}
              <Highlight>«&nbsp;Korean / Global&nbsp;»</Highlight>.
            </>,
            <>
              <strong>Date de péremption :</strong> sur certains sites
              tiers (Yesstyle, Stylevana), vérifiez la date PAO (Period
              After Opening). Les filtres UV s&apos;oxydent avec le temps.
            </>,
            <>
              <strong>Notation PA / SPF :</strong>{" "}
              <em>SPF 50+ PA++++</em> est le maximum réglementaire en
              Corée. Au-dessous, c&apos;est moins protecteur sur les UVA.
            </>,
            <>
              <strong>Parfums :</strong> certains SPF coréens utilisent des
              parfums prononcés. Vérifiez l&apos;INCI si peau sensible.
            </>,
          ]}
        />

        <BlogCTA
          title="Vérifiez votre SPF coréen avant achat"
          description="Cosme Check analyse l'INCI des SPF coréens et internationaux selon la réglementation européenne, signale les filtres modernes et alerte sur les molécules à surveiller."
        />
      </section>

      <section id="resume" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          En résumé
        </h2>
        <CheckList
          items={[
            <>
              SPF coréens = <strong>textures supérieures</strong> et
              filtres modernes <Highlight>compatibles EU</Highlight>.
            </>,
            <>
              Très différents des SPF américains (filtres anciens
              uniquement aux USA).
            </>,
            <>
              Stars du moment :{" "}
              <strong>Beauty of Joseon, Round Lab, Anua, COSRX</strong>.
            </>,
            <>
              Vérifier la <strong>version «&nbsp;Korean / Global&nbsp;»</strong>{" "}
              et la date PAO sur les sites tiers.
            </>,
            <>
              Toujours scanner l&apos;INCI avant achat (parfums, alcool,
              filtres précis).
            </>,
          ]}
        />
      </section>
    </BlogArticleShell>
  );
}
