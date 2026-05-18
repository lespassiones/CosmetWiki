// DuckDuckGo HTML search fallback : we hit html.duckduckgo.com, parse the
// result links, keep only domains we know we can fetch (others 403 us),
// then run Mistral extraction on the first fetchable page.

import { fetchPageHtml } from "./httpFetch";
import { extractInciFromHtml } from "./extractWithMistral";
import { matchesQuery } from "./relevance";

const SEARCH_URL = "https://html.duckduckgo.com/html/?q=";

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

// Domains that historically respond to a browser-style fetch and tend to
// expose a full INCI list. Bot-blocked domains are skipped.
const FETCHABLE_DOMAINS = [
  "incidecoder.com",
  "cosdna.com",
  "m.cosdna.com",
  "laroche-posay.fr",
  "laroche-posay.com",
  "loreal-paris.fr",
  "loreal-paris.com",
  "vichy.fr",
  "vichy.com",
  "avene.fr",
  "avene.com",
  "nivea.fr",
  "nivea.com",
  "yves-rocher.fr",
  "garnier.fr",
  "the-ordinary.com",
  "cerave.fr",
  "cerave.com",
  "bioderma.fr",
  "bioderma.com",
];

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

function isFetchable(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return FETCHABLE_DOMAINS.some((d) => host === d || host.endsWith("." + d));
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
  // Legacy "find one and extract INCI" path used by the parallel cascade in
  // `searchProductCascade`. We try the top-3 candidates and return the first
  // one whose INCI we manage to extract.
  const candidates = await collectDuckDuckGoCandidates(query, 3);
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
  const searchQuery = `${query} INCI ingredients composition`;
  const html = await fetchPageHtml(SEARCH_URL + encodeURIComponent(searchQuery));
  if (!html) return [];

  const seen = new Set<string>();
  const out: DuckDuckGoCandidate[] = [];
  let match: RegExpExecArray | null;
  RESULT_LINK_RE.lastIndex = 0;

  while ((match = RESULT_LINK_RE.exec(html)) !== null) {
    const real = decodeUddg(match[1]!);
    const titleHtml = match[2] ?? "";
    if (!isFetchable(real)) continue;
    if (!matchesQuery(query, urlSearchableText(real))) continue;
    if (seen.has(real)) continue;
    seen.add(real);

    const title = stripHtml(titleHtml).slice(0, 160);
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
