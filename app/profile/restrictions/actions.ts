"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase";
import {
  EMPTY_RESTRICTIONS,
  readUserRestrictions,
  type RestrictedIngredient,
  type UserRestrictions,
} from "@/lib/restrictions/types";

export type RestrictionResult = { ok: true } | { ok: false; error: string };

const MAX_FAMILIES = 60;
const MAX_INGREDIENTS = 80;

/**
 * Read-modify-write `preferences.restrictions`. Kept in one place so the
 * three mutators (families, add ingredient, remove ingredient) stay
 * symmetrical and never lose the other half of the data.
 */
async function mutateRestrictions(
  apply: (current: UserRestrictions) => UserRestrictions,
): Promise<RestrictionResult> {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Non connecté." };

  const { data: existing } = await sb
    .schema("cosme_check")
    .from("user_profiles")
    .select("preferences")
    .eq("id", user.id)
    .maybeSingle();

  const prefs = (existing?.preferences ?? {}) as Record<string, unknown>;
  const current = readUserRestrictions(prefs);
  const next = apply(current);

  const merged = {
    ...prefs,
    restrictions: {
      families: next.families,
      ingredients: next.ingredients,
    },
  };

  const { error } = await sb
    .schema("cosme_check")
    .from("user_profiles")
    .update({ preferences: merged, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/profile/restrictions");
  revalidatePath("/routine");
  return { ok: true };
}

/** Replace the full set of restricted family slugs. */
export async function saveRestrictionsFamilies(slugs: string[]): Promise<RestrictionResult> {
  const cleaned = Array.from(
    new Set(
      slugs
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.length <= 80),
    ),
  ).slice(0, MAX_FAMILIES);

  return mutateRestrictions((current) => ({
    families: cleaned,
    ingredients: current.ingredients,
  }));
}

/** Add a single ingredient. Idempotent: re-adding is a no-op. */
export async function addRestrictionIngredient(
  ingredient: RestrictedIngredient,
): Promise<RestrictionResult> {
  const slug = (ingredient.slug ?? "").trim();
  const name = (ingredient.name ?? "").trim();
  if (!slug || !name) return { ok: false, error: "Ingrédient invalide." };

  return mutateRestrictions((current) => {
    if (current.ingredients.some((i) => i.slug === slug)) return current;
    if (current.ingredients.length >= MAX_INGREDIENTS) return current;
    return {
      families: current.families,
      ingredients: [...current.ingredients, { slug, name }],
    };
  });
}

/** Remove a single ingredient by slug. */
export async function removeRestrictionIngredient(slug: string): Promise<RestrictionResult> {
  const target = slug.trim();
  if (!target) return { ok: false, error: "Slug manquant." };

  return mutateRestrictions((current) => ({
    families: current.families,
    ingredients: current.ingredients.filter((i) => i.slug !== target),
  }));
}

/** Wipe both lists. Useful for the "Tout désactiver" CTA. */
export async function clearRestrictions(): Promise<RestrictionResult> {
  return mutateRestrictions(() => EMPTY_RESTRICTIONS);
}

/**
 * Search the ingredient catalogue for the "Ingrédients" tab autocomplete.
 * Limited to a small page so we never haul the 15k-row table into memory.
 * Matches by INCI name (case-insensitive) and by slug prefix.
 */
export async function searchIngredientsForRestrictions(
  query: string,
): Promise<{ slug: string; name: string; colorRating: string | null }[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);

  const pattern = `%${q.replace(/[%_]/g, "\\$&")}%`;
  const { data } = await sb
    .schema("cosme_check")
    .from("ingredients")
    .select("slug, name, color_rating")
    .or(`name.ilike.${pattern},slug.ilike.${pattern}`)
    .limit(12);

  if (!data) return [];

  return (data as { slug: string; name: string; color_rating: string | null }[]).map(
    (r) => ({ slug: r.slug, name: r.name, colorRating: r.color_rating }),
  );
}
