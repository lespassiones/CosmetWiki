/**
 * Parité web — MOTEUR ADDITIF du score de compatibilité (lib/ai/compat).
 * score = base qualité + lignes IA (±5/±10 capées ±20) → plafond couleurs →
 * -8 par restriction → plancher qualité → clamp. Breakdown qui somme.
 */
import { describe, it, expect } from "vitest";
import {
  buildCompatLines,
  colorCeiling,
  composeCompatScore,
  labelForScore,
  negativeSubtitle,
  qualityScore,
  toneForScore,
  type CompatLine,
} from "@/lib/ai/compat";

describe("labelForScore — 10 paliers (échelle « adapté »)", () => {
  const cases: [number, string][] = [
    [0, "Incompatible"],
    [10, "À éviter pour toi"],
    [23, "Pas adapté"],
    [35, "Très peu adapté"],
    [48, "Peu adapté"],
    [55, "Moyennement adapté"],
    [66, "Plutôt compatible"],
    [75, "Compatible"],
    [82, "Très compatible"],
    [95, "Totalement compatible"],
  ];
  it.each(cases)("%i → %s", (score, label) => {
    expect(labelForScore(score)).toBe(label);
  });

  it("sous 60, ne dit JAMAIS « compatible » en positif (règle user)", () => {
    for (let s = 0; s < 60; s++) {
      expect(labelForScore(s)).not.toMatch(/^(Assez|Plutôt|Bien|Très|Totalement) compatible$/);
    }
  });
});

describe("toneForScore", () => {
  it("rouge < 30, orange 30-49, jaune 50-69, vert ≥ 70", () => {
    expect(toneForScore(29)).toBe("rouge");
    expect(toneForScore(49)).toBe("orange");
    expect(toneForScore(69)).toBe("jaune");
    expect(toneForScore(70)).toBe("vert");
  });
});

describe("qualityScore + colorCeiling", () => {
  it("conversion note/20 et plafonds", () => {
    expect(qualityScore(16.82)).toBe(84);
    expect(qualityScore(0.79)).toBe(4);
    expect(colorCeiling(0, 1)).toBe(59);
    expect(colorCeiling(3, 0)).toBe(59);
    expect(colorCeiling(2, 0)).toBe(69);
    expect(colorCeiling(0, 0)).toBe(100);
  });
});

describe("buildCompatLines — barème v21 (bonus tout actif utile, aucun malus jaune)", () => {
  const a = (name: string) => ({ name });

  it("3 actifs utiles → +6 agrégé (sans « verts ») ; 12 → +20 cap", () => {
    const out = buildCompatLines({
      contributors: [a("glycérine"), a("aloe vera"), a("karité")],
      against: [],
    });
    expect(out).toEqual([
      { label: "3 actifs utiles à ton profil : glycérine, aloe vera, karité", points: 6 },
    ]);
    const capped = buildCompatLines({
      contributors: Array.from({ length: 12 }, (_, i) => a(`v${i}`)),
      against: [],
    });
    expect(capped[0].points).toBe(20);
    expect(capped[0].label).not.toContain("vert");
  });

  it("un jaune BÉNÉFIQUE reçoit le bonus comme un vert ; un jaune SANS lien n'a aucun malus", () => {
    // acide salicylique est jaune mais utile → +2, comme un vert
    expect(buildCompatLines({ contributors: [a("acide salicylique")], against: [] })).toEqual([
      { label: "1 actif utile à ton profil : acide salicylique", points: 2 },
    ]);
    // rien de listé → aucune ligne : un jaune neutre ne coûte rien (barème v21)
    expect(buildCompatLines({ contributors: [], against: [] })).toEqual([]);
  });

  it("against : -5 nommée, jusqu'à 7 (8 → 7 gardés)", () => {
    const out = buildCompatLines({
      contributors: [],
      against: [
        { name: "alcool", need: "ta peau sèche" },
        { name: "huile de coco", need: "ton acné" },
        { name: "parfum", need: "ta peau réactive" },
      ],
    });
    expect(out).toHaveLength(3);
    expect(out[2]).toEqual({ label: "Parfum : à éviter pour ta peau réactive", points: -5 });
    const many = Array.from({ length: 8 }, (_, i) => ({ name: `x${i}`, need: "ton profil" }));
    expect(buildCompatLines({ contributors: [], against: many })).toHaveLength(7);
  });
});

describe("composeCompatScore", () => {
  const noIa: CompatLine[] = [];

  it("base pure : 16/20 propre → 80", () => {
    const r = composeCompatScore({ scoreOver20: 16, orange: 0, red: 0, iaLines: noIa, restrictionLabels: [] });
    expect(r.score).toBe(80);
    expect(r.breakdown).toEqual({ base: 80, lines: [] });
  });

  it("bonus IA : 16/20 +10 +5 → 95, breakdown somme", () => {
    const r = composeCompatScore({
      scoreOver20: 16, orange: 0, red: 0,
      iaLines: [
        { label: "Glycérine : ton objectif hydratation", points: 10 },
        { label: "Niacinamide : tes pores", points: 5 },
      ],
      restrictionLabels: [],
    });
    expect(r.score).toBe(95);
    expect(r.breakdown.base + r.breakdown.lines.reduce((s, l) => s + l.points, 0)).toBe(95);
  });

  it("malus IA : 15/20 -10 → 65", () => {
    const r = composeCompatScore({
      scoreOver20: 15, orange: 0, red: 0,
      iaLines: [{ label: "Alcool : ta peau sensible", points: -10 }],
      restrictionLabels: [],
    });
    expect(r.score).toBe(65);
  });

  it("plafond couleurs en ligne : 12/20 +10 = 70, 2 oranges → 69", () => {
    const r = composeCompatScore({
      scoreOver20: 12, orange: 2, red: 0,
      iaLines: [{ label: "Karité : ta peau sèche", points: 10 }],
      restrictionLabels: [],
    });
    expect(r.score).toBe(69);
    expect(r.breakdown.lines.find((l) => l.label.startsWith("Plafond"))).toEqual({
      label: "Plafond : 2 ingrédients orange",
      points: -1,
    });
  });

  it("restrictions : ligne -8 nommée chacune (18/20 - 16 → 74)", () => {
    const r = composeCompatScore({
      scoreOver20: 18, orange: 0, red: 0, iaLines: noIa,
      restrictionLabels: ["Sulfates", "Silicones"],
    });
    expect(r.score).toBe(74);
    expect(r.breakdown.lines).toHaveLength(2);
  });

  it("sensibilité DÉDUITE : -8 nommée « sensibilité de ton profil » (18/20 - 8 → 82)", () => {
    const r = composeCompatScore({
      scoreOver20: 18, orange: 0, red: 0, iaLines: noIa,
      restrictionLabels: [],
      inferredRestrictionLabels: ["Silicones"],
    });
    expect(r.score).toBe(82);
    expect(r.breakdown.lines).toEqual([
      { label: "Silicones : sensibilité de ton profil", points: -8 },
    ]);
  });

  it("cochée + déduite cumulent (chacune -8) : la ligne cochée dit « ta restriction », l'inférée « sensibilité de ton profil » (18/20 -8 -8 → 74)", () => {
    // NB : le dédoublonnage par slug (une famille cochée n'est PAS re-listée en
    // inférée) est fait en amont (enforceCompatibility) ; ici on prouve que les
    // deux listes, une fois distinctes, appliquent bien -8 chacune sans se gêner.
    const r = composeCompatScore({
      scoreOver20: 18, orange: 0, red: 0, iaLines: noIa,
      restrictionLabels: ["Sulfates"],
      inferredRestrictionLabels: ["Silicones"],
    });
    expect(r.score).toBe(74);
    expect(r.breakdown.lines).toEqual([
      { label: "Sulfates : ta restriction", points: -8 },
      { label: "Silicones : sensibilité de ton profil", points: -8 },
    ]);
  });

  it("déo réel : 0.79/20 + 4 restrictions → 0 Incompatible", () => {
    const r = composeCompatScore({
      scoreOver20: 0.79, orange: 6, red: 3, iaLines: noIa,
      restrictionLabels: ["Aluminium", "A", "B", "C"],
    });
    expect(r.score).toBe(0);
    expect(r.label).toBe("Incompatible");
  });

  it("product_only : lignes IA IGNORÉES (score = qualité), pas de liste d'actifs dans le breakdown", () => {
    // Le positif d'un produit hors profil est porté par les 3 blocs IA, pas ici (v31).
    const r = composeCompatScore({
      scoreOver20: 15, orange: 0, red: 0,
      iaLines: [{ label: "x", points: 10 }],
      restrictionLabels: [], productOnly: true,
    });
    expect(r.score).toBe(75);
    expect(r.breakdown.lines).toHaveLength(0);
  });

  it("product_only : les restrictions cochées mordent quand même (86 - 8 → 78)", () => {
    const r = composeCompatScore({
      scoreOver20: 17.2, orange: 0, red: 0, iaLines: [{ label: "ignorée", points: 10 }],
      restrictionLabels: ["Sulfates"], productOnly: true,
    });
    expect(r.score).toBe(78);
    expect(r.breakdown.lines).toEqual([{ label: "Sulfates : ta restriction", points: -8 }]);
  });

  it("clamp haut : 20/20 + bonus → 100, SANS ligne « Plafond » (0 orange/rouge)", () => {
    const r = composeCompatScore({
      scoreOver20: 20, orange: 0, red: 0,
      iaLines: [{ label: "a", points: 10 }],
      restrictionLabels: [],
    });
    expect(r.score).toBe(100);
    expect(r.breakdown.lines.some((l) => /Plafond/i.test(l.label))).toBe(false);
  });

  it("restriction APRÈS le plafond 100 : 20/20 + 4 actifs (+8) + 1 restriction → 92", () => {
    const r = composeCompatScore({
      scoreOver20: 20, orange: 0, red: 0,
      iaLines: [{ label: "4 actifs utiles à ton profil : glycérine, karité, amande, aloe", points: 8 }],
      restrictionLabels: ["Silicones"],
    });
    expect(r.score).toBe(92); // 100 plafonné - 8, PAS 100 (le bonus ne l'absorbe pas)
    expect(r.breakdown.base + r.breakdown.lines.reduce((s, l) => s + l.points, 0)).toBe(92);
    expect(r.breakdown.lines.some((l) => /Plafond/i.test(l.label))).toBe(false);
    expect(r.breakdown.lines.some((l) => l.label === "Silicones : ta restriction")).toBe(true);
  });

  it("PAS de plancher : contre-indications font baisser (base 40 -20 → 20 ; base 84 -20 → 64)", () => {
    const low = composeCompatScore({
      scoreOver20: 8, orange: 0, red: 0,
      iaLines: [{ label: "a", points: -10 }, { label: "b", points: -10 }],
      restrictionLabels: [],
    });
    expect(low.score).toBe(20); // plus de plancher à 24
    const green = composeCompatScore({
      scoreOver20: 16.82, orange: 0, red: 0,
      iaLines: [{ label: "a", points: -10 }, { label: "b", points: -10 }],
      restrictionLabels: [],
    });
    expect(green.score).toBe(64);
  });

  it("produit propre SANS contre-indication reste haut (base + bonus, aucun malus)", () => {
    const r = composeCompatScore({
      scoreOver20: 16, orange: 0, red: 0,
      iaLines: [{ label: "2 actifs utiles à ton profil : a, b", points: 4 }],
      restrictionLabels: [],
    });
    expect(r.score).toBe(84);
  });
});

describe("negativeSubtitle — sous 60, focus danger", () => {
  const base = { against: [], orange: 0, red: 0 };
  it("≥60 → null ; restrictions nommées/comptées ; against nommée ; replis", () => {
    expect(negativeSubtitle({ ...base, score: 84, restrictionLabels: ["Sulfates"] })).toBeNull();
    expect(negativeSubtitle({ ...base, score: 24, restrictionLabels: ["Silicones"] }))
      .toBe("contient une de tes restrictions : silicones");
    expect(negativeSubtitle({ ...base, score: 0, restrictionLabels: ["A", "B", "C"] }))
      .toBe("contient 3 de tes restrictions");
    expect(
      negativeSubtitle({
        score: 40, restrictionLabels: [],
        against: [{ name: "Alcool", need: "ta peau sèche" }],
        orange: 0, red: 0,
      }),
    ).toBe("alcool déconseillé pour ta peau sèche");
    expect(negativeSubtitle({ ...base, score: 45, restrictionLabels: [], orange: 2 }))
      .toBe("formule pénalisée par des ingrédients à risque");
    expect(negativeSubtitle({ ...base, score: 30, restrictionLabels: [] }))
      .toBe("la qualité de la formule est insuffisante");
  });

  it("sensibilité déduite (non cochée) : phrase honnête, jamais « tes restrictions » ni « qualité insuffisante »", () => {
    expect(
      negativeSubtitle({ ...base, score: 50, restrictionLabels: [], inferredCount: 1 }),
    ).toBe("contient des ingrédients peu adaptés à ton profil");
    // Une vraie restriction cochée reste prioritaire sur la sensibilité déduite.
    expect(
      negativeSubtitle({ ...base, score: 50, restrictionLabels: ["Silicones"], inferredCount: 2 }),
    ).toBe("contient une de tes restrictions : silicones");
  });
});
