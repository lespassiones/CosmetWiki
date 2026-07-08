/**
 * Parité web du fix "concentration" des 3 blocs (personalInsights). Le bloc goals
 * mettait en avant l'huile de coco (bas de liste) sur une crème capillaire au
 * lieu des huiles dominantes (tournesol/avocat). On teste la partie
 * déterministe : rang #N + règle de concentration dans le prompt.
 */
import { describe, it, expect } from "vitest";
import { buildPrompt, PERSONAL_PROMPT_VERSION, type PersonalInput } from "@/lib/ai/personalInsights";

type G = { name: string; fn: string; pos: number };
const HAIR_GREENS: G[] = [
  { name: "Aqua", fn: "Solvant", pos: 0 },
  { name: "Helianthus Annuus Seed Oil", fn: "Emollient", pos: 1 },
  { name: "Glycerin", fn: "Humectant", pos: 2 },
  { name: "Glyceryl Stearate SE", fn: "Agent émulsifiant", pos: 3 },
  { name: "Persea Gratissima Oil", fn: "Agent d'entretien de la peau", pos: 5 },
  { name: "Cocos Nucifera Oil", fn: "Conditionneur capillaire", pos: 6 },
  { name: "Mangifera Indica Seed Butter", fn: "Agent d'entretien de la peau", pos: 7 },
];

function makeInput(opts?: { greens?: G[]; profileBlock?: string | null }): PersonalInput {
  const greens = opts?.greens ?? HAIR_GREENS;
  return {
    enriched: greens.map((g) => ({
      input_raw: g.name,
      name: g.name,
      color_rating: "Vert",
      primary_function: g.fn,
      tags: null,
      position_idx: g.pos,
    })),
    counts: { Vert: greens.length, Jaune: 3, Orange: 0, Rouge: 0 },
    score: 16.5,
    scoreLabel: "Bon",
    scoreTone: "green",
    productLabel: "Crème CAPILLAIRE",
    category: "Crème capillaire",
    userId: "test",
    profileBlock:
      opts?.profileBlock === undefined ? "- Cheveux : Secs, Cheveux ternes / cassants" : opts.profileBlock,
    restrictionsBlock: null,
    restrictionMatches: [],
  };
}

describe("personalInsights buildPrompt — concentration (parité web)", () => {
  it("version alignée sur le mobile (>= 11)", () => {
    expect(PERSONAL_PROMPT_VERSION).toBeGreaterThanOrEqual(11);
  });

  it("chaque vert porte son rang [#N INCI]", () => {
    const { user } = buildPrompt(makeInput());
    expect(user).toContain("Helianthus Annuus Seed Oil (Emollient) [#2 INCI]");
    expect(user).toContain("Cocos Nucifera Oil (Conditionneur capillaire) [#7 INCI]");
  });

  it("les huiles dominantes précèdent la coco", () => {
    const { user } = buildPrompt(makeInput());
    expect(user.indexOf("Helianthus Annuus Seed Oil")).toBeLessThan(user.indexOf("Cocos Nucifera Oil"));
    expect(user.indexOf("Persea Gratissima Oil")).toBeLessThan(user.indexOf("Cocos Nucifera Oil"));
  });

  it("tri robuste même si enriched est mélangé", () => {
    const { user } = buildPrompt(makeInput({ greens: [...HAIR_GREENS].reverse() }));
    expect(user.indexOf("Helianthus Annuus Seed Oil")).toBeLessThan(user.indexOf("Cocos Nucifera Oil"));
  });

  it("la règle de concentration est dans le system prompt (avec et sans profil)", () => {
    expect(buildPrompt(makeInput()).system).toContain("CONCENTRATION (ordre INCI)");
    expect(buildPrompt(makeInput()).system).toMatch(/REGROUPE-les/i);
    expect(buildPrompt(makeInput({ profileBlock: null })).system).toContain("CONCENTRATION (ordre INCI)");
  });
});
