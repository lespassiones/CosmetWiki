import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { IngredientList } from "@/components/glossary/IngredientList";
import {
  GLOSSARY_LETTERS,
  fetchIngredientsByLetter,
  isValidLetter,
  letterLabel,
} from "@/lib/glossary";
import { SITE_URL } from "@/lib/siteUrl";

// 7 jours — la liste des ingrédients par lettre ne change quasiment jamais.
export const revalidate = 604800;

type Props = {
  params: Promise<{ lettre: string }>;
};

/**
 * Pré-rend les 27 pages de lettre au build. Chaque page est ISR avec
 * `revalidate = 86400` (24 h) — si la base évolue, la page se met à jour
 * sans rebuild complet.
 */
export function generateStaticParams() {
  return GLOSSARY_LETTERS.map((letter) => ({ lettre: letter.toLowerCase() }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lettre } = await params;
  const normalised = lettre.toUpperCase();
  if (!isValidLetter(normalised)) {
    return { title: "Lettre inconnue", robots: { index: false, follow: true } };
  }
  const label = letterLabel(normalised);
  const title = `Ingrédients commençant par ${label}`;
  const description = `Liste complète des ingrédients cosmétiques commençant par ${label}, avec leur classification couleur (vert, jaune, orange, rouge) selon les sources scientifiques et réglementaires européennes.`;
  return {
    title,
    description,
    alternates: { canonical: `/glossaire/${lettre.toLowerCase()}` },
    openGraph: {
      title: `${title} · Cosme Check`,
      description,
      url: `/glossaire/${lettre.toLowerCase()}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · Cosme Check`,
      description,
    },
  };
}

export default async function GlossaryLetterPage({ params }: Props) {
  const { lettre } = await params;
  const normalised = lettre.toUpperCase();
  if (!isValidLetter(normalised)) notFound();

  const items = await fetchIngredientsByLetter(normalised);
  const label = letterLabel(normalised);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/glossaire/${lettre.toLowerCase()}#collection`,
        name: `Ingrédients commençant par ${label}`,
        url: `${SITE_URL}/glossaire/${lettre.toLowerCase()}`,
        inLanguage: "fr",
        numberOfItems: items.length,
        isPartOf: { "@id": `${SITE_URL}/glossaire#collection` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Glossaire",
            item: `${SITE_URL}/glossaire`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: label,
            item: `${SITE_URL}/glossaire/${lettre.toLowerCase()}`,
          },
        ],
      },
    ],
  };

  // Lettres voisines pour la navigation prev / next.
  const currentIdx = GLOSSARY_LETTERS.indexOf(normalised);
  const prevLetter = currentIdx > 0 ? GLOSSARY_LETTERS[currentIdx - 1] : null;
  const nextLetter =
    currentIdx < GLOSSARY_LETTERS.length - 1
      ? GLOSSARY_LETTERS[currentIdx + 1]
      : null;

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e"),
        }}
      />
      <BackgroundGlow />
      <PublicHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-28 sm:px-8 sm:pt-32">
        {/* Breadcrumb */}
        <nav
          aria-label="Fil d'ariane"
          className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-subtle"
        >
          <Link href="/" className="hover:text-ink">
            Accueil
          </Link>
          <span aria-hidden>›</span>
          <Link href="/glossaire" className="hover:text-ink">
            Glossaire
          </Link>
          <span aria-hidden>›</span>
          <span className="text-ink">{label}</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-[44px] font-semibold leading-none text-[#F43F5E] sm:text-[56px]">
              {label}
            </span>
            <span className="h-px w-12 bg-rose-300" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F43F5E]">
              {items.length.toLocaleString("fr-FR")} ingrédient
              {items.length > 1 ? "s" : ""}
            </p>
          </div>
          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Ingrédients commençant par {label}
          </h1>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-ink-muted">
            Tous les ingrédients cosmétiques INCI commençant par {label},
            classés par ordre alphabétique. La pastille colorée indique le
            niveau de pénalité de chaque substance selon notre méthode.
          </p>
        </header>

        <div className="mt-10">
          <IngredientList items={items} />
        </div>

        {/* Navigation lettre précédente / suivante + retour index */}
        <nav
          aria-label="Navigation alphabétique"
          className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.08] pt-8"
        >
          {prevLetter ? (
            <Link
              href={`/glossaire/${prevLetter.toLowerCase()}`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13.5px] font-medium text-ink ring-1 ring-black/[0.06] hover:ring-rose-200 hover:text-[#F43F5E]"
            >
              <span aria-hidden>←</span> {letterLabel(prevLetter)}
            </Link>
          ) : (
            <span />
          )}

          <Link
            href="/glossaire"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#F43F5E] hover:underline"
          >
            Retour au glossaire
          </Link>

          {nextLetter ? (
            <Link
              href={`/glossaire/${nextLetter.toLowerCase()}`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13.5px] font-medium text-ink ring-1 ring-black/[0.06] hover:ring-rose-200 hover:text-[#F43F5E]"
            >
              {letterLabel(nextLetter)} <span aria-hidden>→</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </main>

      <Footer />
    </div>
  );
}
