// DuckDuckGo HTML search fallback : we hit html.duckduckgo.com, parse the
// result links, then run Mistral extraction on the candidate pages.
//
// No domain whitelist: any http(s) result the user could have clicked on in a
// browser is fair game. The garde-fous are technical, not editorial — strict
// timeout + content-type check in `fetchPageHtml`, and we never store or
// expose raw HTML, only the INCI string Mistral extracts.

import { fetchPageHtml } from "./httpFetch";
import { extractInciFromHtml } from "./extractWithMistral";
import { matchesQuery } from "./relevance";

const SEARCH_URL = "https://html.duckduckgo.com/html/?q=";

// Max candidates we'll deep-fetch automatically inside the cascade before
// giving up. Each adds ~1 HTTP fetch + 1 Mistral call, but most niche brand
// pages take 1-3 tries to land on the right product page.
const CASCADE_AUTO_FETCH_LIMIT = 5;

/** A web search candidate without its INCI list. The INCI is fetched lazily
 *  (via /api/deep-fetch) when the user clicks the card, the same pattern as
 *  INCIDecoder candidates. Keeps the deep-search endpoint cheap. */
export type DuckDuckGoCandidate = {
  url: string;
  title: string;
  domain: string;
  brand: string | null;
  productName: string | null;
};

const RESULT_LINK_RE =
  /<a[^>]+class=["'][^"']*result__a[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/g;

function decodeUddg(href: string): string {
  try {
    const url = new URL(href, "https://duckduckgo.com");
    const real = url.searchParams.get("uddg");
    return real ? decodeURIComponent(real) : href;
  } catch {
    return href;
  }
}

/** Accept any http(s) URL. The only filter is the URL parser rejecting
 *  malformed strings and non-web schemes (file:, data:, javascript:). */
function isWebUrl(url: string): boolean {
  try {
    const proto = new URL(url).protocol;
    return proto === "https:" || proto === "http:";
  } catch {
    return false;
  }
}

export async function searchDuckDuckGo(query: string): Promise<{
  brand: string | null;
  productName: string | null;
  ingredientsText: string;
  sourceUrl: string;
} | null> {
  // "Find one and extract INCI" path used by the parallel cascade in
  // `searchProductCascade`. We walk the top candidates and return the first
  // one whose INCI we manage to extract — including small/indie brand sites
  // now that the domain whitelist is gone.
  const candidates = await collectDuckDuckGoCandidates(query, CASCADE_AUTO_FETCH_LIMIT);
  for (const c of candidates) {
    const pageHtml = await fetchPageHtml(c.url);
    if (!pageHtml) continue;
    const inci = await extractInciFromHtml({ label: query, html: pageHtml });
    if (inci) {
      return {
        brand: c.brand,
        productName: c.productName,
        ingredientsText: inci,
        sourceUrl: c.url,
      };
    }
  }
  return null;
}

/**
 * Collect up to `limit` web candidates for the deep-search UI without
 * extracting any INCI. Cheap (one HTML fetch + parsing) so the user can
 * browse 8-12 candidates and we only spend Mistral cost on the one they
 * click. Used by `/api/product-search` when serving the "Voir plus" flow.
 */
export async function collectDuckDuckGoCandidates(
  query: string,
  limit: number,
): Promise<DuckDuckGoCandidate[]> {
  // Query enrichment: bias DDG towards pages that expose a full ingredient
  // list (FR + EN keywords). Without this, generic product pages and
  // marketplaces rank above brand sites that actually publish INCI.
  const searchQuery = `${query} INCI ingrédients composition ingredients`;
  const html = await fetchPageHtml(SEARCH_URL + encodeURIComponent(searchQuery));
  if (!html) return [];

  const seen = new Set<string>();
  const out: DuckDuckGoCandidate[] = [];
  let match: RegExpExecArray | null;
  RESULT_LINK_RE.lastIndex = 0;

  while ((match = RESULT_LINK_RE.exec(html)) !== null) {
    const real = decodeUddg(match[1]!);
    const titleHtml = match[2] ?? "";
    // Sanity check only: must be a real http(s) URL. No domain whitelist.
    if (!isWebUrl(real)) continue;
    // Relevance check: title/URL must mention enough of the query to be
    // plausibly the right product. This is NOT a brand filter — it just
    // weeds out obvious mismatches like ads / unrelated pages.
    const title = stripHtml(titleHtml).slice(0, 160);
    if (!matchesQuery(query, `${title} ${urlSearchableText(real)}`)) continue;
    if (seen.has(real)) continue;
    seen.add(real);

    const domain = safeDomain(real);
    const { brand, productName } = guessBrandAndName(title, domain, query);
    out.push({ url: real, title, domain, brand, productName });
    if (out.length >= limit) break;
  }
  return out;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Best-effort split of a search result title into brand + product name.
 *  We try a few common separators (" - ", " | ", " :") and fall back to the
 *  domain for brand if nothing matches. Pure heuristic — wrong is fine, the
 *  user picks the right card visually. */
function guessBrandAndName(
  title: string,
  domain: string,
  query: string,
): { brand: string | null; productName: string | null } {
  if (!title) {
    return { brand: brandFromDomain(domain), productName: null };
  }
  // Strip trailing "- Domain" / "| Brand" tails common in titles.
  const cleanedTitle = title.replace(/\s*[|·-]\s*[^|·-]{1,30}$/u, "").trim();
  // If the domain matches the start of a known brand, use it; otherwise try
  // a separator split on the title.
  const sepMatch = cleanedTitle.split(/\s+(?:[|·-])\s+/u);
  if (sepMatch.length >= 2) {
    return {
      brand: sepMatch[0]!.slice(0, 80) || brandFromDomain(domain),
      productName: sepMatch.slice(1).join(" ").slice(0, 160) || null,
    };
  }
  // No separator: use the whole title as productName, brand from domain.
  // If the title visibly starts with the query brand, use that instead.
  const queryFirstWord = query.trim().split(/\s+/u)[0]?.toLowerCase() ?? "";
  const titleLower = cleanedTitle.toLowerCase();
  const startsWithQueryBrand =
    queryFirstWord.length > 2 && titleLower.startsWith(queryFirstWord);
  return {
    brand: startsWithQueryBrand ? query.trim().split(/\s+/u)[0]! : brandFromDomain(domain),
    productName: cleanedTitle.slice(0, 160) || null,
  };
}

function brandFromDomain(domain: string): string | null {
  if (!domain) return null;
  const head = domain.split(".")[0] ?? "";
  if (!head) return null;
  return head.charAt(0).toUpperCase() + head.slice(1);
}

function urlSearchableText(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname} ${u.pathname.replace(/[\/_-]+/g, " ")}`;
  } catch {
    return url;
  }
}
