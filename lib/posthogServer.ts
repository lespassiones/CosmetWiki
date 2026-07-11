/**
 * Capture PostHog CÔTÉ SERVEUR (fire-and-forget, jamais bloquant).
 *
 * POURQUOI serveur : les événements métier (signup, scan, premium...) partent
 * de là où la vérité se produit (server actions / API routes / webhooks), avec
 * le user id Supabase comme distinct_id — parité exacte avec l'app mobile et
 * impossible à rater côté client (adblock, fermeture d'onglet...).
 *
 * Convention : chaque événement porte `platform: "web" | "mobile"` (les
 * insights du dashboard « Cosme Check — Mobile + Web » cassent par cette
 * propriété). Le suivi de NAVIGATION (pageviews, replay) reste côté client
 * (PostHogInit), lui.
 */

const PH_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const PH_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

export type ProductEvent =
  | "signup"
  | "onboarding_completed"
  | "scan_completed"
  | "routine_item_added"
  | "premium_started";

/** Envoie un événement produit. Ne throw jamais, n'attend pas la réponse. */
export function phCapture(
  event: ProductEvent,
  distinctId: string,
  properties: Record<string, unknown> = {},
): void {
  if (!PH_KEY || !distinctId) return;
  void fetch(`${PH_HOST}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: PH_KEY,
      event,
      distinct_id: distinctId,
      properties: { platform: "web", ...properties },
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {
    /* best-effort : l'analytics ne casse jamais une action utilisateur */
  });
}
