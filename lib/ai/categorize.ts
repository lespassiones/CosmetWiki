/**
 * Product categorization from the top INCI ingredients. Cached per fingerprint
 * of the first 5 ingredients.
 */
import crypto from "node:crypto";
import { AI_MODEL, callWithFallback, getCached, hasOpenAI, openai, setCached } from "./client";

export type ProductCategory =
  | "creme_visage"
  | "creme_corps"
  | "shampooing"
  | "apres_shampooing"
  | "solaire"
  | "maquillage"
  | "nettoyant_visage"
  | "deodorant"
  | "parfum"
  | "autre";

const VALID = new Set<ProductCategory>([
  "creme_visage",
  "creme_corps",
  "shampooing",
  "apres_shampooing",
  "solaire",
  "maquillage",
  "nettoyant_visage",
  "deodorant",
  "parfum",
  "autre",
]);

export async function categorizeProduct(
  top5: string[],
  userId?: string | null,
): Promise<ProductCategory> {
  if (top5.length === 0) return "autre";
  const key = crypto
    .createHash("sha256")
    .update(top5.map((s) => s.toUpperCase().trim()).join("|"))
    .digest("hex")
    .slice(0, 24);
  const cacheKey = `categorize:${key}`;
  const cached = await getCached<{ category: ProductCategory }>(cacheKey);
  if (cached?.category) return cached.category;

  if (!hasOpenAI()) return "autre";

  const system =
    "Tu es un expert cosmétique. À partir des 5 premiers ingrédients INCI d'un produit, identifie sa catégorie. Réponds en JSON strict avec une seule clé `category` dont la valeur est exactement l'une des catégories autorisées.";
  const user = `5 premiers ingrédients : ${top5.join(", ")}.

Catégories autorisées (réponds avec la valeur exacte) :
- creme_visage
- creme_corps
- shampooing
- apres_shampooing
- solaire
- maquillage
- nettoyant_visage
- deodorant
- parfum
- autre

JSON attendu : { "category": "<valeur>" }`;

  try {
    const value = await callWithFallback<ProductCategory>({
      feature: "categorize",
      userId: userId ?? null,
      timeoutMs: 6000,
      primary: async () => {
        const r = await openai().chat.completions.create({
          model: AI_MODEL,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        });
        const raw = r.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(raw) as { category?: string };
        const cat = (parsed.category ?? "autre") as ProductCategory;
        return {
          value: VALID.has(cat) ? cat : "autre",
          tokensIn: r.usage?.prompt_tokens,
          tokensOut: r.usage?.completion_tokens,
        };
      },
      fallback: async () => ({ value: "autre" as ProductCategory, provider: "openai" }),
    });
    void setCached(cacheKey, { category: value });
    return value;
  } catch {
    return "autre";
  }
}
