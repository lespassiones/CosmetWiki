import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageArticle } from "@/components/blog/PageArticle";
import { ARTICLES, ARTICLES_RECENTS, articleParSlug } from "@/contenu/articles";

type Params = { params: Promise<{ slug: string }> };

/**
 * Les articles sont connus au build : chacun devient une page statique servie
 * depuis le CDN, sans fonction réveillée. Une adresse inconnue est une 404, et
 * aucune page n'est fabriquée à la demande.
 *
 * Les douze articles écrits à la main avant le 19/10/2026 vivaient chacun dans
 * son dossier (`app/blog/<slug>/page.tsx`) : leurs adresses sont restées les
 * mêmes, elles sont désormais servies par cette route depuis
 * `contenu/articles/`.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const a = articleParSlug(slug);
  if (!a) return {};
  const url = `/blog/${a.slug}`;
  return {
    title: a.titreSeo,
    description: a.resume,
    keywords: [a.theme, ...(a.motsCles ?? [])],
    alternates: {
      canonical: url,
      types: { "application/rss+xml": [{ url: "/blog/flux.xml", title: "Le Journal Cosme Check" }] },
    },
    openGraph: {
      type: "article",
      title: a.titre,
      description: a.resume,
      url,
      locale: "fr_FR",
      publishedTime: a.publieLe,
      modifiedTime: a.modifieLe,
      section: a.categorie,
      images: [{ url: a.couverture.src, width: a.couverture.largeur, height: a.couverture.hauteur, alt: a.couverture.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: a.titre,
      description: a.resume,
      images: [a.couverture.src],
    },
  };
}

export default async function PageArticleBlog({ params }: Params) {
  const { slug } = await params;
  const article = articleParSlug(slug);
  if (!article) notFound();
  return <PageArticle article={article} liste={ARTICLES_RECENTS} />;
}
