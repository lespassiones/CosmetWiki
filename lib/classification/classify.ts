import {
  OBF_TO_SUBCATEGORY,
  NAME_RULES,
  NAME_OVERRIDES,
  INCI_RULES,
  SUBCATEGORY_PARENT,
  type Classification,
  type Subcategory,
} from "./taxonomy";

type ProductInput = {
  ean: string;
  brand: string | null;
  name: string;
  category: string | null;       // OBF category slug
  ingredientsText: string | null;
};

type ClassificationResult = Classification & {
  ean: string;
  method: "obf" | "name" | "inci" | "unclassified";
  confidence: number;
};

function normForRules(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Classify a single product.
 *
 * Priority order:
 *   1. NAME_OVERRIDES  - high-confidence name patterns that fix known OBF errors
 *   2. OBF mapping     - direct slug → subcategory mapping
 *   3. NAME_RULES      - regex on brand+name (broader, lower confidence)
 *   4. INCI heuristics - last resort, ingredient-based
 */
export function classifyProduct(p: ProductInput): ClassificationResult | null {
  const label = normForRules(`${p.brand ?? ""} ${p.name}`);

  // 1. High-confidence name overrides (fix OBF mis-tags)
  for (const [re, sub] of NAME_OVERRIDES) {
    if (re.test(label)) {
      return {
        ean: p.ean,
        subcategory: sub,
        category: SUBCATEGORY_PARENT[sub],
        method: "name",
        confidence: 0.90,
      };
    }
  }

  // 2. OBF category mapping
  if (p.category) {
    const slug = p.category.trim().toLowerCase();
    const sub = OBF_TO_SUBCATEGORY[slug];
    if (sub) {
      return {
        ean: p.ean,
        subcategory: sub,
        category: SUBCATEGORY_PARENT[sub],
        method: "obf",
        confidence: 0.95,
      };
    }
  }

  // 3. Name-based rules
  for (const [re, sub] of NAME_RULES) {
    if (re.test(label)) {
      return {
        ean: p.ean,
        subcategory: sub,
        category: SUBCATEGORY_PARENT[sub],
        method: "name",
        confidence: 0.80,
      };
    }
  }

  // 4. INCI heuristics (only first 300 chars)
  const inci = (p.ingredientsText ?? "").slice(0, 300);
  if (inci.length > 10) {
    for (const [re, sub] of INCI_RULES) {
      if (re.test(inci)) {
        return {
          ean: p.ean,
          subcategory: sub,
          category: SUBCATEGORY_PARENT[sub],
          method: "inci",
          confidence: 0.65,
        };
      }
    }
  }

  return null;
}

/**
 * Classify a batch of products.
 * Returns { classified, unclassified } with counts.
 */
export function classifyBatch(products: ProductInput[]): {
  classified: ClassificationResult[];
  unclassified: ProductInput[];
} {
  const classified: ClassificationResult[] = [];
  const unclassified: ProductInput[] = [];
  for (const p of products) {
    const r = classifyProduct(p);
    if (r) {
      classified.push(r);
    } else {
      unclassified.push(p);
    }
  }
  return { classified, unclassified };
}
