/**
 * Pépites du jour (web) — parité avec le mobile. Prouve :
 *  - le mapping profil -> needs (exhaustif, pondéré, déterministe par jour) ;
 *  - la sélection : dédup EAN, sécurité restrictions, PLANCHER SANTÉ (note
 *    plafonnée), diversité par sous-catégorie, déterminisme par graine, backfill.
 */
import { describe, it, expect } from "vitest";
import { buildExclusionSet } from "@/lib/alternatives/filter";
import {
  CONCERN_NEEDS,
  GOAL_NEEDS,
  HAIR_NEEDS,
  INTENT_NEEDS,
  pickNeedsForUser,
} from "@/lib/weeklyPicks/needsMap";
import {
  buildWeeklyPicksSeed,
  dayKey,
  restrictionsCanonical,
  scoreLabelFromScore,
  selectWeeklyPicks,
  type WeeklyPickCandidate,
} from "@/lib/weeklyPicks/select";
import type { SkinProfile } from "@/lib/skin/profile";

// ── needsMap ──────────────────────────────────────────────────────────────
describe("needsMap — mapping profil -> needs", () => {
  it("tous les needs mappés existent dans INTENT_NEEDS", () => {
    const all = [
      ...Object.values(CONCERN_NEEDS),
      ...Object.values(GOAL_NEEDS),
      ...Object.values(HAIR_NEEDS),
    ].flat();
    for (const { need } of all) {
      expect(INTENT_NEEDS).toContain(need);
    }
  });

  it("classe par poids cumulé décroissant (acné dominante)", () => {
    const skin = { concerns: ["acne", "rides"], goals: ["attenuer_boutons"] } as SkinProfile;
    const needs = pickNeedsForUser(skin, "2026-07-17", 3);
    // acne_prone reçoit 3 (concern) + 3 (goal) = 6 -> en tête.
    expect(needs[0]).toBe("acne_prone");
    expect(needs).toContain("anti_aging");
    expect(needs).toHaveLength(3);
  });

  it("prend en compte les préoccupations cheveux", () => {
    const skin = { hairConcerns: ["pellicules"] } as SkinProfile;
    const needs = pickNeedsForUser(skin, "2026-07-17", 3);
    expect(needs[0]).toBe("scalp_health");
  });

  it("profil vide -> rotation quotidienne déterministe (stable le même jour)", () => {
    const empty = {} as SkinProfile;
    const a = pickNeedsForUser(empty, "2026-07-17", 3);
    const b = pickNeedsForUser(empty, "2026-07-17", 3);
    expect(a).toEqual(b);
    expect(a).toHaveLength(3);
    expect(a).not.toContain("odor_control_feet"); // exclu de la rotation grand public
  });

  it("la rotation change de jour en jour (déterminisme quotidien)", () => {
    const empty = {} as SkinProfile;
    const days = ["2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17", "2026-07-18"].map(
      (d) => pickNeedsForUser(empty, d, 3).join(","),
    );
    // Au moins deux jours distincts produisent des sélections différentes.
    expect(new Set(days).size).toBeGreaterThan(1);
  });

  it("complète depuis la rotation quand le profil a peu de needs", () => {
    const skin = { concerns: ["acne"] } as SkinProfile; // 1 need seulement
    const needs = pickNeedsForUser(skin, "2026-07-17", 3);
    expect(needs).toHaveLength(3);
    expect(needs[0]).toBe("acne_prone");
    expect(new Set(needs).size).toBe(3); // pas de doublon
  });
});

// ── select ──────────────────────────────────────────────────────────────────
function cand(
  ean: string,
  need: string,
  opts: Partial<WeeklyPickCandidate> = {},
): WeeklyPickCandidate {
  return {
    ean,
    brand: "Marque",
    name: `Produit ${ean}`,
    imageUrl: null,
    score: 18,
    ingredientsText: "aqua, glycerin",
    countOrange: 0,
    countRouge: 0,
    need,
    subCategory: "creme-visage",
    family: "soin-visage",
    ...opts,
  };
}

const NO_EXCL = buildExclusionSet([], undefined);
const SEED = "user-1:2026-07-17:";

describe("selectWeeklyPicks", () => {
  it("dédoublonne par EAN (un produit remonté par 2 needs = 1 pick)", () => {
    const picks = selectWeeklyPicks({
      candidates: [cand("1", "hydration_face"), cand("1", "brightening")],
      exclusion: NO_EXCL,
      seed: SEED,
    });
    expect(picks).toHaveLength(1);
  });

  it("exclut les produits contenant un ingrédient restreint (token exact)", () => {
    const picks = selectWeeklyPicks({
      candidates: [
        cand("1", "hydration_face", { ingredientsText: "aqua, parfum, glycerin" }),
        cand("2", "hydration_face", { ingredientsText: "aqua, glycerin" }),
      ],
      exclusion: buildExclusionSet(["parfum"], undefined),
      seed: SEED,
    });
    expect(picks.map((p) => p.ean)).toEqual(["2"]);
  });

  it("PLANCHER SANTÉ : écarte une note plafonnée < 13 (2 rouges rabaissent une note haute)", () => {
    const picks = selectWeeklyPicks({
      candidates: [
        cand("1", "hydration_face", { score: 20, countRouge: 2 }), // capé à 8.9 -> écarté
        cand("2", "hydration_face", { score: 15 }), // vert -> gardé
      ],
      exclusion: NO_EXCL,
      seed: SEED,
      minCappedScore: 13,
    });
    expect(picks.map((p) => p.ean)).toEqual(["2"]);
  });

  it("garde diversité : au plus maxPerSubCategory par sous-catégorie", () => {
    const picks = selectWeeklyPicks({
      candidates: [
        cand("1", "hydration_face", { subCategory: "creme", family: "f1" }),
        cand("2", "hydration_face", { subCategory: "creme", family: "f2" }),
        cand("3", "hydration_face", { subCategory: "creme", family: "f3" }),
      ],
      exclusion: NO_EXCL,
      seed: SEED,
      maxPerSubCategory: 2,
    });
    expect(picks).toHaveLength(2);
  });

  it("déterministe : même graine -> tableau strictement identique", () => {
    const candidates = Array.from({ length: 8 }, (_, i) =>
      cand(String(i), "hydration_face", { subCategory: `sub${i}`, family: `fam${i}` }),
    );
    const a = selectWeeklyPicks({ candidates, exclusion: NO_EXCL, seed: SEED, max: 6 });
    const b = selectWeeklyPicks({ candidates, exclusion: NO_EXCL, seed: SEED, max: 6 });
    expect(a.map((p) => p.ean)).toEqual(b.map((p) => p.ean));
  });

  it("coupe à `max` picks", () => {
    const candidates = Array.from({ length: 20 }, (_, i) =>
      cand(String(i), "hydration_face", { subCategory: `sub${i}`, family: `fam${i}` }),
    );
    const picks = selectWeeklyPicks({ candidates, exclusion: NO_EXCL, seed: SEED, max: 6 });
    expect(picks).toHaveLength(6);
  });

  it("backfill : profil mono-famille -> liste pleine malgré le plafond famille", () => {
    // 5 produits, même famille, sous-catégories distinctes. maxPerFamily=3 mais
    // le backfill (famille relâchée) doit compléter jusqu'à max en respectant la
    // sous-catégorie.
    const candidates = Array.from({ length: 5 }, (_, i) =>
      cand(String(i), "hydration_face", { subCategory: `sub${i}`, family: "meme-famille" }),
    );
    const picks = selectWeeklyPicks({
      candidates,
      exclusion: NO_EXCL,
      seed: SEED,
      max: 5,
      maxPerSubCategory: 2,
      maxPerFamily: 3,
    });
    expect(picks).toHaveLength(5);
  });
});

// ── helpers ──────────────────────────────────────────────────────────────────
describe("helpers", () => {
  it("scoreLabelFromScore suit les seuils 17/13/9", () => {
    expect(scoreLabelFromScore(18)).toBe("Très bien");
    expect(scoreLabelFromScore(13)).toBe("Bien");
    expect(scoreLabelFromScore(10)).toBe("Moyen");
    expect(scoreLabelFromScore(3)).toBe("Faible");
  });

  it("dayKey est un jour calendaire UTC AAAA-MM-JJ", () => {
    expect(dayKey(new Date("2026-07-17T23:30:00Z"))).toBe("2026-07-17");
    expect(dayKey(new Date("2026-01-05T00:00:00Z"))).toBe("2026-01-05");
  });

  it("restrictionsCanonical est trié et stable (insensible à l'ordre)", () => {
    const a = restrictionsCanonical({
      families: ["silicones", "alcools"],
      ingredients: [{ slug: "parfum", name: "Parfum" }],
    });
    const b = restrictionsCanonical({
      families: ["alcools", "silicones"],
      ingredients: [{ slug: "parfum", name: "Parfum" }],
    });
    expect(a).toBe(b);
  });

  it("buildWeeklyPicksSeed compose user:jour:restrictions", () => {
    expect(buildWeeklyPicksSeed("u1", "2026-07-17", "fams|ings")).toBe(
      "u1:2026-07-17:fams|ings",
    );
  });
});
