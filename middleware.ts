import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const SUSPICIOUS_UA_RE =
  /(curl|wget|python-requests|go-http|scrapy|httpx|libwww|java\/|axios\/|node-fetch|aiohttp|okhttp|MJ12bot|PetalBot|SemrushBot|AhrefsBot|DotBot|MegaIndex|GPTBot|ClaudeBot|anthropic-ai|CCBot|Bytespider)/i;

const BOT_TRAP_PATHS = ["/admin-bot-trap", "/wp-admin", "/wp-login.php"];
// Pages that require an authenticated session. Public pages stay accessible.
const PROTECTED_PREFIXES = ["/history", "/routine", "/profile", "/compare"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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

  // Refresh the Supabase session cookie on every request and gate protected routes.
  const res = NextResponse.next();
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

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected) {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/sign-in";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  } else {
    // Even on public routes, hit getUser() once so the cookie is refreshed.
    await sb.auth.getUser();
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|css|js)$).*)"],
};
