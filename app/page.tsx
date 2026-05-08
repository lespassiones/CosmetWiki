import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { MobileMenu } from "@/components/MobileMenu";

export const revalidate = 86400;

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-bg">
      <BackgroundGlow />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Logo size="md" />
        <nav className="hidden items-center gap-1 text-sm text-ink-muted sm:flex">
          <Link
            href="/comment-ca-marche"
            className="rounded-full px-3 py-1.5 transition-colors hover:text-ink"
          >
            Comment ça marche
          </Link>
          <Link
            href="/about"
            className="rounded-full px-3 py-1.5 transition-colors hover:text-ink"
          >
            À propos
          </Link>
        </nav>
        <MobileMenu />
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-12 text-center sm:py-16">
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Décrypte tes cosmétiques<br className="hidden sm:block" /> en{" "}
            <span className="relative inline-block whitespace-nowrap">
              3 secondes.
              <svg
                aria-hidden
                viewBox="0 0 200 14"
                preserveAspectRatio="none"
                className="pointer-events-none absolute -bottom-2 left-0 h-2.5 w-full text-rose-500 sm:-bottom-3 sm:h-3"
              >
                <path
                  d="M3,10 Q60,1 100,5 T197,10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  className="hero-underline"
                />
              </svg>
            </span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
            Colle la liste INCI d&apos;un produit.<br className="hidden sm:block" />
            On te montre en couleurs ce qu&apos;elle cache.
          </p>

          <div className="mt-10 w-full">
            <SearchBar autoFocus size="lg" />
            <p className="mt-3 text-[13px] text-ink-subtle">
              Tape un ingrédient pour sa fiche, ou{" "}
              <Link
                href="/analyser"
                className="font-medium text-violet-700 hover:text-violet-900"
              >
                colle une liste complète →
              </Link>
            </p>
          </div>

          <Legend />
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Legend() {
  const items = [
    { color: "bg-emerald-500", label: "Vert", sub: "Sans risque connu" },
    { color: "bg-amber-400", label: "Jaune", sub: "Pénalité légère" },
    { color: "bg-orange-500", label: "Orange", sub: "Pénalité moyenne" },
    { color: "bg-rose-500", label: "Rouge", sub: "Pénalité forte" },
  ];
  return (
    <div className="mt-10 grid w-full grid-cols-4 gap-x-2 gap-y-1 sm:gap-x-12">
      {items.map((i) => (
        <div key={i.label} className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${i.color} sm:h-2.5 sm:w-2.5`} aria-hidden />
            <span className="text-[12px] font-medium text-ink sm:text-sm">{i.label}</span>
          </div>
          <span className="mt-0.5 text-[10px] leading-tight text-ink-subtle sm:text-[12px]">
            {i.sub}
          </span>
        </div>
      ))}
    </div>
  );
}
