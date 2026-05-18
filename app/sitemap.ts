import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";
import { CATEGORIES, GLOSSARY_LETTERS } from "@/lib/glossary";

// Cache the sitemap : Next will revalidate at most once per day.
export const revalidate = 86400;

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/fonctionnalites", priority: 0.9, changeFrequency: "monthly" },
  { path: "/glossaire", priority: 0.9, changeFrequency: "weekly" },
  { path: "/comment-ca-marche", priority: 0.6, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
  { path: "/blog/spf-50-visage-7-erreurs", priority: 0.7, changeFrequency: "monthly" },
  { path: "/blog/perturbateurs-endocriniens-cosmetiques-2026", priority: 0.7, changeFrequency: "monthly" },
  { path: "/blog/serums-visage-guide", priority: 0.7, changeFrequency: "monthly" },
  { path: "/blog/masque-led-visage", priority: 0.7, changeFrequency: "monthly" },
  { path: "/blog/lip-oils-huiles-levres", priority: 0.7, changeFrequency: "monthly" },
  { path: "/blog/cremes-hydratantes-reparatrices", priority: 0.7, changeFrequency: "monthly" },
  { path: "/blog/creme-solaire-coreenne-k-beauty", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.8, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
];

// 27 pages alphabétiques + pages catégorie : générées à partir des constantes
// pour qu'un nouvel ajout dans `lib/glossary.ts` apparaisse automatiquement
// dans le sitemap à la prochaine régénération (24 h max).
const GLOSSARY_LETTER_ROUTES = GLOSSARY_LETTERS.map((letter) => ({
  path: `/glossaire/${letter.toLowerCase()}`,
  priority: 0.7,
  changeFrequency: "monthly" as const,
}));

const CATEGORY_ROUTES = CATEGORIES.map((c) => ({
  path: `/ingredients/${c.slug}`,
  priority: 0.8,
  changeFrequency: "monthly" as const,
}));

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const mapRoute = (r: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  });

  // We deliberately DO NOT include the 15 700 `/i/[slug]` URLs anymore.
  // Crawlers were hammering Supabase (37k+ get_ingredient calls + 18k+
  // products_for_ingredient calls observed in pg_stat_statements), which
  // drained the project's Disk IO Budget. The pages stay reachable through
  // internal links (glossary letter pages, category pages, search), so users
  // and bots can still discover them at a sustainable pace.
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(mapRoute);
  const glossaryEntries: MetadataRoute.Sitemap = GLOSSARY_LETTER_ROUTES.map(mapRoute);
  const categoryEntries: MetadataRoute.Sitemap = CATEGORY_ROUTES.map(mapRoute);

  return [
    ...staticEntries,
    ...glossaryEntries,
    ...categoryEntries,
  ];
}
