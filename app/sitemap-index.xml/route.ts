import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/siteUrl";
import { INDEX_INGREDIENTS } from "@/lib/seoConfig";
import {
  INGREDIENT_SITEMAP_CHUNK,
  loadIngredientSlugs,
} from "@/lib/sitemapData";

export const runtime = "nodejs";
// Dynamique + Cache-Control : le CDN Vercel sert la réponse cachée 24 h,
// Supabase n'est sollicité qu'à la première requête (et la liste des slugs
// est elle-même dans le Data Cache via loadIngredientSlugs).
export const dynamic = "force-dynamic";

/**
 * /sitemap-index.xml - index de sitemaps soumis à Google Search Console et
 * Bing Webmaster Tools. Agrège :
 *   - /sitemap.xml                 : pages statiques (landing, blog, FAQ...)
 *   - /sitemaps/ingredients-N.xml  : fiches ingrédient par tranches de 10 000
 *
 * Cette URL était déjà soumise dans GSC mais n'existait pas (erreur
 * "Impossible de récupérer le sitemap") : la créer suffit à réparer la
 * soumission existante.
 */
export async function GET() {
  // Les chunks /sitemaps/ingredients-N.xml ne sont listés que si on indexe les
  // ingrédients (cf. lib/seoConfig.ts). Par défaut le site ne veut pas être
  // référencé comme un annuaire INCI : seul /sitemap.xml (pages + articles) est
  // soumis.
  const ingredientLocs: string[] = [];
  if (INDEX_INGREDIENTS) {
    const slugs = await loadIngredientSlugs();
    const chunkCount = Math.max(
      1,
      Math.ceil(slugs.length / INGREDIENT_SITEMAP_CHUNK),
    );
    for (let i = 0; i < chunkCount; i++) {
      ingredientLocs.push(`${SITE_URL}/sitemaps/ingredients-${i}.xml`);
    }
  }

  const locs = [`${SITE_URL}/sitemap.xml`, ...ingredientLocs];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locs.map((loc) => `  <sitemap><loc>${loc}</loc></sitemap>`).join("\n")}
</sitemapindex>
`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
