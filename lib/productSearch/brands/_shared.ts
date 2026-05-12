// Shared search routine used by every brand handler: DuckDuckGo with a
// `site:` filter pointed at the brand's own domain, then Mistral extracts
// the INCI from the first fetchable result. Centralising this means a brand
// file is just a tiny config — adding a new brand is ~6 lines.

import { fetchPageHtml } from "../httpFetch";
import { extractInciFromHtml } from "../extractWithMistral";
import { matchesQuery } from "../relevance";
import type { BrandResult } from "./types";

const SEARCH_URL = "https://html.duckduckgo.com/html/?q=";
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

function urlSearchableText(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname} ${u.pathname.replace(/[\/_-]+/g, " ")}`;
  } catch {
    return url;
  }
}

function isOnDomain(url: string, domain: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === domain || host.endsWith(`.${domain}`);
  } catch {
    return false;
  }
}

export async function searchBrandViaDDG(opts: {
  brand: string;
  domain: string;
  query: string;
  /** Max candidate URLs to fetch (cheap fail-fast). */
  maxCandidates?: number;
}): Promise<BrandResult | null> {
  const { brand, domain, query } = opts;
  const maxCandidates = opts.maxCandidates ?? 3;

  // DDG with site: filter — restricts results to the brand's own domain.
  // We append INCI hints so DDG ranks the actual product page (which
  // usually contains the word "ingrédients" or "composition") higher.
  const ddgQuery = `site:${domain} ${query} ingrédients`;
  const searchHtml = await fetchPageHtml(
    SEARCH_URL + encodeURIComponent(ddgQuery),
  );
  if (!searchHtml) return null;

  const candidates: string[] = [];
  let m: RegExpExecArray | null;
  RESULT_LINK_RE.lastIndex = 0;
  while ((m = RESULT_LINK_RE.exec(searchHtml)) !== null) {
    const real = decodeUddg(m[1]!);
    if (!isOnDomain(real, domain)) continue;
    if (!matchesQuery(query, urlSearchableText(real))) continue;
    if (candidates.includes(real)) continue;
    candidates.push(real);
    if (candidates.length >= maxCandidates) break;
  }
  if (candidates.length === 0) return null;

  for (const url of candidates) {
    const html = await fetchPageHtml(url);
    if (!html) continue;
    const inci = await extractInciFromHtml({ label: `${brand} ${query}`, html });
    if (inci) {
      return {
        brand,
        productName: null,
        ingredientsText: inci,
        sourceUrl: url,
      };
    }
  }
  return null;
}
