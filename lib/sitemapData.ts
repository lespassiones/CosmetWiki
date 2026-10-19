/**
 * Source unique des données de sitemap / IndexNow / hub ingrédients.
 *
 * La liste des slugs ingrédients vient de la RPC
 * `cosme_check_list_active_slugs_json` (déjà utilisée par /api/indexnow).
 * Elle est enveloppée dans `unstable_cache` : Supabase n'est interrogé
 * qu'UNE fois par 24 h quel que soit le nombre de hits (sitemaps, hub A-Z,
 * IndexNow). C'est ce cache qui permet d'ouvrir les 15 700 fiches aux
 * crawlers sans faire exploser le budget IO Supabase (raison historique du
 * blocage robots.txt, désormais levé).
 */
import { unstable_cache } from "next/cache";
import { supabaseAnon } from "@/lib/supabase";
import { SITE_URL } from "@/lib/siteUrl";
import { INDEX_INGREDIENTS } from "@/lib/seoConfig";
import { ARTICLES_RECENTS } from "@/contenu/articles";

/** Taille max d'un sitemap ingrédients. La spec autorise 50 000 URLs ;
 *  10 000 garde des fichiers légers et scale jusqu'à 500k URLs via l'index. */
export const INGREDIENT_SITEMAP_CHUNK = 10_000;

/**
 * Slugs actifs, triés, cachés 24 h dans le Data Cache Vercel.
 * Jette en cas d'échec RPC : `unstable_cache` ne met alors RIEN en cache,
 * la prochaine requête retentera (on ne veut jamais cacher une liste vide
 * pendant 24 h à cause d'un hoquet réseau).
 */
export const loadIngredientSlugs = unstable_cache(
  async (): Promise<string[]> => {
    const { data, error } = await supabaseAnon().rpc(
      "cosme_check_list_active_slugs_json",
    );
    if (error || !Array.isArray(data)) {
      throw new Error(
        `cosme_check_list_active_slugs_json failed: ${error?.message ?? "payload inattendu"}`,
      );
    }
    return (data as unknown[])
      .filter((s): s is string => typeof s === "string" && s.length > 0)
      .sort();
  },
  ["ingredient-slugs-v1"],
  { revalidate: 86_400 },
);

export type StaticRoute = {
  path: string;
  priority: number;
  changeFrequency:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  /** lastmod ISO (YYYY-MM-DD) quand elle est connue et honnête. */
  lastModified?: string;
};

/**
 * Pages statiques du site. Les articles de blog sont dérivés de
 * `contenu/articles.ts` : ajouter un article là-bas suffit, le sitemap
 * suit automatiquement (fini les listes dupliquées qui divergent).
 */
export function staticRoutes(): StaticRoute[] {
  const core: StaticRoute[] = [
    { path: "/", priority: 1.0, changeFrequency: "daily" },
    { path: "/fonctionnalites", priority: 0.9, changeFrequency: "monthly" },
    { path: "/comment-ca-marche", priority: 0.9, changeFrequency: "monthly" },
    // Le hub /ingredients n'est listé que si on choisit d'indexer les
    // ingrédients (cf. lib/seoConfig.ts). Positionnement = compatibilité.
    ...(INDEX_INGREDIENTS
      ? ([{ path: "/ingredients", priority: 0.9, changeFrequency: "weekly" }] as StaticRoute[])
      : []),
    { path: "/faq", priority: 0.8, changeFrequency: "monthly" },
    // Un article par jour : la liste change chaque jour, sa date est celle du dernier article retouché.
    { path: "/blog", priority: 0.8, changeFrequency: "daily", lastModified: ARTICLES_RECENTS.map((x) => x.modifieLe).sort().at(-1) },
    { path: "/en-savoir-plus", priority: 0.7, changeFrequency: "monthly" },
    { path: "/equipe", priority: 0.5, changeFrequency: "yearly" },
    { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
    // Retirés du sitemap avec la web app : `/produits` (navigation catalogue),
    // `/offre` (page Premium, remplacée par la section tarifs de la home) et
    // `/auth/sign-in` (il n'y a plus de connexion sur le site). La middleware
    // les redirige en 308 vers la page d'accueil : Google transfère le signal
    // au lieu de tomber sur des 404.
    { path: "/cgu", priority: 0.3, changeFrequency: "yearly" },
    { path: "/confidentialite", priority: 0.3, changeFrequency: "yearly" },
    { path: "/mentions-legales", priority: 0.3, changeFrequency: "yearly" },
  ];

  const blog: StaticRoute[] = ARTICLES_RECENTS.map((a) => ({
    path: `/blog/${a.slug}`,
    priority: 0.7,
    changeFrequency: "monthly" as const,
    lastModified: a.modifieLe,
  }));

  return [...core, ...blog];
}

/** URLs absolues de toutes les pages statiques (pour IndexNow). */
export function staticPageUrls(): string[] {
  return staticRoutes().map((r) => `${SITE_URL}${r.path}`);
}

/** URLs absolues des fiches ingrédient (pour IndexNow / sitemaps). */
export async function ingredientPageUrls(): Promise<string[]> {
  const slugs = await loadIngredientSlugs();
  return slugs.map((slug) => `${SITE_URL}/i/${slug}`);
}
