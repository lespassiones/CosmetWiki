import Link from "next/link";
import type { Metadata } from "next";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import {
  CATEGORIES,
  GLOSSARY_LETTERS,
  getLetterCounts,
  letterLabel,
} from "@/lib/glossary";
import { SITE_URL } from "@/lib/siteUrl";

// 7 jours — l'index alphabétique change uniquement quand on ajoute des
// ingrédients en base (très rare). 1 seule RPC légère (~270 octets).
export const revalidate = 604800;

const TITLE = "Glossaire des ingrédients cosmétiques";
const DESCRIPTION =
  "Le glossaire complet des ingrédients cosmétiques INCI : plus de 15 700 substances classées par lettre, avec leur score couleur (vert, jaune, orange, rouge), leurs fonctions et leurs sources scientifiques.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "glossaire ingrédients cosmétiques",
    "liste INCI",
    "tous les ingrédients cosmétiques",
    "dictionnaire INCI",
    "encyclopédie ingrédients cosmétiques",
    "noms INCI",
    "lexique cosmétique",
  ],
  alternates: { canonical: "/glossaire" },
  openGraph: {
    title: `${TITLE} · Cosme Check`,
    description: DESCRIPTION,
    url: "/glossaire",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} · Cosme Check`,
    description: DESCRIPTION,
  },
};

export default async function GlossairePage() {
  const counts = await getLetterCounts();
  const totalIngredients = Object.values(counts).reduce((a, b) => a + b, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/glossaire#collection`,
        name: TITLE,
        description: DESCRIPTION,
        url: `${SITE_URL}/glossaire`,
        inLanguage: "fr",
        about: {
          "@type": "Thing",
          name: "Ingrédients cosmétiques INCI",
        },
        numberOfItems: totalIngredients,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Glossaire",
            item: `${SITE_URL}/glossaire`,
          },
        ],
      },
    ],
  };

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e"),
        }}
      />
      <BackgroundGlow />
      <PublicHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-28 sm:px-8 sm:pt-32">
        <header className="max-w-3xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
            Glossaire
          </p>
          <h1 className="mt-2 text-balance text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Tous les ingrédients cosmétiques
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-muted sm:text-[16px]">
            Notre base contient{" "}
            <strong className="text-ink">
              {totalIngredients.toLocaleString("fr-FR")} ingrédients
            </strong>{" "}
            cosmétiques répertoriés et classés par couleur de pénalité.
            Choisis une lettre pour parcourir la liste complète.
          </p>
        </header>

        {/* Grille alphabétique */}
        <section className="mt-12">
          <ul className="grid grid-cols-4 gap-2.5 sm:grid-cols-7 lg:grid-cols-9">
            {GLOSSARY_LETTERS.map((letter) => {
              const count = counts[letter] ?? 0;
              const disabled = count === 0;
              if (disabled) {
                return (
                  <li key={letter}>
                    <span
                      aria-disabled
                      className="flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-black/[0.02] px-3 py-4 text-ink-subtle ring-1 ring-black/[0.04]"
                    >
                      <span className="text-[20px] font-bold leading-none">
                        {letterLabel(letter)}
                      </span>
                      <span className="text-[10.5px] font-medium uppercase tracking-wider">
                        Aucun
                      </span>
                    </span>
                  </li>
                );
              }
              return (
                <li key={letter}>
                  <Link
                    href={`/glossaire/${letter.toLowerCase()}`}
                    className="group flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-white px-3 py-4 ring-1 ring-black/[0.05] transition hover:ring-rose-200 hover:bg-rose-50/40"
                  >
                    <span className="text-[20px] font-bold leading-none text-ink group-hover:text-[#F43F5E]">
                      {letterLabel(letter)}
                    </span>
                    <span className="text-[11px] font-medium tabular-nums text-ink-subtle">
                      {count.toLocaleString("fr-FR")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Catégories thématiques */}
        <section className="mt-16">
          <header>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
              Explorer par catégorie
            </p>
            <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Familles d&apos;ingrédients à connaître
            </h2>
            <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-ink-muted">
              Plutôt que parcourir lettre par lettre, plonge directement dans
              les familles d&apos;ingrédients les plus discutées : silicones,
              parabens, filtres UV, conservateurs, huiles essentielles, etc.
            </p>
          </header>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/ingredients/${c.slug}`}
                  className="group block rounded-2xl bg-white p-5 ring-1 ring-black/[0.05] transition hover:ring-rose-200 hover:bg-rose-50/30"
                >
                  <h3 className="text-[15.5px] font-semibold text-ink group-hover:text-[#F43F5E]">
                    {c.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                    {c.description.slice(0, 140)}
                    {c.description.length > 140 ? "…" : ""}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#F43F5E]">
                    Voir la liste <span aria-hidden>→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
}
