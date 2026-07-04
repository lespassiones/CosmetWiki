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

/** A web search candidate. When `ingredientsText` est présent, l'INCI a déjà
 *  été extraite côté serveur lors de la pré-validation — le frontend peut
 *  directement passer à l'analyse sans rappeler `/api/deep-fetch`. Sinon
 *  (legacy/DDG fallback), l'INCI sera extraite lazily au clic. */
export type DuckDuckGoCandidate = {
  url: string;
  title: string;
  domain: string;
  brand: string | null;
  productName: string | null;
  ingredientsText?: string;
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

/**
 * Leading filler words we strip from web result titles before extracting the
 * product name. "Composition" especially poisons results because we add it to
 * the DDG search query for ranking — pages legitimately get titled "Composition
 * <product>". Same for FR review sites that prefix with "Avis", "Test", etc.
 */
const NOISE_PREFIX_RE =
  /^(?:composition\s+(?:de\s+(?:la\s+|du\s+|l['']\s*)?|du\s+|des\s+)?|avis\s+(?:sur\s+(?:le\s+|la\s+|les\s+)?)?|test\s+(?:de\s+(?:la\s+|du\s+)?|du\s+)?|comparatif\s+(?:de\s+|des\s+)?|fiche\s+(?:produit\s+|technique\s+)?(?:de\s+|du\s+)?|notice\s+(?:de\s+|du\s+)?|liste\s+(?:complète\s+)?(?:des\s+)?(?:ingr[ée]dients|inci)\s+(?:de\s+|du\s+)?|inci\s+(?:de\s+|du\s+)?|ingr[ée]dients?\s+(?:de\s+|du\s+)?|review\s+(?:of\s+)?)/iu;

/**
 * Editorial / review / aggregator domains whose name is NOT a cosmetic brand.
 * For these, we never use the domain as the product brand — the real brand
 * either appears in the page title (often ALL CAPS), or we fall back to the
 * query's leading word.
 */
const EDITORIAL_DOMAINS = new Set([
  "quechoisir.org",
  "comprendrechoisir.com",
  "60millions-mag.com",
  "incidecoder.com",
  "cosmopolitan.fr",
  "elle.fr",
  "vogue.fr",
  "marieclaire.fr",
  "biba-magazine.fr",
  "lemonde.fr",
  "lefigaro.fr",
  "femmeactuelle.fr",
  "version-femina.fr",
  "topsante.com",
  "santemagazine.fr",
  "doctissimo.fr",
  "passeportsante.net",
  "amazon.fr",
  "amazon.com",
  "fnac.com",
  "darty.com",
  "ebay.fr",
  "ebay.com",
]);

function isEditorialDomain(domain: string): boolean {
  if (EDITORIAL_DOMAINS.has(domain)) return true;
  // Generic editorial patterns: anything matching <word>-magazine, blog.xxx,
  // press.xxx, news.xxx. False positives are acceptable here because the
  // worst-case outcome is "brand falls back to query word" — not data loss.
  return /(?:^|\.)(?:blog|news|press|magazine|info|forum|wiki|reviews?)\b/.test(domain);
}

/**
 * Trailing " - Site Name" patterns we strip. Whitelist-based (vs greedy 1-30
 * char tail) because aggressive stripping was eating real product names
 * (e.g. "Cerave - Daily Moisturizing Cream" → "Cerave"). Editorial / retail
 * site names only.
 */
const TAIL_SITE_NAMES_RE =
  /\s*[|·\-]\s*(?:que\s+choisir|quechoisir|doctissimo|marie[\s-]?claire|cosmopolitan|vogue|amazon(?:\.[a-z]{2,3})?|fnac|darty|cdiscount|60\s+millions(?:\s+de\s+consommateurs)?|topsant[ée]|sant[ée]\s+magazine|femme\s+actuelle|inci(?:[-\s]?decoder|[-\s]?beauty)|wikip[ée]dia|ebay(?:\.[a-z]{2,3})?)\s*$/iu;

/**
 * Generic "- foo.fr" / "| foo.com" tail strip: the trailing token looks like
 * a bare domain (single word + recognised TLD). Catches indie / smaller
 * retailer titles where the site name isn't in our whitelist but still ends
 * with its domain, e.g. "PUREPOUSSE Élixir POUSSE 50ml - SUPERBEAUTE.fr".
 */
const TAIL_DOMAIN_RE =
  /\s*[|·\-]\s*(?:[A-Za-z0-9][A-Za-z0-9_-]{0,40}\.)+(?:fr|com|org|net|io|co|de|uk|ca|be|ch|eu|es|it|pt|nl|se|no|dk|fi|jp|us|biz|info|shop|store)\s*$/iu;

/**
 * Scan the title for a plausible brand marker: an ALL-CAPS word of 3+ letters
 * (4+ if it has no diacritics, to skip acronyms like "INCI"). Cosmetic brand
 * sites and editorial summaries commonly write the brand fully capitalised
 * (PUREPOUSSE, L'ORÉAL, GARNIER). When such a word also overlaps with the
 * user's query, we treat it as the canonical brand.
 */
function detectAllCapsBrand(title: string, query: string): string | null {
  // Reject common acronyms / noise words that often appear in caps.
  const skip = new Set(["INCI", "EAN", "FR", "EN", "DE", "UK", "USA", "EU", "PARIS"]);
  // JS \b is ASCII-only: É / È / etc. count as non-word, which breaks word
  // boundary detection for brands like L'ORÉAL or NUXE. Normalise diacritics
  // out before regex so the boundaries land correctly. We return the
  // normalised match (titleCase downstream will render it acceptably).
  const normalised = title.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const matches = normalised.match(/\b[A-Z][A-Z']{2,}\b/g);
  if (!matches) return null;
  const qFlat = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ");
  const qTokens = qFlat.split(/\s+/u).filter((t) => t.length >= 3);
  for (const m of matches) {
    if (skip.has(m)) continue;
    if (m.length < 4) continue;
    const flat = m.toLowerCase().replace(/[^a-z0-9]/g, "");
    // Overlap with query: either direction (PUREPOUSSE contains "pure" from
    // "pure pousse"; "garnier" query contains "GARNIER").
    if (qTokens.some((t) => flat.includes(t) || t.includes(flat))) {
      return m;
    }
  }
  return null;
}

/** Strip every recognised noise prefix and leading separator until stable. */
function stripNoise(s: string): string {
  let prev: string;
  let cur = s;
  do {
    prev = cur;
    cur = cur.replace(NOISE_PREFIX_RE, "").trim();
    cur = cur.replace(/^[:\-|·]\s*/u, "").trim();
  } while (cur !== prev && cur.length > 2);
  return cur;
}

/** Drop the brand from the beginning of the product name if it duplicates. */
function dropLeadingBrand(name: string, brand: string): string {
  const flat = (x: string) =>
    x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const fn = flat(name);
  const fb = flat(brand);
  if (fb.length >= 3 && fn.startsWith(fb)) {
    return name.slice(brand.length).replace(/^[:\-|·\s]+/u, "");
  }
  return name;
}

/** Best-effort split of a search result title into brand + product name.
 *  Stripping logic, in order:
 *    1. Drop trailing " - Site Name" tails.
 *    2. Strip leading noise ("Composition", "Avis", "Test"...).
 *    3. Try ALL-CAPS brand detection (PUREPOUSSE, L'ORÉAL...).
 *    4. Fall back to separator split (Brand - Product).
 *    5. Final fallback: query first word, then non-editorial domain.
 *  Pure heuristic — wrong is acceptable, the user still picks visually. */
function guessBrandAndName(
  title: string,
  domain: string,
  query: string,
): { brand: string | null; productName: string | null } {
  if (!title) {
    return {
      brand: isEditorialDomain(domain) ? null : brandFromDomain(domain),
      productName: null,
    };
  }
  // 1. Strip trailing site signatures: a known site name OR a bare domain
  //    (e.g. "- SUPERBEAUTE.fr"). Run both in a loop so a title like
  //    "Foo - bar.fr - Amazon" gets fully cleaned.
  let cleaned = title;
  let prev: string;
  do {
    prev = cleaned;
    cleaned = cleaned.replace(TAIL_SITE_NAMES_RE, "").trim();
    cleaned = cleaned.replace(TAIL_DOMAIN_RE, "").trim();
  } while (cleaned !== prev && cleaned.length > 2);
  // 2. Strip leading noise ("Composition", "Avis sur", ...)
  cleaned = stripNoise(cleaned);
  if (cleaned.length < 3) cleaned = title;

  // 3. ALL CAPS brand marker
  const capsBrand = detectAllCapsBrand(cleaned, query);

  // 4. Separator split (only consume it if we don't already have a CAPS brand)
  if (!capsBrand) {
    const sepMatch = cleaned.split(/\s+(?:[|·-])\s+/u);
    if (sepMatch.length >= 2) {
      let sepBrand = sepMatch[0]!.slice(0, 80);
      let sepProduct = sepMatch.slice(1).join(" - ").slice(0, 160) || null;
      // Brand-site convention: if the tail matches the domain (e.g.
      // "Effaclar Duo+ - La Roche-Posay" on laroche-posay.fr), the title is
      // "Product - Brand" — swap them.
      if (sepProduct) {
        const tailFlat = sepProduct
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "");
        const domHead = domain
          .replace(/\..*$/, "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "");
        if (
          domHead.length >= 4 &&
          (tailFlat.includes(domHead) || domHead.includes(tailFlat))
        ) {
          [sepBrand, sepProduct] = [sepProduct, sepBrand];
        }
      }
      // Don't accept the separator's left side if it's a noise word that
      // survived (e.g. when the title was "Composition - PRODUCT").
      const looksLikeNoise = NOISE_PREFIX_RE.test(`${sepBrand} `);
      if (!looksLikeNoise) {
        return {
          brand: sepBrand || (isEditorialDomain(domain) ? null : brandFromDomain(domain)),
          productName: sepProduct,
        };
      }
    }
  }

  // 5. Resolve brand: CAPS > query first word > non-editorial domain > null.
  let brand: string | null = null;
  if (capsBrand) {
    brand = capsBrand;
  } else {
    const queryFirstWord = query.trim().split(/\s+/u)[0] ?? "";
    const titleLower = cleaned.toLowerCase();
    if (queryFirstWord.length > 2 && titleLower.startsWith(queryFirstWord.toLowerCase())) {
      brand = queryFirstWord;
    } else if (!isEditorialDomain(domain)) {
      brand = brandFromDomain(domain);
    } else if (queryFirstWord.length > 2) {
      brand = queryFirstWord;
    }
  }

  // 6. Strip duplicated brand prefix from the product name.
  let productName: string | null = cleaned;
  if (brand) productName = dropLeadingBrand(productName, brand);
  productName = productName.slice(0, 160) || null;

  return { brand, productName };
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
