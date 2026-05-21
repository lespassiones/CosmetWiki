/**
 * Inject the user's restrictions into LLM prompts (analyse synthese,
 * advisor chat, coherence). Same shape as `lib/skin/promptFormat.ts` so
 * callers stay symmetric. Returns null when nothing is restricted.
 */
import "server-only";
import { cookies } from "next/headers";
import { supabaseServer } from "../supabase";
import { loadIngredientFamilies } from "./families";
import {
  EMPTY_RESTRICTIONS,
  hasAnyRestriction,
  readUserRestrictions,
  type IngredientFamily,
  type UserRestrictions,
} from "./types";

export function formatRestrictionsForPrompt(
  restrictions: UserRestrictions,
  familyLabels: Map<string, string>,
): string | null {
  if (!hasAnyRestriction(restrictions)) return null;

  const familyNames = restrictions.families
    .map((slug) => familyLabels.get(slug))
    .filter((n): n is string => Boolean(n));

  const ingredientNames = restrictions.ingredients.map((i) => i.name);

  const lines: string[] = [];
  if (familyNames.length > 0) {
    lines.push(`- Familles d'ingrédients à éviter : ${familyNames.join(", ")}`);
  }
  if (ingredientNames.length > 0) {
    lines.push(`- Ingrédients individuels à éviter : ${ingredientNames.join(", ")}`);
  }
  if (lines.length === 0) return null;

  return [
    "RESTRICTIONS DE L'UTILISATEUR (à respecter dans tes recommandations) :",
    ...lines,
    "Signale-lui en clair lorsqu'un produit contient un de ces éléments. Ne propose jamais un produit qui contient l'un d'eux comme alternative.",
  ].join("\n");
}

/**
 * One-shot helper: load the signed-in user's restrictions and return a
 * ready-to-splice prompt block. Returns null when the user is anonymous,
 * the row is missing, or no restriction is set.
 */
export async function loadRestrictionsForPrompt(userId: string): Promise<string | null> {
  const ctx = await loadRestrictionsContext(userId);
  return ctx.block;
}

export type RestrictionsContext = {
  /** Ready-to-splice prompt block; null when no restriction is configured. */
  block: string | null;
  /** Raw restrictions, defaulted to the empty shape on error. */
  restrictions: UserRestrictions;
  /** Full ingredient family catalogue (active rows only). Empty array on error. */
  families: IngredientFamily[];
};

/**
 * Same as `loadRestrictionsForPrompt` but also returns the raw restrictions
 * + family catalogue so the caller can compute exact item-level matches
 * (used by the analyser route to flag specific ingredients in the synthesis
 * bullet points).
 */
export async function loadRestrictionsContext(userId: string): Promise<RestrictionsContext> {
  try {
    const cookieStore = await cookies();
    const sb = supabaseServer(cookieStore);
    const { data } = await sb
      .schema("cosme_check")
      .from("user_profiles")
      .select("preferences")
      .eq("id", userId)
      .maybeSingle();
    const prefs = (data?.preferences ?? null) as Record<string, unknown> | null;
    const restrictions = readUserRestrictions(prefs);
    if (!hasAnyRestriction(restrictions)) {
      return { block: null, restrictions: EMPTY_RESTRICTIONS, families: [] };
    }
    const families = await loadIngredientFamilies();
    const labels = new Map(families.map((f) => [f.slug, f.name] as const));
    return {
      block: formatRestrictionsForPrompt(restrictions, labels),
      restrictions,
      families,
    };
  } catch {
    return { block: null, restrictions: EMPTY_RESTRICTIONS, families: [] };
  }
}
