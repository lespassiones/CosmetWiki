/**
 * POST /api/ecommerce-scrape
 * Body: { url: string }
 *
 * Pasted-URL flow: an e-commerce page URL → { productName, brand,
 * description, ingredientsText, imageUrl }. Used by the "Coller le lien"
 * tile in the scan sheet. The result is cached per (normalised) URL so a
 * re-scan or a confirm-then-analyse round-trip is free.
 *
 * Rate-limit: per-IP, matched to /api/deep-fetch (same cost profile —
 * 1 HTTP fetch + 1 gpt-4o-mini call per cold request).
 *
 * SSRF: handled inside `validateUserUrl` so any future caller of
 * `scrapeEcommerceUrl` gets the same protection.
 */
import { NextRequest, NextResponse } from "next/server";
import { scrapeEcommerceUrl, type EcommerceScrapeResult } from "@/lib/productSearch/scrapeEcommerceUrl";
import { checkRateLimitShared, getClientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { url?: string };

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  // 20/min — same as /api/deep-fetch. A user pasting a URL twice (preview
  // then confirm) only costs one fresh call thanks to the cache, so this
  // budget covers ~20 distinct products per minute, well above normal use.
  const rl = await checkRateLimitShared(`scrape:${ip}`, 20, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de récupérations récentes. Patiente une minute." },
      {
        status: 429,
        headers: { "Retry-After": Math.ceil(rl.retryAfterMs / 1000).toString() },
      },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const url = (body.url ?? "").trim();
  if (!url) {
    return NextResponse.json({ error: "URL manquante." }, { status: 400 });
  }

  const result: EcommerceScrapeResult = await scrapeEcommerceUrl(url);
  if (!result.ok) {
    // Map our internal reason to an HTTP status:
    //  - 400 for input we refused (invalid URL)
    //  - 404 / 451 / 502 / 422 for upstream and content issues, matched as
    //    closely as possible to standard HTTP semantics so the client gets
    //    something monitorable beyond a generic 5xx wall.
    const status =
      result.reason === "invalid_url"
        ? 400
        : result.reason === "not_found"
          ? 404
          : result.reason === "site_blocked"
            ? 451 // Unavailable for Legal Reasons — closest fit for "the site is blocking us"
            : result.reason === "fetch_failed" || result.reason === "html_too_large"
              ? 502
              : 422;
    return NextResponse.json({ error: result.message, reason: result.reason }, { status });
  }

  return NextResponse.json(result);
}
