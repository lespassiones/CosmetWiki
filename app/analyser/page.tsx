import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { MobileMenu } from "@/components/MobileMenu";
import { AnalyserApp } from "@/components/AnalyserApp";

export const metadata = {
  title: "Analyser une composition",
  description:
    "Colle la liste INCI d'un cosmétique et obtiens une analyse complète : note sur 20, classification par couleurs, tags, observations et synthèse.",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ inci?: string }>;
};

export default async function AnalyserPage({ searchParams }: Props) {
  const params = await searchParams;
  const initial = (params.inci ?? "").slice(0, 6000);

  return (
    <div className="relative flex min-h-screen flex-col bg-bg">
      <BackgroundGlow />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Logo size="md" />
        <nav className="hidden items-center gap-1 text-sm text-ink-muted sm:flex">
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 transition-colors hover:text-ink"
          >
            Rechercher
          </Link>
          <Link
            href="/analyser"
            className="rounded-full bg-white/60 px-3 py-1.5 font-medium text-ink ring-1 ring-white/70 backdrop-blur-md"
          >
            Analyser
          </Link>
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16">
        <AnalyserApp initialText={initial} />
      </main>

      <Footer />
    </div>
  );
}
