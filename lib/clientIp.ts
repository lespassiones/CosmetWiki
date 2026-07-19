/**
 * IP client *fiable* pour le rate-limiting.
 *
 * `x-forwarded-for` est partiellement contrôlé par le client : sur Vercel, la
 * vraie IP observée est ajoutée en fin de chaîne, mais un attaquant peut
 * préfixer n'importe quelle valeur. Prendre le premier élément (leftmost) rend
 * donc TOUT rate-limit contournable par rotation de X-Forwarded-For.
 *
 * Vercel réécrit `x-vercel-forwarded-for` et `x-real-ip` avec la vraie IP
 * client : on les privilégie. En dernier recours seulement, on prend le
 * *dernier* maillon de x-forwarded-for (le plus proche de l'infra).
 */
export function getTrustedIp(headers: Headers): string {
  const vercel = headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0]!.trim();

  const real = headers.get("x-real-ip");
  if (real) return real.trim();

  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1]!; // rightmost, pas leftmost
  }
  return "0.0.0.0";
}
