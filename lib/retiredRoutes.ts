/**
 * Anciennes URLs de la web app connectée, retirées du site.
 *
 * Isolé de `middleware.ts` pour être testable sans `next/server` ni Supabase :
 * une erreur ici casserait la réinitialisation de mot de passe de
 * l'application mobile, ou renverrait des pages publiques vers l'accueil.
 *
 * Ces chemins restent dans des favoris, des emails, l'historique des
 * navigateurs et l'index de Google. La middleware les redirige vers la page
 * d'accueil avec `?app=<raison>`, ce qui ouvre la modale de téléchargement
 * avec le bon message plutôt que d'afficher un 404 sans explication.
 */

/** Raison de la redirection : elle choisit le message de la modale. */
export type RetiredReason = "auth" | "premium" | "default";

const RETIRED_PREFIXES: readonly { prefix: string; reason: RetiredReason }[] = [
  { prefix: "/auth", reason: "auth" },
  { prefix: "/onboarding", reason: "auth" },
  { prefix: "/offre", reason: "premium" },
  { prefix: "/advisor", reason: "default" },
  { prefix: "/analyse", reason: "default" },
  { prefix: "/compare", reason: "default" },
  { prefix: "/history", reason: "default" },
  { prefix: "/produits", reason: "default" },
  { prefix: "/profile", reason: "default" },
  { prefix: "/promesses", reason: "default" },
  { prefix: "/routine", reason: "default" },
];

/**
 * Chemins CONSERVÉS bien qu'ils tombent sous un préfixe retiré.
 *
 * `/auth/reset-password` est la page d'atterrissage du lien « mot de passe
 * oublié » envoyé par l'APPLICATION MOBILE (cf. `PASSWORD_RESET_WEB_URL` dans
 * le dépôt mobile). La rediriger casserait la réinitialisation de mot de passe
 * sur mobile, sans aucun message d'erreur visible côté app.
 */
const KEPT_PATHS: readonly string[] = ["/auth/reset-password"];

function matches(pathname: string, prefix: string): boolean {
  // Comparaison par SEGMENT : `/analysery` ne doit pas matcher `/analyse`, et
  // `/produits-bio` ne doit pas matcher `/produits`. Sans cette règle, une
  // future page publique dont le nom commence par un préfixe retiré serait
  // redirigée sans qu'on comprenne pourquoi.
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Renvoie la raison de redirection pour ce chemin, ou `null` s'il doit être
 * servi normalement.
 */
export function retiredReason(pathname: string): RetiredReason | null {
  if (KEPT_PATHS.some((p) => matches(pathname, p))) return null;
  const hit = RETIRED_PREFIXES.find((r) => matches(pathname, r.prefix));
  return hit ? hit.reason : null;
}
