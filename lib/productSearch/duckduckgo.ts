// DuckDuckGo HTML search fallback : we hit html.duckduckgo.com, parse the
// result links, keep only domains we know we can fetch (others 403 us),
// then run Mistral extraction on the first fetchable page.

import { fetchPageHtml } from "./httpFetch";
import { extractInciFromHtml } from "./extractWithMistral";
import { matchesQuery } from "./relevance";

const SEARCH_URL = "https://html.duckduckgo.com/html/?q=";

// Domains that historically respond to a browser-style fetch and tend to
// expose a full INCI list. Skinsort, INCI Beauty etc. block bots so we
// don't even try.
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
  /<a[^>]+class=["'][^"']*result__a[^"']*["'][^>]+href=["']([^"']+)["']/g;

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
  const searchQuery = `${query} INCI ingredients composition`;
  const html = await fetchPageHtml(
    SEARCH_URL + encodeURIComponent(searchQuery),
  );
  if (!html) return null;

  const candidates: string[] = [];
  let match: RegExpExecArray | null;
  RESULT_LINK_RE.lastIndex = 0;
  while ((match = RESULT_LINK_RE.exec(html)) !== null) {
    const real = decodeUddg(match[1]!);
    // The URL path is our cheapest relevance signal — if no query token
    // appears anywhere in the candidate URL, it's almost certainly a generic
    // "list of all products" page and not the one we asked for.
    if (
      isFetchable(real) &&
      matchesQuery(query, urlSearchableText(real)) &&
      !candidates.includes(real)
    ) {
      candidates.push(real);
    }
    if (candidates.length >= 3) break;
  }
  if (candidates.length === 0) return null;

  for (const url of candidates) {
    const pageHtml = await fetchPageHtml(url);
    if (!pageHtml) continue;
    const inci = await extractInciFromHtml({ label: query, html: pageHtml });
    if (inci) {
      return {
        brand: null,
        productName: null,
        ingredientsText: inci,
        sourceUrl: url,
      };
    }
  }

  return null;
}

function urlSearchableText(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname} ${u.pathname.replace(/[\/_-]+/g, " ")}`;
  } catch {
    return url;
  }
}
