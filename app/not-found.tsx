import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";

export const metadata: Metadata = {
  title: "Page introuvable",
  description: "Cette page n'existe pas dans Cosme Check.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-bg">
      <BackgroundGlow />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Logo size="md" />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-[13px] font-medium uppercase tracking-wider text-ink-subtle">
          Erreur 404
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Cette page n&apos;existe pas.
        </h1>
        <div className="mt-8 flex flex-col items-center gap-3 text-sm font-medium sm:flex-row sm:gap-6">
          <Link href="/" className="text-rose-700 hover:text-rose-900">
            ← Retour à l&apos;accueil
          </Link>
          <Link href="/blog" className="text-rose-700 hover:text-rose-900">
            Lire le blog
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
