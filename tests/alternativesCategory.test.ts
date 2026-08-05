import { describe, it, expect } from "vitest";
import {
  isSpecificCategorySlug,
  normalizeType,
  productNameToCategoryPrefix,
  productTypeToCategoryPrefix,
  resolveAlternativesQuery,
} from "@/lib/alternatives/categoryResolve";

// Preuve que la résolution de catégorie des ALTERNATIVES ne pivote JAMAIS sur un
// bucket poubelle et retombe proprement sur des signaux fonctionnels
// (product_type, nom), ou s'ABSTIENT.
//
// Bug source (bêta juil 2026) : « Gel de Limpeza Facial CeraVe » (catégorie
// catalogue = « gel », product_type = null) affichait comme alternatives un savon
// pour les mains, un gel gingival bébé, un gel jambes, des lingettes.

describe("isSpecificCategorySlug", () => {
  it("accepte un slug hiérarchique ≥ 2 niveaux", () => {
    expect(isSpecificCategorySlug("soin-du-corps-et-visage/nettoyant-visage")).toBe(true);
    expect(
      isSpecificCategorySlug("soin-du-corps-et-visage/nettoyant-visage/gel-nettoyant-visage"),
    ).toBe(true);
    expect(isSpecificCategorySlug("coiffure/shampooing")).toBe(true);
  });

  it("REJETTE les buckets poubelle observés en prod", () => {
    // Mono-token (le cœur du bug)
    expect(isSpecificCategorySlug("gel")).toBe(false);
    expect(isSpecificCategorySlug("coiffure")).toBe(false);
    expect(isSpecificCategorySlug("maquillage")).toBe(false);
    expect(isSpecificCategorySlug("sunscreen")).toBe(false);
    expect(isSpecificCategorySlug("hair-gel")).toBe(false);
    // Top-level seul (trop large)
    expect(isSpecificCategorySlug("soin-du-corps-et-visage")).toBe(false);
    // Labels bruts avec espaces
    expect(isSpecificCategorySlug("Crème solaire adulte")).toBe(false);
    expect(isSpecificCategorySlug("Lingettes nettoyantes bébé")).toBe(false);
    // Vide / null
    expect(isSpecificCategorySlug(null)).toBe(false);
    expect(isSpecificCategorySlug(undefined)).toBe(false);
    expect(isSpecificCategorySlug("")).toBe(false);
    expect(isSpecificCategorySlug("/")).toBe(false);
  });
});

describe("productNameToCategoryPrefix — dernier recours prudent", () => {
  it("classe un nom à mot-clé FORT", () => {
    expect(productNameToCategoryPrefix("Gel de Limpeza Facial CeraVe Pele Oleosa")).toBe(
      "soin-du-corps-et-visage/nettoyant-visage/%",
    );
    expect(productNameToCategoryPrefix("Shampooing doux quotidien")).toBe("coiffure/shampooing/%");
    expect(productNameToCategoryPrefix("Dentifrice blancheur")).toBe(
      "hygiene-dentaire/dentifrice-adulte/%",
    );
  });

  it("S'ABSTIENT sur un nom marketing sans fonction (pas de fourre-tout crème)", () => {
    // « crème »/« jour » (catchAll) sont ignorés pour un NOM → abstention plutôt qu'un faux positif.
    expect(productNameToCategoryPrefix("Nouvelle Peau")).toBeNull();
    expect(productNameToCategoryPrefix("Merveille Absolue")).toBeNull();
    expect(productNameToCategoryPrefix("Ma Crème du Jour")).toBeNull();
    expect(productNameToCategoryPrefix("")).toBeNull();
  });
});

describe("resolveAlternativesQuery — priorité des signaux", () => {
  it("slug catalogue spécifique → match EXACT (le plus précis)", () => {
    const q = resolveAlternativesQuery({
      catalogCategory: "soin-du-corps-et-visage/nettoyant-visage/gel-nettoyant-visage",
      productType: "Nettoyant visage",
      productName: "peu importe",
    });
    expect(q).toEqual({
      kind: "exact",
      value: "soin-du-corps-et-visage/nettoyant-visage/gel-nettoyant-visage",
      source: "catalog-category",
    });
  });

  it("catégorie POUBELLE ignorée → product_type utilisé (préfixe)", () => {
    const q = resolveAlternativesQuery({
      catalogCategory: "gel",
      productType: "Nettoyant visage",
      productName: null,
    });
    expect(q).toEqual({
      kind: "prefix",
      value: "soin-du-corps-et-visage/nettoyant-visage/%",
      source: "product-type",
    });
  });

  it("RÉGRESSION bug bêta : catégorie « gel » + product_type null → nom rattrape", () => {
    // Exactement le cas du bêta-testeur : ni catégorie propre, ni product_type.
    const q = resolveAlternativesQuery({
      catalogCategory: "gel",
      productType: null,
      productName: "Gel de Limpeza Facial CeraVe Pele Oleosa com 454g",
    });
    expect(q).toEqual({
      kind: "prefix",
      value: "soin-du-corps-et-visage/nettoyant-visage/%",
      source: "product-name",
    });
  });

  it("aucun signal fiable → ABSTENTION (null) : rien plutôt que du hors-sujet", () => {
    expect(
      resolveAlternativesQuery({ catalogCategory: "gel", productType: null, productName: "XYZ 42" }),
    ).toBeNull();
    expect(resolveAlternativesQuery({})).toBeNull();
    expect(
      resolveAlternativesQuery({ catalogCategory: null, productType: "", productName: "" }),
    ).toBeNull();
  });
});

describe("normalizeType", () => {
  it("minuscule + sans accents + trim", () => {
    expect(normalizeType("  Gel de Limpeza FACIAL  ")).toBe("gel de limpeza facial");
    expect(normalizeType(null)).toBe("");
  });
});
