import Link from "next/link";
import type { IngredientListItem } from "@/lib/glossary";
import type { ColorRating } from "@/lib/supabase";

const DOT: Record<ColorRating, string> = {
  Vert: "bg-emerald-500",
  Jaune: "bg-amber-400",
  Orange: "bg-orange-500",
  Rouge: "bg-rose-500",
};

const DOT_LABEL: Record<ColorRating, string> = {
  Vert: "Sans risque connu",
  Jaune: "Pénalité légère",
  Orange: "Pénalité moyenne",
  Rouge: "Pénalité forte",
};

/**
 * Rendu d'une liste d'ingrédients en grille responsive. Chaque ligne est
 * un lien vers /i/[slug]. C'est le composant partagé entre :
 *   - /glossaire/[lettre]
 *   - /ingredients/[category]
 *
 * Affichage volontairement dense (3 colonnes desktop) pour donner une vision
 * panoramique d'une longue liste sans imposer un scroll infini.
 */
export function IngredientList({ items }: { items: IngredientListItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-white px-6 py-8 text-center text-[14px] text-ink-muted shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.04]">
        Aucun ingrédient à afficher pour le moment.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <li key={it.slug}>
          <Link
            href={`/i/${it.slug}`}
            // Listes pouvant atteindre 2 700 items (lettre P) : le prefetch
            // automatique de Next/Link générerait des centaines de fetch au
            // hover. On le désactive, la navigation classique reste rapide
            // car les pages /i/[slug] sont ISR 24 h.
            prefetch={false}
            className="group flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-black/[0.05] transition hover:ring-black/[0.12] hover:bg-black/[0.01]"
          >
            <span
              aria-label={DOT_LABEL[it.color_rating]}
              title={DOT_LABEL[it.color_rating]}
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[it.color_rating]}`}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium text-ink group-hover:text-[#F43F5E]">
                {prettyName(it.name)}
              </span>
              {it.prevalence_pct !== null && it.prevalence_pct >= 0.05 ? (
                <span className="block text-[11px] text-ink-subtle">
                  {Number(it.prevalence_pct).toFixed(2)} % des produits
                </span>
              ) : null}
            </span>
            <span
              aria-hidden
              className="text-[14px] text-ink-subtle group-hover:text-[#F43F5E]"
            >
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Normalise un nom INCI tout-majuscule en Title Case lisible. */
function prettyName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(" ")
    .map((w) =>
      w.length === 0
        ? w
        : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
}
