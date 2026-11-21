/**
 * Source unique des données de sitemap et d'IndexNow : les pages du site et
 * les articles du blog, tout est connu au build.
 *
 * Plus de liste de slugs ingrédient lue dans Supabase : les 15 700 fiches
 * /i/[slug] ont été retirées le 15 nov 2026 (rendues à chaque visite de robot,
 * elles pesaient l'essentiel du CPU facturé par Vercel pour des pages déjà en
 * `noindex`).
 */
import { SITE_URL } from "@/lib/siteUrl";
import { ARTICLES_RECENTS } from "@/contenu/articles";

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
    { path: "/faq", priority: 0.8, changeFrequency: "monthly" },
    // Un article par jour : la liste change chaque jour, sa date est celle du dernier article retouché.
    { path: "/blog", priority: 0.8, changeFrequency: "daily", lastModified: ARTICLES_RECENTS.map((x) => x.modifieLe).sort().at(-1) },
    { path: "/en-savoir-plus", priority: 0.7, changeFrequency: "monthly" },
    { path: "/equipe", priority: 0.5, changeFrequency: "yearly" },
    { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
    { path: "/marques", priority: 0.6, changeFrequency: "monthly" },
    // Retirés du sitemap avec la web app : `/produits` (navigation catalogue),
    // `/offre` (page Premium, remplacée par la section tarifs de la home) et
    // `/auth/sign-in` (il n'y a plus de connexion sur le site). Ils sont
    // redirigés en 308 vers la page d'accueil (next.config.ts) : Google
    // transfère le signal au lieu de tomber sur des 404.
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
