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
  "Sérums visage : vitamine C, acide hyaluronique, peptides, lequel choisir ?";
const DESCRIPTION =
  "Trois actifs stars, trois usages très différents. Le guide simple pour choisir son sérum visage selon son besoin (éclat, hydratation, anti-âge) et les combiner sans erreur.";
const URL = "/blog/serums-visage-guide";
const PUBLISHED = "2026-05-18";
const HERO_IMAGE = "/image/blog/serums/hero.webp";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "sérum visage",
    "sérum vitamine C",
    "sérum acide hyaluronique",
    "sérum peptides",
    "sérum anti-âge",
    "meilleur sérum visage",
    "comment choisir un sérum",
    "sérum éclat",
    "sérum hydratant",
    "ordre routine skincare sérum",
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
  { id: "pourquoi", label: "1. Pourquoi un sérum ?" },
  { id: "vitamine-c", label: "2. Vitamine C : éclat" },
  { id: "acide-hyaluronique", label: "3. Acide hyaluronique : hydratation" },
  { id: "peptides", label: "4. Peptides : anti-âge" },
  { id: "combiner", label: "5. Comment les combiner" },
  { id: "resume", label: "En résumé" },
];

export default function SerumsArticlePage() {
  return (
    <BlogArticleShell
      title={TITLE}
      description={DESCRIPTION}
      url={URL}
      published={PUBLISHED}
      heroImage={HERO_IMAGE}
      category="Ingrédients"
      date="18 mai 2026"
      readingTime="5 min"
      toc={TOC}
    >
      <section id="introduction" className="scroll-mt-28">
        <p className="text-[17px] leading-relaxed text-ink-muted">
          Trois actifs dominent les rayons sérums : la{" "}
          <strong className="text-ink">vitamine C</strong>, l&apos;
          <strong className="text-ink">acide hyaluronique</strong> et les{" "}
          <strong className="text-ink">peptides</strong>. Ils ne font{" "}
          <Underline>pas la même chose</Underline> et ne se mettent pas
          tous au même moment. Voici comment choisir et les combiner sans
          fausser ses effets.
        </p>
      </section>

      <section id="pourquoi" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          1. Pourquoi un sérum ?
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          Un sérum est une <strong>formule très concentrée en actifs</strong>{" "}
          (souvent 3 à 10 fois plus qu&apos;une crème), à la texture fluide
          qui pénètre vite. Il vient <Highlight>avant la crème</Highlight>{" "}
          pour cibler un besoin précis : éclat, hydratation, rides...
        </p>
        <Callout title="Le bon réflexe" tone="emerald">
          Un seul sérum bien choisi vaut mieux que trois mal combinés. On
          identifie son besoin n°1, puis on choisit l&apos;actif adapté.
        </Callout>
      </section>

      <section id="vitamine-c" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          2. Vitamine C : pour l&apos;éclat et les taches
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          L&apos;antioxydant le plus étudié en cosmétique. Il neutralise les
          radicaux libres causés par les UV et la pollution, et inhibe la
          production de mélanine responsable des taches.
        </p>
        <CheckList
          items={[
            <>
              <strong>Pour qui :</strong> teint terne, taches pigmentaires,
              prévention anti-âge.
            </>,
            <>
              <strong>Quand :</strong>{" "}
              <Highlight>le matin</Highlight>, sous le SPF (effet synergique
              avec la protection UV).
            </>,
            <>
              <strong>Concentration efficace :</strong> 10 à 20 % d&apos;
              <em>L-ascorbic acid</em>, ou des dérivés stables (
              <em>Ascorbyl Glucoside, MAP, THD-ascorbate</em>) si peau
              sensible.
            </>,
            <>
              <strong>Conservation :</strong> garder loin de la lumière,
              jeter si la formule vire au jaune-orange foncé.
            </>,
          ]}
        />
      </section>

      <section id="acide-hyaluronique" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          3. Acide hyaluronique : pour l&apos;hydratation
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          Naturellement présent dans la peau, l&apos;acide hyaluronique
          retient <Highlight>jusqu&apos;à 1 000 fois son poids en eau</Highlight>.
          Il regonfle la peau visiblement en quelques semaines.
        </p>
        <CheckList
          items={[
            <>
              <strong>Pour qui :</strong> toutes les peaux, surtout
              déshydratées, tiraillements, ridules de déshydratation.
            </>,
            <>
              <strong>Quand :</strong> matin et / ou soir, sur peau
              légèrement humide pour booster l&apos;hydratation.
            </>,
            <>
              <strong>À chercher dans l&apos;INCI :</strong>{" "}
              <em>Sodium Hyaluronate</em> (la forme la mieux absorbée), ou
              des combinaisons de petites et grandes molécules.
            </>,
          ]}
        />
        <Callout title="Astuce" tone="emerald">
          Si vous vivez dans un climat très sec, scellez votre sérum à
          l&apos;acide hyaluronique avec une crème grasse par-dessus.
          Sinon, il peut puiser l&apos;eau{" "}
          <strong>de la peau elle-même</strong>.
        </Callout>
      </section>

      <section id="peptides" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          4. Peptides : pour l&apos;anti-âge
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          Les peptides sont de <strong>petits fragments de protéines</strong>{" "}
          qui envoient à la peau un signal de réparation : produire plus de
          collagène, raffermir, lisser. C&apos;est l&apos;alternative douce
          au rétinol.
        </p>
        <CheckList
          items={[
            <>
              <strong>Pour qui :</strong> premières rides, perte de
              fermeté, peaux qui ne tolèrent pas le rétinol.
            </>,
            <>
              <strong>Quand :</strong>{" "}
              <Highlight>le soir</Highlight>, après nettoyage. Compatible
              avec presque tout.
            </>,
            <>
              <strong>Mots-clés INCI :</strong>{" "}
              <em>Palmitoyl Tripeptide-1, Acetyl Hexapeptide-8 (Argireline),
              Copper Tripeptide-1, Matrixyl 3000</em>.
            </>,
            <>
              <strong>Patience :</strong> 6 à 12 semaines pour voir un
              effet visible, contre 2 à 4 pour la vitamine C.
            </>,
          ]}
        />
      </section>

      <ArticleImage
        src="/image/blog/serums/image1.webp"
        alt="Application d'un sérum visage avec pipette en verre, illustration d'une routine skincare"
      />

      <section id="combiner" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          5. Comment les combiner sans se planter
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">
          La règle simple, validée par la majorité des dermatologues :
        </p>
        <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-black/[0.06]">
          <table className="w-full text-[14.5px]">
            <thead className="bg-emerald-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-ink">Moment</th>
                <th className="px-4 py-3 font-semibold text-ink">Sérum</th>
                <th className="px-4 py-3 font-semibold text-ink">Pourquoi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] bg-white">
              <tr>
                <td className="px-4 py-3 font-semibold text-ink">Matin</td>
                <td className="px-4 py-3 text-ink">Vitamine C</td>
                <td className="px-4 py-3 text-ink">
                  Antioxydant qui prépare aux UV
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-ink">
                  Matin ou soir
                </td>
                <td className="px-4 py-3 text-ink">Acide hyaluronique</td>
                <td className="px-4 py-3 text-ink">
                  Hydratation compatible avec tout
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-ink">Soir</td>
                <td className="px-4 py-3 text-ink">Peptides</td>
                <td className="px-4 py-3 text-ink">
                  Réparation pendant le sommeil
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <WarnList
          items={[
            <>
              <strong>Vitamine C + niacinamide :</strong> compatible en
              formules modernes, mais éviter de superposer deux sérums
              forts. Choisissez l&apos;un, pas les deux.
            </>,
            <>
              <strong>Vitamine C + rétinol :</strong> jamais en même
              temps. Vitamine C le matin, rétinol le soir.
            </>,
            <>
              <strong>Peptides + acides exfoliants (AHA, BHA) :</strong>{" "}
              les acides peuvent dégrader certains peptides. Alternez les
              soirs.
            </>,
          ]}
        />

        <BlogCTA
          title="Analysez la composition de votre sérum"
          description="Cosme Check vous donne la note ingrédient par ingrédient de votre sérum, signale les actifs efficaces et les ingrédients à surveiller."
        />
      </section>

      <section id="resume" className="mt-12 scroll-mt-28">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">
          En résumé
        </h2>
        <CheckList
          items={[
            <>
              <strong>Vitamine C</strong> = éclat et taches.{" "}
              <Highlight>Le matin</Highlight>, sous SPF.
            </>,
            <>
              <strong>Acide hyaluronique</strong> = hydratation. Matin ou
              soir, sur peau humide.
            </>,
            <>
              <strong>Peptides</strong> = anti-âge doux.{" "}
              <Highlight>Le soir</Highlight>, après nettoyage.
            </>,
            <>
              Un seul sérum bien choisi {">"} trois mal combinés.
            </>,
            <>
              Patience : 4 à 12 semaines pour un résultat visible.
            </>,
          ]}
        />
      </section>
    </BlogArticleShell>
  );
}
