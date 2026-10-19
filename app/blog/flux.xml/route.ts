import { ARTICLES_RECENTS } from "@/contenu/articles";
import { texteBrut } from "@/lib/article";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * Le flux RSS du blog : `/blog/flux.xml`.
 *
 * Un article par jour, c'est un rythme qu'un lecteur de flux, un agrégateur ou
 * un moteur génératif suit mieux par un flux que par le plan du site. Rendu au
 * build (`force-static`), relu à chaque déploiement : un article publié est
 * dans le flux dès qu'il est en ligne.
 */
export const dynamic = "force-static";

const echapper = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** RFC 822, ce qu'exige RSS 2.0 : midi UTC, pour qu'aucun fuseau ne change le jour. */
const dateRss = (iso: string) => new Date(`${iso}T12:00:00Z`).toUTCString();

export function GET() {
  const items = ARTICLES_RECENTS.map((a) => {
    const url = `${SITE_URL}/blog/${a.slug}`;
    return `    <item>
      <title>${echapper(texteBrut(a.titre))}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${dateRss(a.publieLe)}</pubDate>
      <category>${echapper(a.categorie)}</category>
      <description>${echapper(a.resume)}</description>
      <enclosure url="${SITE_URL}${a.couverture.src}" type="image/webp" length="0" />
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Le Journal Cosme Check</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/blog/flux.xml" rel="self" type="application/rss+xml" />
    <description>Décoder les cosmétiques, un article à la fois : ingrédients, routines, tendances et composition des produits.</description>
    <language>fr-FR</language>
    <lastBuildDate>${dateRss(ARTICLES_RECENTS.map((a) => a.modifieLe).sort().at(-1) ?? "2026-01-01")}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
