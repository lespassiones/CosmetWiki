// INCIDecoder fallback : search → fetch first product page → extract via Mistral.
// Site is fetchable with a browser User-Agent.

import { fetchPageHtml } from "./httpFetch";
import { extractInciFromHtml } from "./extractWithMistral";
import { matchesQuery } from "./relevance";

const SEARCH_URL = "https://incidecoder.com/search?query=";
const PRODUCT_LINK_RE = /href=["']\/products\/([a-z0-9\-]+)["']/i;
const PRODUCT_LINK_GLOBAL_RE = /href=["']\/products\/([a-z0-9\-]+)["'][^>]*>([^<]+)</gi;
const TITLE_RE = /<h1[^>]*>([^<]+)<\/h1>/i;
const BRAND_LINK_RE = /<a[^>]+href=["']\/brands\/([^"']+)["'][^>]*>([^<]+)<\/a>/i;

export async function searchInciDecoder(query: string): Promise<{
  brand: string | null;
  productName: string | null;
  ingredientsText: string;
  sourceUrl: string;
} | null> {
  const searchHtml = await fetchPageHtml(
    SEARCH_URL + encodeURIComponent(query),
  );
  if (!searchHtml) return null;

  const slugMatch = PRODUCT_LINK_RE.exec(searchHtml);
  if (!slugMatch) return null;
  const slug = slugMatch[1]!;
  const productUrl = `https://incidecoder.com/products/${slug}`;

  const productHtml = await fetchPageHtml(productUrl);
  if (!productHtml) return null;

  const titleMatch = TITLE_RE.exec(productHtml);
  const productName = titleMatch ? titleMatch[1]!.trim() : null;
  const brandMatch = BRAND_LINK_RE.exec(productHtml);
  const brand = brandMatch ? brandMatch[2]!.trim() : null;

  // Reject loose matches : INCIDecoder returns "did you mean" type results
  // that have no token in common with the original query.
  const label = `${brand ?? ""} ${productName ?? ""} ${slug.replace(/-/g, " ")}`;
  if (!matchesQuery(query, label)) return null;

  const inci = await extractInciFromHtml({
    label: productName ?? slug,
    html: productHtml,
  });
  if (!inci) return null;

  return {
    brand,
    productName,
    ingredientsText: inci,
    sourceUrl: productUrl,
  };
}

/**
 * Lightweight INCIDecoder candidate — slug + display name + url, NO INCI
 * pre-fetched. Used to populate the disambiguation list alongside OBF; the
 * actual INCI is loaded on click via fetchInciDecoderProduct().
 */
export type InciDecoderListCandidate = {
  slug: string;
  productName: string | null;
  brand: string | null;
  sourceUrl: string;
};

/**
 * Returns up to `limit` product candidates from an INCIDecoder text search.
 * Performs a SINGLE HTTP request (the search page) — no per-product fetches,
 * so the call stays under ~1 s. INCI is loaded lazily when the user picks one.
 */
export async function searchInciDecoderList(
  query: string,
  limit = 8,
): Promise<InciDecoderListCandidate[]> {
  const html = await fetchPageHtml(SEARCH_URL + encodeURIComponent(query));
  if (!html) return [];

  const seen = new Set<string>();
  const out: InciDecoderListCandidate[] = [];
  const re = new RegExp(PRODUCT_LINK_GLOBAL_RE.source, PRODUCT_LINK_GLOBAL_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (out.length >= limit) break;
    const slug = m[1];
    const rawLabel = m[2].trim();
    if (!slug || seen.has(slug)) continue;
    // INCIDecoder anchor text is `<brand> <product>` separated by a · or space.
    // It's usually "Brand · Product Name" or "Brand Product Name". We split on
    // the first " · " if present, otherwise leave the whole string as the name.
    let brand: string | null = null;
    let productName: string | null = rawLabel;
    const sepIdx = rawLabel.indexOf(" · ");
    if (sepIdx > 0) {
      brand = rawLabel.slice(0, sepIdx).trim() || null;
      productName = rawLabel.slice(sepIdx + 3).trim() || null;
    }
    // Reject fuzzy "did you mean" results that share no token with the query.
    const label = `${brand ?? ""} ${productName ?? ""} ${slug.replace(/-/g, " ")}`;
    if (!matchesQuery(query, label)) continue;
    seen.add(slug);
    out.push({
      slug,
      brand,
      productName,
      sourceUrl: `https://incidecoder.com/products/${slug}`,
    });
  }
  return out;
}

/**
 * Fetch a single INCIDecoder product page and extract its INCI list. Used
 * when the user clicks an INCIDecoder candidate from the disambiguation list.
 */
export async function fetchInciDecoderProduct(slug: string): Promise<{
  brand: string | null;
  productName: string | null;
  ingredientsText: string;
  sourceUrl: string;
} | null> {
  const safe = slug.replace(/[^a-z0-9\-]/gi, "");
  if (!safe) return null;
  const productUrl = `https://incidecoder.com/products/${safe}`;
  const productHtml = await fetchPageHtml(productUrl);
  if (!productHtml) return null;

  const titleMatch = TITLE_RE.exec(productHtml);
  const productName = titleMatch ? titleMatch[1]!.trim() : null;
  const brandMatch = BRAND_LINK_RE.exec(productHtml);
  const brand = brandMatch ? brandMatch[2]!.trim() : null;

  const inci = await extractInciFromHtml({
    label: productName ?? safe,
    html: productHtml,
  });
  if (!inci) return null;

  return { brand, productName, ingredientsText: inci, sourceUrl: productUrl };
}
