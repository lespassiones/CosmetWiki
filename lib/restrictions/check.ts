/**
 * Pure restriction matcher. Pass in the analyse items + the user's
 * restrictions and the family list (master table) and get back the list of
 * matched items. No network, no AI, runs on both server and client.
 *
 * The function is intentionally tolerant: families with `tagSlug = null`
 * (not yet bound to a DB tag) are simply ignored, and ingredient matches
 * compare by slug first then fall back to a case-insensitive INCI name
 * comparison so freshly-added items still trigger even when the slug
 * resolution differs between the saved entry and the analyse output.
 */
import type { AnalyseItem } from "../analyseTypes";
import type {
  IngredientFamily,
  RestrictionMatch,
  UserRestrictions,
} from "./types";

/** Narrow shape needed for restriction matching. AnalyseItem satisfies it,
 *  so client-side callers keep working unchanged. The server (analyser
 *  route) can pass a leaner shape built from `enriched` rows without
 *  reconstructing the full AnalyseItem. */
export type CheckableItem = Pick<AnalyseItem, "position" | "input" | "slug" | "name" | "tags">;

export function checkRestrictions(
  items: CheckableItem[],
  restrictions: UserRestrictions,
  families: IngredientFamily[],
): RestrictionMatch[] {
  if (!items || items.length === 0) return [];
  if (
    restrictions.families.length === 0
    && restrictions.ingredients.length === 0
  ) {
    return [];
  }

  // Build tag -> family lookup for the active families only.
  const restrictedFamilySet = new Set(restrictions.families);
  const tagToFamily = new Map<string, IngredientFamily>();
  for (const fam of families) {
    if (!fam.tagSlug) continue;
    if (!restrictedFamilySet.has(fam.slug)) continue;
    tagToFamily.set(fam.tagSlug, fam);
  }

  // Ingredient lookup: by slug and by normalised name.
  const ingredientBySlug = new Map<string, string>();
  const ingredientByName = new Map<string, string>();
  for (const ing of restrictions.ingredients) {
    if (ing.slug) ingredientBySlug.set(ing.slug, ing.name);
    if (ing.name) ingredientByName.set(normaliseInci(ing.name), ing.name);
  }

  const matches: RestrictionMatch[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const inciName = (item.name ?? item.input ?? "").trim();
    const normalised = normaliseInci(inciName);

    // Family match: any of the item.tags maps to a restricted family.
    if (item.tags && item.tags.length > 0) {
      for (const tag of item.tags) {
        const fam = tagToFamily.get(tag);
        if (!fam) continue;
        const key = `f:${fam.slug}:${item.position}`;
        if (seen.has(key)) continue;
        seen.add(key);
        matches.push({
          kind: "family",
          slug: fam.slug,
          label: fam.name,
          position: item.position,
          inciName,
        });
      }
    }

    // Ingredient match: by slug, then by normalised INCI name.
    const slugHit = item.slug ? ingredientBySlug.get(item.slug) : undefined;
    const nameHit = normalised ? ingredientByName.get(normalised) : undefined;
    const ingredientLabel = slugHit ?? nameHit;
    if (ingredientLabel) {
      const key = `i:${item.slug ?? normalised}:${item.position}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({
          kind: "ingredient",
          slug: item.slug ?? normalised,
          label: ingredientLabel,
          position: item.position,
          inciName,
        });
      }
    }
  }

  return matches.sort((a, b) => a.position - b.position);
}

/** Lower-case, trim, collapse whitespace. INCI names are case-insensitive. */
function normaliseInci(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}
