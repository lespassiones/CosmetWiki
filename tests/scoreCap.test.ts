import { describe, it, expect } from "vitest";
import { colorCapScore } from "@/lib/essentiel/engine";
import { scoreLabel } from "@/lib/inciParser";

// Filet d'affichage par INVARIANTS pastille (réactivé 16 juil 2026 — incident
// « feuille verte avec 2 rouges », 870 notes corrompues recalculées en base).
// Seules des bornes JAMAIS dépassables par le moteur pastille sont appliquées :
// ≥1 rouge → ≤ 12,9 ; ≥2 rouges ou ≥4 oranges → ≤ 8,9. Produit sain inchangé.
describe("colorCapScore (invariants pastille)", () => {
  it("note corrompue « verte » avec rouge(s) → rabattue (cas réel : 13,56 / 2 rouges)", () => {
    expect(colorCapScore(13.56, { orange: 2, rouge: 2 })).toBe(8.9); // Lady Speed Stick
    expect(colorCapScore(18, { orange: 0, rouge: 1 })).toBe(12.9);
    expect(colorCapScore(18, { orange: 1, rouge: 1 })).toBe(12.9);
    expect(colorCapScore(17, { orange: 4, rouge: 0 })).toBe(8.9);
  });

  it("produit SAIN : jamais modifié (pas de sur-pénalisation)", () => {
    expect(colorCapScore(12.5, { orange: 0, rouge: 1 })).toBe(12.5); // rouge en queue
    expect(colorCapScore(18, { orange: 3, rouge: 0 })).toBe(18); // 1-3 oranges : légitime
    expect(colorCapScore(18, { orange: 1, rouge: 0 })).toBe(18);
    expect(colorCapScore(16.4, { orange: 0, rouge: 0 })).toBe(16.4);
    expect(colorCapScore(5, { orange: 0, rouge: 1 })).toBe(5);
  });
});

describe("scoreLabel thresholds", () => {
  // Seuils UNIFIÉS (4 juil 2026, convention unique mobile/web/DB) :
  // >=17 vert "Très bien", >=13 vert "Bien", >=9 ambre "Moyen",
  // >=5 orange "Faible", <5 rose "Faible".
  it("maps to the tiers at the boundaries (convention >=13 vert)", () => {
    expect(scoreLabel(17)).toEqual({ label: "Très bien", tone: "green" });
    expect(scoreLabel(13)).toEqual({ label: "Bien", tone: "green" });
    expect(scoreLabel(9)).toEqual({ label: "Moyen", tone: "amber" });
    expect(scoreLabel(8.9)).toEqual({ label: "Faible", tone: "orange" });
    expect(scoreLabel(4.9)).toEqual({ label: "Faible", tone: "rose" });
  });
});
