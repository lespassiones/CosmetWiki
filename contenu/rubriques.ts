/**
 * Les rubriques du blog, et leurs couleurs.
 *
 * Elles vivent hors du registre des articles pour une seule raison : la liste
 * du blog et le carrousel de l'accueil sont des composants client, et ils ont
 * besoin de ces mots. Les lire dans le registre aurait embarqué le texte de
 * tous les articles dans le JavaScript de `/blog`, pour afficher six boutons.
 *
 * Une rubrique ajoutée ici apparaît d'elle-même dans le filtre de la liste.
 * Les familles du mélange éditorial (`docs/seo/ROBOT.md`, section 2) ne sont
 * pas les rubriques : une famille sert au robot à doser ses sujets, une
 * rubrique sert au lecteur à trier.
 */
export const CATEGORIES = [
  "Ingrédients",
  "Routines",
  "Tendances",
  "Célébrités",
  "Marques",
  "Réglementation",
] as const;

export type Categorie = (typeof CATEGORIES)[number];

/** La pastille d'une rubrique, sur les cartes et en tête d'article (classes Tailwind). */
export const STYLE_CATEGORIE: Record<Categorie, string> = {
  Ingrédients: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Routines: "bg-rose-50 text-rose-700 ring-rose-100",
  Tendances: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100",
  Célébrités: "bg-orange-50 text-orange-700 ring-orange-100",
  Marques: "bg-violet-50 text-violet-700 ring-violet-100",
  Réglementation: "bg-amber-50 text-amber-700 ring-amber-100",
};

/** La pastille pleine, posée sur la photo de couverture d'un article. */
export const FOND_CATEGORIE: Record<Categorie, string> = {
  Ingrédients: "bg-emerald-500/90",
  Routines: "bg-rose-500/90",
  Tendances: "bg-fuchsia-500/90",
  Célébrités: "bg-orange-500/90",
  Marques: "bg-violet-500/90",
  Réglementation: "bg-amber-500/90",
};
