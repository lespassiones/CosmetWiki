import { describe, it, expect } from "vitest";
import { __testing } from "@/lib/essentiel/engine";
import { item } from "./_factories";

const { pickPositives } = __testing;

// Handoff §4 — "Ce qui est bien" shows the REAL functions, no verb table.
describe("pickPositives", () => {
  it("excludes only water, keeps everything else (incl. alcohol)", () => {
    const positives = pickPositives([
      item({ position: 1, name: "Aqua", colorRating: "Vert", allFunctions: ["Solvant"] }),
      item({ position: 2, name: "Alcohol Denat.", colorRating: "Vert", allFunctions: ["Antimicrobien"] }),
    ]);
    // Water is dropped; the alcohol ingredient survives (display name may be
    // the grand-public override, that's the name-priority rule, tested below).
    expect(positives).toHaveLength(1);
    expect(positives[0].functions).toEqual(["Antimicrobien"]);
    expect(positives.some((p) => /aqua|eau|water/i.test(p.name))).toBe(false);
  });

  it("shows real functions, dedupes, ignores 'Non classé', caps at 3", () => {
    const positives = pickPositives([
      item({
        position: 1,
        name: "Niacinamide",
        colorRating: "Vert",
        allFunctions: ["Agent apaisant", "Agent apaisant", "Non classé", "Antioxydant", "Humectant", "Astringent"],
      }),
    ]);
    expect(positives).toHaveLength(1);
    expect(positives[0].functions).toEqual(["Agent apaisant", "Antioxydant", "Humectant"]);
  });

  it("skips a green ingredient that has only 'Non classé' or no function", () => {
    const positives = pickPositives([
      item({ position: 1, name: "Mystere", colorRating: "Vert", allFunctions: ["Non classé"] }),
      item({ position: 2, name: "Inconnu", colorRating: "Vert", allFunctions: null, primaryFunction: null }),
      item({ position: 3, name: "Bisabolol", colorRating: "Vert", primaryFunction: "Agent apaisant" }),
    ]);
    expect(positives.map((p) => p.name)).toEqual(["Bisabolol"]);
    expect(positives[0].functions).toEqual(["Agent apaisant"]);
  });

  it("orders by INCI position and stops at 3", () => {
    const positives = pickPositives([
      item({ position: 5, name: "E", colorRating: "Vert", primaryFunction: "Emollient" }),
      item({ position: 1, name: "A", colorRating: "Vert", primaryFunction: "Humectant" }),
      item({ position: 3, name: "C", colorRating: "Vert", primaryFunction: "Antioxydant" }),
      item({ position: 2, name: "B", colorRating: "Vert", primaryFunction: "Agent apaisant" }),
    ]);
    expect(positives.map((p) => p.name)).toEqual(["A", "B", "C"]);
  });

  it("name priority: FR translation wins over raw INCI", () => {
    const positives = pickPositives([
      item({
        position: 1,
        name: "Glycerin",
        translationFr: "Glycérine",
        colorRating: "Vert",
        primaryFunction: "Humectant",
      }),
    ]);
    expect(positives[0].name).toBe("Glycérine");
  });

  it("ignores non-green ingredients entirely", () => {
    const positives = pickPositives([
      item({ position: 1, name: "Bad", colorRating: "Rouge", primaryFunction: "Conservateur" }),
      item({ position: 2, name: "Meh", colorRating: "Orange", primaryFunction: "Emollient" }),
    ]);
    expect(positives).toHaveLength(0);
  });
});
