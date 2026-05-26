import type { Metadata } from "next";
import { Fragment } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { BlogList } from "./BlogList";
import { ARTICLES } from "./articles";

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

const STATS = [
  { value: "2026", label: "Édition" },
  { value: `${ARTICLES.length}`, label: "Articles" },
  { value: "Hebdo", label: "Mise à jour" },
];

export default function BlogPage() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-bg">
      <BackgroundGlow />
      <PublicHeader />

      <main className="flex-1 pb-20">
        <section className="relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/image/landing/blog.webp"
            alt=""
            aria-hidden
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-b from-white/55 via-white/40 to-white/85"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 -z-10 h-px bg-black/[0.06]"
          />
          <div className="mx-auto max-w-6xl px-5 pb-16 pt-20 text-center sm:px-8 sm:pb-24 sm:pt-24">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-ink drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)] sm:text-5xl lg:text-6xl">
              Le Journal Cosme Check
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-[15px] leading-relaxed text-ink-muted drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)] sm:text-[17px]">
              Décoder les cosmétiques, un article à la fois. Ingrédients,
              marques, routines et réglementation, expliqués clairement.
            </p>
            <div className="mx-auto mt-10 flex w-fit max-w-full flex-nowrap items-center justify-center gap-x-4 rounded-2xl bg-white/55 px-4 py-4 backdrop-blur-sm ring-1 ring-white/60 sm:gap-x-12 sm:px-6">
              {STATS.map((s, i) => (
                <Fragment key={s.label}>
                  {i > 0 && (
                    <span aria-hidden className="h-8 w-px shrink-0 bg-black/10" />
                  )}
                  <div className="text-center">
                    <div className="text-[18px] font-bold tracking-tight text-ink sm:text-[26px]">
                      {s.value}
                    </div>
                    <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-subtle sm:text-[11px]">
                      {s.label}
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto mt-10 w-full max-w-6xl px-5 sm:px-8">
          <BlogList articles={ARTICLES} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
