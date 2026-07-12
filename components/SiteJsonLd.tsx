import { SITE_URL } from "@/lib/siteUrl";

/**
 * JSON-LD global injecté par le root layout sur toutes les pages :
 *   - Organization : identité de l'éditeur (entité réutilisée par les
 *     moteurs et les LLM pour attribuer le contenu à « Cosme Check »).
 *   - WebSite + SearchAction : décrit la recherche interne (/search?q=...)
 *     et rend le site éligible à la sitelinks searchbox Google.
 * Les pages ajoutent leurs propres blocs spécifiques (ChemicalSubstance sur
 * les fiches ingrédient, FAQPage sur /faq, Article sur le blog).
 */
export function SiteJsonLd() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Cosme Check",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/image/logo-cc.webp`,
        },
        description:
          "Application française et indépendante d'analyse des cosmétiques : décodage INCI, vérification des promesses marketing, recommandations personnalisées.",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Cosme Check",
        inLanguage: "fr",
        publisher: { "@id": `${SITE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Échappe `<` / `>` pour empêcher toute sortie du tag script.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(graph)
          .replace(/</g, "\\u003c")
          .replace(/>/g, "\\u003e"),
      }}
    />
  );
}
