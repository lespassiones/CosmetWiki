import type { Metadata } from "next";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";

const TITLE = "Blog";
const DESCRIPTION =
  "Le journal Cosme Check : décoder les cosmétiques, un article à la fois. Ingrédients, marques, routines, réglementation.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    title: `${TITLE} · Cosme Check`,
    description: DESCRIPTION,
    url: "/blog",
    type: "website",
  },
};

type Category = "Ingrédients" | "Marques" | "Routines" | "Réglementation";

type Article = {
  id: string;
  title: string;
  excerpt: string;
  category: Category;
  date: string;
  readingTime: string;
  image: string;
};

const FEATURED: Article = {
  id: "routine-skincare-2026",
  title: "Qu'est-ce qu'une bonne routine skincare en 2026 ?",
  excerpt:
    "Comprendre les étapes essentielles et les bons gestes pour une peau saine. On fait le point sur ce qui compte vraiment (et ce qui est optionnel).",
  category: "Routines",
  date: "12 mai 2026",
  readingTime: "6 min de lecture",
  image:
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80",
};

const ARTICLES: Article[] = [
  {
    id: "acide-hyaluronique",
    title: "Acide hyaluronique : bienfaits et idées reçues",
    excerpt: "Hydratant star ou simple effet de mode ?",
    category: "Ingrédients",
    date: "5 mai 2026",
    readingTime: "4 min",
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "marques-clean",
    title: "Typology, Minimalist, The Ordinary : que valent-ils ?",
    excerpt: "Comparatif de 3 marques cultes et transparentes.",
    category: "Marques",
    date: "28 avril 2026",
    readingTime: "7 min",
    image:
      "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "double-nettoyage",
    title: "Double nettoyage : est-ce toujours nécessaire ?",
    excerpt: "À qui s'adresse cette étape et quand l'adopter.",
    category: "Routines",
    date: "21 avril 2026",
    readingTime: "5 min",
    image:
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=80",
  },
];

const CATEGORIES: { label: string; value: Category | "Tous" }[] = [
  { label: "Tous", value: "Tous" },
  { label: "Ingrédients", value: "Ingrédients" },
  { label: "Marques", value: "Marques" },
  { label: "Routines", value: "Routines" },
  { label: "Réglementation", value: "Réglementation" },
];

const CATEGORY_STYLES: Record<Category, string> = {
  Ingrédients: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Marques: "bg-violet-50 text-violet-700 ring-violet-100",
  Routines: "bg-rose-50 text-rose-700 ring-rose-100",
  Réglementation: "bg-amber-50 text-amber-700 ring-amber-100",
};

export default function BlogPage() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-bg">
      <BackgroundGlow />
      <PublicHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-28 sm:px-8 sm:pt-32">
        <header className="text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Le Journal Cosme Check
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ink-muted sm:text-[16px]">
            Décoder les cosmétiques, un article à la fois.
          </p>
        </header>

        <nav
          aria-label="Catégories"
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          {CATEGORIES.map((c, i) => (
            <span
              key={c.value}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-medium ring-1 transition ${
                i === 0
                  ? "bg-rose-50 text-rose-700 ring-rose-100"
                  : "bg-white text-ink ring-black/[0.05]"
              }`}
            >
              <CategoryIcon value={c.value} className="h-4 w-4" />
              {c.label}
            </span>
          ))}
        </nav>

        <section className="mt-10">
          <FeaturedCard article={FEATURED} />
        </section>

        <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FeaturedCard({ article }: { article: Article }) {
  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_32px_-12px_rgba(17,17,17,0.10)] ring-1 ring-black/[0.04]">
      <div className="grid md:grid-cols-2">
        <div className="relative aspect-[4/3] md:aspect-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.image}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:p-10">
          <CategoryBadge category={article.category} />
          <h2 className="text-balance text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {article.title}
          </h2>
          <p className="text-[15px] leading-relaxed text-ink-muted">
            {article.excerpt}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[13px] text-ink-subtle">
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              {article.date}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="h-3.5 w-3.5" />
              {article.readingTime}
            </span>
          </div>
          <div className="mt-2">
            <span className="inline-flex cursor-default items-center gap-1.5 text-[14px] font-semibold text-[#F43F5E]">
              Lire l&apos;article <span aria-hidden>→</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.04]">
      <div className="aspect-[4/3]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.image}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col gap-3 p-5">
        <CategoryBadge category={article.category} />
        <h3 className="text-balance text-[17px] font-bold leading-tight tracking-tight text-ink">
          {article.title}
        </h3>
        <p className="text-[14px] leading-relaxed text-ink-muted">
          {article.excerpt}
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-subtle">
          <CalendarIcon className="h-3.5 w-3.5" />
          {article.date}
        </div>
      </div>
    </article>
  );
}

function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${CATEGORY_STYLES[category]}`}
    >
      <CategoryIcon value={category} className="h-3 w-3" />
      {category}
    </span>
  );
}

function CategoryIcon({
  value,
  className,
}: {
  value: Category | "Tous";
  className?: string;
}) {
  switch (value) {
    case "Tous":
      return <GridIcon className={className} />;
    case "Ingrédients":
      return <LeafIcon className={`${className ?? ""} text-emerald-600`} />;
    case "Marques":
      return <TagIcon className={`${className ?? ""} text-violet-600`} />;
    case "Routines":
      return <SparkleIcon className={`${className ?? ""} text-rose-600`} />;
    case "Réglementation":
      return <ScalesIcon className={`${className ?? ""} text-amber-600`} />;
  }
}

function GridIcon({ className }: { className?: string }) {
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
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function LeafIcon({ className }: { className?: string }) {
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
      <path d="M5 21c0-9 7-16 16-16 0 9-7 16-16 16z" />
      <path d="M5 21c2-5 6-9 11-11" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
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
      <path d="M20.6 13.4l-7.2 7.2a1.7 1.7 0 0 1-2.4 0L3 13V3h10l7.6 7.6a1.7 1.7 0 0 1 0 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
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
      <path d="M12 3l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3z" />
    </svg>
  );
}

function ScalesIcon({ className }: { className?: string }) {
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
      <path d="M12 3v18" />
      <path d="M6 21h12" />
      <path d="M5 7h14" />
      <path d="M7 7l-3 7a3 3 0 0 0 6 0L7 7z" />
      <path d="M17 7l-3 7a3 3 0 0 0 6 0L17 7z" />
    </svg>
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
