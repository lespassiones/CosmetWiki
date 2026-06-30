/**
 * Cache LOCAL persistant des « Suggestions intelligentes » (web twin du mobile
 * lib/routine/deckCache.ts).
 *
 * Stocké dans localStorage, SANS TTL : invalidé uniquement quand la signature
 * change (routine modifiée OU restrictions modifiées). Donc rouvrir la page sans
 * avoir touché à sa routine = ré-affichage instantané, sans re-débiter de crédit,
 * et ce indéfiniment (jusqu'à ce que le navigateur soit vidé). Une seule entrée.
 */
// v5: critère « à optimiser » élargi (orange/rouge >= 1) + re-route sur catégorie
// vide via classifyByName + contexte peau passé à la validation IA (parité mobile
// complète). v4: top 8 trié sévérité + verts restreints inclus. v3: alternative
// VERTE (plafonné >= 13). Bump = purge du cache local (force le recalcul).
const KEY = "cosmecheck:routine_suggestions:v5";

/** Champs d'un produit à risque qui influent sur la suggestion renvoyée. */
type SigProduct = {
  id: string;
  ean: string | null;
  category: string | null;
  score: number;
  cappedScore: number;
};

/**
 * Signature stable (indépendante de l'ordre) des entrées qui déterminent les
 * suggestions : l'ensemble des produits à optimiser (+ leur note/catégorie) et
 * les restrictions du profil. Un changement quelconque ⇒ signature différente
 * ⇒ recalcul (1 crédit). Sinon ⇒ cache.
 */
export function suggestionsSignature(products: SigProduct[], restrictionsSig: string): string {
  const items = products
    .map((p) => `${p.id}:${p.score}:${p.cappedScore}:${p.ean ?? "?"}:${p.category ?? "?"}`)
    .sort()
    .join("|");
  return `${items}#${restrictionsSig}`;
}

/** Renvoie les suggestions cachées si la signature correspond, sinon null. */
export function readSuggestionsCache<T>(signature: string): T[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { sig?: string; items?: T[] };
    return parsed.sig === signature && Array.isArray(parsed.items) ? parsed.items : null;
  } catch {
    return null;
  }
}

/** Écrit les suggestions en cache (best-effort). N'appeler que sur résultat non vide. */
export function writeSuggestionsCache<T>(signature: string, items: T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ sig: signature, items }));
  } catch {
    /* best-effort (quota / mode privé) */
  }
}
