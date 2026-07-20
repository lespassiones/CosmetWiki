import type { Metadata } from "next";
import { PublicHeader } from "@/components/PublicHeader";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { FaqExplorer } from "@/components/faq/FaqExplorer";
import { SITE_URL } from "@/lib/siteUrl";
import { FAQ_CATEGORIES, FAQ_ITEMS } from "./data";

const TITLE = "FAQ - Questions fréquentes";
const DESCRIPTION =
  "Tout ce que tu as toujours voulu savoir sur tes cosmétiques : composition INCI, ingrédients, confidentialité, abonnement. Les réponses claires de Cosme Check.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "FAQ cosmétiques",
    "questions fréquentes INCI",
    "comprendre composition cosmétique",

    "perturbateurs endocriniens cosmétiques",
    "parabens",
    "silicones",
    "RGPD application beauté",
  ],
  alternates: { canonical: "/faq" },
  openGraph: {
    title: `${TITLE} · Cosme Check`,
    description: DESCRIPTION,
    url: "/faq",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} · Cosme Check`,
    description: DESCRIPTION,
  },
};

function buildFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/faq#faq`,
        url: `${SITE_URL}/faq`,
        inLanguage: "fr",
        name: "Questions fréquentes - Cosme Check",
        description: DESCRIPTION,
        mainEntity: FAQ_ITEMS.map((it) => ({
          "@type": "Question",
          name: it.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: it.answer,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "FAQ",
            item: `${SITE_URL}/faq`,
          },
        ],
      },
    ],
  };
}

export default function FaqPage() {
  const jsonLd = buildFaqJsonLd();

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\u003c").replace(/>/g, "\u003e")
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e"),
        }}
      />
      <BackgroundGlow />
      <PublicHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-20 sm:px-8 sm:pt-24">
        <header className="mb-10 max-w-3xl">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Questions <span className="text-ink">fréquentes</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-muted sm:text-[16px]">
            Tout ce que tu as toujours voulu savoir sur tes cosmétiques.
          </p>
        </header>

        <FaqExplorer
          items={FAQ_ITEMS}
          categories={FAQ_CATEGORIES}
          defaultOpenId="signification-couleurs"
        />
      </main>

    </div>
  );
}
