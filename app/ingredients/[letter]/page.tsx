import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { SearchTrigger } from "@/components/SearchTrigger";
import { MobileMenu } from "@/components/MobileMenu";
import {
  LETTERS,
  OTHER_KEY,
  PAGE_SIZE,
  displayName,
  slugsByLetter,
} from "../data";

type Props = {
  params: Promise<{ letter: string }>;
  searchParams?: Promise<{ page?: string }>;
};

function isValidLetter(letter: string): boolean {
  return LETTERS.includes(letter) || letter === OTHER_KEY;
}

function parsePage(raw: string | undefined): number {
  const n = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { letter } = await params;
  if (!isValidLetter(letter)) return { title: "Page introuvable" };
  const page = parsePage((await searchParams)?.page);
  const label = letter === OTHER_KEY ? "0-9" : letter.toUpperCase();
  const pageSuffix = page > 1 ? ` (page ${page})` : "";
  return {
    title: `Ingrédients INCI commençant par ${label}${pageSuffix}`,
    description: `Liste des ingrédients cosmétiques INCI commençant par ${label} : niveau de tolérance, fonctions et fiche détaillée pour chaque ingrédient.`,
    alternates: {
      canonical:
        page > 1
          ? `/ingredients/${letter}?page=${page}`
          : `/ingredients/${letter}`,
    },
  };
}

export default async function IngredientsLetterPage({
  params,
  searchParams,
}: Props) {
  const { letter } = await params;
  if (!isValidLetter(letter)) notFound();

  const page = parsePage((await searchParams)?.page);
  const byLetter = await slugsByLetter();
  const slugs = byLetter.get(letter) ?? [];
  if (slugs.length === 0) notFound();

  const pageCount = Math.ceil(slugs.length / PAGE_SIZE);
  if (page > pageCount) notFound();

  const start = (page - 1) * PAGE_SIZE;
  const visible = slugs.slice(start, start + PAGE_SIZE);
  const label = letter === OTHER_KEY ? "0-9" : letter.toUpperCase();

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
          Ingrédients INCI : {label}
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-ink-muted">
          {slugs.length.toLocaleString("fr-FR")} ingrédients cosmétiques
          commençant par {label}. Ouvrez une fiche pour connaître le niveau de
          tolérance, les fonctions et le statut réglementaire de
          l&apos;ingrédient.
        </p>

        <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((slug) => (
            <li key={slug}>
              <Link
                href={`/i/${slug}`}
                className="text-[14px] leading-relaxed text-ink-muted transition-colors hover:text-violet-700"
              >
                {displayName(slug)}
              </Link>
            </li>
          ))}
        </ul>

        {pageCount > 1 ? (
          <nav
            aria-label="Pagination"
            className="mt-10 flex items-center gap-3 text-sm"
          >
            {page > 1 ? (
              <Link
                href={
                  page === 2
                    ? `/ingredients/${letter}`
                    : `/ingredients/${letter}?page=${page - 1}`
                }
                className="rounded-full bg-white/70 px-4 py-1.5 font-medium text-ink ring-1 ring-white/70 backdrop-blur-md hover:text-violet-700"
              >
                ← Page précédente
              </Link>
            ) : null}
            <span className="text-ink-subtle">
              Page {page} / {pageCount}
            </span>
            {page < pageCount ? (
              <Link
                href={`/ingredients/${letter}?page=${page + 1}`}
                className="rounded-full bg-white/70 px-4 py-1.5 font-medium text-ink ring-1 ring-white/70 backdrop-blur-md hover:text-violet-700"
              >
                Page suivante →
              </Link>
            ) : null}
          </nav>
        ) : null}

        <nav
          aria-label="Fil d'ariane"
          className="mt-10 flex items-center gap-1.5 text-[12px] text-ink-subtle"
        >
          <Link href="/" className="hover:text-ink">
            Accueil
          </Link>
          <span aria-hidden>›</span>
          <Link href="/ingredients" className="hover:text-ink">
            Ingrédients
          </Link>
          <span aria-hidden>›</span>
          <span className="text-ink">{label}</span>
        </nav>
      </main>

      <Footer />
    </div>
  );
}
