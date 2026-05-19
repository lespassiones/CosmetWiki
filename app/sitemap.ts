import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

// Cache the sitemap : Next will revalidate at most once per day.
export const revalidate = 86400;

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/fonctionnalites", priority: 0.9, changeFrequency: "monthly" },
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

// Le glossaire (/glossaire, /glossaire/[lettre], /ingredients/[category]) a été
// retiré du site. Les fiches /i/[slug] restent accessibles via URL directe mais
// sont volontairement absentes du sitemap : les bots SEO ne les indexeront pas
// et ne consommeront pas le budget IO Supabase à les crawler en masse.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
