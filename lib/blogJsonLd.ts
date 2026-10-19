import type { Article } from "@/contenu/articles";
import { nombreDeMots, sourcesCitees, texteBrut } from "@/lib/article";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * Les données structurées d'une page d'article : `Article`, `FAQPage` quand
 * l'article a une FAQ, et le fil d'Ariane. Un seul `@graph`, relié à
 * l'organisation et au site que pose `components/SiteJsonLd.tsx` sur toutes
 * les pages (`#organization`, `#website`).
 *
 * C'est ce que Google lit pour la date et l'image d'un résultat, et ce que les
 * moteurs génératifs découpent en réponses : la FAQ y part mot pour mot, les
 * sources citées partent en `citation`.
 */
export function jsonLdArticle(a: Article) {
  const url = `${SITE_URL}/blog/${a.slug}`;
  const graphe: Record<string, unknown>[] = [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: texteBrut(a.titre),
      alternativeHeadline: a.titreSeo,
      description: a.resume,
      inLanguage: "fr-FR",
      datePublished: a.publieLe,
      dateModified: a.modifieLe,
      wordCount: nombreDeMots(a),
      timeRequired: `PT${a.minutes}M`,
      articleSection: a.categorie,
      keywords: [a.theme, ...(a.motsCles ?? [])].join(", "),
      about: { "@type": "Thing", name: a.theme },
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      isPartOf: { "@id": `${SITE_URL}/#website` },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      image: {
        "@type": "ImageObject",
        url: `${SITE_URL}${a.couverture.src}`,
        width: a.couverture.largeur,
        height: a.couverture.hauteur,
        creditText: `${a.couverture.credit}, ${a.couverture.licence}`,
      },
      ...(sourcesCitees(a).length ? { citation: sourcesCitees(a) } : {}),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: a.titreSeo, item: url },
      ],
    },
  ];
  if (a.faq?.length) {
    graphe.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: a.faq.map((q) => ({
        "@type": "Question",
        name: q.question,
        acceptedAnswer: { "@type": "Answer", text: texteBrut(q.reponse) },
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graphe };
}
