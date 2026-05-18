import type { Metadata } from "next";
import { Fragment } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { BlogList, type Article } from "./BlogList";

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

const ARTICLES: Article[] = [
  {
    id: "routine-skincare-2026",
    title: "Qu'est-ce qu'une bonne routine skincare en 2026 ?",
    excerpt:
      "Comprendre les étapes essentielles et les bons gestes pour une peau saine. On fait le point sur ce qui compte vraiment (et ce qui est optionnel).",
    category: "Routines",
    date: "12 mai 2026",
    readingTime: "6 min",
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "acide-hyaluronique",
    title: "Acide hyaluronique : bienfaits et idées reçues",
    excerpt:
      "Hydratant star ou simple effet de mode ? On démêle le vrai du faux sur cet actif devenu incontournable.",
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
      "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=900&q=80",
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
            src="/image/landing/blog.png"
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
          <div className="mx-auto max-w-6xl px-5 pb-16 pt-28 text-center sm:px-8 sm:pb-24 sm:pt-36">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-ink drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)] sm:text-5xl lg:text-6xl">
              Le Journal Cosme Check
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-[15px] leading-relaxed text-ink-muted drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)] sm:text-[17px]">
              Décoder les cosmétiques, un article à la fois. Ingrédients,
              marques, routines et réglementation, expliqués clairement.
            </p>
            <div className="mx-auto mt-10 flex w-fit max-w-full flex-wrap items-center justify-center gap-x-8 gap-y-4 rounded-2xl bg-white/55 px-6 py-4 backdrop-blur-sm ring-1 ring-white/60 sm:gap-x-12">
              {STATS.map((s, i) => (
                <Fragment key={s.label}>
                  {i > 0 && (
                    <span aria-hidden className="h-8 w-px bg-black/10" />
                  )}
                  <div className="text-center">
                    <div className="text-[22px] font-bold tracking-tight text-ink sm:text-[26px]">
                      {s.value}
                    </div>
                    <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
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
