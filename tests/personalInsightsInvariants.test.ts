/**
 * Invariants DURS des 3 blocs perso (enforceInvariants) — garantis côté code,
 * indépendamment de la sortie stochastique du LLM.
 *
 *  - watch ne dit JAMAIS « rien à surveiller » s'il y a orange/rouge/restriction
 *  - tone watch : rouge (rouge|restriction) / ambre (orange seul) / vert (rien)
 *  - tone goals borné par les couleurs : rouge si (rouge|>=3 orange), jamais vert si orange/rouge
 *  - description watch jamais vide
 */
import { describe, it, expect } from "vitest";
import { enforceInvariants, type PersonalBlocks } from "@/lib/ai/personalInsights";

const base = (): PersonalBlocks => ({
  goals: { title: "Bonne formule", description: "Hydrate bien.", tone: "vert" },
  skin: { title: "Crème visage", description: "Convient.", tone: "neutre" },
  watch: { title: "Rien à surveiller", description: "Aucun ingrédient à risque.", tone: "vert" },
});

describe("enforceInvariants", () => {
  it("orange seul -> watch ambre, goals dégradé de vert à ambre", () => {
    const out = enforceInvariants(base(), { orange: 1, red: 0, restrictionHit: false, signalCats: ["parfum"] });
    expect(out.watch.tone).toBe("ambre");
    expect(out.goals.tone).toBe("ambre");
    expect(/rien à surveiller/i.test(out.watch.title + out.watch.description)).toBe(false);
    expect(out.watch.description).toContain("parfum");
  });

  it("rouge -> watch rouge ET goals rouge", () => {
    const out = enforceInvariants(base(), { orange: 0, red: 1, restrictionHit: false, signalCats: ["conservateur (parabène)"] });
    expect(out.watch.tone).toBe("rouge");
    expect(out.goals.tone).toBe("rouge");
  });

  it("restriction (ingrédient orange) -> watch rouge", () => {
    const out = enforceInvariants(base(), { orange: 1, red: 0, restrictionHit: true, signalCats: ["sulfates"] });
    expect(out.watch.tone).toBe("rouge");
  });

  it("3 oranges -> goals rouge", () => {
    const out = enforceInvariants(base(), { orange: 3, red: 0, restrictionHit: false, signalCats: ["parfum", "solvant"] });
    expect(out.goals.tone).toBe("rouge");
  });

  it("rien de problématique -> watch vert + description non vide", () => {
    const b = base();
    b.watch.description = "";
    const out = enforceInvariants(b, { orange: 0, red: 0, restrictionHit: false, signalCats: [] });
    expect(out.watch.tone).toBe("vert");
    expect(out.watch.description.trim().length).toBeGreaterThan(0);
  });

  it("remplace « rien à surveiller » quand il y a des oranges", () => {
    const b = base(); // watch dit "Rien à surveiller"
    const out = enforceInvariants(b, { orange: 2, red: 0, restrictionHit: false, signalCats: ["parfum", "agent adoucissant"] });
    expect(out.watch.title).toBe("Ingrédients à surveiller");
    expect(out.watch.description).toContain("parfum");
  });
});
