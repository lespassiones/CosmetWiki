"use client";

import { useMemo, useState } from "react";

export type Category =
  | "Ingrédients"
  | "Marques"
  | "Routines"
  | "Réglementation";

export type Article = {
  id: string;
  title: string;
  excerpt: string;
  category: Category;
  date: string;
  readingTime: string;
  image: string;
};

const CATEGORY_STYLES: Record<Category, string> = {
  Ingrédients: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Marques: "bg-violet-50 text-violet-700 ring-violet-100",
  Routines: "bg-rose-50 text-rose-700 ring-rose-100",
  Réglementation: "bg-amber-50 text-amber-700 ring-amber-100",
};

const ALL_CATEGORIES: Category[] = [
  "Ingrédients",
  "Marques",
  "Routines",
  "Réglementation",
];

type Filter = "Tous" | Category;
type SortOrder = "recent" | "oldest";

export function BlogList({ articles }: { articles: Article[] }) {
  const [filter, setFilter] = useState<Filter>("Tous");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrder>("recent");

  const counts = useMemo(() => {
    const map: Record<Filter, number> = {
      Tous: articles.length,
      Ingrédients: 0,
      Marques: 0,
      Routines: 0,
      Réglementation: 0,
    };
    for (const a of articles) map[a.category] += 1;
    return map;
  }, [articles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = articles.filter((a) => {
      if (filter !== "Tous" && a.category !== filter) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q)
      );
    });
    // articles already ordered most-recent first in source
    return sort === "recent" ? list : [...list].reverse();
  }, [articles, filter, search, sort]);

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.04]">
          <label className="relative block">
            <span className="sr-only">Rechercher un article</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full rounded-xl bg-black/[0.03] py-2 pl-9 pr-3 text-[14px] text-ink placeholder:text-ink-subtle outline-none ring-1 ring-transparent focus:bg-white focus:ring-rose-200"
            />
          </label>

          <div className="mt-6">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              <span aria-hidden className="h-px w-4 bg-rose-300" />
              Catégories
            </div>
            <ul className="mt-3 flex flex-col gap-1">
              <CategoryRow
                label="Tous les articles"
                count={counts.Tous}
                active={filter === "Tous"}
                onSelect={() => setFilter("Tous")}
              />
              {ALL_CATEGORIES.map((c) => (
                <CategoryRow
                  key={c}
                  label={c}
                  count={counts[c]}
                  active={filter === c}
                  onSelect={() => setFilter(c)}
                />
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              <span aria-hidden className="h-px w-4 bg-rose-300" />
              Suivez-nous
            </div>
            <div className="mt-3 flex items-center gap-2">
              <SocialButton href="#" label="Instagram">
                <InstagramIcon className="h-4 w-4" />
              </SocialButton>
              <SocialButton href="#" label="TikTok">
                <TikTokIcon className="h-4 w-4" />
              </SocialButton>
              <SocialButton href="#" label="LinkedIn">
                <LinkedInIcon className="h-4 w-4" />
              </SocialButton>
              <SocialButton href="#" label="X">
                <XIcon className="h-4 w-4" />
              </SocialButton>
            </div>
          </div>
        </div>
      </aside>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[20px] font-bold tracking-tight text-ink">
            {filter === "Tous" ? "Tous les articles" : filter}{" "}
            <span className="font-medium text-ink-subtle">
              ({filtered.length})
            </span>
          </h2>
          <label className="flex items-center gap-2 text-[13px] text-ink-muted">
            Trier
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOrder)}
              className="rounded-lg bg-white px-2.5 py-1.5 text-[13px] font-medium text-ink ring-1 ring-black/[0.06] outline-none focus:ring-rose-300"
            >
              <option value="recent">Récent</option>
              <option value="oldest">Ancien</option>
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-white p-10 text-center text-[14px] text-ink-muted shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.04]">
            Aucun article ne correspond à votre recherche.
          </div>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CategoryRow({
  label,
  count,
  active,
  onSelect,
}: {
  label: string;
  count: number;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[14px] transition ${
          active
            ? "bg-rose-50 font-semibold text-rose-700"
            : "text-ink hover:bg-black/[0.03]"
        }`}
      >
        <span className="truncate">{label}</span>
        <span
          className={`inline-flex min-w-[24px] items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
            active
              ? "bg-rose-600 text-white"
              : "bg-black/[0.05] text-ink-muted"
          }`}
        >
          {count}
        </span>
      </button>
    </li>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.04] transition hover:shadow-[0_8px_24px_-10px_rgba(17,17,17,0.12)]">
      <div className="relative aspect-[16/10] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.image}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold shadow-sm ring-1 ${CATEGORY_STYLES[article.category]}`}
        >
          {article.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-balance text-[16px] font-bold leading-snug tracking-tight text-ink">
          {article.title}
        </h3>
        <p className="line-clamp-2 text-[13.5px] leading-relaxed text-ink-muted">
          {article.excerpt}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2 text-[12px] text-ink-subtle">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <CalendarIcon className="h-3.5 w-3.5" />
              {article.date}
            </span>
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" />
              {article.readingTime}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#F43F5E]">
            Lire <span aria-hidden>→</span>
          </span>
        </div>
      </div>
    </article>
  );
}

function SocialButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-black/[0.04] text-ink-muted transition hover:bg-rose-50 hover:text-rose-600"
    >
      {children}
    </a>
  );
}

function SearchIcon({ className }: { className?: string }) {
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
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
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

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.5 3a5 5 0 0 0 4 4v3a8 8 0 0 1-4-1.1V15a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3V3h3z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8h4.56v14H.22V8zm7.5 0h4.37v1.92h.06c.61-1.15 2.1-2.36 4.33-2.36 4.63 0 5.49 3.05 5.49 7v7.44h-4.56v-6.6c0-1.57-.03-3.59-2.19-3.59-2.19 0-2.53 1.71-2.53 3.48V22H7.72V8z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2H21l-6.52 7.45L22 22h-6.79l-4.74-6.2L4.8 22H2.04l6.97-7.96L2 2h6.91l4.29 5.67L18.244 2zm-2.38 18h1.88L7.22 4H5.27l10.6 16z" />
    </svg>
  );
}
