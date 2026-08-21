import { describe, it, expect } from "vitest";
import { cacheMatchesInci, inciKey, parseInciList, reconcileScore, scoreLabel } from "@/lib/inciParser";

/**
 * Garde-fous de RÉGRESSION de l'incident bêta du 21 août 2026 (« 4 étoiles
 * vertes avec un ingrédient orange en 4e position »). Twin des tests mobile
 * (`lib/__tests__/staleCacheGuards.test.ts` du repo CosmeCheck-App).
 *
 * Le diagnostic est parti d'une ligne d'historique où `result_json` ne décrivait
 * PAS son propre `input_text` : `product_analyses` est un cache d'analyse
 * pré-calculée keyé par EAN, et rien ne l'invalidait quand
 * `catalog.ingredients_text` changeait. L'EAN 3770035517084 (Vagance, Le
 * Shampoing capillaire et barbe, INCI naturel de 13 ingrédients, catalogue 16,3
 * avec 0 orange) renvoyait l'analyse d'une eau micellaire à l'eau de rose
 * (12 items, POLOXAMER 184 Orange en position 4).
 *
 * Côté web, la branche cache de `app/api/analyser/route.ts` servait cette ligne
 * SANS aucun garde-fou, ni quantité ni contenu → d'où `cacheMatchesInci`.
 * `reconcileScore` existait déjà (garde-fou score catalogue ↔ couleurs) ; les
 * cas ci-dessous le verrouillent, notamment le cas réel Yepoda.
 */

// INCI réels relevés en prod le 21 août 2026.
const VAGANCE_INCI =
  "Aqua, Urtica Dioica Leaf Water, Cananga Odorata Flower Water, Aloe Barbadensis Leaf Juice, " +
  "Decyl Glucoside, Sodium Cocoyl Glutamate, Persea Gratissima Oil, Xanthan Gum, Potassium Sorbate, " +
  "Sodium Benzoate, Propylene Glycol, Citric Acid, Hydrolyzed Rice Protein";

/** Les 12 items que le cache servait pour l'EAN Vagance (eau micellaire). */
const MICELLAR_CACHED_ITEMS = [
  "Aqua", "Hexylene Glycol", "Glycerin", "Poloxamer 184", "Disodium Cocoamphodiacetate",
  "Disodium EDTA", "Sodium Chloride", "Citric Acid", "Sodium Benzoate", "Potassium Sorbate",
  "Rosa Damascena Flower Water", "Fragrance",
].map((input) => ({ input }));

const rawsOf = (inci: string) => parseInciList(inci).map((t) => t.raw);

describe("cacheMatchesInci — cache EAN décrivant un AUTRE produit", () => {
  it("REJETTE le cache eau micellaire servi sous l'EAN du shampoing Vagance", () => {
    // 4 tokens communs sur 12 (Aqua, Citric Acid, Sodium Benzoate, Potassium
    // Sorbate) = 0,33 < 0,6.
    expect(cacheMatchesInci(MICELLAR_CACHED_ITEMS, rawsOf(VAGANCE_INCI))).toBe(false);
  });

  it("ACCEPTE un cache calculé sur le même INCI", () => {
    const raws = rawsOf(VAGANCE_INCI);
    expect(cacheMatchesInci(raws.map((input) => ({ input })), raws)).toBe(true);
  });

  it("ACCEPTE malgré les alias parenthésés retirés par le parser (pas de faux rejet)", () => {
    // Piège qui produisait 36 faux positifs sur 41 dans le détecteur SQL : le
    // texte source dit « Vitis Vinifera (Grape) Seed Oil », le parser stocke la
    // forme sans parenthèse. La comparaison doit rester raw↔raw.
    const raws = rawsOf("Vitis Vinifera (Grape) Seed Oil, Corylus Avellana (Hazelnut) Seed Oil, Tocopherol");
    expect(cacheMatchesInci(raws.map((input) => ({ input })), raws)).toBe(true);
  });

  it("ACCEPTE malgré les astérisques Ecocert", () => {
    const raws = rawsOf("*Olea Europaea (Olive) Fruit Oil, *Cera Alba (Beeswax), *Ricinus Communis Seed Oil");
    expect(cacheMatchesInci(raws.map((input) => ({ input })), raws)).toBe(true);
  });

  it("REJETTE un cache vide ou sans INCI de référence (pas de confiance par défaut)", () => {
    expect(cacheMatchesInci([], rawsOf(VAGANCE_INCI))).toBe(false);
    expect(cacheMatchesInci(MICELLAR_CACHED_ITEMS, [])).toBe(false);
  });

  it("inciKey neutralise casse, accents et ponctuation", () => {
    expect(inciKey("Rosa Damascena Flower Water")).toBe("ROSADAMASCENAFLOWERWATER");
    expect(inciKey("Aloé-Barbadensis, Leaf")).toBe(inciKey("ALOE BARBADENSIS LEAF"));
  });
});

describe("reconcileScore — la note ne contredit pas les couleurs affichées", () => {
  it("garde le score live quand le catalogue est dans une AUTRE bande (cas Yepoda)", () => {
    // Catalogue 12,9 « Moyen » (ambre) vs live 16,55 « Bien » (vert), 34/34
    // identifiés → on sert 16,55, donc 4 étoiles vertes cohérentes avec un top5
    // tout vert. Le mobile rend la même chose depuis le fix du même jour.
    expect(reconcileScore(12.9, 16.55, 34, 34)).toBe(16.55);
  });

  it("sert le score catalogue quand les deux sont dans la même bande (curation respectée)", () => {
    expect(reconcileScore(16.12, 16.12, 15, 15)).toBe(16.12);
    // 19,5 et 16,3 sont tous deux « vert » → le catalogue gagne.
    expect(reconcileScore(19.5, 16.3, 13, 13)).toBe(19.5);
  });

  it("retombe sur le catalogue si moins de 50 % des ingrédients sont identifiés", () => {
    expect(reconcileScore(16.3, 8.1, 4, 13)).toBe(16.3);
  });

  it("retombe sur le catalogue si aucun score live", () => {
    expect(reconcileScore(16.3, null, 13, 13)).toBe(16.3);
  });

  it("« Très bien » et « Bien » partagent la bande verte (pas de bascule inutile)", () => {
    expect(scoreLabel(17).tone).toBe("green");
    expect(scoreLabel(13).tone).toBe("green");
    expect(scoreLabel(12.9).tone).toBe("amber");
    expect(scoreLabel(8.9).tone).toBe("orange");
    expect(scoreLabel(4.9).tone).toBe("rose");
  });
});
