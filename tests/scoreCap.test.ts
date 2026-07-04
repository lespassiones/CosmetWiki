import { describe, it, expect } from "vitest";
import { colorCapScore } from "@/lib/essentiel/engine";
import { scoreLabel } from "@/lib/inciParser";

// NEUTRALISÉ (parité mobile) — le score pastille intègre déjà le plafond par
// position ; colorCapScore renvoie le score inchangé (plus de double-plafond).
describe("colorCapScore (neutralisé)", () => {
  it("renvoie toujours le score inchangé, quels que soient orange/rouge", () => {
    expect(colorCapScore(18, { orange: 0, rouge: 1 })).toBe(18);
    expect(colorCapScore(18, { orange: 3, rouge: 0 })).toBe(18);
    expect(colorCapScore(18, { orange: 1, rouge: 0 })).toBe(18);
    expect(colorCapScore(16.4, { orange: 0, rouge: 0 })).toBe(16.4);
    expect(colorCapScore(5, { orange: 0, rouge: 1 })).toBe(5);
    expect(colorCapScore(18, { orange: 1, rouge: 1 })).toBe(18);
  });
});

describe("scoreLabel thresholds", () => {
  it("maps to the 4 tiers at the boundaries", () => {
    expect(scoreLabel(17)).toEqual({ label: "Très bien", tone: "green" });
    expect(scoreLabel(13)).toEqual({ label: "Bien", tone: "amber" });
    expect(scoreLabel(9)).toEqual({ label: "Moyen", tone: "orange" });
    expect(scoreLabel(8.9)).toEqual({ label: "Faible", tone: "rose" });
  });
});
