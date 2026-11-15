/**
 * Anciennes URLs retirées du site : la web app connectée (septembre 2026),
 * puis l'annuaire d'ingrédients et la recherche (novembre 2026).
 *
 * Ces chemins restent dans des favoris, des emails, l'historique des
 * navigateurs et l'index de Google. Ils sont redirigés vers la page d'accueil
 * avec `?app=<raison>`, ce qui ouvre la modale de téléchargement avec le bon
 * message plutôt que d'afficher un 404 sans explication.
 *
 * ⚠️ Plus de middleware (retirée le 15 nov 2026). Elle s'exécutait sur CHAQUE
 * page vue, robots compris : 174 000 exécutions et 43 % du temps CPU facturé
 * par Vercel sur 30 jours, au point de suspendre le site (quota Hobby Fluid
 * Active CPU dépassé). Les redirections sont désormais déclarées dans
 * `next.config.ts` via `retiredRedirects()` : Vercel les applique dans son
 * routage, sans exécuter de fonction. Ne pas recréer de middleware.
 *
 * Une erreur ici casserait la réinitialisation de mot de passe de
 * l'application mobile, ou renverrait des pages publiques vers l'accueil :
 * `tests/retiredRoutes.test.ts` vérifie les deux, motifs compilés compris.
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
  // Retirés le 15 nov 2026 : rendus à chaque visite (robots IA compris) pour
  // des pages déjà en `noindex` depuis juillet. Le site est une vitrine plus
  // un blog ; l'analyse des ingrédients vit dans l'application.
  { prefix: "/i", reason: "default" },
  { prefix: "/ingredients", reason: "default" },
  { prefix: "/search", reason: "default" },
  { prefix: "/maintenance", reason: "default" },
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

/** Une redirection au format `redirects()` de `next.config.ts`. */
export type RetiredRedirect = {
  source: string;
  destination: string;
  permanent: true;
};

/** Échappe un chemin pour l'insérer dans une expression régulière. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Les redirections de toutes les anciennes URLs, prêtes pour `next.config.ts`.
 *
 * `permanent: true` donne un 308, comme l'ancienne middleware : définitive,
 * et un éventuel POST garde sa méthode. Google transfère le signal vers
 * l'accueil.
 *
 * Un préfixe qui contient un chemin conservé (`/auth` contient
 * `/auth/reset-password`) reçoit deux règles : le préfixe nu, puis ses
 * sous-chemins SAUF le chemin conservé (lookahead négatif, comparaison par
 * segment comme `retiredReason`).
 */
export function retiredRedirects(): RetiredRedirect[] {
  const out: RetiredRedirect[] = [];
  for (const { prefix, reason } of RETIRED_PREFIXES) {
    const destination = `/?app=${reason}`;
    const kept = KEPT_PATHS.filter((p) => p.startsWith(`${prefix}/`)).map((p) =>
      escapeRegex(p.slice(prefix.length + 1)),
    );
    if (kept.length === 0) {
      // `/x/:path*` couvre aussi `/x` lui-même.
      out.push({ source: `${prefix}/:path*`, destination, permanent: true });
      continue;
    }
    out.push({ source: prefix, destination, permanent: true });
    out.push({
      source: `${prefix}/:path((?!(?:${kept.join("|")})(?:/|$)).*)`,
      destination,
      permanent: true,
    });
  }
  return out;
}
