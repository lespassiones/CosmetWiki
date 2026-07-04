export type ProductSource =
  | "cache"
  | "openbeautyfacts"
  | "openproductsfacts"
  | "incidecoder"
  | "duckduckgo+mistral"
  | "web_search"
  | `brand:${string}`;

/** Aperçu INSTANTANÉ pour la carte de scan (haut d'analyse), lu direct du
 *  catalogue — aucune analyse lancée. Miroir du mobile. */
export type ScanPreview = {
  ean: string;
  brand: string | null;
  name: string | null;
  category: string | null;
  score: number | null;
  scoreTone: string | null;
  scoreLabel: string | null;
  countOrange: number;
  countRouge: number;
  imageUrl: string | null;
};

export type ProductSearchHit = {
  found: true;
  brand: string | null;
  productName: string | null;
  ingredientsText: string;
  source: ProductSource;
  sourceUrl: string | null;
  confidence: number;
  preview?: ScanPreview;
};

export type ProductSearchMiss = {
  found: false;
  // Scan code-barres :
  //  - "incomplete"  : EAN présent au catalogue mais sans liste INCI exploitable
  //  - "registered"  : EAN inconnu, enregistré pour enrichissement ultérieur
  reason: "too_short" | "not_found" | "timeout" | "registered" | "incomplete";
  message: string;
};

export type ProductSearchResult = ProductSearchHit | ProductSearchMiss;
