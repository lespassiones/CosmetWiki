import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { MobileMenu } from "@/components/MobileMenu";

const TITLE = "À propos";
const DESCRIPTION =
  "CosmetWiki est un moteur de recherche public et libre dédié aux ingrédients cosmétiques. Plus de 15 000 substances INCI classées par tolérance.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `${TITLE} · CosmetWiki`,
    description: DESCRIPTION,
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} · CosmetWiki`,
    description: DESCRIPTION,
  },
};

export default function AboutPage() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-bg">
      <BackgroundGlow />

      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6">
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
            className="rounded-full bg-white/60 px-3 py-1.5 font-medium text-ink ring-1 ring-white/70 backdrop-blur-md"
          >
            À propos
          </Link>
        </nav>
        <MobileMenu />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16">
        <h1 className="text-4xl font-semibold tracking-tight text-ink">
          À propos de CosmetWiki
        </h1>
        <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-ink-muted">
          <p>
            CosmetWiki est un moteur de recherche public et libre dédié aux
            ingrédients cosmétiques. Il référence plus de 15&nbsp;000 substances
            INCI et leur niveau de tolérance (vert, jaune, orange, rouge).
          </p>
          <h2 className="pt-4 text-lg font-semibold text-ink">Pourquoi&nbsp;?</h2>
          <p>
            Lire la liste INCI au dos d&apos;un cosmétique est intimidant.
            CosmetWiki simplifie cette lecture&nbsp;: tape un nom — qu&apos;il
            soit en anglais, en français ou un numéro CAS — et tu obtiens un
            résumé de la classification, de la prévalence dans les produits, et
            des produits qui en contiennent.
          </p>
          <h2 className="pt-4 text-lg font-semibold text-ink">Source des données</h2>
          <p>
            Les données proviennent d&apos;
            <a
              href="https://incibeauty.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-700 hover:underline"
            >
              incibeauty.com
            </a>
            , une base publique de référence en France. CosmetWiki les rend
            simplement plus rapides à parcourir.
          </p>
          <h2 className="pt-4 text-lg font-semibold text-ink">Limites</h2>
          <p>
            La classification couleur résume un grand nombre d&apos;informations
            et reste indicative. Pour les conseils médicaux, consulte un
            professionnel de santé.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
