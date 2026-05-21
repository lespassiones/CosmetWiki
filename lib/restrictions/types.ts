/**
 * User-defined ingredient restrictions. Stored in
 * cosme_check.user_profiles.preferences (jsonb) under the `restrictions` key,
 * alongside the existing `skin` profile object. Single-row read keeps the
 * routine page and the analyser route fast (no extra join).
 *
 *   preferences.restrictions = {
 *     families:    ["paraben", "sulfate", ...],   // slugs of ingredient_families
 *     ingredients: [{ slug, name }, ...]          // individual INCI picks
 *   }
 */

export type RestrictedIngredient = {
  /** cosme_check.ingredients.slug (kebab case, unique). */
  slug: string;
  /** Display label (INCI name, prettified). Persisted to avoid a join on read. */
  name: string;
};

export type UserRestrictions = {
  families: string[];
  ingredients: RestrictedIngredient[];
};

export const EMPTY_RESTRICTIONS: UserRestrictions = {
  families: [],
  ingredients: [],
};

/**
 * One row from cosme_check.ingredient_families (the master list shown in the
 * settings page). `tagSlug` is the bridge to ingredients.tags[] — when null
 * the family appears in the UI but currently matches no ingredient.
 */
export type IngredientFamily = {
  slug: string;
  tagSlug: string | null;
  name: string;
  descriptionSimple: string;
  sortOrder: number;
};

export type RestrictionMatch = {
  /** Which restriction triggered the match. */
  kind: "family" | "ingredient";
  /** Slug of the matching family or ingredient. */
  slug: string;
  /** Display label (family name or INCI name). */
  label: string;
  /** Position of the ingredient in the analysed INCI list (1-based). */
  position: number;
  /** Ingredient INCI name (raw input) that triggered the match. */
  inciName: string;
};

/** Read `preferences.restrictions` from a user_profiles.preferences jsonb. */
export function readUserRestrictions(
  prefs: Record<string, unknown> | null | undefined,
): UserRestrictions {
  if (!prefs || typeof prefs !== "object") return EMPTY_RESTRICTIONS;
  const raw = (prefs as { restrictions?: unknown }).restrictions;
  if (!raw || typeof raw !== "object") return EMPTY_RESTRICTIONS;

  const r = raw as Record<string, unknown>;
  const families = Array.isArray(r.families)
    ? (r.families as unknown[])
        .filter((s): s is string => typeof s === "string" && s.length > 0)
        .slice(0, 60)
    : [];

  const ingredients: RestrictedIngredient[] = Array.isArray(r.ingredients)
    ? (r.ingredients as unknown[])
        .map((it): RestrictedIngredient | null => {
          if (!it || typeof it !== "object") return null;
          const obj = it as Record<string, unknown>;
          const slug = typeof obj.slug === "string" ? obj.slug.trim() : "";
          const name = typeof obj.name === "string" ? obj.name.trim() : "";
          if (!slug || !name) return null;
          return { slug, name };
        })
        .filter((x): x is RestrictedIngredient => x !== null)
        .slice(0, 80)
    : [];

  return { families, ingredients };
}

export function hasAnyRestriction(r: UserRestrictions): boolean {
  return r.families.length > 0 || r.ingredients.length > 0;
}
