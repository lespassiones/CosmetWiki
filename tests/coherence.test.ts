import { describe, it, expect } from "vitest";
import { resolveAbsencePromise, resolveOpenPromise, type OpenLlmMatch } from "@/lib/coherence/engine";
import { item, absenceCategory, proposal } from "./_factories";

// Handoff §1 — coherence engine.
describe("resolveAbsencePromise (sans X)", () => {
  const sulfate = absenceCategory("sulfate");

  it("tenue 100 when the forbidden tag is absent", () => {
    const r = resolveAbsencePromise(proposal(), sulfate, [
      item({ position: 1, name: "Aqua" }),
      item({ position: 2, name: "Coco Glucoside", tags: ["tensioactif-doux"] }),
    ]);
    expect(r.verdict).toBe("tenue");
    expect(r.score).toBe(100);
  });

  it("contredite 0 when the forbidden tag is present, and names the offender", () => {
    const r = resolveAbsencePromise(proposal(), sulfate, [
      item({ position: 1, name: "Sodium Laureth Sulfate", slug: "sodium-laureth-sulfate", tags: ["sulfate"] }),
    ]);
    expect(r.verdict).toBe("contredite");
    expect(r.score).toBe(0);
    expect(r.contradictingActives?.[0].name).toBe("Sodium Laureth Sulfate");
  });
});

// Feature 1.B — bi-function allergen nuance.
describe("resolveAbsencePromise — allergène parfumant bi-fonction", () => {
  const allergen = absenceCategory("allergene-parfumant");

  it("partielle 50 when the ONLY offender is a dual-use molecule in a fragrance-free formula", () => {
    const r = resolveAbsencePromise(proposal(), allergen, [
      item({ position: 1, name: "Aqua" }),
      item({ position: 2, name: "Benzyl Alcohol", slug: "benzyl-alcohol", tags: ["allergene-parfumant", "conservateur"] }),
    ]);
    expect(r.verdict).toBe("partielle");
    expect(r.score).toBe(50);
    // The ingredient stays flagged.
    expect(r.contradictingActives?.some((a) => a.slug === "benzyl-alcohol")).toBe(true);
  });

  it("contredite when a REAL allergen (Limonene) is present", () => {
    const r = resolveAbsencePromise(proposal(), allergen, [
      item({ position: 1, name: "Limonene", slug: "limonene", tags: ["allergene-parfumant"] }),
    ]);
    expect(r.verdict).toBe("contredite");
    expect(r.score).toBe(0);
  });

  it("contredite for a dual-use molecule when a fragrance IS declared (Parfum present)", () => {
    const r = resolveAbsencePromise(proposal(), allergen, [
      item({ position: 1, name: "Benzyl Alcohol", slug: "benzyl-alcohol", tags: ["allergene-parfumant"] }),
      item({ position: 2, name: "Parfum", tags: ["parfum-synthese"] }),
    ]);
    expect(r.verdict).toBe("contredite");
  });
});

// gradeEffect (exercised via resolveOpenPromise) + anti-hallucination.
describe("resolveOpenPromise — gradeEffect barème", () => {
  const items = [
    item({ position: 2, slug: "panthenol", name: "Panthenol" }),
    item({ position: 3, slug: "niacinamide", name: "Niacinamide" }),
    item({ position: 4, slug: "dimethicone", name: "Dimethicone" }),
    // an item flagged as "trace" (after a fragrance) -> not well-dosed
    item({ position: 9, slug: "bisabolol", name: "Bisabolol", thresholdContext: "after_fragrance" }),
  ];
  const m = (slug: string, evidence: OpenLlmMatch["evidence"]): OpenLlmMatch => ({
    item_slug: slug,
    item_name: slug,
    evidence,
    reason: "r",
  });

  it("1 supportif bien dosé -> partielle 55", () => {
    const r = resolveOpenPromise(proposal(), items, [m("panthenol", "supportive")], []);
    expect(r.verdict).toBe("partielle");
    expect(r.score).toBe(55);
  });

  it("2 supportifs bien dosés -> tenue 72", () => {
    const r = resolveOpenPromise(proposal(), items, [m("panthenol", "supportive"), m("niacinamide", "supportive")], []);
    expect(r.verdict).toBe("tenue");
    expect(r.score).toBe(72);
  });

  it("1 documenté bien dosé -> tenue 80", () => {
    const r = resolveOpenPromise(proposal(), items, [m("niacinamide", "documented")], []);
    expect(r.verdict).toBe("tenue");
    expect(r.score).toBe(80);
  });

  it("doc + sup -> tenue 85", () => {
    const r = resolveOpenPromise(proposal(), items, [m("niacinamide", "documented"), m("panthenol", "supportive")], []);
    expect(r.verdict).toBe("tenue");
    expect(r.score).toBe(85);
  });

  it("1 actif documenté en trace -> partielle 35", () => {
    const r = resolveOpenPromise(proposal(), items, [m("bisabolol", "documented")], []);
    expect(r.verdict).toBe("partielle");
    expect(r.score).toBe(35);
  });

  it("effet marketing seul -> partielle 30", () => {
    const r = resolveOpenPromise(proposal(), items, [m("dimethicone", "marketing")], []);
    expect(r.verdict).toBe("partielle");
    expect(r.score).toBe(30);
  });

  it("rien -> non_demontree 0", () => {
    const r = resolveOpenPromise(proposal(), items, [], []);
    expect(r.verdict).toBe("non_demontree");
    expect(r.score).toBe(0);
  });

  it("anti-hallucination: a cited slug absent from the formula is dropped -> 0", () => {
    const r = resolveOpenPromise(proposal(), items, [m("retinol", "documented")], []);
    expect(r.verdict).toBe("non_demontree");
    expect(r.score).toBe(0);
  });
});
