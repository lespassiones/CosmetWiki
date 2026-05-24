/**
 * Fallback metadata extraction when no Schema.org JSON-LD `Product` block is
 * present on the page. Pulls the common cross-platform signals:
 *
 *   - <meta property="og:title">          → product name (most reliable)
 *   - <meta property="og:site_name">      → brand (often the shop's name)
 *   - <meta property="product:brand">     → brand (Shopify, WooCommerce)
 *   - <meta property="og:description">    → description
 *   - <meta property="og:image">          → image URL
 *   - <meta name="description">           → description fallback
 *   - <title>                             → product name fallback
 *   - first <h1>                          → product name last-resort
 *
 * Together with the JSON-LD path this covers ~95 % of cosmetics e-commerce
 * pages we've seen in the wild — Les Secrets de Loly, Yves Rocher and other
 * mid-size French shops that ship product pages without rich structured
 * data still surface a name + brand here.
 */

export type MetaFallback = {
  productName: string | null;
  brand: string | null;
  description: string | null;
  imageUrl: string | null;
};

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Find a meta tag by property/name attribute and return its content. Handles
 *  both attribute orderings (`property` before `content` and the reverse). */
function metaContent(html: string, key: string): string | null {
  const escaped = escapeRe(key);
  // property/name first, content after.
  const r1 = new RegExp(
    `<meta\\b[^>]*?\\b(?:property|name|itemprop)=["']${escaped}["'][^>]*?\\bcontent=["']([^"']*)["']`,
    "i",
  ).exec(html);
  if (r1?.[1]) return decodeEntities(r1[1].trim());
  // content first, property/name after.
  const r2 = new RegExp(
    `<meta\\b[^>]*?\\bcontent=["']([^"']*)["'][^>]*?\\b(?:property|name|itemprop)=["']${escaped}["']`,
    "i",
  ).exec(html);
  if (r2?.[1]) return decodeEntities(r2[1].trim());
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function cleanText(s: string | null, maxLen: number): string | null {
  if (!s) return null;
  const cleaned = s.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen) : cleaned;
}

function firstTitle(html: string): string | null {
  const m = /<title\b[^>]*>([\s\S]{0,400}?)<\/title>/i.exec(html);
  if (!m?.[1]) return null;
  return decodeEntities(m[1].replace(/\s+/g, " ").trim());
}

function firstH1(html: string): string | null {
  const m = /<h1\b[^>]*>([\s\S]{0,400}?)<\/h1>/i.exec(html);
  if (!m?.[1]) return null;
  // Strip nested tags (Shopify wraps titles in <span> sometimes).
  const inner = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return inner ? decodeEntities(inner) : null;
}

/**
 * Many shops put "Product Name | Brand Name" or "Product Name — Brand Name"
 * in the <title>. When we have the brand independently, we can strip it from
 * the title to get a cleaner product name.
 */
function stripBrandFromTitle(title: string, brand: string | null): string {
  if (!brand) return title;
  const re = new RegExp(`\\s*[|\\-—–·•]\\s*${escapeRe(brand)}\\s*$`, "i");
  return title.replace(re, "").trim() || title;
}

export function extractMetaFallback(html: string): MetaFallback {
  const ogTitle = metaContent(html, "og:title");
  const ogSiteName = metaContent(html, "og:site_name");
  const ogDescription = metaContent(html, "og:description");
  const ogImage = metaContent(html, "og:image");
  const productBrand = metaContent(html, "product:brand") ?? metaContent(html, "og:brand");
  const metaDescription = metaContent(html, "description");
  const title = firstTitle(html);
  const h1 = firstH1(html);

  const brand = productBrand ?? ogSiteName;

  // Prefer OG title (curated by the shop for sharing), fall back to first H1
  // (product title on most templates), then a brand-stripped <title>.
  let productName = ogTitle ?? h1 ?? null;
  if (!productName && title) productName = stripBrandFromTitle(title, brand);

  return {
    productName: cleanText(productName, 200),
    brand: cleanText(brand, 120),
    description: cleanText(ogDescription ?? metaDescription, 2000),
    imageUrl: cleanText(ogImage, 2048),
  };
}
