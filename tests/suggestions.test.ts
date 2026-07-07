import { describe, it, expect } from "vitest";
import {
  altHitsRestriction,
  scoreAlternative,
  pickBestAlternative,
} from "@/lib/routine/suggestions";
import type { UserRestrictions } from "@/lib/restrictions/types";
import { alternative, NO_RESTRICTIONS } from "./_factories";

// Sélection des suggestions intelligentes (plus de color cap : le score pastille
// est déjà position-aware, donc on lui fait confiance tel quel).
describe("scoreAlternative (pas de cap — score pastille de confiance)", () => {
  it("garde le score du catalogue tel quel + attache label/tone", () => {
    // Un produit avec un rouge a DÉJÀ un score pastille bas (~8.9), pas 18.
    const a = scoreAlternative(alternative({ score: 8.9, count_rouge: 1 }));
    expect(a.score).toBe(8.9);
    expect(a.score_label).toBe("Faible");
    // Convention unifiée 4 juil 2026 : 8.9 tombe dans la tranche >=5 = orange
    // (rose est réservé à <5).
    expect(a.score_tone).toBe("orange");
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

  it("classe par le score pastille (un rouge a déjà fait chuter le score)", () => {
    const product = 9;
    const alts = [
      // 2 rouge -> score pastille bas (~2), pas 19 -> rejeté (pas meilleur que 9.5)
      alternative({ ean: "lowRed", score: 2, count_rouge: 2 }),
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

  it("ne propose rien si aucune alternative n'est nettement meilleure", () => {
    const product = 7; // orange
    const alts = [
      alternative({ ean: "barely", score: 7.3 }), // <= 7.5 -> rejeté
      alternative({ ean: "worse", score: 5 }),
    ];
    expect(pickBestAlternative(product, alts, NO_RESTRICTIONS)).toBeNull();
  });

  it("choisit l'alternative au meilleur score pastille", () => {
    const product = 7;
    const alts = [
      alternative({ ean: "caution", score: 11 }), // caution (9-13)
      alternative({ ean: "green", score: 15 }), // safe (13-17) -> meilleur
    ];
    expect(pickBestAlternative(product, alts, NO_RESTRICTIONS)?.ean).toBe("green");
  });

  it("returns null for an empty candidate list", () => {
    expect(pickBestAlternative(10, [], NO_RESTRICTIONS)).toBeNull();
  });
});
