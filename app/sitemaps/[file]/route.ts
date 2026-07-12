import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/siteUrl";
import {
  INGREDIENT_SITEMAP_CHUNK,
  loadIngredientSlugs,
} from "@/lib/sitemapData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /sitemaps/ingredients-N.xml - sitemap des fiches ingrédient, par tranches
 * de 10 000 URLs (spec sitemaps.org : 50 000 max par fichier). Référencé par
 * /sitemap-index.xml.
 *
 * Coût Supabase : la liste des slugs vient de loadIngredientSlugs()
 * (Data Cache 24 h) et la réponse XML est cachée 24 h par le CDN Vercel.
 * Pas de <lastmod> : on ne stocke pas de date de modification fiable par
 * ingrédient, et un lastmod mensonger est ignoré (voire pénalisé) par Google.
 */
const FILE_RE = /^ingredients-(\d{1,4})\.xml$/;

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const match = FILE_RE.exec(file);
  if (!match) {
    return new NextResponse("Not found", { status: 404 });
  }

  const page = Number.parseInt(match[1], 10);
  const slugs = await loadIngredientSlugs();
  const start = page * INGREDIENT_SITEMAP_CHUNK;
  const chunk = slugs.slice(start, start + INGREDIENT_SITEMAP_CHUNK);

  if (chunk.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunk
  .map(
    (slug) =>
      `  <url><loc>${xmlEscape(`${SITE_URL}/i/${slug}`)}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`,
  )
  .join("\n")}
</urlset>
`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
