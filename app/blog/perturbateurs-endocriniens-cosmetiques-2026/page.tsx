import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { BlogCTA } from "@/components/blog/BlogCTA";
import { SITE_URL } from "@/lib/siteUrl";

const TITLE =
  "Perturbateurs endocriniens dans les cosmétiques : ce qu'il faut vraiment surveiller en 2026";
const DESCRIPTION =
  "Les perturbateurs endocriniens font peur, souvent pour de bonnes raisons. Définition claire, substances vraiment documentées, cadre légal européen et populations à risque : le guide factuel et rassurant pour s'y retrouver sans psychose.";
const URL = "/blog/perturbateurs-endocriniens-cosmetiques-2026";
const PUBLISHED = "2026-05-16";
const HERO_IMAGE = "/image/blog/perturbateurs-endocriniens/hero.webp";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "perturbateur endocrinien cosmétique",
    "perturbateur endocrinien",
    "cosmétique sans perturbateur endocrinien",
    "parabène perturbateur endocrinien",
    "benzophénone cosmétique perturbateur",
    "liste perturbateurs endocriniens cosmétiques",
    "perturbateur endocrinien INCI",
    "REACH cosmétique perturbateur",
    "réglementation européenne perturbateur endocrinien",
    "cosmétique bébé perturbateur endocrinien",
    "perturbateur endocrinien grossesse cosmétique",
    "perturbateur endocrinien hormone",
    "ingrédient xénoestrogène",
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

const TOC: { id: string; label: string }[] = [
  { id: "introduction", label: "Introduction" },
  { id: "definition", label: "1. C'est quoi un perturbateur ?" },
  { id: "pourquoi-cosmetique", label: "2. Pourquoi la cosmétique compte" },
  { id: "substances", label: "3. Les substances à surveiller" },
  { id: "reglementation", label: "4. La réglementation européenne" },
  { id: "populations", label: "5. Les populations prioritaires" },
  { id: "identifier", label: "6. Identifier en 3 étapes" },
  { id: "resume", label: "En résumé" },
];

function buildArticleJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${SITE_URL}${URL}#article`,
        headline: TITLE,
        description: DESCRIPTION,
        inLanguage: "fr",
        datePublished: PUBLISHED,
        dateModified: PUBLISHED,
        author: { "@type": "Organization", name: "Cosme Check" },
        publisher: {
          "@type": "Organization",
          name: "Cosme Check",
          url: SITE_URL,
        },
        mainEntityOfPage: `${SITE_URL}${URL}`,
        image: `${SITE_URL}${HERO_IMAGE}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: TITLE, item: `${SITE_URL}${URL}` },
        ],
      },
    ],
  };
}

function ArticleImage({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="my-10">
      <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl bg-black/[0.04] ring-1 ring-black/[0.04]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      {caption ? (
        <figcaption className="mt-3 text-center text-[13px] italic text-ink-subtle">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

type EvidenceLevel = "proved" | "suspected" | "uncertain";

const EVIDENCE_STYLES: Record<EvidenceLevel, string> = {
  proved: "bg-rose-50 text-rose-700 ring-rose-100",
  suspected: "bg-orange-50 text-orange-700 ring-orange-100",
  uncertain: "bg-amber-50 text-amber-700 ring-amber-100",
};

const EVIDENCE_LABEL: Record<EvidenceLevel, string> = {
  proved: "Effet prouvé",
  suspected: "Effet suspecté",
  uncertain: "Données incertaines",
};

function SubstanceCard({
  name,
  inci,
  level,
  status,
  whatItDoes,
}: {
  name: string;
  inci: string;
  level: EvidenceLevel;
  status: string;
  whatItDoes: string;
}) {
  return (
    <div className="mt-6 rounded-2xl bg-white p-5 shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.04] sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="flex-1 text-[18px] font-bold tracking-tight text-ink">
          {name}
        </h3>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ${EVIDENCE_STYLES[level]}`}
        >
          {EVIDENCE_LABEL[level]}
        </span>
      </div>
      <dl className="mt-3 space-y-2.5 text-[14.5px] leading-relaxed text-ink">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
            Nom INCI
          </dt>
          <dd className="mt-0.5 font-mono text-[13.5px] text-ink">{inci}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
            Effet documenté
          </dt>
          <dd className="mt-0.5">{whatItDoes}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
            Statut EU
          </dt>
          <dd className="mt-0.5 font-medium text-ink">{status}</dd>
        </div>
      </dl>
    </div>
  );
}

function CheckList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mt-4 space-y-2.5 text-[15.5px] leading-relaxed text-ink">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span
            aria-hidden
            className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[12px] font-bold text-emerald-700"
          >
            ✓
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded-sm bg-amber-100/80 px-1 font-medium text-ink">
      {children}
    </mark>
  );
}

function Callout({
  title,
  tone = "emerald",
  children,
}: {
  title: string;
  tone?: "emerald" | "rose" | "indigo";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "rose"
      ? "border-rose-400 bg-rose-50/60 text-rose-700"
      : tone === "indigo"
      ? "border-indigo-400 bg-indigo-50/60 text-indigo-700"
      : "border-emerald-400 bg-emerald-50/60 text-emerald-700";
  return (
    <div className={`mt-5 rounded-xl border-l-4 p-4 ${toneClass}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider">
        {title}
      </div>
      <div className="mt-1 text-[15px] leading-relaxed text-ink">
        {children}
      </div>
    </div>
  );
}

export default function PerturbateursArticlePage() {
  const jsonLd = buildArticleJsonLd();

  return (
    <div className="relative isolate flex min-h-screen flex-col scroll-smooth bg-bg">
      <BackgroundGlow />
      <PublicHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 pb-24">
        <section className="relative h-[420px] w-full overflow-hidden bg-gradient-to-br from-indigo-200 via-emerald-50 to-amber-50 sm:h-[520px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMAGE}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/75"
          />

          <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col justify-end px-5 pb-10 pt-24 sm:px-8 sm:pb-14 sm:pt-28">
            <nav className="text-[13px] text-white/80">
              <Link href="/" className="hover:text-white">
                Accueil
              </Link>
              <span className="mx-2 text-white/50">›</span>
              <Link href="/blog" className="hover:text-white">
                Blog
              </Link>
              <span className="mx-2 text-white/50">›</span>
              <span className="text-white/90">Ingrédients</span>
            </nav>

            <h1 className="mt-3 max-w-4xl text-balance text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] sm:text-[44px] sm:leading-[1.08]">
              Perturbateurs endocriniens dans les cosmétiques : ce
              qu&apos;il faut vraiment surveiller en 2026
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/85 sm:text-[14px]">
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4" />
                16 mai 2026
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UserIcon className="h-4 w-4" />
                Cosme Check
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4" />
                7 min de lecture
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/90 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-white ring-1 ring-white/20">
                Ingrédients
              </span>
            </div>
          </div>
        </section>

        <div className="mx-auto mt-10 grid w-full max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav
              aria-label="Sommaire de l'article"
              className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.04]"
            >
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <span aria-hidden className="h-px w-4 bg-emerald-400" />
                Dans cet article
                <span className="ml-auto rounded-md bg-black/[0.05] px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted">
                  {TOC.length}
                </span>
              </div>
              <ol className="mt-4 flex flex-col gap-1 text-[13.5px]">
                {TOC.map((item, idx) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="group flex items-start gap-2 rounded-lg px-2 py-1.5 text-ink-muted transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <span className="mt-px shrink-0 text-[11px] font-semibold text-ink-subtle group-hover:text-emerald-600">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="leading-snug">{item.label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="min-w-0">
            <section id="introduction" className="scroll-mt-28">
              <p className="text-[17px] leading-relaxed text-ink-muted">
                Les perturbateurs endocriniens font peur, parfois pour de
                bonnes raisons. Mais toutes les molécules pointées du doigt{" "}
                <u className="decoration-emerald-400 decoration-2 underline-offset-4">
                  n&apos;ont pas le même niveau de preuve
                </u>
                , et l&apos;Europe en a déjà interdit{" "}
                <Highlight>plus de 1 700</Highlight>. Voici ce qu&apos;il
                faut vraiment surveiller en 2026, sans psychose et sans
                angle mort.
              </p>
            </section>

            <section id="definition" className="mt-12 scroll-mt-28">
              <h2 className="text-[26px] font-bold tracking-tight text-ink">
                1. C&apos;est quoi, un perturbateur endocrinien ?
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink">
                Une substance qui <strong>interfère avec le système
                hormonal</strong>. Trois grands mécanismes :
              </p>
              <CheckList
                items={[
                  <>
                    <strong>Mimétisme</strong> : la molécule imite une
                    hormone et active ses récepteurs à sa place (ex.
                    xénoestrogènes qui imitent les œstrogènes).
                  </>,
                  <>
                    <strong>Blocage</strong> : elle occupe le récepteur
                    sans l&apos;activer.{" "}
                    <em>La fausse clé qui bouche la serrure</em> pour la
                    vraie clé.
                  </>,
                  <>
                    <strong>Perturbation de synthèse</strong> : production,
                    transport ou élimination des hormones modifiés.
                  </>,
                ]}
              />
              <Callout title="À retenir" tone="indigo">
                Pour une reconnaissance{" "}
                <strong>officielle</strong> par l&apos;EFSA et l&apos;ECHA,
                <Highlight> 3 critères cumulatifs</Highlight> sont exigés :
                mode d&apos;action, effet néfaste, lien de cause à effet.
                Cette définition stricte explique pourquoi beaucoup de
                molécules restent au statut «&nbsp;suspectées&nbsp;».
              </Callout>
            </section>

            <section id="pourquoi-cosmetique" className="mt-12 scroll-mt-28">
              <h2 className="text-[26px] font-bold tracking-tight text-ink">
                2. Pourquoi la cosmétique compte
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink">
                L&apos;alimentation reste la voie principale d&apos;exposition.
                Mais la cosmétique est <strong>secondaire mais durable</strong>
                {" "}: répétée, quotidienne, et facile à maîtriser.
              </p>
              <CheckList
                items={[
                  <>
                    Une femme adulte utilise en moyenne{" "}
                    <Highlight>12 produits par jour</Highlight>, soit plus
                    de 100 substances différentes.
                  </>,
                  <>
                    Certaines molécules <strong>pénètrent la peau</strong>{" "}
                    et se retrouvent dans le sang et l&apos;urine.
                  </>,
                  <>
                    L&apos;<strong>effet cocktail</strong> : l&apos;évaluation
                    se fait molécule par molécule, mais l&apos;exposition
                    réelle est multi-substances.
                  </>,
                  <>
                    Plusieurs voies d&apos;entrée : peau, muqueuses,
                    inhalation (sprays, parfums).
                  </>,
                ]}
              />
            </section>

            <ArticleImage
              src="/image/blog/perturbateurs-endocriniens/image1.webp"
              alt="Femme appliquant sa routine de soins du visage, illustrant l'exposition quotidienne et répétée aux ingrédients cosmétiques"
            />

            <section id="substances" className="mt-12 scroll-mt-28">
              <h2 className="text-[26px] font-bold tracking-tight text-ink">
                3. Les substances à surveiller
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink">
                Les molécules les plus citées, classées par{" "}
                <strong>niveau de preuve</strong>. Cette classification
                reflète le consensus actuel de l&apos;ANSES, l&apos;EFSA et
                l&apos;ECHA.
              </p>

              <h3 className="mt-8 text-[18px] font-bold tracking-tight text-rose-700">
                Niveau 1 : effet prouvé
              </h3>

              <SubstanceCard
                name="Parabènes à longue chaîne"
                inci="Butylparaben, Propylparaben, Isobutylparaben, Isopropylparaben"
                level="proved"
                whatItDoes="Activité œstrogénique démontrée in vitro et in vivo. Les parabènes courte chaîne (Methylparaben, Ethylparaben) sont considérés plus sûrs."
                status="Max 0,14 % en EU (somme des esters) depuis 2015. Interdits dans les produits sans rinçage pour enfants de moins de 3 ans."
              />

              <SubstanceCard
                name="Triclosan"
                inci="Triclosan"
                level="proved"
                whatItDoes="Antibactérien. Perturbation thyroïdienne chez l'animal, soupçon d'antibiorésistance."
                status="Interdit dans la majorité des cosmétiques EU depuis 2014. Autorisé uniquement en dentifrice à 0,3 % max."
              />

              <h3 className="mt-10 text-[18px] font-bold tracking-tight text-orange-700">
                Niveau 2 : effet suspecté
              </h3>

              <SubstanceCard
                name="Benzophénone-3 (Oxybenzone)"
                inci="Benzophenone-3, Oxybenzone, BP-3"
                level="suspected"
                whatItDoes="Filtre UV chimique. Activité œstrogénique chez l'animal, retrouvée dans le sang/urine après application cutanée."
                status="Max 6 % en filtre solaire EU. Interdite à Hawaï pour impact sur les coraux."
              />

              <SubstanceCard
                name="Octocrylène"
                inci="Octocrylene"
                level="suspected"
                whatItDoes="Filtre UV répandu. Peut se dégrader en benzophénone (cancérogène possible) avec le temps et la chaleur."
                status="Autorisé jusqu'à 10 % en EU. Éviter les produits anciens."
              />

              <SubstanceCard
                name="Siloxanes cycliques (D4, D5)"
                inci="Cyclotetrasiloxane (D4), Cyclopentasiloxane (D5)"
                level="suspected"
                whatItDoes="Silicones utilisés pour la texture (toucher poudré). Suspectés perturbateurs chez l'animal, bioaccumulation environnementale."
                status="D4 restreint à 0,1 % dans les produits rincés en EU depuis 2020. D5 sous surveillance."
              />

              <h3 className="mt-10 text-[18px] font-bold tracking-tight text-amber-700">
                Niveau 3 : données incertaines
              </h3>

              <SubstanceCard
                name="Phtalates"
                inci="DEHP, DBP, BBP (interdits), DEP (autorisé)"
                level="uncertain"
                whatItDoes="Activité anti-androgénique chez l'animal. Le DEP reste autorisé et peut se cacher derrière «Fragrance/Parfum» dans l'INCI."
                status="Phtalates lourds interdits depuis 2009 en EU. Vigilance sur le DEP : préférer les produits sans parfum."
              />

              <SubstanceCard
                name="Bisphénols (BPA, BPS)"
                inci="Pas dans la formule, mais migration possible depuis l'emballage"
                level="uncertain"
                whatItDoes="Activité œstrogénique documentée. Voie d'exposition mineure vs alimentation."
                status="BPA interdit dans les biberons EU depuis 2011, dans les contenants alimentaires depuis 2024. Préférer le verre ou les plastiques «BPA-free»."
              />

              <Callout title="Le bon réflexe" tone="emerald">
                La <strong>grande majorité</strong> des substances
                dangereuses connues sont{" "}
                <Highlight>déjà interdites ou strictement encadrées</Highlight>{" "}
                en Europe. L&apos;attention se concentre désormais sur les
                substances en cours de réévaluation et l&apos;effet cocktail.
              </Callout>
            </section>

            <section id="reglementation" className="mt-12 scroll-mt-28">
              <h2 className="text-[26px] font-bold tracking-tight text-ink">
                4. La réglementation européenne
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink">
                Le règlement <strong>1223/2009</strong> est l&apos;un des
                plus protecteurs au monde. Il fonctionne par annexes :
              </p>
              <CheckList
                items={[
                  <>
                    <strong>Annexe II</strong> : 1 700+ substances
                    interdites.
                  </>,
                  <>
                    <strong>Annexe III</strong> : substances réglementées
                    (dose max, conditions d&apos;usage).
                  </>,
                  <>
                    <strong>Annexes V & VI</strong> : conservateurs et
                    filtres UV autorisés (listes positives, tout le reste
                    est interdit).
                  </>,
                ]}
              />
              <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-black/[0.06]">
                <table className="w-full text-[14.5px]">
                  <thead className="bg-emerald-50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-ink">
                        Marché
                      </th>
                      <th className="px-4 py-3 font-semibold text-ink">
                        Substances interdites en cosmétique
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] bg-white">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-ink">
                        Union européenne
                      </td>
                      <td className="px-4 py-3 text-ink">
                        <Highlight>1 700+</Highlight>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-ink">
                        États-Unis (FDA)
                      </td>
                      <td className="px-4 py-3 text-ink">~11</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-5 text-[16px] leading-relaxed text-ink">
                Depuis <strong>2023</strong>, la Commission accélère la
                réévaluation des filtres UV anciens et de plusieurs
                conservateurs. Cosme Check s&apos;appuie sur cette base et
                l&apos;actualise au fil des décisions.
              </p>
            </section>

            <section id="populations" className="mt-12 scroll-mt-28">
              <h2 className="text-[26px] font-bold tracking-tight text-ink">
                5. Les populations prioritaires
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink">
                Pour ces trois populations, la <strong>règle du
                minimum</strong> (moins de produits, plus simples, sans
                parfum) est plus pertinente que pour la population générale.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
                    Priorité 1
                  </div>
                  <div className="mt-2 text-[16px] font-bold text-ink">
                    Femmes enceintes
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
                    Le placenta n&apos;est pas une barrière imperméable.
                    Fenêtres de vulnérabilité fœtale précises
                    (organogenèse, neuro).
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
                    Priorité 2
                  </div>
                  <div className="mt-2 text-[16px] font-bold text-ink">
                    Nourrissons (0-3 ans)
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
                    Peau plus perméable, foie immature, rapport surface /
                    poids élevé. C&apos;est pourquoi les produits
                    «&nbsp;bébé&nbsp;» ont un cahier des charges plus
                    strict.
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
                    Priorité 3
                  </div>
                  <div className="mt-2 text-[16px] font-bold text-ink">
                    Ados en puberté
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
                    Système hormonal en pleine recomposition. Éviter les
                    déodorants et parfums chargés, limiter le maquillage
                    quotidien.
                  </p>
                </div>
              </div>
            </section>

            <ArticleImage
              src="/image/blog/perturbateurs-endocriniens/image2.webp"
              alt="Femme enceinte examinant la composition d'un produit cosmétique, illustration de la vigilance pendant la grossesse"
            />

            <section id="identifier" className="mt-12 scroll-mt-28">
              <h2 className="text-[26px] font-bold tracking-tight text-ink">
                6. Identifier ces substances en 3 étapes
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink">
                Pas besoin d&apos;être chimiste. Trois réflexes simples
                couvrent <Highlight>80 % des produits problématiques</Highlight>.
              </p>
              <ol className="mt-5 space-y-4 text-[15.5px] leading-relaxed text-ink">
                <li className="flex gap-3">
                  <span
                    aria-hidden
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[14px] font-bold text-emerald-700"
                  >
                    1
                  </span>
                  <div>
                    <strong>Préférer les listes INCI courtes</strong>{" "}
                    (10-20 ingrédients {">"} 40 ingrédients).
                  </div>
                </li>
                <li className="flex gap-3">
                  <span
                    aria-hidden
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[14px] font-bold text-emerald-700"
                  >
                    2
                  </span>
                  <div>
                    <strong>Repérer les noms-clés</strong> :{" "}
                    <span className="font-mono text-[13.5px]">
                      Butylparaben, Propylparaben, Benzophenone-3,
                      Oxybenzone, Triclosan, Fragrance / Parfum,
                      Cyclopentasiloxane, Octocrylene, Homosalate
                    </span>
                    .
                  </div>
                </li>
                <li className="flex gap-3">
                  <span
                    aria-hidden
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[14px] font-bold text-emerald-700"
                  >
                    3
                  </span>
                  <div>
                    <strong>Scanner avec Cosme Check</strong> : note
                    couleur ingrédient par ingrédient, alerte directe sur
                    les perturbateurs suspectés / prouvés, alternatives
                    proposées en 10 secondes.
                  </div>
                </li>
              </ol>

              <BlogCTA
                title="Vérifiez vos produits du quotidien"
                description="Scannez la crème, le déodorant ou la protection solaire que vous utilisez tous les jours. Cosme Check identifie les perturbateurs endocriniens suspectés ou prouvés selon la réglementation européenne et l'ANSES."
              />
            </section>

            <section id="resume" className="mt-12 scroll-mt-28">
              <h2 className="text-[26px] font-bold tracking-tight text-ink">
                En résumé
              </h2>
              <CheckList
                items={[
                  <>
                    Reconnaissance officielle :{" "}
                    <strong>3 critères cumulatifs</strong> (mode
                    d&apos;action, effet, lien).
                  </>,
                  <>
                    Cosmétique : <Highlight>12 produits/jour</Highlight>,
                    voie secondaire mais durable.
                  </>,
                  <>
                    <strong>Prouvés</strong> : parabènes longue chaîne,
                    triclosan.
                  </>,
                  <>
                    <strong>Suspectés</strong> : benzophénone-3,
                    octocrylène, D4 / D5.
                  </>,
                  <>
                    <strong>Incertains</strong> : phtalates (parfum),
                    bisphénols (emballage).
                  </>,
                  <>
                    EU = <strong>1 700+ interdites</strong> vs ~11 aux USA.
                  </>,
                  <>
                    Vigilance prio : <strong>enceintes, 0-3 ans, ados</strong>.
                  </>,
                  <>
                    Méthode : listes courtes, mots-clés, et Cosme Check.
                  </>,
                ]}
              />
              <p className="mt-6 text-[16px] leading-relaxed text-ink">
                L&apos;objectif n&apos;est pas la peur, c&apos;est la{" "}
                <u className="decoration-emerald-400 decoration-2 underline-offset-4">
                  vigilance ciblée
                </u>
                . Lire l&apos;INCI (ou laisser Cosme Check le faire) suffit
                à garder un temps d&apos;avance sans entrer en panique.
              </p>
            </section>

            <div className="mt-16 border-t border-black/[0.06] pt-8">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-[14px] font-semibold text-rose-600 hover:text-rose-700"
              >
                <span aria-hidden>←</span> Tous les articles
              </Link>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="3" y1="11" x2="21" y2="11" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
