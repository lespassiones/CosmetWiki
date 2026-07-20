import type { Metadata } from "next";
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
  "Meilleurs produits anti-imperfections : comment choisir (peau à boutons)";
const DESCRIPTION =
  "Boutons, points noirs, pores dilatés : les actifs qui marchent vraiment (BHA, niacinamide, zinc, acide azélaïque), les erreurs à éviter, et comment savoir si un produit est vraiment fait pour TA peau.";
const URL = "/blog/meilleurs-produits-anti-imperfections";
const PUBLISHED = "2026-07-20";
const HERO_IMAGE = "/image/blog/anti-imperfections/hero.webp";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "meilleurs produits anti-imperfections",
    "produits contre les boutons",
    "soin anti-acné",
    "acide salicylique boutons",
    "niacinamide imperfections",
    "acide azélaïque",
    "peau grasse à boutons",
    "points noirs pores dilatés",
    "routine anti-imperfections",
    "produit adapté à ma peau",
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
  { id: "causes", label: "1. D'où viennent les imperfections" },
  { id: "actifs", label: "2. Les actifs qui marchent" },
  { id: "eviter", label: "3. Ce qu'il vaut mieux éviter" },
  { id: "situation", label: "4. Selon ta situation" },
  { id: "compatibilite", label: "5. Le meilleur produit pour TOI" },
  { id: "faq", label: "FAQ" },
  { id: "resume", label: "En résumé" },
];

// FAQPage : réponses courtes et directes, pensées pour être extraites et citées
// par les moteurs de réponse IA (GEO). Correspond aux questions People Also Ask.
const FAQ: { q: string; a: string }[] = [
  {
    q: "Quel actif choisir contre les boutons ?",
    a: "L'acide salicylique (BHA) désincruste les pores et cible points noirs et microkystes. Le peroxyde de benzoyle agit sur les boutons inflammatoires. La niacinamide et le zinc régulent le sébum et apaisent. L'acide azélaïque est le plus polyvalent (imperfections, rougeurs, marques) et convient aux peaux sensibles.",
  },
  {
    q: "Peut-on cumuler plusieurs actifs anti-imperfections ?",
    a: "Oui, avec prudence. On évite de superposer plusieurs exfoliants forts le même soir, et on introduit un seul actif nouveau à la fois pour repérer ce que la peau tolère. Niacinamide et acide azélaïque sont doux et se combinent facilement ; le peroxyde de benzoyle et les rétinoïdes s'utilisent plutôt en alternance.",
  },
  {
    q: "Comment savoir si un produit anti-imperfections est fait pour ma peau ?",
    a: "Un produit bien noté dans l'absolu peut ne pas te convenir selon ton type de peau, tes sensibilités et ce que tu veux éviter. Cosme Check calcule un score de compatibilité entre ton profil et la formule réelle du produit, et signale les ingrédients qui touchent tes restrictions.",
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

export default function AntiImperfectionsArticlePage() {
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
      readingTime="6 min"
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
          Contre les imperfections, quatre actifs font le gros du travail :{" "}
          <Highlight>acide salicylique (BHA)</Highlight> pour les pores et les
          points noirs, <Highlight>peroxyde de benzoyle</Highlight> pour les
          boutons inflammatoires, <Highlight>niacinamide + zinc</Highlight> pour
          réguler, et <Highlight>acide azélaïque</Highlight> comme option douce
          et polyvalente. Mais «&nbsp;le meilleur produit&nbsp;» dépend de{" "}
          <Underline>ta peau</Underline> : un soin efficace sur une peau grasse
          peut irriter une peau sensible. La bonne question n&apos;est pas
          «&nbsp;quel est le meilleur produit&nbsp;», c&apos;est «&nbsp;lequel
          est fait pour moi&nbsp;».
        </Callout>
      </section>

      <section id="causes" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          1. D&apos;où viennent les imperfections
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          Un bouton, c&apos;est presque toujours la même mécanique : un pore qui
          se bouche (excès de sébum + cellules mortes), une bactérie naturelle
          de la peau (<em>Cutibacterium acnes</em>) qui prolifère, et une
          inflammation. Chaque actif efficace agit sur{" "}
          <strong>un ou plusieurs de ces leviers</strong>. C&apos;est pour ça
          qu&apos;on ne choisit pas au hasard : on choisit selon le type
          d&apos;imperfection.
        </p>
      </section>

      <section id="actifs" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          2. Les actifs qui marchent vraiment
        </h2>
        <CheckList
          items={[
            <>
              <strong>Acide salicylique (BHA, <em>Salicylic Acid</em>)</strong>{" "}
              : liposoluble, il pénètre dans le pore et le désincruste. La
              référence contre les <Highlight>points noirs et microkystes</Highlight>.
            </>,
            <>
              <strong>Peroxyde de benzoyle</strong> : antibactérien, cible les{" "}
              <Highlight>boutons rouges inflammatoires</Highlight>. Efficace mais
              desséchant, on commence à faible concentration.
            </>,
            <>
              <strong>Niacinamide</strong> (vitamine B3) : régule le sébum,
              resserre l&apos;aspect des pores, apaise les rougeurs. Très bien
              tolérée, elle se glisse dans presque toutes les routines.
            </>,
            <>
              <strong>Zinc (<em>Zinc PCA</em>)</strong> : séborégulateur et
              apaisant, souvent associé à la niacinamide.
            </>,
            <>
              <strong>Acide azélaïque</strong> : le couteau suisse. Il agit sur
              les imperfections, les rougeurs et les marques post-boutons, tout
              en étant <Highlight>doux pour les peaux sensibles</Highlight>.
            </>,
            <>
              <strong>Rétinoïdes</strong> (<em>Retinol</em>, rétinaldéhyde) :
              accélèrent le renouvellement cellulaire et débouchent les pores sur
              le long terme. À introduire progressivement, le soir. À éviter
              pendant la grossesse.
            </>,
          ]}
        />
      </section>

      <section id="eviter" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          3. Ce qu&apos;il vaut mieux éviter
        </h2>
        <WarnList
          items={[
            <>
              <strong>Le sur-nettoyage.</strong> Décaper la peau matin et soir
              avec des produits agressifs stimule le sébum et empire les
              imperfections.
            </>,
            <>
              <strong>Les huiles très comédogènes</strong> (ex.{" "}
              <em>Coconut Oil</em> sur peau grasse) : elles peuvent boucher
              davantage les pores.
            </>,
            <>
              <strong>Empiler tous les actifs d&apos;un coup.</strong> BHA +
              peroxyde de benzoyle + rétinoïde + AHA le même soir, c&apos;est la
              recette de l&apos;irritation. On y va un actif à la fois.
            </>,
            <>
              <strong>Le parfum et les huiles essentielles</strong> sur une peau
              réactive : ce ne sont pas des anti-boutons, et ils peuvent
              déclencher des réactions.
            </>,
          ]}
        />
        <Callout title="Acné modérée à sévère" tone="rose">
          Si les boutons sont nombreux, douloureux, kystiques ou laissent des
          marques, aucun cosmétique ne remplace un{" "}
          <Underline>avis dermatologique</Underline>. Les soins ci-dessus
          accompagnent, ils ne soignent pas une acné médicale.
        </Callout>
      </section>

      <section id="situation" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          4. Selon ta situation
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
              Peau grasse à boutons
            </div>
            <div className="mt-2 text-[16px] font-bold text-ink">
              Gel nettoyant doux + BHA
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
              Un nettoyant sans savon, un sérum à l&apos;acide salicylique ou à
              la niacinamide, une hydratation légère non comédogène. On n&apos;oublie
              jamais l&apos;hydratation, même sur peau grasse.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
              Points noirs / pores visibles
            </div>
            <div className="mt-2 text-[16px] font-bold text-ink">
              BHA en cure régulière
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
              L&apos;acide salicylique 2 à 3 fois par semaine, complété par la
              niacinamide au quotidien. Pas de gommage à grains agressif, qui
              irrite sans déboucher.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
              Peau sensible + imperfections
            </div>
            <div className="mt-2 text-[16px] font-bold text-ink">
              Acide azélaïque + minimalisme
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
              L&apos;azélaïque et la niacinamide plutôt que le peroxyde de
              benzoyle. Formules courtes, sans parfum ni huiles essentielles.{" "}
              <Highlight>Moins d&apos;ingrédients = mieux toléré.</Highlight>
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
              Boutons inflammatoires
            </div>
            <div className="mt-2 text-[16px] font-bold text-ink">
              Traitement localisé ciblé
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
              Peroxyde de benzoyle en local sur le bouton, en commençant à faible
              concentration. On hydrate autour pour limiter le dessèchement.
            </p>
          </div>
        </div>
      </section>

      <section id="compatibilite" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          5. Le «&nbsp;meilleur&nbsp;» produit, c&apos;est celui fait pour TOI
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          Deux personnes avec des «&nbsp;boutons&nbsp;» n&apos;ont souvent pas
          besoin du même produit : peau grasse contre peau sensible, points
          noirs contre boutons inflammatoires, ingrédients à éviter différents.
          C&apos;est pour ça qu&apos;un classement universel «&nbsp;top 10 des
          produits anti-boutons&nbsp;» est trompeur. Ce qui compte, c&apos;est la{" "}
          <Underline>compatibilité entre le produit et ta peau</Underline>.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          C&apos;est exactement ce que fait Cosme Check : tu scannes ou tu
          cherches un produit, et l&apos;app calcule un{" "}
          <strong>score de compatibilité</strong> avec ton profil, vérifie si
          ses promesses tiennent, et signale les ingrédients que tu veux éviter.
        </p>
        <BlogCTA
          title="Vérifie si un produit anti-imperfections est fait pour toi"
          description="Scanne ton produit ou colle sa liste INCI : Cosme Check calcule ta compatibilité, analyse la formule réelle derrière les promesses et repère les ingrédients à éviter selon ton profil."
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
              Actifs qui marchent :{" "}
              <strong>
                BHA, peroxyde de benzoyle, niacinamide, zinc, acide azélaïque,
                rétinoïdes
              </strong>
              .
            </>,
            <>
              On choisit selon le <strong>type d&apos;imperfection</strong>{" "}
              (points noirs, boutons inflammatoires, peau sensible), pas au
              hasard.
            </>,
            <>
              On évite le sur-nettoyage, l&apos;empilement d&apos;actifs forts et
              les huiles comédogènes.
            </>,
            <>
              Acné importante ou douloureuse :{" "}
              <Highlight>direction le dermatologue</Highlight>.
            </>,
            <>
              Le meilleur produit est celui{" "}
              <strong>compatible avec ta peau</strong> : vérifie-le sur Cosme
              Check.
            </>,
          ]}
        />
      </section>
    </BlogArticleShell>
  );
}
