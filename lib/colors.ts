import type { ColorRating } from "./supabase";

export const RATING_LABEL: Record<ColorRating, string> = {
  Vert: "Sans risque connu",
  Jaune: "Pénalité légère",
  Orange: "Pénalité moyenne",
  Rouge: "Pénalité forte",
};

export const RATING_DESCRIPTION: Record<ColorRating, string> = {
  Vert: "Aucune restriction connue. Considéré comme sûr aux usages cosmétiques courants.",
  Jaune: "Tolérance variable. À surveiller selon la concentration ou le profil cutané.",
  Orange: "Pénalité significative. Préférer les alternatives quand c'est possible.",
  Rouge: "Substance fortement déconseillée ou réglementée.",
};

export const RATING_CLASS: Record<ColorRating, string> = {
  Vert: "bg-rating-vert-soft text-rating-vert-ink ring-1 ring-rating-vert/20",
  Jaune: "bg-rating-jaune-soft text-rating-jaune-ink ring-1 ring-rating-jaune/30",
  Orange: "bg-rating-orange-soft text-rating-orange-ink ring-1 ring-rating-orange/30",
  Rouge: "bg-rating-rouge-soft text-rating-rouge-ink ring-1 ring-rating-rouge/30",
};

export const RATING_DOT: Record<ColorRating, string> = {
  Vert: "bg-rating-vert",
  Jaune: "bg-rating-jaune",
  Orange: "bg-rating-orange",
  Rouge: "bg-rating-rouge",
};

export const RATING_GRADIENT: Record<ColorRating, string> = {
  Vert: "from-emerald-500 via-green-500 to-teal-500",
  Jaune: "from-amber-400 via-yellow-500 to-orange-400",
  Orange: "from-orange-500 via-orange-600 to-red-500",
  Rouge: "from-red-500 via-rose-600 to-pink-600",
};
