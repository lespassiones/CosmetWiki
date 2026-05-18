import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { IngredientList } from "@/components/glossary/IngredientList";
import {
  CATEGORIES,
  fetchIngredientsByTag,
  getCategoryBySlug,
} from "@/lib/glossary";
import { SITE_URL } from "@/lib/siteUrl";

// 7 jours — la composition d'une catégorie (silicones, parabens...) ne
// bouge que lors d'ajouts en base, événement rare.
export const revalidate = 604800;

type Props = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat) {
    return { title: "Catégorie inconnue", robots: { index: false, follow: true } };
  }
  const title = `${cat.title} : la liste complète`;
  const description = `${cat.description.slice(0, 200)}${cat.description.length > 200 ? "…" : ""}`;
  return {
    title,
    description,
    keywords: [
      cat.shortLabel.toLowerCase(),
      `liste ${cat.shortLabel.toLowerCase()}`,
      `${cat.shortLabel.toLowerCase()} cosmétiques`,
      `${cat.shortLabel.toLowerCase()} INCI`,
      "ingrédients cosmétiques",
    ],
    alternates: { canonical: `/ingredients/${cat.slug}` },
    openGraph: {
      title: `${title} · Cosme Check`,
      description,
      url: `/ingredients/${cat.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · Cosme Check`,
      description,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat) notFound();

  const items = await fetchIngredientsByTag(cat.tag);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/ingredients/${cat.slug}#collection`,
        name: cat.title,
        description: cat.description,
        url: `${SITE_URL}/ingredients/${cat.slug}`,
        inLanguage: "fr",
        numberOfItems: items.length,
        isPartOf: { "@id": `${SITE_URL}/glossaire#collection` },
        about: { "@type": "Thing", name: cat.title },
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
            name: cat.title,
            item: `${SITE_URL}/ingredients/${cat.slug}`,
          },
        ],
      },
    ],
  };

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
          <span className="text-ink">{cat.shortLabel}</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#F43F5E]">
            Catégorie · {items.length.toLocaleString("fr-FR")} ingrédient
            {items.length > 1 ? "s" : ""}
          </p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            {cat.title}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-muted sm:text-[16px]">
            {cat.intro}
          </p>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
            {cat.description}
          </p>
        </header>

        <section className="mt-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
            Tous les ingrédients de cette catégorie
          </p>
          <IngredientList items={items} />
        </section>

        {/* Autres catégories */}
        <section className="mt-16 border-t border-black/[0.08] pt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
            Explorer d&apos;autres catégories
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c.slug !== cat.slug).map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/ingredients/${c.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink ring-1 ring-black/[0.06] hover:ring-rose-200 hover:text-[#F43F5E]"
                >
                  {c.shortLabel}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
}
