/**
 * Server-only read of the ingredient_families master list. Cached for the
 * lifetime of a request via React's `cache()` so the settings page and the
 * analyser can both call it without doubling the round-trip.
 */
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { supabaseServer } from "../supabase";
import type { IngredientFamily } from "./types";

type RawRow = {
  slug: string;
  tag_slug: string | null;
  name: string;
  description_simple: string;
  sort_order: number;
};

export const loadIngredientFamilies = cache(async (): Promise<IngredientFamily[]> => {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data, error } = await sb
    .schema("cosme_check")
    .from("ingredient_families")
    .select("slug, tag_slug, name, description_simple, sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) return [];

  return (data as RawRow[]).map((r) => ({
    slug: r.slug,
    tagSlug: r.tag_slug,
    name: r.name,
    descriptionSimple: r.description_simple,
    sortOrder: r.sort_order,
  }));
});
