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

const TITLE = "Comment savoir si un cosmétique est fait pour toi (la méthode)";
const DESCRIPTION =
  "Un produit n'est ni bon ni mauvais dans l'absolu : il est compatible, ou non, avec TA peau, tes objectifs et ce que tu veux éviter. La méthode pour le savoir, et l'erreur des notes universelles.";
const URL = "/blog/cosmetique-fait-pour-toi";
const PUBLISHED = "2026-07-20";
const HERO_IMAGE = "/image/blog/cosmetique-fait-pour-toi/hero.webp";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "produit fait pour ma peau",
    "compatibilité produit cosmétique",
    "quel produit pour ma peau",
    "savoir si un produit me convient",
    "note cosmétique universelle",
    "produit adapté type de peau",
    "choisir un cosmétique",
    "score de compatibilité",
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
  { id: "note-universelle", label: "1. Le piège de la note universelle" },
  { id: "trois-questions", label: "2. Les 3 questions à te poser" },
  { id: "lire-formule", label: "3. Lire une formule pour TOI" },
  { id: "routine", label: "4. Raisonner routine, pas produit isolé" },
  { id: "cosme-check", label: "5. Comment Cosme Check le fait pour toi" },
  { id: "faq", label: "FAQ" },
  { id: "resume", label: "En résumé" },
];

// FAQPage : réponses courtes, extractibles par les moteurs de réponse IA (GEO).
const FAQ: { q: string; a: string }[] = [
  {
    q: "Un produit bien noté est-il forcément bon pour moi ?",
    a: "Non. Une note universelle juge la formule dans l'absolu, la même pour tout le monde. Or un produit peut être excellent pour une peau grasse et inadapté à une peau sensible, ou contenir un ingrédient que tu dois éviter. Ce qui compte, c'est la compatibilité entre le produit et ton profil, pas une note unique.",
  },
  {
    q: "Comment savoir si un produit convient à une peau sensible ?",
    a: "On vérifie trois choses : l'absence d'irritants inutiles (parfum, huiles essentielles, alcool dénaturé en tête de liste), la présence d'apaisants (panthénol, niacinamide, céramides), et une formule plutôt courte. Cosme Check signale automatiquement les ingrédients à risque pour ton profil et calcule ton score de compatibilité.",
  },
  {
    q: "Faut-il un produit différent pour chaque type de peau ?",
    a: "Les besoins diffèrent (texture, actifs, tolérance), donc oui, le même produit ne convient pas à tout le monde. L'idée n'est pas d'avoir plus de produits, mais les bons : ceux compatibles avec ta peau et tes objectifs.",
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

export default function CosmetiqueFaitPourToiArticlePage() {
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
          Un cosmétique n&apos;est pas «&nbsp;bon&nbsp;» ou «&nbsp;mauvais&nbsp;»
          dans l&apos;absolu. Il est <Highlight>compatible ou non avec toi</Highlight>.
          Trois choses décident : <strong>ton profil</strong> (peau, cheveux),{" "}
          <strong>tes objectifs</strong> (ce que tu veux améliorer) et{" "}
          <strong>ce que tu veux éviter</strong> (sensibilités, ingrédients
          bannis). La bonne question n&apos;est jamais «&nbsp;quelle est sa
          note&nbsp;», c&apos;est «&nbsp;<Underline>est-il fait pour moi</Underline>&nbsp;».
        </Callout>
      </section>

      <section id="note-universelle" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          1. Le piège de la note universelle
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          La plupart des applications donnent à un produit{" "}
          <strong>une note unique, la même pour tout le monde</strong>. C&apos;est
          rassurant, mais trompeur : ta peau n&apos;est pas la peau moyenne.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          Une huile riche peut être parfaite pour une peau sèche et boucher les
          pores d&apos;une peau grasse. Une crème notée «&nbsp;très bien&nbsp;»
          peut contenir un parfum qui fait réagir ta peau sensible. Un actif
          peut être idéal pour une peau mature et inutile pour une peau jeune.{" "}
          <Highlight>Le même produit, deux verdicts opposés selon la personne.</Highlight>
        </p>
        <Callout title="À retenir" tone="rose">
          Une note universelle répond à «&nbsp;ce produit est-il bien
          formulé&nbsp;». La vraie question au moment d&apos;acheter, c&apos;est
          «&nbsp;ce produit est-il bien formulé <em>pour moi</em>&nbsp;». Ce
          n&apos;est pas la même réponse.
        </Callout>
      </section>

      <section id="trois-questions" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          2. Les 3 questions à te poser
        </h2>
        <CheckList
          items={[
            <>
              <strong>Quel est mon profil ?</strong> Type de peau (grasse,
              sèche, mixte, sensible, mature) et de cheveux. C&apos;est le socle :
              il décide des textures et des actifs qui te conviennent.
            </>,
            <>
              <strong>Quels sont mes objectifs ?</strong> Hydrater, atténuer les
              imperfections, unifier le teint, anti-âge, apaiser les rougeurs...
              Un produit n&apos;est pertinent que s&apos;il sert{" "}
              <Highlight>ton</Highlight> objectif.
            </>,
            <>
              <strong>Qu&apos;est-ce que je veux éviter ?</strong> Allergènes
              connus, ingrédients que tu ne tolères pas, familles que tu bannis
              (parfum, certains conservateurs...). Un produit qui contient l&apos;un
              d&apos;eux est disqualifié, quelle que soit sa note.
            </>,
          ]}
        />
      </section>

      <section id="lire-formule" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          3. Lire une formule pour TOI
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          Une fois ton profil clair, une liste INCI se lit différemment. Tu ne
          cherches plus «&nbsp;des mauvais ingrédients&nbsp;» en général, mais :
        </p>
        <CheckList
          items={[
            <>
              <strong>Les actifs pertinents pour ton objectif</strong> (ex.
              acide salicylique si tu cibles les imperfections, acide
              hyaluronique si tu cibles l&apos;hydratation).
            </>,
            <>
              <strong>Les irritants pour TA peau</strong> (le parfum n&apos;est
              un problème que s&apos;il te fait réagir).
            </>,
            <>
              <strong>La cohérence promesse / formule</strong> : le produit tient-il
              ce que le marketing annonce, ou l&apos;actif vedette est-il en fin
              de liste, à dose symbolique ?
            </>,
          ]}
        />
        <WarnList
          items={[
            <>
              Ne te fie pas au packaging «&nbsp;naturel&nbsp;» ou
              «&nbsp;hypoallergénique&nbsp;» : ce sont des arguments, pas des
              garanties. <Highlight>La formule dit la vérité.</Highlight>
            </>,
            <>
              Un ingrédient «&nbsp;controversé&nbsp;» en fin de liste, à faible
              dose, ne pèse pas comme le même ingrédient en tête. Le contexte
              compte.
            </>,
          ]}
        />
      </section>

      <section id="routine" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          4. Raisonner routine, pas produit isolé
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          Un produit ne vit pas seul. Ce qui compte, c&apos;est ce que{" "}
          <strong>l&apos;ensemble de ta routine</strong> fait pour tes objectifs.
          Deux questions utiles : mes objectifs sont-ils{" "}
          <Underline>tous couverts</Underline> ? Et quel produit est le{" "}
          <Underline>maillon faible</Underline>, celui qu&apos;il faudrait
          remplacer en priorité ? On progresse plus vite en corrigeant un
          maillon faible qu&apos;en empilant des produits.
        </p>
      </section>

      <section id="cosme-check" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          5. Comment Cosme Check le fait pour toi
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          C&apos;est exactement la raison d&apos;être de Cosme Check : répondre à
          «&nbsp;ce produit est-il fait pour moi&nbsp;», automatiquement.
        </p>
        <CheckList
          items={[
            <>
              <strong>Un score de compatibilité</strong> entre ton profil et la
              formule réelle du produit, avec le détail du calcul et les
              ingrédients qui touchent tes restrictions.
            </>,
            <>
              <strong>Promesses vs formule</strong> : ce que la marque promet
              face à ce que la composition tient vraiment.
            </>,
            <>
              <strong>La comparaison</strong> de deux produits côte à côte, pour
              trancher sans biais commercial.
            </>,
            <>
              <strong>La couverture de tes objectifs</strong> sur toute ta
              routine, pour voir ce qui est bien couvert et ce qui manque.
            </>,
          ]}
        />
        <BlogCTA
          title="Vérifie si un produit est fait pour toi"
          description="Scanne un produit ou colle sa liste INCI : Cosme Check calcule ton score de compatibilité, confronte les promesses à la formule réelle et signale les ingrédients à éviter selon ton profil."
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
              Un produit est <strong>compatible ou non avec toi</strong>, pas
              bon ou mauvais dans l&apos;absolu.
            </>,
            <>
              Trois questions : <strong>ton profil</strong>,{" "}
              <strong>tes objectifs</strong>, <strong>ce que tu évites</strong>.
            </>,
            <>
              Lis la formule pour TOI : actifs utiles à ton objectif, irritants
              pour ta peau, cohérence promesse / formule.
            </>,
            <>
              Raisonne <strong>routine</strong> : objectifs couverts et maillon
              faible à remplacer.
            </>,
            <>
              Cosme Check automatise tout ça avec un{" "}
              <Highlight>score de compatibilité</Highlight> personnalisé.
            </>,
          ]}
        />
      </section>
    </BlogArticleShell>
  );
}
