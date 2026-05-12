// Per-brand product search. Each brand handler knows where to look for its
// own products (typically: DDG with `site:` filter to the official domain,
// then Mistral extraction). The cascade calls these BEFORE the generic DDG
// step when the user's query mentions a known brand.

export type BrandResult = {
  brand: string;
  productName: string | null;
  ingredientsText: string;
  sourceUrl: string;
};

export type BrandHandler = {
  /** Display name shown to the user, e.g. "La Roche-Posay". */
  name: string;
  /** Normalised tokens used to detect this brand in the user query. All
   *  lowercase, accents stripped. At least one must appear as a whole token
   *  in the query for the handler to be invoked. */
  aliases: string[];
  /** Domain (sans protocole) used both for the DDG site: filter AND for
   *  whitelisting fetchable pages. */
  domain: string;
  /** Search this brand for `query` and return a single best match, or null. */
  search(query: string): Promise<BrandResult | null>;
};
