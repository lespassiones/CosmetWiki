/**
 * Données partagées du hub /ingredients (index A-Z des fiches INCI).
 * La liste des slugs vient du Data Cache (lib/sitemapData.ts, 24 h) :
 * naviguer tout le hub ne coûte aucune RPC Supabase supplémentaire.
 */
import { loadIngredientSlugs } from "@/lib/sitemapData";

export const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
/** Bucket pour les slugs ne commençant pas par une lettre (chiffres, etc.). */
export const OTHER_KEY = "0-9";
/** Nombre de liens par page de lettre : sous la recommandation Google
 *  (~1 000 liens/page) tout en limitant le nombre de pages paginées. */
export const PAGE_SIZE = 400;

export function letterOf(slug: string): string {
  const c = slug[0]?.toLowerCase() ?? "";
  return /^[a-z]$/.test(c) ? c : OTHER_KEY;
}

export async function slugsByLetter(): Promise<Map<string, string[]>> {
  const slugs = await loadIngredientSlugs();
  const map = new Map<string, string[]>();
  for (const s of slugs) {
    const l = letterOf(s);
    const arr = map.get(l);
    if (arr) {
      arr.push(s);
    } else {
      map.set(l, [s]);
    }
  }
  return map;
}

/** "sodium-lauryl-sulfate" → "Sodium Lauryl Sulfate" (affichage INCI). */
export function displayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
