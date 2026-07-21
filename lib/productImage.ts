/**
 * Nettoyage des URLs d'images produit (colonne `image_url` du catalogue).
 *
 * Le catalogue agrège des sources scrappées hétérogènes. Deux cas polluent le
 * rendu ET la console :
 *   - des placeholders « pas de photo » (ex. https://i.touslesprix.com/300/nophoto.jpg,
 *     100 % des URLs touslesprix du catalogue sont des nophoto) ;
 *   - des hôtes qui NE SONT PAS dans l'allowlist `img-src` de la CSP
 *     (next.config.ts) : le navigateur bloque la requête et logge une violation
 *     CSP à chaque carte affichée.
 *
 * Dans les deux cas l'image n'est de toute façon jamais visible. On renvoie donc
 * `null` (= « pas d'image », déjà géré partout par une icône placeholder) au lieu
 * de laisser le navigateur tenter — puis bloquer — le chargement.
 *
 * IMPORTANT : garder `ALLOWED_IMAGE_HOSTS` ALIGNÉ sur la directive `img-src` de
 * next.config.ts. Si un hôte y est ajouté (ex. openbeautyfacts.org), l'ajouter ici.
 */

// Miroir de `img-src` dans next.config.ts (hôtes réellement servables).
const ALLOWED_IMAGE_HOSTS = ["supabase.co", "incibeauty.com"];

// Placeholders scrappés connus — jamais une vraie photo produit.
const PLACEHOLDER_PATTERN = /nophoto|no-photo|no_photo|placeholder|default-product/i;

/**
 * Renvoie l'URL si elle est réellement affichable comme photo produit, sinon
 * `null`. `data:` / `blob:` (canvas, caméra) sont autorisés par la CSP et
 * conservés tels quels.
 */
export function safeProductImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;

  let host: string;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    host = parsed.hostname.toLowerCase();
  } catch {
    // URL relative ou invalide : non affichable comme photo produit distante.
    return null;
  }

  if (PLACEHOLDER_PATTERN.test(trimmed)) return null;

  const allowed = ALLOWED_IMAGE_HOSTS.some(
    (h) => host === h || host.endsWith(`.${h}`),
  );
  return allowed ? trimmed : null;
}
