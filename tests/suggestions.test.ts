import { describe, it, expect } from "vitest";
import {
  altHitsRestriction,
  scoreAlternative,
  pickBestAlternative,
} from "@/lib/routine/suggestions";
import type { UserRestrictions } from "@/lib/restrictions/types";
import { alternative, NO_RESTRICTIONS } from "./_factories";

// Handoff §2.3 — the smart-suggestion selection logic.
describe("scoreAlternative (color cap applied to candidates)", () => {
  it("caps the raw catalog score and attaches label/tone", () => {
    const a = scoreAlternative(alternative({ score: 18, count_rouge: 1 }));
    expect(a.score).toBe(8.9);
    expect(a.score_label).toBe("À éviter");
    expect(a.score_tone).toBe("rose");
  });

  it("leaves a clean candidate untouched", () => {
    const a = scoreAlternative(alternative({ score: 17.5, count_orange: 0, count_rouge: 0 }));
    expect(a.score).toBe(17.5);
    expect(a.score_label).toBe("Très bien");
  });
});

describe("altHitsRestriction", () => {
  const restr: UserRestrictions = {
    families: [],
    ingredients: [{ slug: "phenoxyethanol", name: "Phenoxyethanol" }],
  };

  it("flags a candidate whose INCI list contains a restricted ingredient", () => {
    const a = alternative({ ingredients_text: "Aqua, Glycerin, Phenoxyethanol, Parfum" });
    expect(altHitsRestriction(a, restr)).toBe(true);
  });

  it("is accent/case insensitive", () => {
    const a = alternative({ ingredients_text: "aqua, PHENOXYETHANOL" });
    expect(altHitsRestriction(a, restr)).toBe(true);
  });

  it("does not flag a clean candidate", () => {
    const a = alternative({ ingredients_text: "Aqua, Glycerin, Tocopherol" });
    expect(altHitsRestriction(a, restr)).toBe(false);
  });

  it("never flags when the user has no ingredient restriction", () => {
    const a = alternative({ ingredients_text: "Aqua, Phenoxyethanol" });
    expect(altHitsRestriction(a, NO_RESTRICTIONS)).toBe(false);
  });
});

describe("pickBestAlternative", () => {
  it("keeps only candidates strictly better than product + 0.5, returns the best", () => {
    const product = 12;
    const alts = [
      alternative({ ean: "A", score: 12.4 }), // 12.4 <= 12.5 -> rejected
      alternative({ ean: "B", score: 14 }),   // ok
      alternative({ ean: "C", score: 16 }),   // best
    ];
    const best = pickBestAlternative(product, alts, NO_RESTRICTIONS);
    expect(best?.ean).toBe("C");
    expect(best?.score).toBe(16);
  });

  it("ranks by CAPPED score, not raw score", () => {
    const product = 9;
    const alts = [
      // raw 19 but 2 rouge -> capped 8.9 -> not better than 9.5 -> rejected
      alternative({ ean: "capped", score: 19, count_rouge: 2 }),
      alternative({ ean: "honest", score: 13 }),
    ];
    const best = pickBestAlternative(product, alts, NO_RESTRICTIONS);
    expect(best?.ean).toBe("honest");
  });

  it("drops candidates that hit a restriction even if better-scored", () => {
    const restr: UserRestrictions = {
      families: [],
      ingredients: [{ slug: "parfum", name: "Parfum" }],
    };
    const alts = [
      alternative({ ean: "restricted", score: 18, ingredients_text: "Aqua, Parfum" }),
      alternative({ ean: "clean", score: 14, ingredients_text: "Aqua, Glycerin" }),
    ];
    const best = pickBestAlternative(12, alts, restr);
    expect(best?.ean).toBe("clean");
  });

  it("returns null when nothing is meaningfully better", () => {
    const alts = [alternative({ score: 12.3 }), alternative({ score: 11 })];
    expect(pickBestAlternative(12, alts, NO_RESTRICTIONS)).toBeNull();
  });

  it("returns null for an empty candidate list", () => {
    expect(pickBestAlternative(10, [], NO_RESTRICTIONS)).toBeNull();
  });
});
