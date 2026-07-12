import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";
import { staticRoutes } from "@/lib/sitemapData";

// Cache the sitemap : Next will revalidate at most once per day.
export const revalidate = 86400;

/**
 * Sitemap des pages STATIQUES uniquement (landing, blog, FAQ, légal...).
 * Les routes et leurs dates viennent de lib/sitemapData.ts : les articles
 * de blog sont dérivés de app/blog/articles.ts, ajouter un article là-bas
 * suffit.
 *
 * Les 15 700 fiches ingrédient /i/[slug] vivent dans des sitemaps dédiés
 * (/sitemaps/ingredients-N.xml), agrégés avec celui-ci par
 * /sitemap-index.xml : c'est ce fichier index qu'on soumet à Google et Bing.
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
