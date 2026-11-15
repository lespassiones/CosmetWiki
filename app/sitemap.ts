import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";
import { staticRoutes } from "@/lib/sitemapData";

// Statique : généré au build. Il ne dépend que de contenu/articles.ts, qui ne
// change qu'à un déploiement. Plus de régénération (et donc de fonction) par jour.

/**
 * Sitemap des pages STATIQUES uniquement (landing, blog, FAQ, légal...).
 * Les routes et leurs dates viennent de lib/sitemapData.ts : les articles
 * de blog sont dérivés de contenu/articles.ts, ajouter un article là-bas
 * suffit.
 *
 * /sitemap-index.xml (soumis à Google et Bing) ne pointe plus que sur ce
 * fichier : les fiches ingrédient /i/[slug] ont été retirées le 15 nov 2026.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return staticRoutes().map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: r.lastModified ? new Date(r.lastModified) : now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
