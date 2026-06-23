import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const SUSPICIOUS_UA_RE =
  /(curl|wget|python-requests|go-http|scrapy|httpx|libwww|java\/|axios\/|node-fetch|aiohttp|okhttp|MJ12bot|PetalBot|SemrushBot|AhrefsBot|DotBot|MegaIndex|GPTBot|ClaudeBot|anthropic-ai|CCBot|Bytespider)/i;

const BOT_TRAP_PATHS = ["/admin-bot-trap", "/wp-admin", "/wp-login.php"];

// Pages that require an authenticated session. Public pages stay accessible.
const PROTECTED_PREFIXES = ["/history", "/routine", "/profile", "/compare", "/onboarding"];

// Pages where calling Supabase auth at all is pure waste - they don't read the
// session server-side and they're not gated. Skip the round-trip entirely.
const SKIP_AUTH_PREFIXES = [
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/callback",
  "/about",
  "/comment-ca-marche",
  "/offre",
  "/i/",
  "/a/", // analyses partagées en lecture publique (jamais de session lue)
];

function isSkipAuthPath(pathname: string): boolean {
  return SKIP_AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

function hasSupabaseAuthCookie(req: NextRequest): boolean {
  // Supabase-ssr stores auth as sb-<project-ref>-auth-token (sometimes split
  // into .0 / .1 chunks). A cheap presence check lets us bail before spinning
  // up a Supabase client when the user clearly has no session at all.
  for (const cookie of req.cookies.getAll()) {
    if (cookie.name.startsWith("sb-") && cookie.name.includes("auth-token")) {
      return true;
    }
  }
  return false;
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function redirectToSignIn(req: NextRequest, pathname: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = "/auth/sign-in";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

// Timeout dur sur l'appel Supabase Auth. La middleware Vercel a un budget de
// 25 s avant kill (MIDDLEWARE_INVOCATION_TIMEOUT → 504 pour TOUTE la page).
// Si Supabase Auth est lent/down, on préfère laisser passer la requête sans
// rafraîchir le cookie : les page-level checks (`lib/auth.getUser()`) re-
// valident côté serveur, et au pire l'utilisateur sera redirigé vers la
// sign-in au prochain hit. Mieux qu'une prod entièrement en 504.
const AUTH_REFRESH_TIMEOUT_MS = 1500;

// Expose the request pathname to Server Components via a custom header.
// Server Components can't read req.nextUrl directly — the supported pattern is
// to set a request header in middleware and read it via `headers()` in the
// layout. Used by app/layout.tsx to skip Supabase calls on public landing pages.
function withPathnameHeader(req: NextRequest, pathname: string): Headers {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  return requestHeaders;
}

async function refreshSession(req: NextRequest, pathname: string): Promise<NextResponse> {
  const res = NextResponse.next({ request: { headers: withPathnameHeader(req, pathname) } });
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    },
  );
  try {
    await Promise.race([
      sb.auth.getUser(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("supabase_auth_timeout")),
          AUTH_REFRESH_TIMEOUT_MS,
        ),
      ),
    ]);
  } catch {
    // Auth Supabase injoignable ou trop lente : on retourne la réponse en
    // l'état. Pas de refresh de cookie cette fois — le prochain hit re-tentera.
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Always-on security checks ─────────────────────────────────────────
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

  // ── Skip auth refresh on API routes ───────────────────────────────────
  // Chaque API route fait son propre `sb.auth.getUser()` (via apiGate, ou en
  // direct comme /api/credits). Sans ce bypass, chaque hit /api/* déclenche
  // DEUX round-trips Supabase Auth : un dans la middleware, un dans le
  // handler. Sous charge ça double les appels Auth et fait dépasser le
  // budget IO Supabase. supabase-ssr rafraîchit le cookie côté handler dans
  // tous les cas, donc rien n'est perdu.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next({ request: { headers: withPathnameHeader(req, pathname) } });
  }

  // ── Auth refresh / gating ─────────────────────────────────────────────
  // Goal : avoid calling Supabase Auth (a network round-trip) when it can't
  // possibly do anything useful. Three cheap exits before the Supabase client
  // is ever instantiated.
  const isProtected = isProtectedPath(pathname);
  const isPrefetch =
    req.headers.get("next-router-prefetch") === "1"
    || req.headers.get("purpose") === "prefetch";
  const hasSession = hasSupabaseAuthCookie(req);

  if (isProtected) {
    // Protected: a missing cookie is enough to redirect - no need to ask
    // Supabase. The page server component will validate the cookie itself
    // via lib/auth.getUser() (cached for the request).
    if (!hasSession) return redirectToSignIn(req, pathname);
    // Prefetch on a protected route : let the RSC payload through without
    // refreshing the session. The real navigation will trigger its own
    // middleware run that does the refresh.
    if (isPrefetch) return NextResponse.next({ request: { headers: withPathnameHeader(req, pathname) } });
    return refreshSession(req, pathname);
  }

  // Public route : refresh the session only when there's something to refresh
  // and the request is a real navigation. Skips:
  //   - prefetches (hover may never become a click)
  //   - users with no session at all
  //   - sign-in / sign-up / static info pages where the cookie isn't read
  if (!hasSession || isPrefetch || isSkipAuthPath(pathname)) {
    return NextResponse.next({ request: { headers: withPathnameHeader(req, pathname) } });
  }
  return refreshSession(req, pathname);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|css|js)$).*)"],
};
