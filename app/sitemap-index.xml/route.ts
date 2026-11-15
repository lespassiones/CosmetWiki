import { SITE_URL } from "@/lib/siteUrl";

// Statique : généré au build, servi par le CDN.
export const dynamic = "force-static";

/**
 * /sitemap-index.xml - index de sitemaps soumis à Google Search Console et
 * Bing Webmaster Tools. Il ne contient plus que /sitemap.xml (pages + blog) :
 * les sitemaps des fiches ingrédient ont disparu avec les fiches (15 nov 2026).
 * On garde l'URL parce qu'elle est déjà soumise dans les deux consoles.
 */
export function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE_URL}/sitemap.xml</loc></sitemap>
</sitemapindex>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
