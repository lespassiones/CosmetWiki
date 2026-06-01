export type ProductSource =
  | "cache"
  | "openbeautyfacts"
  | "openproductsfacts"
  | "incidecoder"
  | "duckduckgo+mistral"
  | "web_search"
  | `brand:${string}`;

export type ProductSearchHit = {
  found: true;
  brand: string | null;
  productName: string | null;
  ingredientsText: string;
  source: ProductSource;
  sourceUrl: string | null;
  confidence: number;
};

export type ProductSearchMiss = {
  found: false;
  reason: "too_short" | "not_found" | "timeout";
  message: string;
};

export type ProductSearchResult = ProductSearchHit | ProductSearchMiss;
