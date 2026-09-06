import { NextRequest, NextResponse } from "next/server";
import { getAppConfig } from "@/lib/appConfig";
import { retiredReason } from "@/lib/retiredRoutes";

/**
 * Middleware du site public.
 *
 * Ce qui a disparu ici avec la web app connectée :
 *   - la création d'un client Supabase et le `auth.getUser()` de rafraîchissement
 *     de session, qui coûtait un aller-retour réseau sur CHAQUE navigation,
 *   - le garde-fou des routes protégées (`/history`, `/routine`, `/profile`,
 *     `/compare`, `/onboarding`) et sa redirection vers `/auth/sign-in`,
 *   - la liste `SKIP_AUTH_PREFIXES`, devenue sans objet puisque plus aucune page
 *     ne lit de session,
 *   - l'en-tête `x-pathname`, qui n'existait que pour permettre au layout racine
 *     de décider s'il devait appeler Supabase.
 *
 * Il ne reste que trois responsabilités, toutes sans appel réseau sauf le mode
 * maintenance, dont la lecture est mise en cache environ 60 s :
 *   1. les contrôles de sécurité (pièges à bots, User-Agent),
 *   2. le mode maintenance piloté depuis l'admin,
 *   3. la redirection des anciennes URLs de la web app vers la page d'accueil,
 *      avec le paramètre qui déclenche la modale de téléchargement.
 */

const SUSPICIOUS_UA_RE =
  /(curl|wget|python-requests|go-http|scrapy|httpx|libwww|java\/|axios\/|node-fetch|aiohttp|okhttp|MJ12bot|PetalBot|SemrushBot|AhrefsBot|DotBot|MegaIndex|GPTBot|ClaudeBot|anthropic-ai|CCBot|Bytespider)/i;

const BOT_TRAP_PATHS = ["/admin-bot-trap", "/wp-admin", "/wp-login.php"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Contrôles de sécurité, toujours actifs ────────────────────────────
  if (BOT_TRAP_PATHS.includes(pathname)) {
    return new NextResponse("Not found", {
      status: 404,
      headers: { "X-Bot-Trapped": "1" },
    });
  }

  const ua = req.headers.get("user-agent") ?? "";
  if (!ua) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  if (SUSPICIOUS_UA_RE.test(ua) && pathname.startsWith("/api/")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Les routes API restantes (health, contact, recherche, explain, bêta,
  // indexnow) font leurs propres contrôles. Rien à faire ici.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ── Anciennes URLs de la web app ──────────────────────────────────────
  // 308 et non 301 : la redirection est définitive, mais on veut qu'un
  // éventuel POST conserve sa méthode plutôt que d'être transformé en GET.
  // Google traite les deux comme une redirection permanente et transfère le
  // signal vers la page d'accueil.
  const reason = retiredReason(pathname);
  if (reason) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    url.searchParams.set("app", reason);
    return NextResponse.redirect(url, 308);
  }

  // ── Mode maintenance ──────────────────────────────────────────────────
  // Quand l'admin bascule la maintenance (Paramètres → mode maintenance),
  // toutes les pages sont réécrites vers /maintenance. L'URL est préservée,
  // donc un simple rafraîchissement restaure la page à la fin. Les routes API
  // sont exemptées (traitées plus haut) pour que les contrôles de santé et les
  // assets de la page continuent de répondre. `getAppConfig` est mis en cache
  // (environ 60 s) et FAIL-OPEN : un incident base retombe sur
  // `maintenance_mode = false`, donc ceci ne peut jamais verrouiller le site
  // par erreur.
  if (pathname !== "/maintenance") {
    const cfg = await getAppConfig();
    if (cfg.maintenance_mode) {
      const url = req.nextUrl.clone();
      url.pathname = "/maintenance";
      url.search = "";
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|css|js)$).*)"],
};
