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
  date: string;
  readingTime: string;
  image: string;
};

export const ARTICLES: Article[] = [
  {
    id: "serums-visage-guide",
    title: "Sérums visage : vitamine C, acide hyaluronique, peptides, lequel choisir ?",
    excerpt:
      "Trois actifs stars, trois usages très différents. Le guide simple pour choisir son sérum visage selon son besoin (éclat, hydratation, anti-âge) et les combiner sans erreur.",
    category: "Ingrédients",
    date: "18 mai 2026",
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
    readingTime: "5 min",
    image: "/image/landing/SPF.webp",
  },
];

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
