import Image from "next/image";
import Link from "next/link";

import { BackgroundGlow } from "@/components/BackgroundGlow";
import { PublicHeader } from "@/components/PublicHeader";
import type { Article } from "@/contenu/articles";
import { FOND_CATEGORIE } from "@/contenu/rubriques";
import { ANCRE_FAQ, dateLongue, insecables, petiteImage, sommaire, suggestions } from "@/lib/article";
import { jsonLdArticle } from "@/lib/blogJsonLd";
import { AppelTelecharger } from "./AppelTelecharger";
import { BarreTelechargement, SommaireActif, SuiviLecture } from "./ArticleInteractif";
import { CorpsArticle, Credit } from "./CorpsArticle";
import { TexteRiche } from "./TexteRiche";

/**
 * Les textes des appels. Tutoiement, comme le reste du site ; aucun prix ici
 * (« gratuit » suffit, les prix vivent chez les magasins).
 */
const TEXTES = {
  haut: "Tu veux savoir si un produit est fait pour ta peau ? Scanne-le avec Cosme Check : la réponse tombe en quelques secondes.",
  hautBouton: "Télécharger Cosme Check",
  milieu:
    "Ce que tu viens de lire, Cosme Check le vérifie pour toi sur n'importe quel produit : scanne le code-barres, et l'app te dit, ingrédient par ingrédient, s'il te correspond.",
  milieuBouton: "Scanner mes produits",
  colonneTitre: "Ta salle de bain, décodée",
  colonneTexte: "Scanne un produit, et Cosme Check te dit s'il est fait pour ta peau, ingrédient par ingrédient.",
  colonneBouton: "Télécharger l'app",
  finSurtitre: "Application gratuite",
  finTitre: "Scanne tes produits avec Cosme Check",
  finTexte:
    "La composition de chaque produit, ingrédient par ingrédient, et un verdict qui tient compte de ta peau, de tes objectifs et de ce que tu veux éviter.",
  finBouton: "Télécharger l'app",
  finNote: "iPhone et Android",
  barreTexte: "Ce produit est-il fait pour toi ?",
  barreBouton: "Télécharger",
};

/** Les classes du bouton plein du site, celui du hero et de l'en-tête. */
const BOUTON_ROSE =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#F43F5E] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(244,63,94,0.55)] transition hover:bg-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300";

/**
 * Une page d'article, sur le modèle de MemoryPilot et de RevealChat, dans la
 * charte de Cosme Check (bandeau photo, rose, encre).
 *
 * Trois colonnes à partir de `xl` (1280 px) : le sommaire à gauche, qui suit
 * la lecture ; l'article au centre ; « À lire ensuite » et un appel à
 * télécharger à droite, les deux colonnes collées pendant le défilement. En
 * dessous, une seule colonne : le sommaire se replie en haut de l'article,
 * « À lire ensuite » passe dessous, et une barre de téléchargement se colle au
 * bas de l'écran.
 *
 * ## Les cinq appels à télécharger
 *
 * Tous mènent à `/dl?c=<slug>&m=blog&e=<emplacement>` (`AppelTelecharger`),
 * et chacun se mesure à part (`cta_clic`, `source: '<slug>-<emplacement>'`) :
 *
 * | emplacement | où | pour qui |
 * |---|---|---|
 * | `haut` | avant le premier `h2`, après le chapeau | qui a déjà sa réponse et veut agir |
 * | `milieu` | avant le `h2` du milieu, ou là où l'article pose son bloc `cta` | là où la lecture décroche le plus |
 * | `colonne` | colonne de droite, toujours visible sur ordinateur | qui lit sur grand écran |
 * | `fin` | le bloc sombre après la FAQ | qui a tout lu |
 * | `barre` | collée en bas, sur téléphone et tablette | entre les deux |
 *
 * Le robot SEO lit ces chiffres chaque matin : un emplacement qui ne convertit
 * jamais est une hypothèse à tester, pas un emplacement sacré.
 */
export function PageArticle({ article, liste }: { article: Article; liste: readonly Article[] }) {
  const faq = article.faq ?? [];
  const toc = [
    ...sommaire(article.blocs),
    ...(faq.length ? [{ id: ANCRE_FAQ, texte: "Questions fréquentes" }] : []),
  ].map((e) => ({ id: e.id, texte: insecables(e.texte) }));
  const aLire = suggestions(article, liste, 3);
  const modifie = article.modifieLe !== article.publieLe;

  return (
    <div className="relative isolate flex min-h-screen flex-col scroll-smooth bg-bg">
      <BackgroundGlow />
      <PublicHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdArticle(article)).replace(/</g, "\\u003c").replace(/>/g, "\\u003e"),
        }}
      />

      <main className="flex-1 pb-24">
        <section className="relative h-[420px] w-full overflow-hidden bg-gradient-to-br from-rose-200 via-rose-100 to-amber-100 sm:h-[520px]">
          <Image
            src={article.couverture.src}
            alt=""
            aria-hidden
            fill
            sizes="100vw"
            priority
            className="object-cover"
            // Le cadrage choisi par l'article (`couverture.position`), sinon le centre.
            style={article.couverture.position ? { objectPosition: article.couverture.position } : undefined}
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/75" />

          <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col justify-end px-5 pb-10 pt-24 sm:px-8 sm:pb-14 sm:pt-28 xl:max-w-[88rem] xl:px-10">
            <nav aria-label="Fil d'Ariane" className="text-[13px] text-white/80">
              <Link href="/" className="hover:text-white">
                Accueil
              </Link>
              <span aria-hidden className="mx-2 text-white/50">›</span>
              <Link href="/blog" className="hover:text-white">
                Blog
              </Link>
              <span aria-hidden className="mx-2 text-white/50">›</span>
              <span className="text-white/90">{article.categorie}</span>
            </nav>

            <h1 className="mt-3 max-w-4xl text-balance text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] sm:text-[44px] sm:leading-[1.08]">
              {insecables(article.titre)}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/85 sm:text-[14px]">
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4" />
                <time dateTime={article.publieLe}>{dateLongue(article.publieLe)}</time>
                {modifie && (
                  <>
                    , mis à jour le <time dateTime={article.modifieLe}>{dateLongue(article.modifieLe)}</time>
                  </>
                )}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UserIcon className="h-4 w-4" />
                Cosme Check
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4" />
                {article.minutes} min de lecture
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-white ring-1 ring-white/20 ${FOND_CATEGORIE[article.categorie]}`}
              >
                {article.categorie}
              </span>
            </div>
          </div>
        </section>

        <div className="mx-auto mt-10 grid w-full max-w-3xl gap-10 px-5 sm:px-8 xl:max-w-[88rem] xl:grid-cols-[240px_minmax(0,1fr)_280px] xl:gap-14 xl:px-10">
          {/* Colonne de gauche : le sommaire, collé pendant la lecture. */}
          <aside className="hidden xl:sticky xl:top-24 xl:block xl:self-start">
            <Link
              href="/blog"
              className="mb-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-ink-muted transition hover:bg-black/[0.03] hover:text-rose-600"
            >
              <span aria-hidden>←</span> Retour au blog
            </Link>
            {toc.length > 1 && (
              <nav
                aria-label="Sommaire de l'article"
                className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.04]"
              >
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  <span aria-hidden className="h-px w-4 bg-rose-300" />
                  Dans cet article
                  <span className="ml-auto rounded-md bg-black/[0.05] px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted">
                    {toc.length}
                  </span>
                </p>
                <SommaireActif entrees={toc} />
              </nav>
            )}
          </aside>

          <article className="min-w-0">
            <p className="text-[18px] leading-relaxed text-ink-muted">
              <TexteRiche texte={insecables(article.chapo)} />
            </p>

            {toc.length > 1 && (
              <details className="group mt-6 rounded-2xl bg-white p-4 shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.04] xl:hidden">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-ink-muted">
                  <span aria-hidden className="h-px w-4 bg-rose-300" />
                  Dans cet article ({toc.length})
                  <span aria-hidden className="ml-auto transition group-open:rotate-180">▾</span>
                </summary>
                <ol className="mt-3 flex flex-col gap-1 text-[14px]">
                  {toc.map((e, idx) => (
                    <li key={e.id}>
                      <a href={`#${e.id}`} className="flex gap-2 rounded-lg px-2 py-1.5 text-ink-muted hover:bg-rose-50 hover:text-rose-700">
                        <span className="mt-px shrink-0 text-[11px] font-semibold text-ink-subtle">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="leading-snug">{e.texte}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </details>
            )}

            {/* `data-corps` délimite les titres que suit `SuiviLecture` : seuls
                ceux du texte comptent dans l'entonnoir de lecture. */}
            <div data-corps>
              <CorpsArticle
                blocs={article.blocs}
                appel={(emplacement, texte, bouton) =>
                  emplacement === "haut" ? (
                    <aside className="mt-8 flex flex-col gap-4 rounded-2xl bg-rose-50/70 p-5 ring-1 ring-rose-100 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[15px] leading-relaxed text-ink">{insecables(TEXTES.haut)}</p>
                      <AppelTelecharger slug={article.slug} emplacement="haut" className={`${BOUTON_ROSE} shrink-0`}>
                        {TEXTES.hautBouton}
                      </AppelTelecharger>
                    </aside>
                  ) : (
                    <aside className="mt-10 overflow-hidden rounded-2xl bg-white p-6 shadow-[0_8px_24px_-12px_rgba(17,17,17,0.12)] ring-1 ring-black/[0.05]">
                      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-500">
                        <span aria-hidden className="h-px w-6 bg-rose-300" />
                        Cosme Check
                      </p>
                      <p className="mt-3 text-[16px] leading-relaxed text-ink">
                        <TexteRiche texte={insecables(texte ?? TEXTES.milieu)} />
                      </p>
                      <AppelTelecharger slug={article.slug} emplacement="milieu" className={`${BOUTON_ROSE} mt-5`}>
                        {bouton ?? TEXTES.milieuBouton} <span aria-hidden>→</span>
                      </AppelTelecharger>
                    </aside>
                  )
                }
              />

              {faq.length > 0 && (
                <section aria-labelledby={ANCRE_FAQ} className="mt-14">
                  <h2 id={ANCRE_FAQ} className="scroll-mt-28 text-[24px] font-bold tracking-tight text-ink sm:text-[26px]">
                    Questions fréquentes
                  </h2>
                  <div className="mt-5 divide-y divide-black/[0.06] rounded-2xl bg-white px-5 shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.04] sm:px-6">
                    {faq.map((q) => (
                      <div key={q.question} className="py-5">
                        <h3 className="text-[16.5px] font-semibold leading-snug text-ink">{insecables(q.question)}</h3>
                        <p className="mt-2 text-[15.5px] leading-relaxed text-ink-muted">
                          <TexteRiche texte={insecables(q.reponse)} />
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div id="cta-fin" className="mt-14 overflow-hidden rounded-2xl bg-[#0F172A] p-6 ring-1 ring-black/5 sm:p-8">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-300/90">
                <span aria-hidden className="h-px w-6 bg-rose-300/70" />
                {TEXTES.finSurtitre}
              </p>
              <p className="mt-4 text-[22px] font-bold leading-tight tracking-tight text-white sm:text-[24px]">
                {TEXTES.finTitre}
              </p>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-300">{insecables(TEXTES.finTexte)}</p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <AppelTelecharger
                  slug={article.slug}
                  emplacement="fin"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[14px] font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  {TEXTES.finBouton} <span aria-hidden>→</span>
                </AppelTelecharger>
                <span className="text-[13px] text-slate-400">{TEXTES.finNote}</span>
              </div>
            </div>

            <p className="mt-6 text-[12px] text-ink-subtle">
              Image de couverture : <Credit {...article.couverture} />
            </p>

            <div className="mt-10 border-t border-black/[0.06] pt-8">
              <Link href="/blog" className="inline-flex items-center gap-2 text-[14px] font-semibold text-rose-600 hover:text-rose-700">
                <span aria-hidden>←</span> Tous les articles
              </Link>
            </div>
          </article>

          {/* Colonne de droite : les articles à lire ensuite, puis l'appel. Sous
              `xl` elle passe sous l'article, et l'appel y laisse la place à la
              barre du bas. */}
          <aside aria-label="À lire ensuite" className="xl:sticky xl:top-24 xl:self-start">
            <div className="flex flex-col gap-6">
              {aLire.length > 0 && (
                <section className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.04]">
                  <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    <span aria-hidden className="h-px w-4 bg-rose-300" />
                    À lire ensuite
                  </h2>
                  <ul className="mt-4 grid gap-5 sm:grid-cols-3 xl:grid-cols-1">
                    {aLire.map((a) => (
                      <li key={a.slug}>
                        <Link href={`/blog/${a.slug}`} className="group block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={petiteImage(a.couverture.src)}
                            alt=""
                            width={700}
                            height={Math.round((700 * a.couverture.hauteur) / a.couverture.largeur)}
                            loading="lazy"
                            decoding="async"
                            className="aspect-[16/10] w-full rounded-lg bg-black/[0.04] object-cover transition duration-500 group-hover:scale-[1.02]"
                          />
                          <span className="mt-2 block text-[10.5px] font-semibold uppercase tracking-wider text-ink-subtle">
                            {a.categorie}
                          </span>
                          <span className="mt-1 line-clamp-3 block text-balance text-[13.5px] font-semibold leading-snug text-ink transition group-hover:text-rose-600">
                            {insecables(a.titre)}
                          </span>
                          <span className="mt-1.5 block text-[11.5px] text-ink-subtle">
                            {dateLongue(a.publieLe)} · {a.minutes} min
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="hidden rounded-2xl bg-gradient-to-br from-rose-50 via-white to-amber-50 p-5 ring-1 ring-rose-100 xl:block">
                <p className="text-[16px] font-bold leading-snug tracking-tight text-ink">{TEXTES.colonneTitre}</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">{insecables(TEXTES.colonneTexte)}</p>
                <AppelTelecharger slug={article.slug} emplacement="colonne" className={`${BOUTON_ROSE} mt-4 w-full`}>
                  {TEXTES.colonneBouton}
                </AppelTelecharger>
              </div>

              <Link
                href="/blog"
                className="hidden text-center text-[13px] font-semibold text-rose-600 hover:text-rose-700 xl:block"
              >
                Tous les articles →
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <BarreTelechargement>
        <p className="text-[14px] font-semibold leading-snug text-ink">{insecables(TEXTES.barreTexte)}</p>
        <AppelTelecharger slug={article.slug} emplacement="barre" className={`${BOUTON_ROSE} shrink-0 px-4 py-2`}>
          {TEXTES.barreBouton}
        </AppelTelecharger>
      </BarreTelechargement>

      <SuiviLecture slug={article.slug} />
    </div>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="3" y1="11" x2="21" y2="11" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
