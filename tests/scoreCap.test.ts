import { describe, it, expect } from "vitest";
import { colorCapScore } from "@/lib/essentiel/engine";
import { scoreLabel } from "@/lib/inciParser";

// Handoff §5 — applyColorCap must be IDENTICAL everywhere.
describe("colorCapScore", () => {
  it("caps at 8.9 when >= 1 rouge", () => {
    expect(colorCapScore(18, { orange: 0, rouge: 1 })).toBe(8.9);
  });

  it("caps at 8.9 when >= 3 orange", () => {
    expect(colorCapScore(18, { orange: 3, rouge: 0 })).toBe(8.9);
  });

  it("caps at 12.9 when 1-2 orange (and no rouge)", () => {
    expect(colorCapScore(18, { orange: 1, rouge: 0 })).toBe(12.9);
    expect(colorCapScore(18, { orange: 2, rouge: 0 })).toBe(12.9);
  });

  it("does not cap a clean formula", () => {
    expect(colorCapScore(16.4, { orange: 0, rouge: 0 })).toBe(16.4);
  });

  it("never raises a score already below the cap", () => {
    expect(colorCapScore(5, { orange: 0, rouge: 1 })).toBe(5);
    expect(colorCapScore(10, { orange: 1, rouge: 0 })).toBe(10);
  });

  it("rouge wins over orange", () => {
    expect(colorCapScore(18, { orange: 1, rouge: 1 })).toBe(8.9);
  });
});

describe("scoreLabel thresholds", () => {
  it("maps to the 4 tiers at the boundaries", () => {
    expect(scoreLabel(17)).toEqual({ label: "Très bien", tone: "green" });
    expect(scoreLabel(13)).toEqual({ label: "Bien", tone: "amber" });
    expect(scoreLabel(9)).toEqual({ label: "Moyen", tone: "orange" });
    expect(scoreLabel(8.9)).toEqual({ label: "À éviter", tone: "rose" });
  });
});
