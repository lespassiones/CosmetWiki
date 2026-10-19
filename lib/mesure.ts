import posthog from "posthog-js";

/**
 * La mesure de la lecture du blog, et le seul fichier qui en parle à PostHog.
 *
 * Portée de MemoryPilot et de RevealChat (`src/lib/mesure.ts`), pour la même
 * raison : le robot éditorial du matin (`docs/seo/ROBOT.md`) doit lire,
 * article par article, combien de gens arrivent, jusqu'où ils lisent et s'ils
 * touchent « Télécharger ». Les noms d'événements sont **les mêmes** que sur
 * les deux autres sites : le robot les interroge avec les mêmes requêtes.
 *
 * | événement | quand | propriétés |
 * |---|---|---|
 * | `$pageview`, `$pageleave` | chaque page, et sa sortie (profondeur de défilement) | celles de PostHog (`components/PostHogInit.tsx`) |
 * | `cta_clic` | un appel à télécharger d'un article est touché | `source` (`<slug>-<emplacement>`), `destination` (`magasin` ou `modale`), `slug`, `emplacement` |
 * | `section_atteinte` | un `h2` d'article entre à l'écran, une fois par visite | `slug`, `section` (son ancre), `index` (à partir de 1), `total` |
 *
 * ## Sans cookie tant qu'il n'y a pas de consentement
 *
 * La politique de confidentialité (`/confidentialite`, section 9) promet une
 * mesure d'audience exemptée de consentement : pas de cookie de pistage, pas
 * de session replay, pas de profil. Le site n'a pas de bandeau cookies, donc
 * **personne n'a consenti** : PostHog tourne en `cookieless_mode: 'always'`
 * (rien n'est écrit dans le navigateur, le visiteur est reconnu par une
 * empreinte calculée sur les serveurs de PostHog, dont le sel change chaque
 * jour), sans replay, sans carte de chaleur, sans profil.
 *
 * Le jour où un bandeau existe, il appelle `enregistrerConsentementMesure`
 * avec le choix du visiteur : « accepte » rétablit la mesure complète
 * (cookies, replay masqué, identité de l'utilisateur connecté) au chargement
 * suivant. `lib/consent.ts`, lui, porte le consentement aux CGU et à la
 * newsletter recueilli dans l'app : il ne dit rien des cookies du site, et
 * n'est donc pas lu ici.
 *
 * ⚠️ Le réglage « Cookieless server hash mode » du projet PostHog (221637)
 * doit rester actif : sans lui, PostHog jette ces événements sans rien dire.
 * Il a été activé le 19/10/2026 (mode 2, comme MemoryPilot).
 */

const CLE_CONSENTEMENT = "cc_mesure";

export type ChoixMesure = "accepte" | "refuse";

/** Le choix du visiteur, ou `null` s'il n'en a jamais fait (le cas de tous aujourd'hui). */
export function consentementMesure(): ChoixMesure | null {
  try {
    const v = window.localStorage.getItem(CLE_CONSENTEMENT);
    return v === "accepte" || v === "refuse" ? v : null;
  } catch {
    // Navigation privée stricte, stockage bloqué : pas de consentement.
    return null;
  }
}

/**
 * À appeler par un futur bandeau cookies. Le choix s'applique au prochain
 * chargement de page : PostHog ne change pas de mode en cours de route.
 */
export function enregistrerConsentementMesure(choix: ChoixMesure): void {
  try {
    window.localStorage.setItem(CLE_CONSENTEMENT, choix);
  } catch {
    // Stockage bloqué : le visiteur reste mesuré sans cookie, ce qui est le repli sûr.
  }
}

/**
 * Envoie un événement nommé, si PostHog tourne.
 *
 * `immediat` sert aux clics qui quittent la page (vers un magasin) : le
 * navigateur coupe les requêtes en cours à la navigation, et `sendBeacon` est
 * le seul transport qui survit.
 */
export function suivre(nom: string, proprietes: Record<string, unknown> = {}, immediat = false): void {
  // `__loaded` : sans clé PostHog (développement, préversion), rien n'est initialisé.
  if (typeof window === "undefined" || !(posthog as unknown as { __loaded?: boolean }).__loaded) return;
  try {
    posthog.capture(
      nom,
      proprietes,
      immediat ? { send_instantly: true, transport: "sendBeacon" } : undefined,
    );
  } catch {
    // La mesure ne casse jamais une page.
  }
}
