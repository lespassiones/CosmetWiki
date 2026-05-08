// INCIDecoder fallback : search → fetch first product page → extract via Mistral.
// Site is fetchable with a browser User-Agent.

import { fetchPageHtml } from "./httpFetch";
import { extractInciFromHtml } from "./extractWithMistral";

const SEARCH_URL = "https://incidecoder.com/search?query=";
const PRODUCT_LINK_RE = /href=["']\/products\/([a-z0-9\-]+)["']/i;
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
  const productUrl = `https://incidecoder.com/products/${slugMatch[1]}`;

  const productHtml = await fetchPageHtml(productUrl);
  if (!productHtml) return null;

  const titleMatch = TITLE_RE.exec(productHtml);
  const productName = titleMatch ? titleMatch[1]!.trim() : null;
  const brandMatch = BRAND_LINK_RE.exec(productHtml);
  const brand = brandMatch ? brandMatch[2]!.trim() : null;

  const inci = await extractInciFromHtml({
    label: productName ?? slugMatch[1]!,
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
