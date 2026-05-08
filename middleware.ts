import { NextRequest, NextResponse } from "next/server";

const SUSPICIOUS_UA_RE =
  /(curl|wget|python-requests|go-http|scrapy|httpx|libwww|java\/|axios\/|node-fetch|aiohttp|okhttp|MJ12bot|PetalBot|SemrushBot|AhrefsBot|DotBot|MegaIndex|GPTBot|ClaudeBot|anthropic-ai|CCBot|Bytespider)/i;

const BOT_TRAP_PATHS = ["/admin-bot-trap", "/wp-admin", "/wp-login.php"];

export function middleware(req: NextRequest) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|css|js)$).*)"],
};
