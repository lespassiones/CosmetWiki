import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { MobileMenu } from "@/components/MobileMenu";

const TITLE = "Comment ça marche";
const DESCRIPTION =
  "Comprendre le système de classification par couleurs (vert, jaune, orange, rouge) utilisé sur CosmetWiki pour classer les ingrédients cosmétiques selon leur tolérance.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/comment-ca-marche" },
  openGraph: {
    title: `${TITLE} · CosmetWiki`,
    description: DESCRIPTION,
    url: "/comment-ca-marche",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} · CosmetWiki`,
    description: DESCRIPTION,
  },
};

const SOURCE_URL = "https://incibeauty.com/blog/396-comment-les-produits-sont-ils-notes";

const RATINGS = [
  {
    label: "Vert",
    title: "Sans risque connu",
    dot: "bg-emerald-500",
    soft: "bg-emerald-50/70",
    desc: "Aucun problème de santé connu et impact environnemental moindre. La plupart des extraits naturels sont en vert tant qu'ils ne sont pas réglementés.",
    pen: "Pas de pénalité",
  },
  {
    label: "Jaune",
    title: "Pénalité légère",
    dot: "bg-amber-400",
    soft: "bg-amber-50/70",
    desc: "Ingrédient réglementé, plutôt irritant ou allergène. Référencé en Annexe III de la réglementation européenne 1223/2009 — souvent avec une limite de concentration imposée par l'Europe.",
    pen: "Pénalité faible",
  },
  {
    label: "Orange",
    title: "Pénalité moyenne",
    dot: "bg-orange-500",
    soft: "bg-orange-50/70",
    desc: "Ingrédient issu de la pétrochimie ou de la chimie lourde, peu écologique du fait de son procédé de fabrication. Impact non négligeable sur l'environnement et possible effet indirect sur la santé.",
    pen: "Pénalité moyenne",
  },
  {
    label: "Rouge",
    title: "Pénalité forte",
    dot: "bg-rose-500",
    soft: "bg-rose-50/70",
    desc: "Ingrédient controversé ou potentiellement à risque. Une controverse suffisamment sérieuse existe autour de cet ingrédient. Les substances interdites en Annexe II de la réglementation cosmétique sont aussi en rouge.",
    pen: "Pénalité forte",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-bg">
      <BackgroundGlow />

      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6">
        <Logo size="md" />
        <nav className="hidden items-center gap-1 text-sm text-ink-muted sm:flex">
          <Link
            href="/comment-ca-marche"
            className="rounded-full bg-white/60 px-3 py-1.5 font-medium text-ink ring-1 ring-white/70 backdrop-blur-md"
          >
            Comment ça marche
          </Link>
          <Link
            href="/about"
            className="rounded-full px-3 py-1.5 transition-colors hover:text-ink"
          >
            À propos
          </Link>
        </nav>
        <MobileMenu />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16">
        <p className="text-[13px] font-medium uppercase tracking-wider text-ink-subtle">
          Comment ça marche
        </p>
        <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Comment les ingrédients sont-ils classifiés&nbsp;?
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
          Chaque ingrédient est identifié par une couleur — du vert au rouge —
          qui résume sa pénalité. Plus la couleur tire sur le rouge, plus
          l&apos;ingrédient est controversé. Plus elle tire sur le vert, moins
          il l&apos;est. Le système évolue en permanence selon les nouvelles
          données scientifiques et réglementaires.
        </p>

        {/* The 4 ratings */}
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {RATINGS.map((r) => (
            <li
              key={r.label}
              className="rounded-2xl bg-white/70 p-5 shadow-[0_2px_24px_-6px_rgba(15,23,42,0.06)] ring-1 ring-white/60 backdrop-blur-xl"
            >
              <div className="flex items-center gap-2.5">
                <span className={`h-3 w-3 rounded-full ${r.dot}`} aria-hidden />
                <span className="text-base font-semibold text-ink">{r.label}</span>
                <span className="text-sm text-ink-subtle">· {r.title}</span>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
                {r.desc}
              </p>
              <p
                className={`mt-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted ${r.soft} ring-1 ring-white/60`}
              >
                {r.pen}
              </p>
            </li>
          ))}
        </ul>

        {/* Notes */}
        <section className="mt-12 space-y-6 text-[15px] leading-relaxed text-ink-muted">
          <h2 className="text-xl font-semibold text-ink">À retenir</h2>
          <ul className="list-disc space-y-2 pl-5 marker:text-ink-subtle">
            <li>
              Un ingrédient peut avoir des pénalités différentes selon son
              contexte d&apos;usage (présence dans un spray, concentration,
              etc.).
            </li>
            <li>
              La classification ne remplace pas un avis médical. En cas de doute
              ou de réaction, consulte un dermatologue.
            </li>
            <li>
              Le système peut évoluer&nbsp;: un ingrédient peut basculer du vert
              au jaune, ou inversement, à mesure que de nouvelles études
              paraissent ou que la réglementation change.
            </li>
            <li>
              Une note 0/20 n&apos;est pas forcément un produit dangereux —
              c&apos;est l&apos;agrégation de pénalités d&apos;ingrédients qui
              ne sont pas tous critiques.
            </li>
          </ul>

          <h2 className="pt-6 text-xl font-semibold text-ink">Aller plus loin</h2>
          <p>
            Les classifications utilisées sur CosmetWiki proviennent
            d&apos;
            <a
              href="https://incibeauty.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-700 hover:underline"
            >
              incibeauty.com
            </a>
            . Pour la méthodologie complète et les nuances entre les sous-niveaux
            (orange éclatée, jaune réglementé, etc.), consulte l&apos;article
            source&nbsp;:
          </p>
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
          >
            Lire l&apos;article complet sur INCI Beauty
            <span aria-hidden>→</span>
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
