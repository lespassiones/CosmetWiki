import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";
import { supabaseAnon } from "@/lib/supabase";

// Cache the sitemap : Next will revalidate at most once per day.
export const revalidate = 86400;

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/comment-ca-marche", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "yearly" },
];

type SlugRow = { slug: string };

async function fetchIngredientSlugs(): Promise<SlugRow[]> {
  // Primary path : SECURITY DEFINER RPC returning every ingredient slug.
  try {
    const { data, error } = await supabaseAnon().rpc(
      "cosmetwiki_list_active_slugs",
      { p_limit: 45_000 },
    );
    if (!error && Array.isArray(data) && data.length > 0) {
      return data as SlugRow[];
    }
    if (error) {
      console.warn("[sitemap] RPC failed:", error.message);
    }
  } catch (err) {
    console.warn("[sitemap] RPC threw:", err);
  }

  // Fallback : direct schema query (works only if `cosmetwiki` is in
  // Supabase Dashboard > Project Settings > API > Exposed schemas).
  try {
    const { data, error } = await supabaseAnon()
      .schema("cosmetwiki")
      .from("ingredients")
      .select("slug")
      .limit(45_000);
    if (error) {
      console.warn("[sitemap] direct schema query failed:", error.message);
      return [];
    }
    return (data ?? []) as SlugRow[];
  } catch (err) {
    console.warn("[sitemap] direct schema threw:", err);
    return [];
  }
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
  const ingredientEntries: MetadataRoute.Sitemap = slugs.map((row) => ({
    url: `${SITE_URL}/i/${row.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...ingredientEntries];
}
