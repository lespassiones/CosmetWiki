/**
 * Source unique des articles de blog. Importée par :
 *   - app/blog/page.tsx          (liste filtrable)
 *   - app/blog/BlogList.tsx      (types Article / Category)
 *   - components/blog/BlogArticleShell.tsx (sidebar « À lire aussi »)
 *
 * Articles triés par date décroissante (le plus récent en tête).
 */

export type Category =
  | "Ingrédients"
  | "Marques"
  | "Routines"
  | "Réglementation";

export type Article = {
  /** Slug — correspond au dossier sous app/blog/. */
  id: string;
  title: string;
  excerpt: string;
  category: Category;
  /** Date d'affichage pour les utilisateurs, ex. « 18 mai 2026 ». */
  date: string;
  /** Date de publication au format ISO (YYYY-MM-DD) — utilisée par le JSON-LD. */
  published: string;
  /**
   * Date de dernière modification au format ISO. Optionnel : si l'article
   * n'a pas été modifié, on retombe sur `published` côté JSON-LD. Quand tu
   * mets à jour le contenu d'un article (correction, ajout de paragraphe,
   * MAJ chiffres), bumpe cette date ici. C'est l'unique endroit à toucher.
   */
  modified?: string;
  readingTime: string;
  image: string;
};

export const ARTICLES: Article[] = [
  {
    id: "routine-peau-joueurs-foot",
    title: "Skincare des stars du foot : la routine de Ronaldo, Mbappé & co décryptée",
    excerpt:
      "Coupe du monde oblige, leurs visages sont partout. Quelle routine peau suivent vraiment les stars du ballon, quels ingrédients privilégier et la version simple à copier en 3 minutes par jour.",
    category: "Routines",
    date: "17 juin 2026",
    published: "2026-06-17",
    readingTime: "4 min",
    image: "/image/blog/foot-skincare/hero.webp",
  },
  {
    id: "deodorant-sels-aluminium-verite",
    title: "Déodorant ou anti-transpirant : faut-il vraiment fuir les sels d'aluminium ?",
    excerpt:
      "Cancer, Alzheimer, déos « naturels »… on démêle ce que dit vraiment la science sur les sels d'aluminium, la différence déodorant / anti-transpirant et comment lire l'INCI de ton déo cet été.",
    category: "Ingrédients",
    date: "17 juin 2026",
    published: "2026-06-17",
    readingTime: "4 min",
    image: "/image/blog/deodorant-aluminium/hero.webp",
  },
  {
    id: "serums-visage-guide",
    title: "Sérums visage : vitamine C, acide hyaluronique, peptides, lequel choisir ?",
    excerpt:
      "Trois actifs stars, trois usages très différents. Le guide simple pour choisir son sérum visage selon son besoin (éclat, hydratation, anti-âge) et les combiner sans erreur.",
    category: "Ingrédients",
    date: "18 mai 2026",
    published: "2026-05-18",
    readingTime: "5 min",
    image: "/image/blog/serums/hero.webp",
  },
  {
    id: "masque-led-visage",
    title: "Masque LED visage : effet réel ou simple tendance TikTok ?",
    excerpt:
      "Boom des masques LED en 2026 : ce que disent vraiment les études, à quoi sert chaque couleur de lumière, et les précautions à connaître avant d'investir.",
    category: "Routines",
    date: "17 mai 2026",
    published: "2026-05-17",
    readingTime: "4 min",
    image: "/image/blog/led/hero.webp",
  },
  {
    id: "perturbateurs-endocriniens-cosmetiques-2026",
    title: "Perturbateurs endocriniens dans les cosmétiques : ce qu'il faut vraiment surveiller en 2026",
    excerpt:
      "Les perturbateurs endocriniens font peur, souvent pour de bonnes raisons. Mais il faut savoir lesquels surveiller vraiment, et comment les détecter dans tes produits sans tomber dans la psychose.",
    category: "Ingrédients",
    date: "16 mai 2026",
    published: "2026-05-16",
    readingTime: "7 min",
    image: "/image/blog/perturbateurs-endocriniens/hero.webp",
  },
  {
    id: "lip-oils-huiles-levres",
    title: "Lip oils : la vraie différence avec un gloss (et lesquels choisir)",
    excerpt:
      "Les huiles à lèvres ont explosé sur les réseaux. Ce qui les différencie d'un gloss classique, comment lire l'INCI et les références qui tiennent vraiment leurs promesses.",
    category: "Routines",
    date: "14 mai 2026",
    published: "2026-05-14",
    readingTime: "3 min",
    image: "/image/blog/lip-oils/hero.webp",
  },
  {
    id: "cremes-hydratantes-reparatrices",
    title: "Crèmes hydratantes et réparatrices : le guide pour choisir selon sa peau",
    excerpt:
      "Hydratation vs nutrition, actifs qui marchent vraiment, et la bonne crème pour chaque type de peau (grasse, sèche, mixte, sensible). Le guide simple pour ne plus se tromper.",
    category: "Routines",
    date: "13 mai 2026",
    published: "2026-05-13",
    readingTime: "5 min",
    image: "/image/blog/cremes-hydratantes/hero.webp",
  },
  {
    id: "creme-solaire-coreenne-k-beauty",
    title: "Crèmes solaires coréennes (K-Beauty) : pourquoi elles cartonnent",
    excerpt:
      "Beauty of Joseon, Round Lab, Anua, COSRX... les SPF coréens explosent en France. Avantages, différences réglementaires avec l'EU et précautions à connaître.",
    category: "Marques",
    date: "11 mai 2026",
    published: "2026-05-11",
    readingTime: "5 min",
    image: "/image/blog/k-beauty/hero.webp",
  },
  {
    id: "spf-50-visage-7-erreurs",
    title: "SPF 50 visage : les 7 erreurs que tout le monde fait (et comment les éviter)",
    excerpt:
      "80 % des gens appliquent leur crème solaire de la mauvaise façon, et le SPF devient presque inutile. On passe en revue les 7 erreurs les plus fréquentes et la bonne méthode pour vraiment protéger sa peau.",
    category: "Routines",
    date: "15 avril 2026",
    published: "2026-04-15",
    readingTime: "5 min",
    image: "/image/landing/SPF.webp",
  },
];

/** Récupère un article par son slug. */
export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.id === slug);
}

/**
 * Renvoie les dates ISO (published + modified) pour un article, prêtes à
 * être injectées dans le JSON-LD Article. Fallback : `modified === published`.
 */
export function getArticleDates(slug: string): { published: string; modified: string } {
  const article = getArticleBySlug(slug);
  if (!article) {
    // Fallback safe — date actuelle. Ne devrait jamais arriver en pratique.
    const today = new Date().toISOString().slice(0, 10);
    return { published: today, modified: today };
  }
  return {
    published: article.published,
    modified: article.modified ?? article.published,
  };
}

/**
 * Sélectionne jusqu'à `limit` articles à recommander en regard d'un article
 * en cours de lecture. Priorité aux articles de la même catégorie, complète
 * avec les plus récents des autres catégories.
 */
export function pickRelatedArticles(
  currentId: string,
  category: Category,
  limit: number = 3,
): Article[] {
  const others = ARTICLES.filter((a) => a.id !== currentId);
  const sameCategory = others.filter((a) => a.category === category);
  const otherCategory = others.filter((a) => a.category !== category);
  return [...sameCategory, ...otherCategory].slice(0, limit);
}
