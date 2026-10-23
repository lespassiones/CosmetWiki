import { supabaseBrowser } from "@/lib/supabase";

/**
 * Le compteur de vues des articles du blog, et le seul fichier qui en parle à
 * Supabase. Sur le modèle de Test Civique (`components/blog/ArticleViews.tsx`).
 *
 * Le chiffre affiché est le **vrai** total de `cosme_check.article_views` :
 * aucun multiplicateur, aucune valeur de départ. Il ne vaut donc que si on ne
 * le gonfle pas sans le vouloir, d'où les règles de `doitCompter` :
 *
 * - une vue par article et par session d'onglet (`sessionStorage`, effacé à la
 *   fermeture de l'onglet, jamais envoyé au serveur ; aucun cookie) ;
 * - seulement une fois la page réellement affichée (pas pendant un
 *   préchargement ni dans un onglet ouvert en arrière-plan) ;
 * - jamais pour un robot connu ni un navigateur piloté (`navigator.webdriver`) ;
 * - jamais hors du domaine de production : le développement, les préversions
 *   Vercel et le banc (`npm run seo:banc`, port 3210) lisent la même base, ils
 *   ne doivent pas y écrire.
 *
 * Écriture : `public.cosme_check_increment_article_view` (+1, renvoie le
 * total). Lecture : `public.cosme_check_article_views` (une liste de slugs).
 * Migration : `supabase/migrations/20261023_article_views.sql`.
 */

/** Les robots et aperçus de liens connus. Large exprès : mieux vaut rater une vue qu'en compter une fausse. */
const ROBOTS =
  /bot|crawl|spider|slurp|bingpreview|mediapartners|facebookexternalhit|facebookcatalog|embedly|quora link preview|outbrain|pinterest|vkshare|w3c_validator|whatsapp|telegram|skypeuripreview|redditbot|applebot|yandex|baidu|duckduckgo|ahrefs|semrush|mj12|dotbot|petalbot|bytespider|gptbot|chatgpt|oai-searchbot|claude|anthropic|perplexity|ccbot|cohere|diffbot|lighthouse|pagespeed|chrome-lighthouse|gtmetrix|pingdom|uptime|headless|phantomjs|puppeteer|playwright|selenium|python-requests|curl|wget|node-fetch|axios|go-http-client|java\//i;

/** Le domaine où une vue compte. */
const PRODUCTION = /(^|\.)cosme-check\.com$/;

/** Un slug que la base acceptera : la même règle que la fonction SQL. */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function estRobot(userAgent: string, webdriver = false): boolean {
  return webdriver || !userAgent || ROBOTS.test(userAgent);
}

export function slugValide(slug: string): boolean {
  return slug.length <= 80 && SLUG.test(slug);
}

/** « 0 vue », « 1 vue », « 2 vues », « 12 345 vues ». */
export function libelleVues(vues: number): string {
  const n = Math.max(0, Math.floor(vues));
  return `${new Intl.NumberFormat("fr-FR").format(n)} ${n > 1 ? "vues" : "vue"}`;
}

const cle = (slug: string) => `cc_vue:${slug}`;

/** Repli quand le stockage est bloqué : au moins une seule vue par chargement de l'application. */
const comptesEnMemoire = new Set<string>();

function dejaCompte(slug: string): boolean {
  if (comptesEnMemoire.has(slug)) return true;
  try {
    return window.sessionStorage.getItem(cle(slug)) === "1";
  } catch {
    return false;
  }
}

function marquerCompte(slug: string): void {
  comptesEnMemoire.add(slug);
  try {
    window.sessionStorage.setItem(cle(slug), "1");
  } catch {
    // Stockage bloqué : la mémoire de la page suffit.
  }
}

/** Cette visite doit-elle ajouter une vue à cet article ? */
export function doitCompter(slug: string): boolean {
  if (typeof window === "undefined" || !slugValide(slug)) return false;
  if (!PRODUCTION.test(window.location.hostname)) return false;
  if (estRobot(navigator.userAgent, navigator.webdriver === true)) return false;
  return !dejaCompte(slug);
}

function enNombre(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Les totaux d'une liste d'articles. Un article jamais vu vaut 0. `null` si la lecture échoue. */
export async function lireVues(slugs: readonly string[]): Promise<Map<string, number> | null> {
  const valides = [...new Set(slugs.filter(slugValide))].slice(0, 200);
  if (!valides.length) return new Map();
  try {
    const { data, error } = await supabaseBrowser().rpc("cosme_check_article_views", { p_slugs: valides });
    if (error || !Array.isArray(data)) return null;
    const vues = new Map<string, number>(valides.map((s) => [s, 0]));
    for (const ligne of data as { slug: string; views: unknown }[]) {
      const n = enNombre(ligne.views);
      if (n !== null) vues.set(ligne.slug, n);
    }
    return vues;
  } catch {
    return null;
  }
}

/**
 * Ajoute une vue si elle doit compter, et renvoie le total à afficher.
 * Sinon, ou si l'incrément échoue, se contente de lire le total.
 */
export async function compterEtLireVue(slug: string): Promise<number | null> {
  if (doitCompter(slug)) {
    // Marqué avant l'appel : un double rendu (mode strict) ne compte pas deux fois.
    marquerCompte(slug);
    try {
      const { data, error } = await supabaseBrowser().rpc("cosme_check_increment_article_view", { p_slug: slug });
      const n = enNombre(data);
      if (!error && n !== null) return n;
    } catch {
      // On retombe sur la lecture.
    }
  }
  const vues = await lireVues([slug]);
  return vues?.get(slug) ?? null;
}
