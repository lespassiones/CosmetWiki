/**
 * Extract Schema.org `Product` metadata from a page's <script type="application/ld+json">
 * blocks. Shopify, WooCommerce and most modern e-commerce builders emit this
 * automatically — when present it's a free, deterministic source of name +
 * brand + description + image, far more reliable than asking an LLM.
 *
 * We do NOT extract `ingredients` from JSON-LD: cosmetics sites almost
 * never put the full INCI into structured data, and when they do the field
 * naming is inconsistent (`recipeIngredient`, `material`, custom strings…).
 * The scraper's LLM step handles INCI separately.
 */

export type JsonLdProduct = {
  productName: string | null;
  brand: string | null;
  description: string | null;
  imageUrl: string | null;
};

const SCRIPT_RE = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Pull every parsed JSON-LD block out of an HTML string. Malformed JSON is
 *  silently skipped — vendors sometimes ship invalid trailing commas. */
function parseAllJsonLd(html: string): unknown[] {
  const out: unknown[] = [];
  for (const match of html.matchAll(SCRIPT_RE)) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      out.push(parsed);
    } catch {
      // Some shops emit slightly invalid JSON (trailing commas, HTML entities).
      // Try one rescue pass: decode the most common entities and strip
      // trailing commas, then re-attempt. If still bad, drop the block.
      try {
        const rescued = raw
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, "&")
          .replace(/,(\s*[}\]])/g, "$1");
        out.push(JSON.parse(rescued));
      } catch {
        /* skip */
      }
    }
  }
  return out;
}

/** Walk a JSON-LD node (which may be a single object, an array, or a graph
 *  wrapper `{ "@graph": [...] }`) and yield every nested object so we can
 *  search for the Product type without hard-coding the shape. */
function* iterateNodes(node: unknown): Generator<Record<string, unknown>> {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const item of node) yield* iterateNodes(item);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  yield obj;
  const graph = obj["@graph"];
  if (graph) yield* iterateNodes(graph);
}

function hasProductType(node: Record<string, unknown>): boolean {
  const t = node["@type"];
  if (typeof t === "string") return t === "Product" || t === "schema:Product";
  if (Array.isArray(t)) return t.some((x) => x === "Product" || x === "schema:Product");
  return false;
}

function asString(v: unknown, maxLen: number): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

/** Brand can be:
 *  - "Some Brand"
 *  - { "@type": "Brand", "name": "Some Brand" }
 *  - { "name": "Some Brand" }
 *  - ["Some Brand", { ... }] */
function extractBrandName(brand: unknown): string | null {
  if (!brand) return null;
  if (typeof brand === "string") return asString(brand, 120);
  if (Array.isArray(brand)) {
    for (const b of brand) {
      const found = extractBrandName(b);
      if (found) return found;
    }
    return null;
  }
  if (typeof brand === "object") {
    const obj = brand as Record<string, unknown>;
    return asString(obj.name, 120);
  }
  return null;
}

/** Image can be a URL string, an array of URLs, or an ImageObject. */
function extractImageUrl(image: unknown): string | null {
  if (!image) return null;
  if (typeof image === "string") return asString(image, 2048);
  if (Array.isArray(image)) {
    for (const item of image) {
      const found = extractImageUrl(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof image === "object") {
    const obj = image as Record<string, unknown>;
    return asString(obj.url, 2048) ?? asString(obj.contentUrl, 2048);
  }
  return null;
}

/** Strip leftover HTML tags + collapse whitespace. Vendors often dump rich
 *  HTML inside `description`, and we want plain text for downstream display. */
function cleanDescription(s: string | null): string | null {
  if (!s) return null;
  const cleaned = s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 2000 ? cleaned.slice(0, 2000) : cleaned || null;
}

/**
 * Find the first `Product` JSON-LD block in the page and return its key
 * fields. Returns null when no Product block is present (the LLM extractor
 * then becomes the sole source of truth).
 */
export function extractProductFromJsonLd(html: string): JsonLdProduct | null {
  const nodes = parseAllJsonLd(html);
  for (const node of nodes) {
    for (const obj of iterateNodes(node)) {
      if (!hasProductType(obj)) continue;
      const productName = asString(obj.name, 200);
      const brand = extractBrandName(obj.brand);
      const description = cleanDescription(asString(obj.description, 4000));
      const imageUrl = extractImageUrl(obj.image);
      if (!productName && !brand && !description) continue;
      return { productName, brand, description, imageUrl };
    }
  }
  return null;
}
