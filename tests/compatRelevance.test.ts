/**
 * Parité web — gating de pertinence (lib/ai/compatRelevance). Produits liés /
 * non liés au profil, profils avec et sans données, remplis partiellement.
 */
import { describe, it, expect } from "vitest";
import {
  axisFilled,
  categoryToAxis,
  relevanceVerdict,
  type SkinProfileLike,
} from "@/lib/ai/compatRelevance";

const EMPTY: SkinProfileLike = {};
const SKIN_ONLY: SkinProfileLike = { skinTypeFace: "grasse", concerns: ["acne"] };
const HAIR_ONLY: SkinProfileLike = { hairConcerns: ["pellicules"] };
const GOALS_SKIN_ONLY: SkinProfileLike = { goals: ["peau_douce"] };
const GOALS_HAIR_ONLY: SkinProfileLike = { goals: ["cheveux_brillants"] };
const ALLERGY_ONLY: SkinProfileLike = { allergiesFreeform: "allergie au parfum" };

describe("categoryToAxis", () => {
  it("cheveux → hair (avant peau)", () => {
    for (const c of ["Shampooing Antipelliculaire", "Après-shampoing", "Masque cheveux", "Coloration"]) {
      expect(categoryToAxis(c)).toBe("hair");
    }
  });
  it("peau → skin", () => {
    for (const c of ["Crème visage", "Lait corps", "Sérum", "Gel douche", "Crème solaire SPF50"]) {
      expect(categoryToAxis(c)).toBe("skin");
    }
  });
  it("hors profil → none", () => {
    for (const c of ["Dentifrice", "Brosse à dents", "Déodorant", "Parfum", null, ""]) {
      expect(categoryToAxis(c)).toBe("none");
    }
  });
});

describe("axisFilled", () => {
  it("hair", () => {
    expect(axisFilled("hair", HAIR_ONLY)).toBe(true);
    expect(axisFilled("hair", GOALS_HAIR_ONLY)).toBe(true);
    expect(axisFilled("hair", EMPTY)).toBe(false);
    expect(axisFilled("hair", SKIN_ONLY)).toBe(false);
  });
  it("skin", () => {
    expect(axisFilled("skin", SKIN_ONLY)).toBe(true);
    expect(axisFilled("skin", GOALS_SKIN_ONLY)).toBe(true);
    expect(axisFilled("skin", ALLERGY_ONLY)).toBe(true);
    expect(axisFilled("skin", EMPTY)).toBe(false);
    expect(axisFilled("skin", HAIR_ONLY)).toBe(false);
  });
  it("none toujours vrai", () => {
    expect(axisFilled("none", EMPTY)).toBe(true);
  });
});

describe("relevanceVerdict — tous les cas", () => {
  it("sans profil : bloque les produits liés, laisse passer les autres", () => {
    expect(relevanceVerdict("Shampooing", EMPTY)).toEqual({ kind: "profile_incomplete", missingSection: "hair" });
    expect(relevanceVerdict("Crème visage", EMPTY)).toEqual({ kind: "profile_incomplete", missingSection: "skin" });
    expect(relevanceVerdict("Dentifrice", EMPTY)).toEqual({ kind: "product_only" });
  });
  it("peau seule", () => {
    expect(relevanceVerdict("Crème visage", SKIN_ONLY)).toEqual({ kind: "personal", axis: "skin" });
    expect(relevanceVerdict("Shampooing", SKIN_ONLY)).toEqual({ kind: "profile_incomplete", missingSection: "hair" });
  });
  it("cheveux seuls", () => {
    expect(relevanceVerdict("Shampooing", HAIR_ONLY)).toEqual({ kind: "personal", axis: "hair" });
    expect(relevanceVerdict("Crème corps", HAIR_ONLY)).toEqual({ kind: "profile_incomplete", missingSection: "skin" });
  });
  it("objectifs seuls suffisent", () => {
    expect(relevanceVerdict("Crème visage", GOALS_SKIN_ONLY)).toEqual({ kind: "personal", axis: "skin" });
    expect(relevanceVerdict("Shampooing", GOALS_HAIR_ONLY)).toEqual({ kind: "personal", axis: "hair" });
  });
  it("hors profil jamais bloqué", () => {
    for (const p of [EMPTY, SKIN_ONLY, HAIR_ONLY]) {
      expect(relevanceVerdict("Dentifrice", p)).toEqual({ kind: "product_only" });
    }
  });
});
