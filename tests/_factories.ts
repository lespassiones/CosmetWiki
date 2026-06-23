import type { AnalyseItem } from "@/lib/analyseTypes";
import type { ClaimCategory } from "@/lib/coherence/claims";
import type { LlmPromiseProposal } from "@/lib/coherence/engine";
import type { UserRestrictions } from "@/lib/restrictions/types";
import type { CatalogAlternative } from "@/lib/routine/suggestions";

/** Build an AnalyseItem with sane null defaults; override what the test needs. */
export function item(overrides: Partial<AnalyseItem> = {}): AnalyseItem {
  return {
    position: 1,
    input: "X",
    slug: null,
    name: null,
    colorRating: null,
    dbColorRating: null,
    casNumber: null,
    translationFr: null,
    primaryFunction: null,
    allFunctions: null,
    tags: null,
    matchKind: null,
    confidence: 0,
    thresholdContext: null,
    thresholdLabel: null,
    ...overrides,
  };
}

/** Minimal absence ClaimCategory (only the fields the resolver reads matter). */
export function absenceCategory(forbiddenTag: string, slug = `absence_${forbiddenTag}`): ClaimCategory {
  return {
    slug,
    label: `Sans ${forbiddenTag}`,
    keywords: [],
    actives: [],
    hint: "",
    forbiddenTag,
  };
}

export function proposal(overrides: Partial<LlmPromiseProposal> = {}): LlmPromiseProposal {
  return { category_slug: "autre", label: "Promesse", excerpt: "extrait", ...overrides };
}

export function alternative(overrides: Partial<CatalogAlternative> = {}): CatalogAlternative {
  return {
    ean: "0000000000000",
    brand: "Marque",
    name: "Produit",
    category: "soin/x",
    image_url: null,
    score: 15,
    ingredients_text: "aqua, glycerin",
    count_orange: 0,
    count_rouge: 0,
    ...overrides,
  };
}

export const NO_RESTRICTIONS: UserRestrictions = { families: [], ingredients: [] };
