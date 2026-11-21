import { describe, expect, it } from "vitest";
import {
  countInciIngredients,
  isValidGtin,
  normalizeUrl,
  validateBrandContact,
  validateBrandSubmission,
} from "@/lib/brands/submission";
import { applyColorCap, starsForProduct, starsFromScore } from "@/lib/brands/stars";
import { buildBadgeSvg, truncate } from "@/lib/brands/badgeSvg";
import { brandAckEmail, brandTeamEmail, contactTeamEmail, escapeHtml } from "@/lib/emails/templates";

const VALID = {
  brand: "Les Douces Fleurs",
  contactEmail: "Qualite@Marque.FR",
  productName: "Crème visage hydratante",
  ean: "3 760 000 000 000".replace(/\s/g, "").slice(0, 12) + "",
  volume: "50 ml",
  zones: ["Visage"],
  inci: "AQUA, GLYCERIN, CETEARYL ALCOHOL",
  certify: "on",
};

// EAN-13 valide : 3017620422003 (clé 3).
const GOOD_EAN = "3017620422003";

describe("isValidGtin", () => {
  it("accepte un EAN-13 et un EAN-8 justes", () => {
    expect(isValidGtin(GOOD_EAN)).toBe(true);
    expect(isValidGtin("96385074")).toBe(true);
  });
  it("refuse une clé fausse, des lettres, une mauvaise longueur", () => {
    expect(isValidGtin("3017620422004")).toBe(false);
    expect(isValidGtin("30176204220a3")).toBe(false);
    expect(isValidGtin("12345")).toBe(false);
  });
});

describe("validateBrandSubmission", () => {
  it("accepte une fiche minimale et normalise", () => {
    const r = validateBrandSubmission({ ...VALID, ean: `${GOOD_EAN.slice(0, 4)} ${GOOD_EAN.slice(4)}` });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.ean).toBe(GOOD_EAN);
    expect(r.data.contactEmail).toBe("qualite@marque.fr");
    expect(r.data.contactName).toBeNull();
    expect(r.data.productType).toBeNull();
    expect(r.data.productUrl).toBeNull();
  });

  it("produit sans code-barres : ean null", () => {
    const r = validateBrandSubmission({ ...VALID, ean: "", noEan: "on" });
    expect(r.ok && r.data.ean).toBeNull();
  });

  it("signale le bon champ en cas d'erreur", () => {
    const cases: [Record<string, unknown>, string][] = [
      [{ brand: "" }, "brand"],
      [{ contactEmail: "pas-un-mail" }, "contactEmail"],
      [{ ean: "" }, "ean"],
      [{ ean: "3017620422004" }, "ean"],
      [{ volume: "" }, "volume"],
      [{ zones: [] }, "zones"],
      [{ zones: ["Inventée"] }, "zones"],
      [{ inci: "" }, "inci"],
      [{ productUrl: "pas une url" }, "productUrl"],
      [{ certify: undefined }, "certify"],
    ];
    for (const [patch, field] of cases) {
      const r = validateBrandSubmission({ ...VALID, ean: GOOD_EAN, ...patch });
      expect(r.ok, JSON.stringify(patch)).toBe(false);
      if (!r.ok) expect(r.field).toBe(field);
    }
  });

  it("type « Autre » : garde la précision saisie", () => {
    const r = validateBrandSubmission({ ...VALID, ean: GOOD_EAN, productType: "Autre", productTypeOther: "Brume" });
    expect(r.ok && r.data.productType).toBe("Brume");
  });

  it("dédoublonne les zones et ignore les valeurs inconnues", () => {
    const r = validateBrandSubmission({ ...VALID, ean: GOOD_EAN, zones: ["Visage", "Visage", "Corps", "x"] });
    expect(r.ok && r.data.zones).toEqual(["Visage", "Corps"]);
  });
});

describe("helpers", () => {
  it("normalizeUrl ajoute https et refuse le reste", () => {
    expect(normalizeUrl("marque.fr/produit")).toBe("https://marque.fr/produit");
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("localhost")).toBeNull();
  });
  it("countInciIngredients", () => {
    expect(countInciIngredients("AQUA, GLYCERIN;PARFUM\nLINALOOL, ")).toBe(4);
    expect(countInciIngredients("")).toBe(0);
  });
});

describe("étoiles (miroir de l'app)", () => {
  it("seuils 17 / 13 / 9 / 5", () => {
    expect([18, 17, 16.9, 13, 12.9, 9, 8.9, 5, 4.9].map(starsFromScore)).toEqual([5, 5, 4, 4, 3, 3, 2, 2, 1]);
  });
  it("plafond orange / rouge", () => {
    expect(applyColorCap(18, 0, 1)).toBe(12.9);
    expect(applyColorCap(18, 4, 0)).toBe(8.9);
    expect(starsForProduct({ score: 18, count_orange: 0, count_rouge: 2 })).toBe(2);
    expect(starsForProduct({ score: null })).toBeNull();
  });
});

describe("badge SVG", () => {
  it("échappe le nom du produit et compte les étoiles pleines", () => {
    const svg = buildBadgeSvg({ stars: 4, brand: "A&B", productName: "<script>x</script>" });
    expect(svg).toContain("A&amp;B");
    expect(svg).not.toContain("<script>");
    expect(svg.match(/url\(#cc-full\)/g)?.length).toBe(8); // 4 étoiles, fill + stroke
    expect(svg).toContain("4/5");
  });
  it("tronque proprement", () => {
    expect(truncate("un deux trois quatre cinq", 12)).toBe("un deux…");
  });
});

describe("e-mails", () => {
  it("contact : échappe le message, sujet lisible", () => {
    const m = contactTeamEmail({ firstName: "Léa", email: "lea@x.fr", subject: "Bug", message: "<b>hop</b>\nligne 2" });
    expect(m.subject).toBe("[Contact] Bug : Léa");
    expect(m.html).toContain("&lt;b&gt;hop&lt;/b&gt;<br>ligne 2");
  });

  it("marques : un seul mail équipe pour tout l'envoi, accusé listant les produits", () => {
    const product = {
      id: "1",
      productName: "Crème",
      ean: null,
      volume: "50 ml",
      productType: null,
      zones: ["Visage", "Corps"],
      inci: "AQUA, GLYCERIN",
      properties: null,
      madeIn: null,
      productUrl: null,
      photoUrls: [],
    };
    const c = { brand: "Fleurs", contactName: null, contactEmail: "a@b.fr" };
    const one = brandTeamEmail(c, [product]);
    expect(one.subject).toBe("[Marques] Fleurs : Crème");
    expect(one.html).toContain("Sans code-barres");
    expect(one.html).toContain("Visage, Corps");
    const many = brandTeamEmail(c, [product, { ...product, id: "2", productName: "Sérum <b>" }]);
    expect(many.subject).toBe("[Marques] Fleurs : 2 produits");
    expect(many.html).toContain("Sérum &lt;b&gt;");
    const ack = brandAckEmail(c, ["Crème", "Sérum"]);
    expect(ack.subject).toBe("Nous avons bien reçu vos 2 produits");
    expect(ack.html).toContain("Bonjour,");
  });

  it("validateBrandContact", () => {
    expect(validateBrandContact({ brand: "A", contactEmail: "a@b.fr" }).ok).toBe(true);
    const r = validateBrandContact({ brand: "", contactEmail: "a@b.fr" });
    expect(!r.ok && r.field).toBe("brand");
    const r2 = validateBrandContact({ brand: "A", contactEmail: "x" });
    expect(!r2.ok && r2.field).toBe("contactEmail");
  });

  it("aucun tiret cadratin ni demi-cadratin dans les gabarits", () => {
    const all = [
      contactTeamEmail({ firstName: "a", email: "a@b.fr", subject: "Question", message: "m" }).html,
      brandAckEmail({ contactName: "a", brand: "b" }, ["c"]).html,
      buildBadgeSvg({ stars: 5 }),
    ].join("");
    expect(all).not.toMatch(/[–—]/);
    expect(escapeHtml("'")).toBe("&#39;");
  });
});
