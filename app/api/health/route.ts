/**
 * GET /api/health
 *
 * Sonde de disponibilité du site, lue par l'admin (`HealthPing`, toutes les
 * 10 s, il ne regarde que `r.ok`) et par tout moniteur externe.
 *
 * Réponse STATIQUE, générée au build et servie par le CDN : aucune fonction
 * ne s'exécute. Avant le 15 nov 2026 elle interrogeait Supabase à chaque
 * appel, soit jusqu'à 8 640 exécutions par jour admin ouvert, pour une
 * information (« la base répond ») que l'admin lit déjà directement.
 *
 * Elle reste un vrai signal : si le site tombe (déploiement suspendu, panne
 * Vercel), le CDN ne renvoie plus 200.
 *
 * L'en-tête CORS (`Access-Control-Allow-Origin: *`) est posé par
 * `next.config.ts` : la réponse est lue depuis le domaine de l'admin.
 */
export const dynamic = "force-static";

export function GET() {
  return Response.json({ ok: true });
}
