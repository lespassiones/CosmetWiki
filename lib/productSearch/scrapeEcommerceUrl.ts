/**
 * Orchestrate the "user pasted an e-commerce URL" flow:
 *
 *   1. Validate the URL (SSRF/scheme/length checks).
 *   2. Fetch the page HTML with browser-ish headers + detect bot-management
 *      challenges (Cloudflare, Akamai) so we can surface a useful error
 *      instead of a generic "fetch failed".
 *   3. Try to read structured Product metadata from JSON-LD — gets us name,
 *      brand, description and image for free on Shopify/WooCommerce/most
 *      modern shops.
 *   4. If JSON-LD didn't yield a name, fall back to Open Graph / <title> /
 *      first <h1>. Together they cover ~95 % of the cosmetics sites we've
 *      tested (Les Secrets de Loly, Yves Rocher, indie shops…).
 *   5. Run the existing LLM INCI extractor on the same HTML to recover the
 *      ingredients list.
 *   6. Cache the whole bundle keyed by URL so re-paste / re-analyse is free.
 *
 * Cost per cold call: ~$0.0003 (one gpt-4o-mini extraction). Cache hit: $0.
 */

import crypto from "node:crypto";
import { extractInciFromHtml } from "./extractWithMistral";
import { extractProductFromJsonLd, type JsonLdProduct } from "./extractJsonLd";
import { extractMetaFallback } from "./extractMetaFallback";
import { validateUserUrl } from "./validateUrl";
import { getCached, setCached } from "@/lib/ai/client";

export type EcommerceScrapeOk = {
  ok: true;
  productName: string | null;
  brand: string | null;
  description: string | null;
  ingredientsText: string | null;
  imageUrl: string | null;
  sourceUrl: string;
  /** Where each field came from. Useful for telemetry + debugging the
   *  json-ld vs llm-extraction split — and to surface confidence in the UI. */
  source: {
    metadata: "json-ld" | "meta-tags" | "mixed" | "none";
    inci: "llm" | "none";
    cached: boolean;
  };
};

export type EcommerceScrapeErr = {
  ok: false;
  reason:
    | "invalid_url"
    | "fetch_failed"
    | "site_blocked"
    | "not_found"
    | "html_too_large"
    | "no_content"
    | "extraction_failed";
  message: string;
};

export type EcommerceScrapeResult = EcommerceScrapeOk | EcommerceScrapeErr;

const MAX_HTML_BYTES = 1_500_000; // 1.5 MB hard cap — anything heavier is usually
                                  // a single-page app whose HTML alone won't help us.
const CACHE_PREFIX = "ecommerce-scrape:v4:"; // v4 = HTML reducer targets INCI-shaped sequences first (pharma sites)

// Browser-ish headers. Akamai/Cloudflare bot mitigation can still block us
// (they fingerprint TLS + JS execution we can't fake without Playwright), so
// these are best-effort — they're enough to pass most non-managed shops.
const BROWSER_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  DNT: "1",
};

type FetchOutcome =
  | { kind: "ok"; html: string }
  | { kind: "blocked"; vendor: "cloudflare" | "akamai" | "generic"; status: number }
  | { kind: "not_found"; status: number }
  | { kind: "fetch_failed"; reason: string };

/** Lightweight fingerprint for bot-management challenge pages we can't get
 *  past without a real browser. */
function isCloudflareChallenge(server: string, body: string): boolean {
  if (server.includes("cloudflare")) {
    if (body.includes("Just a moment...") || body.includes("cf_chl_") || body.includes("cf-mitigated")) {
      return true;
    }
  }
  return false;
}

function isAkamaiBlock(server: string, body: string): boolean {
  if (server.toLowerCase().includes("akamai")) {
    if (body.includes("Access Denied") || body.includes("Reference #")) return true;
  }
  return false;
}

async function fetchHtmlWithDiagnostics(url: string, timeoutMs = 10_000): Promise<FetchOutcome> {
  let r: Response;
  let target = url;
  try {
    // SSRF : redirections suivies manuellement et revalidées à chaque saut, pour
    // qu'un 302 vers une IP interne (169.254.169.254, 127.x, IP privée…) soit
    // refusé. Sans ça, seule l'URL initiale était validée.
    for (let hop = 0; ; hop++) {
      if (hop > 4) return { kind: "fetch_failed", reason: "too_many_redirects" };
      const v = validateUserUrl(target);
      if (!v.ok) return { kind: "fetch_failed", reason: "blocked_url" };
      r = await fetch(v.url.toString(), {
        headers: BROWSER_HEADERS,
        signal: AbortSignal.timeout(timeoutMs),
        redirect: "manual",
      });
      if (r.status >= 300 && r.status < 400) {
        const loc = r.headers.get("location");
        if (!loc) return { kind: "fetch_failed", reason: "redirect_no_location" };
        target = new URL(loc, v.url).toString();
        continue;
      }
      break;
    }
  } catch (e) {
    return { kind: "fetch_failed", reason: e instanceof Error ? e.message : String(e) };
  }
  const server = (r.headers.get("server") ?? "").toLowerCase();
  const ct = r.headers.get("content-type") ?? "";

  if (r.status === 404) {
    // Drain body so the connection can be reused; ignore content.
    void r.text().catch(() => undefined);
    return { kind: "not_found", status: 404 };
  }

  if (!r.ok) {
    // Sniff the body for a known bot-management signature so we can give a
    // useful message back to the user.
    const body = await r.text().catch(() => "");
    if (isCloudflareChallenge(server, body)) return { kind: "blocked", vendor: "cloudflare", status: r.status };
    if (isAkamaiBlock(server, body)) return { kind: "blocked", vendor: "akamai", status: r.status };
    if (r.status === 403) return { kind: "blocked", vendor: "generic", status: r.status };
    return { kind: "fetch_failed", reason: `http_${r.status}` };
  }

  if (!ct.includes("html") && !ct.includes("text") && !ct.includes("xml")) {
    return { kind: "fetch_failed", reason: `unexpected_content_type:${ct}` };
  }

  const html = await r.text();
  // Some shops respond 200 but with a Cloudflare interstitial inside. Catch
  // that too so we don't waste an LLM call on an empty body.
  if (isCloudflareChallenge(server, html)) {
    return { kind: "blocked", vendor: "cloudflare", status: r.status };
  }
  return { kind: "ok", html };
}

function cacheKeyFor(url: string): string {
  // URLs can contain tracking params we want to ignore for cache lookup —
  // strip query + fragment so `?utm_source=…` doesn't fragment the cache.
  // We keep the path because some shops differentiate variants in the path.
  let normalised = url;
  try {
    const u = new URL(url);
    u.search = "";
    u.hash = "";
    normalised = u.toString();
  } catch {
    /* keep raw */
  }
  const hash = crypto.createHash("sha256").update(normalised).digest("hex").slice(0, 32);
  return CACHE_PREFIX + hash;
}

/**
 * Public entry point. Always resolves (never throws) so callers can use a
 * plain `if (result.ok)` pattern without try/catch noise.
 */
export async function scrapeEcommerceUrl(rawUrl: string): Promise<EcommerceScrapeResult> {
  const validation = validateUserUrl(rawUrl);
  if (!validation.ok) {
    return { ok: false, reason: "invalid_url", message: validation.reason };
  }
  const url = validation.url.toString();
  const cacheKey = cacheKeyFor(url);

  // Cache hit short-circuits the entire flow. We store the OK envelope only —
  // failure modes shouldn't be cached because they're often transient
  // (rate-limit, Cloudflare challenge, ephemeral 5xx).
  const cached = await getCached<EcommerceScrapeOk>(cacheKey);
  if (cached) {
    return { ...cached, source: { ...cached.source, cached: true } };
  }

  const fetched = await fetchHtmlWithDiagnostics(url, 10_000);
  if (fetched.kind === "fetch_failed") {
    return {
      ok: false,
      reason: "fetch_failed",
      message: "Impossible de récupérer la page. Vérifie le lien (page indisponible ou site très lent).",
    };
  }
  if (fetched.kind === "not_found") {
    return {
      ok: false,
      reason: "not_found",
      message: "La page n'existe pas (404). Vérifie le lien et réessaie.",
    };
  }
  if (fetched.kind === "blocked") {
    const who =
      fetched.vendor === "cloudflare"
        ? "Cloudflare"
        : fetched.vendor === "akamai"
          ? "Akamai"
          : "le pare-feu du site";
    return {
      ok: false,
      reason: "site_blocked",
      message: `Ce site bloque les analyses automatiques (${who}). Tu peux coller la composition à la main ou prendre une photo de l'étiquette.`,
    };
  }

  const html = fetched.html;
  if (html.length > MAX_HTML_BYTES) {
    return {
      ok: false,
      reason: "html_too_large",
      message: "Cette page est trop lourde pour être analysée (>1,5 Mo de HTML).",
    };
  }
  if (html.length < 200) {
    return { ok: false, reason: "no_content", message: "La page semble vide." };
  }

  // Step 1: free structured metadata via JSON-LD.
  const jsonLd: JsonLdProduct | null = extractProductFromJsonLd(html);

  // Step 2: fallback meta-tags extraction. We always compute it so we can
  // back-fill any field JSON-LD missed (some shops emit a Product node with
  // a name but no description, etc.).
  const fallback = extractMetaFallback(html);

  const productName = jsonLd?.productName ?? fallback.productName;
  const brand = jsonLd?.brand ?? fallback.brand;
  const description = jsonLd?.description ?? fallback.description;
  const imageUrl = jsonLd?.imageUrl ?? fallback.imageUrl;

  // Step 3: LLM extraction for INCI specifically.
  const label = productName ?? brand ?? validation.url.hostname.replace(/^www\./, "");
  const ingredientsText = await extractInciFromHtml({ label, html });

  if (!ingredientsText && !productName) {
    return {
      ok: false,
      reason: "extraction_failed",
      message:
        "On n'a pas réussi à extraire les ingrédients ni le nom du produit depuis cette page.",
    };
  }

  const metadataSource: EcommerceScrapeOk["source"]["metadata"] =
    jsonLd && (fallback.productName || fallback.description || fallback.imageUrl)
      ? "mixed"
      : jsonLd
        ? "json-ld"
        : productName || brand || description || imageUrl
          ? "meta-tags"
          : "none";

  const result: EcommerceScrapeOk = {
    ok: true,
    productName,
    brand,
    description,
    ingredientsText: ingredientsText ?? null,
    imageUrl,
    sourceUrl: url,
    source: {
      metadata: metadataSource,
      inci: ingredientsText ? "llm" : "none",
      cached: false,
    },
  };

  // Cache the result with `cached: false` so re-reads can flip it to true
  // and the UI knows whether this came from a fresh fetch or the cache.
  void setCached(cacheKey, result);

  return result;
}
