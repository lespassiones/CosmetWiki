import Link from "next/link";
import type { ReactNode } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { SITE_URL } from "@/lib/siteUrl";
import { pickRelatedArticles, type Article } from "@/app/blog/articles";

export type BlogCategory =
  | "Ingrédients"
  | "Routines"
  | "Marques"
  | "Réglementation";

type Theme = {
  heroGradient: string;
  badgeBg: string;
  tocAccent: string;
  tocHoverBg: string;
  tocHoverText: string;
  tocActiveText: string;
};

const CATEGORY_THEME: Record<BlogCategory, Theme> = {
  Ingrédients: {
    heroGradient:
      "bg-gradient-to-br from-indigo-200 via-emerald-50 to-amber-50",
    badgeBg: "bg-emerald-500/90",
    tocAccent: "bg-emerald-400",
    tocHoverBg: "hover:bg-emerald-50",
    tocHoverText: "hover:text-emerald-700",
    tocActiveText: "group-hover:text-emerald-600",
  },
  Routines: {
    heroGradient:
      "bg-gradient-to-br from-rose-200 via-rose-100 to-amber-100",
    badgeBg: "bg-rose-500/90",
    tocAccent: "bg-rose-300",
    tocHoverBg: "hover:bg-rose-50",
    tocHoverText: "hover:text-rose-700",
    tocActiveText: "group-hover:text-rose-500",
  },
  Marques: {
    heroGradient:
      "bg-gradient-to-br from-violet-200 via-violet-50 to-amber-50",
    badgeBg: "bg-violet-500/90",
    tocAccent: "bg-violet-300",
    tocHoverBg: "hover:bg-violet-50",
    tocHoverText: "hover:text-violet-700",
    tocActiveText: "group-hover:text-violet-500",
  },
  Réglementation: {
    heroGradient:
      "bg-gradient-to-br from-amber-200 via-amber-50 to-rose-50",
    badgeBg: "bg-amber-500/90",
    tocAccent: "bg-amber-300",
    tocHoverBg: "hover:bg-amber-50",
    tocHoverText: "hover:text-amber-700",
    tocActiveText: "group-hover:text-amber-500",
  },
};

type Props = {
  title: string;
  description: string;
  url: string;
  published: string;
  heroImage: string;
  category: BlogCategory;
  date: string;
  readingTime: string;
  toc: { id: string; label: string }[];
  children: ReactNode;
};

export function BlogArticleShell({
  title,
  description,
  url,
  published,
  heroImage,
  category,
  date,
  readingTime,
  toc,
  children,
}: Props) {
  const theme = CATEGORY_THEME[category];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${SITE_URL}${url}#article`,
        headline: title,
        description,
        inLanguage: "fr",
        datePublished: published,
        dateModified: published,
        author: { "@type": "Organization", name: "Cosme Check" },
        publisher: {
          "@type": "Organization",
          name: "Cosme Check",
          url: SITE_URL,
        },
        mainEntityOfPage: `${SITE_URL}${url}`,
        image: `${SITE_URL}${heroImage}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: title, item: `${SITE_URL}${url}` },
        ],
      },
    ],
  };

  return (
    <div className="relative isolate flex min-h-screen flex-col scroll-smooth bg-bg">
      <BackgroundGlow />
      <PublicHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 pb-24">
        <section
          className={`relative h-[420px] w-full overflow-hidden sm:h-[520px] ${theme.heroGradient}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/75"
          />

          <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col justify-end px-5 pb-10 pt-32 sm:px-8 sm:pb-14 sm:pt-36">
            <nav className="text-[13px] text-white/80">
              <Link href="/" className="hover:text-white">
                Accueil
              </Link>
              <span className="mx-2 text-white/50">›</span>
              <Link href="/blog" className="hover:text-white">
                Blog
              </Link>
              <span className="mx-2 text-white/50">›</span>
              <span className="text-white/90">{category}</span>
            </nav>

            <h1 className="mt-3 max-w-4xl text-balance text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] sm:text-[44px] sm:leading-[1.08]">
              {title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/85 sm:text-[14px]">
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4" />
                {date}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UserIcon className="h-4 w-4" />
                Cosme Check
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4" />
                {readingTime} de lecture
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-white ring-1 ring-white/20 ${theme.badgeBg}`}
              >
                {category}
              </span>
            </div>
          </div>
        </section>

        <div className="mx-auto mt-10 grid w-full max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-14 xl:max-w-[88rem] xl:grid-cols-[260px_minmax(0,1fr)_260px] xl:gap-20 xl:px-10">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Link
              href="/blog"
              className="mb-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-ink-muted transition hover:bg-black/[0.03] hover:text-rose-600"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Retour au blog
            </Link>

            <nav
              aria-label="Sommaire de l'article"
              className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.04]"
            >
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <span aria-hidden className={`h-px w-4 ${theme.tocAccent}`} />
                Dans cet article
                <span className="ml-auto rounded-md bg-black/[0.05] px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted">
                  {toc.length}
                </span>
              </div>
              <ol className="mt-4 flex flex-col gap-1 text-[13.5px]">
                {toc.map((item, idx) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={`group flex items-start gap-2 rounded-lg px-2 py-1.5 text-ink-muted transition ${theme.tocHoverBg} ${theme.tocHoverText}`}
                    >
                      <span
                        className={`mt-px shrink-0 text-[11px] font-semibold text-ink-subtle ${theme.tocActiveText}`}
                      >
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
            {children}

            <div className="mt-16 border-t border-black/[0.06] pt-8">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-[14px] font-semibold text-rose-600 hover:text-rose-700"
              >
                <span aria-hidden>←</span> Tous les articles
              </Link>
            </div>
          </article>

          <RelatedArticlesSidebar currentSlug={url} category={category} />
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

function ArrowLeftIcon({ className }: { className?: string }) {
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
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

/**
 * Sidebar droite « À lire aussi » — 3 articles recommandés.
 * Visible uniquement à partir du breakpoint xl (sinon stack en bas de page).
 * Priorité aux articles de la même catégorie, complétée par les plus récents
 * des autres catégories.
 */
function RelatedArticlesSidebar({
  currentSlug,
  category,
}: {
  currentSlug: string;
  category: BlogCategory;
}) {
  // `currentSlug` est passé au format `/blog/<id>` — on extrait juste l'id.
  const currentId = currentSlug.replace(/^\/blog\//, "");
  const related = pickRelatedArticles(currentId, category, 3);
  if (related.length === 0) return null;

  return (
    <aside
      aria-label="Articles recommandés"
      className="xl:sticky xl:top-24 xl:self-start"
    >
      <div className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.04]">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          <span aria-hidden className="h-px w-4 bg-rose-300" />
          À lire aussi
        </div>
        <ul className="mt-4 flex flex-col gap-5">
          {related.map((a) => (
            <RelatedArticleItem key={a.id} article={a} />
          ))}
        </ul>
      </div>
    </aside>
  );
}

function RelatedArticleItem({ article }: { article: Article }) {
  return (
    <li>
      <Link href={`/blog/${article.id}`} className="group block">
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-black/[0.04]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.image}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        </div>
        <p className="mt-2 text-[10.5px] font-semibold uppercase tracking-wider text-ink-subtle">
          {article.category}
        </p>
        <h3 className="mt-1 line-clamp-3 text-balance text-[13.5px] font-semibold leading-snug text-ink transition group-hover:text-rose-600">
          {article.title}
        </h3>
        <p className="mt-1.5 text-[11.5px] text-ink-subtle">
          {article.date} · {article.readingTime}
        </p>
      </Link>
    </li>
  );
}
