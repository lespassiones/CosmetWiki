import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";
import { supabaseAnon } from "@/lib/supabase";

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

async function fetchIngredientSlugs(): Promise<string[]> {
  // Primary path : JSONB RPC returning every active slug in a single row.
  // This bypasses PostgREST's `db.max_rows = 1000` cap, which would otherwise
  // truncate the response (the cap is on row count, not payload size - so a
  // single row holding a JSON array of all slugs is returned in full).
  try {
    const { data, error } = await supabaseAnon().rpc(
      "cosme_check_list_active_slugs_json",
    );
    if (error) {
      console.warn("[sitemap] JSON RPC failed:", error.message);
    } else if (Array.isArray(data)) {
      return data.filter((s): s is string => typeof s === "string");
    }
  } catch (err) {
    console.warn("[sitemap] JSON RPC threw:", err);
  }

  // Fallback : legacy SETOF RPC (capped at 1000 rows by PostgREST, but still
  // better than nothing if the JSONB function is unavailable for any reason).
  try {
    const { data, error } = await supabaseAnon().rpc(
      "cosme_check_list_active_slugs",
      { p_limit: 45_000 },
    );
    if (!error && Array.isArray(data)) {
      return (data as { slug: string }[])
        .map((row) => row.slug)
        .filter((s): s is string => typeof s === "string");
    }
    if (error) {
      console.warn("[sitemap] legacy RPC failed:", error.message);
    }
  } catch (err) {
    console.warn("[sitemap] legacy RPC threw:", err);
  }

  return [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const slugs = await fetchIngredientSlugs();
  const ingredientEntries: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${SITE_URL}/i/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...ingredientEntries];
}
