// File d'attente des produits trouvés sur internet SANS code-barres résoluble.
// Alimentée par /api/analyser (web) et par l'Edge Function `analyser` (mobile).
// L'admin (CosmeCheckAdmin /catalog/web-products) y résout l'EAN via LLM puis
// promeut le produit dans le catalogue.

import { supabaseService } from "@/lib/supabase";

/**
 * dedupeKey — clé de dédoublonnage stable (marque + nom). IDENTIQUE au
 * `dedupeKey` mobile (`supabase/functions/_shared/dedupeKey.ts`) : minuscules,
 * sans accents, alphanum, tokens triés, 6 premiers. Garantit qu'un même produit
 * remonté par le web OU le mobile fusionne sur la même ligne `web_products`.
 */
export function normalizeLabel(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function dedupeKey(brand: string | null, name: string | null): string {
  const all = `${brand ?? ""} ${name ?? ""}`;
  return normalizeLabel(all).split(/\s+/).filter(Boolean).sort().slice(0, 6).join(" ");
}

export type WebProductLog = {
  brand: string | null;
  name: string | null;
  category?: string | null;
  ingredientsText?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  sourceUrl?: string | null;
};

/**
 * Archive un produit internet sans EAN dans `cosme_check.web_products`
 * (idempotent côté DB sur dedupe_key, incrémente les occurrences). Toujours
 * non-bloquant : jamais throw, erreurs loguées en warning.
 */
export async function logWebProduct(p: WebProductLog): Promise<void> {
  try {
    const { error } = await supabaseService().rpc("cosme_check_log_web_product", {
      p_dedupe_key: dedupeKey(p.brand, p.name),
      p_brand: p.brand,
      p_name: p.name,
      p_category: p.category ?? null,
      p_ingredients_text: p.ingredientsText ?? null,
      p_description: p.description ?? null,
      p_image_url: p.imageUrl ?? null,
      p_source_url: p.sourceUrl ?? null,
    });
    if (error) console.warn("[web_products] log error:", error.message);
  } catch (err) {
    console.warn("[web_products] log failed:", err);
  }
}
