"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ARTICLES, type Article } from "@/app/blog/articles";
import { FadeInSection } from "@/components/FadeInSection";

const SHOWN = ARTICLES.slice(0, 6);

const CATEGORY_STYLES: Record<string, string> = {
  Ingrédients: "bg-emerald-100 text-emerald-700",
  Routines: "bg-rose-100 text-rose-600",
  Marques: "bg-purple-100 text-purple-700",
  Réglementation: "bg-sky-100 text-sky-700",
};

function ArticleCard({ article }: { article: Article }) {
  const catStyle =
    CATEGORY_STYLES[article.category] ?? "bg-gray-100 text-gray-600";
  return (
    <Link
      href={`/blog/${article.id}`}
      className="group flex snap-start flex-col min-w-[calc(100%-1.5rem)] sm:min-w-[calc(50%-0.5rem)] lg:min-w-[calc(33.333%-0.75rem)] rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-50">
        <Image
          src={article.image}
          alt={article.title}
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 90vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span
          className={`inline-block self-start rounded-full px-3 py-0.5 text-[11px] font-semibold ${catStyle}`}
        >
          {article.category}
        </span>

        <h3 className="mt-3 line-clamp-2 text-[15px] font-bold leading-snug text-ink transition-colors group-hover:text-[#F43F5E]">
          {article.title}
        </h3>

        <p className="mt-2 line-clamp-3 flex-1 text-[13px] leading-relaxed text-ink-muted">
          {article.excerpt}
        </p>

        <div className="mt-4 flex items-center gap-2 text-[12px] text-ink-muted/70">
          <span>{article.date}</span>
          <span aria-hidden>·</span>
          <span>{article.readingTime} de lecture</span>
        </div>
      </div>
    </Link>
  );
}

export function LandingArticles() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateButtons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    updateButtons();
  }, [updateButtons]);

  const scroll = useCallback((dir: "prev" | "next") => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const cardWidth = card ? card.offsetWidth + 16 : el.clientWidth;
    el.scrollBy({
      left: dir === "next" ? cardWidth : -cardWidth,
      behavior: "smooth",
    });
  }, []);

  return (
    <section
      aria-labelledby="articles-heading"
      className="relative w-full bg-white py-16 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1280px] px-6 sm:px-8">
        <FadeInSection>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="articles-heading"
                className="text-[28px] font-bold leading-[1.15] tracking-tight text-ink sm:text-[34px] lg:text-[40px]"
              >
                Le Journal{" "}
                <span className="text-[#F43F5E]">Cosme Check</span>
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
                Décoder les cosmétiques, un article à la fois.
              </p>
            </div>

            <Link
              href="/blog"
              className="hidden shrink-0 sm:inline-flex items-center gap-1.5 rounded-full border border-[#F43F5E]/60 px-5 py-2 text-[13px] font-semibold text-[#F43F5E] transition hover:bg-[#F43F5E]/5 active:scale-[0.97]"
            >
              Voir tous les articles →
            </Link>
          </div>
        </FadeInSection>

        {/* Carousel */}
        <div className="relative mt-8 lg:mt-10">
          <button
            onClick={() => scroll("prev")}
            disabled={!canPrev}
            aria-label="Articles précédents"
            className="absolute -left-3 top-[45%] z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition disabled:opacity-0 hover:shadow-[0_4px_16px_rgba(0,0,0,0.16)] lg:-left-5"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-ink" aria-hidden>
              <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
            </svg>
          </button>

          <div
            ref={trackRef}
            onScroll={updateButtons}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {SHOWN.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          <button
            onClick={() => scroll("next")}
            disabled={!canNext}
            aria-label="Articles suivants"
            className="absolute -right-3 top-[45%] z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition disabled:opacity-0 hover:shadow-[0_4px_16px_rgba(0,0,0,0.16)] lg:-right-5"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-ink" aria-hidden>
              <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
            </svg>
          </button>
        </div>

        {/* CTA mobile */}
        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#F43F5E] to-[#E11D48] px-6 py-2.5 text-[14px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(244,63,94,0.5),inset_0_1px_0_rgba(255,255,255,0.30)] transition hover:brightness-110 active:scale-[0.98]"
          >
            Voir tous les articles →
          </Link>
        </div>
      </div>
    </section>
  );
}
