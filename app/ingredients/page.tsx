import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { SearchTrigger } from "@/components/SearchTrigger";
import { MobileMenu } from "@/components/MobileMenu";
import { LETTERS, OTHER_KEY, slugsByLetter } from "./data";
import { INDEX_INGREDIENTS } from "@/lib/seoConfig";

export const metadata: Metadata = {
  title: "Ingrédients cosmétiques INCI de A à Z : danger, note et utilité",
  description:
    "Index des 15 700+ ingrédients cosmétiques (INCI) analysés par Cosme Check : niveau de tolérance (vert, jaune, orange, rouge), fonctions, réglementation européenne. Cherchez un ingrédient par lettre.",
  alternates: { canonical: "/ingredients" },
  // Hub ingrédient noindex : le site se positionne sur la compatibilité, pas
  // sur l'annuaire INCI (cf. lib/seoConfig.ts).
  robots: { index: INDEX_INGREDIENTS, follow: true },
};

export default async function IngredientsHubPage() {
  const byLetter = await slugsByLetter();
  const total = [...byLetter.values()].reduce((n, arr) => n + arr.length, 0);
  const groups = [...LETTERS, OTHER_KEY].filter((l) => byLetter.has(l));

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-bg">
      <BackgroundGlow />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Logo size="md" />
        <div className="flex items-center gap-2">
          <Link
            href="/comment-ca-marche"
            className="hidden rounded-full px-3 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink sm:inline"
          >
            Comment ça marche
          </Link>
          <SearchTrigger />
          <MobileMenu />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-[40px] sm:leading-tight">
          Ingrédients cosmétiques de A à Z
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-ink-muted">
          {total.toLocaleString("fr-FR")} ingrédients INCI analysés selon des
          sources scientifiques publiques (ECHA, SCCS, CIR, règlement européen
          CE 1223/2009). Chaque fiche indique le niveau de tolérance de
          l&apos;ingrédient (vert, jaune, orange, rouge), ses fonctions et son
          statut réglementaire.{" "}
          <Link
            href="/comment-ca-marche"
            className="font-medium text-violet-700 hover:text-violet-900"
          >
            Comprendre la méthodologie.
          </Link>
        </p>

        <nav aria-label="Ingrédients par lettre" className="mt-10">
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
            {groups.map((letter) => {
              const count = byLetter.get(letter)?.length ?? 0;
              return (
                <li key={letter}>
                  <Link
                    href={`/ingredients/${letter}`}
                    className="flex flex-col items-center rounded-2xl bg-white/70 px-4 py-5 shadow-[0_2px_24px_-6px_rgba(15,23,42,0.06)] ring-1 ring-white/70 backdrop-blur-xl transition-transform hover:-translate-y-0.5"
                  >
                    <span className="text-2xl font-semibold uppercase text-ink">
                      {letter}
                    </span>
                    <span className="mt-1 text-xs text-ink-subtle">
                      {count.toLocaleString("fr-FR")} fiches
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <nav
          aria-label="Fil d'ariane"
          className="mt-10 flex items-center gap-1.5 text-[12px] text-ink-subtle"
        >
          <Link href="/" className="hover:text-ink">
            Accueil
          </Link>
          <span aria-hidden>›</span>
          <span className="text-ink">Ingrédients</span>
        </nav>
      </main>

      <Footer />
    </div>
  );
}
