import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { BlogCTA } from "@/components/blog/BlogCTA";
import { SITE_URL } from "@/lib/siteUrl";

const TITLE =
  "SPF 50 visage : les 7 erreurs que tout le monde fait (et comment les éviter)";
const DESCRIPTION =
  "80 % des gens appliquent leur crème solaire de la mauvaise façon. Quantité, filtres, réapplication, hiver, parfum, minéral vs chimique : les 7 erreurs à éviter pour qu'un SPF 50 visage protège vraiment.";
const URL = "/blog/spf-50-visage-7-erreurs";
const PUBLISHED = "2026-04-15";
const HERO_IMAGE = "/image/landing/SPF.webp";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "crème solaire visage",
    "SPF 50",
    "protection solaire quotidienne",
    "SPF peau grasse",
    "crème solaire teintée",
    "heliocare 360",
    "isdin mineral brush SPF 50",
    "crème solaire anti-âge",
    "SPF en hiver",
    "différence SPF minéral chimique",
    "comment appliquer crème solaire visage",
    "crème solaire peau mixte",
    "crème solaire sans blanc",
    "protection solaire UV",
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
  { id: "erreur-1", label: "1. Mettre trop peu de produit" },
  { id: "erreur-2", label: "2. Ne pas remettre dans la journée" },
  { id: "erreur-3", label: "3. Des filtres problématiques" },
  { id: "erreur-4", label: "4. Le maquillage SPF ne suffit pas" },
  { id: "erreur-5", label: "5. Pas de SPF en hiver" },
  { id: "erreur-6", label: "6. Choisir au parfum" },
  { id: "erreur-7", label: "7. Confondre minéral et chimique" },
  { id: "analyser", label: "Analyser avec Cosme Check" },
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

function Solution({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-xl border-l-4 border-rose-400 bg-rose-50/60 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
        La solution
      </div>
      <div className="mt-1 text-[15px] leading-relaxed text-ink">{children}</div>
    </div>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded-sm bg-amber-100/80 px-1 font-medium text-ink">
      {children}
    </mark>
  );
}

export default function SpfArticlePage() {
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
        <section className="relative h-[420px] w-full overflow-hidden bg-gradient-to-br from-rose-200 via-rose-100 to-amber-100 sm:h-[520px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMAGE}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70"
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
              <span className="text-white/90">Routines</span>
            </nav>

            <h1 className="mt-3 max-w-4xl text-balance text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] sm:text-[44px] sm:leading-[1.08]">
              SPF 50 visage : les 7 erreurs que tout le monde fait (et comment
              les éviter)
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/85 sm:text-[14px]">
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4" />
                15 avril 2026
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UserIcon className="h-4 w-4" />
                Cosme Check
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4" />5 min de lecture
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/90 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-white ring-1 ring-white/20">
                Routines
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
                <span aria-hidden className="h-px w-4 bg-rose-300" />
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
                      className="group flex items-start gap-2 rounded-lg px-2 py-1.5 text-ink-muted transition hover:bg-rose-50 hover:text-rose-700"
                    >
                      <span className="mt-px shrink-0 text-[11px] font-semibold text-ink-subtle group-hover:text-rose-500">
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
                <strong className="text-ink">80 % des gens appliquent leur
                crème solaire de la mauvaise façon</strong>, et le SPF devient
                presque inutile. Une seule erreur (dose, moment, filtre) peut
                transformer un SPF 50 en SPF 7. Voici les 7 plus fréquentes,
                et la bonne méthode pour vraiment protéger son visage.
              </p>
            </section>

            <section id="erreur-1" className="mt-12 scroll-mt-28">
              <h2 className="text-[26px] font-bold tracking-tight text-ink">
                Erreur 1 : Mettre trop peu de produit
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink">
                Le SPF est calculé en labo avec <Highlight>2 mg de crème par
                cm² de peau</Highlight>. Soit, pour un visage adulte,{" "}
                <strong>deux longueurs de doigt</strong> (index + majeur) ou
                une <strong>demi-cuillère à café</strong>. La plupart des
                gens en mettent 2 à 3 fois moins.
              </p>
              <CheckList
                items={[
                  <>
                    À moitié dose, le SPF protège{" "}
                    <Highlight>comme un SPF 7</Highlight> (pas 25 : la
                    relation n&apos;est pas linéaire).
                  </>,
                  <>
                    Mesurez votre dose sur les doigts, étalez en deux temps
                    (visage, puis cou + oreilles + racine des cheveux).
                  </>,
                  <>
                    Texture gel ou fluide si la quantité gêne (ex.{" "}
                    <em>Heliocare 360 Water Gel</em>).
                  </>,
                ]}
              />
            </section>

            <section id="erreur-2" className="mt-12 scroll-mt-28">
              <h2 className="text-[26px] font-bold tracking-tight text-ink">
                Erreur 2 : Ne pas remettre en cours de journée
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink">
                Le SPF se dégrade : oxydation UV, transpiration, frottements.
                Après <Highlight>2 heures d&apos;exposition</Highlight>, sa
                protection effective chute fortement, même pour les formules
                tenaces.
              </p>
              <Solution>
                Utilisez un format <strong>poudre, brume ou stick</strong>{" "}
                (par exemple <em>Isdin Mineral Brush SPF 50</em>) qui se
                réapplique par-dessus le maquillage en quelques secondes. Une
                fois à 13 h pour une journée de bureau, deux fois en
                extérieur.
              </Solution>
            </section>

            <section id="erreur-3" className="mt-12 scroll-mt-28">
              <h2 className="text-[26px] font-bold tracking-tight text-ink">
                Erreur 3 : Choisir un SPF aux filtres problématiques
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink">
                Tous les SPF 50 ne se valent pas. Les filtres à surveiller :
              </p>
              <ul className="mt-4 space-y-2.5 text-[15.5px] leading-relaxed text-ink">
                <li className="flex gap-2.5">
                  <span aria-hidden className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-700">!</span>
                  <span>
                    <strong>Oxybenzone (Benzophenone-3)</strong> : suspecté
                    perturbateur endocrinien, interdit à Hawaï pour son
                    impact sur les coraux.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span aria-hidden className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-700">!</span>
                  <span>
                    <strong>Octocrylène</strong> : peut se dégrader en
                    benzophénone (cancérogène possible) avec le temps.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span aria-hidden className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-700">!</span>
                  <span>
                    <strong>Homosalate, Octinoxate</strong> : pénètrent la
                    peau, sous surveillance européenne.
                  </span>
                </li>
              </ul>
              <p className="mt-5 text-[16px] leading-relaxed text-ink">
                À l&apos;inverse, les filtres modernes (
                <strong>Tinosorb S, Mexoryl 400, Uvinul A Plus</strong>) sont
                stables, sûrs et efficaces. Le bon angle n&apos;est pas
                «&nbsp;chimique vs minéral&nbsp;» mais «&nbsp;
                <u className="decoration-rose-400 decoration-2 underline-offset-4">quels
                filtres précis</u>&nbsp;».
              </p>
            </section>

            <section id="erreur-4" className="mt-12 scroll-mt-28">
              <h2 className="text-[26px] font-bold tracking-tight text-ink">
                Erreur 4 : Croire que le maquillage SPF suffit
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink">
                Un fond de teint affiché SPF 30 ne protège que si on en met{" "}
                <Highlight>une demi-cuillère à café sur le visage</Highlight>.
                Personne ne fait ça. En usage réel, la protection effective
                tombe à <strong>SPF 4-5</strong>.
              </p>
              <Solution>
                Le maquillage SPF est un <strong>bonus</strong>, pas la
                couche principale. La routine reste : sérum → crème → SPF 50
                dédié → maquillage par-dessus.
              </Solution>
            </section>

            <ArticleImage
              src="/image/blog/spf-50-erreurs/image1.webp"
              alt="Application d'une crème solaire SPF 50 sur le bout des doigts, illustrant la règle des deux doigts"
            />

            <section id="erreur-5" className="mt-12 scroll-mt-28">
              <h2 className="text-[26px] font-bold tracking-tight text-ink">
                Erreur 5 : Ne pas mettre de SPF en hiver
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink">
                Les <strong>UVA traversent les nuages et les vitres</strong>{" "}
                toute l&apos;année. Ce sont eux qui causent{" "}
                <Highlight>80 % des signes visibles du vieillissement</Highlight>{" "}
                (taches, perte de fermeté, rides), pas l&apos;âge en
                lui-même.
              </p>
              <Solution>
                SPF 30-50 quotidien, <u className="decoration-rose-400 decoration-2 underline-offset-4">365 jours par an</u>. En hiver, une
                texture hydratante ou une crème teintée fait double emploi
                sans alourdir.
              </Solution>
            </section>

            <section id="erreur-6" className="mt-12 scroll-mt-28">
              <h2 className="text-[26px] font-bold tracking-tight text-ink">
                Erreur 6 : Choisir au parfum, pas à la composition
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink">
                Le parfum est l&apos;un des premiers facteurs d&apos;irritation
                et d&apos;allergie cutanée. Certains composants parfumants sont
                aussi <strong>photosensibilisants</strong> : ils provoquent
                des taches ou des rougeurs sous UV, précisément là où vous
                vouliez vous protéger.
              </p>
              <Solution>
                Privilégiez une formule <strong>sans parfum</strong> sur le
                visage (mention «&nbsp;fragrance-free&nbsp;» ou absence de
                «&nbsp;Parfum/Fragrance&nbsp;» dans l&apos;INCI). Gardez les
                parfums solaires pour le corps.
              </Solution>
            </section>

            <section id="erreur-7" className="mt-12 scroll-mt-28">
              <h2 className="text-[26px] font-bold tracking-tight text-ink">
                Erreur 7 : Confondre SPF minéral et chimique
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink">
                Le sujet le plus mal expliqué de la cosmétique solaire. Petit
                récap visuel :
              </p>
              <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-black/[0.06]">
                <table className="w-full text-[14.5px]">
                  <thead className="bg-rose-50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-ink">Type</th>
                      <th className="px-4 py-3 font-semibold text-ink">
                        Mécanisme
                      </th>
                      <th className="px-4 py-3 font-semibold text-ink">
                        Avantage
                      </th>
                      <th className="px-4 py-3 font-semibold text-ink">
                        Limite
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] bg-white">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-ink">
                        Minéral
                      </td>
                      <td className="px-4 py-3 text-ink">
                        Réfléchit les UV
                      </td>
                      <td className="px-4 py-3 text-ink">
                        Bien toléré, grossesse / enfant
                      </td>
                      <td className="px-4 py-3 text-ink">
                        Fini blanc, texture pâteuse
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-ink">
                        Chimique
                      </td>
                      <td className="px-4 py-3 text-ink">
                        Absorbe les UV
                      </td>
                      <td className="px-4 py-3 text-ink">
                        Texture invisible et fluide
                      </td>
                      <td className="px-4 py-3 text-ink">
                        Selon la molécule choisie (cf. erreur 3)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-5 text-[16px] leading-relaxed text-ink">
                Ni l&apos;un ni l&apos;autre n&apos;est intrinsèquement
                meilleur. <strong>Un Tinosorb moderne est aussi sûr</strong>{" "}
                qu&apos;un minéral classique. Ce qui compte : la liste INCI
                et la stabilité de la formule.
              </p>
            </section>

            <ArticleImage
              src="/image/blog/spf-50-erreurs/image2.webp"
              alt="Femme appliquant une protection solaire visage SPF 50, illustration d'une routine quotidienne anti-UV"
            />

            <section id="analyser" className="mt-12 scroll-mt-28">
              <h2 className="text-[26px] font-bold tracking-tight text-ink">
                Analyser sa crème solaire avec Cosme Check
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink">
                Lisez la composition, pas l&apos;allégation. En 10 secondes :
              </p>
              <ol className="mt-4 list-decimal space-y-2.5 pl-6 text-[15.5px] leading-relaxed text-ink">
                <li>
                  <strong>Scannez</strong> le code-barres du tube.
                </li>
                <li>
                  Note couleur <Highlight>vert / jaune / orange / rouge</Highlight>{" "}
                  ingrédient par ingrédient.
                </li>
                <li>
                  Alerte directe sur les filtres controversés (benzophénone,
                  octocrylène, oxybenzone...).
                </li>
                <li>
                  Comparaison avec d&apos;autres SPF 50 plus propres.
                </li>
              </ol>
              <p className="mt-5 text-[16px] leading-relaxed text-ink">
                Deux références qui ressortent bien à l&apos;analyse :{" "}
                <strong>Heliocare 360</strong> (Tinosorb + Mexoryl, sans
                parfum) et <strong>Isdin Mineral Brush SPF 50</strong> (poudre
                pour la retouche).
              </p>

              <BlogCTA
                title="Vérifiez la composition de votre crème solaire"
                description="Connectez-vous à Cosme Check pour obtenir la note ingrédient par ingrédient de votre SPF, identifier les filtres controversés et comparer avec des alternatives plus propres."
              />
            </section>

            <section id="resume" className="mt-12 scroll-mt-28">
              <h2 className="text-[26px] font-bold tracking-tight text-ink">
                En résumé
              </h2>
              <CheckList
                items={[
                  <>
                    <strong>La bonne dose</strong> : deux doigts /
                    demi-cuillère à café.
                  </>,
                  <>
                    <strong>Réappliqué</strong> au moins une fois en journée.
                  </>,
                  <>
                    <strong>Formule propre</strong> : sans filtres
                    controversés, sans parfum sur le visage.
                  </>,
                  <>
                    <strong>Toute l&apos;année</strong>, pas qu&apos;en été
                    ou à la plage.
                  </>,
                  <>
                    <strong>Filtres précis</strong> {">"} catégorie minéral /
                    chimique.
                  </>,
                ]}
              />
              <p className="mt-6 text-[16px] leading-relaxed text-ink">
                La meilleure crème solaire est celle dont vous mettez la
                bonne quantité, tous les jours, et que vous savez lire.
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
