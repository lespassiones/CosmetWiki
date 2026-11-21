/**
 * Espace marques : validation d'une fiche produit proposée par une marque.
 *
 * Logique PURE (aucun import serveur), partagée par le formulaire (contrôle
 * avant envoi) et par la route POST /api/marques (contrôle qui fait foi).
 * Testée dans tests/brandSubmission.test.ts.
 */

/** Zones d'usage proposées dans le formulaire (plusieurs choix possibles). */
export const BRAND_ZONES = [
  "Visage",
  "Corps",
  "Cheveux et cuir chevelu",
  "Mains",
  "Pieds",
  "Lèvres",
  "Contour des yeux",
  "Ongles",
  "Hygiène intime",
  "Bébé et enfant",
] as const;
export type BrandZone = (typeof BRAND_ZONES)[number];

/** Types de produit les plus courants (« Autre » laisse écrire le sien). */
export const BRAND_PRODUCT_TYPES = [
  "Crème, soin hydratant",
  "Sérum",
  "Nettoyant, démaquillant",
  "Lotion, tonique",
  "Masque, gommage",
  "Protection solaire",
  "Huile",
  "Baume",
  "Shampoing",
  "Après-shampoing, masque capillaire",
  "Soin coiffant",
  "Gel douche, savon",
  "Déodorant",
  "Maquillage",
  "Parfum",
  "Dentifrice, soin bucco-dentaire",
  "Autre",
] as const;

export const LIMITS = {
  brand: 120,
  company: 160,
  contactName: 120,
  contactEmail: 200,
  contactRole: 120,
  url: 500,
  productName: 200,
  volume: 60,
  productType: 120,
  inciMin: 10,
  inci: 6000,
  properties: 2000,
  madeIn: 120,
} as const;

export type BrandSubmissionInput = {
  brand?: unknown;
  company?: unknown;
  contactName?: unknown;
  contactEmail?: unknown;
  contactRole?: unknown;
  brandWebsite?: unknown;
  productName?: unknown;
  ean?: unknown;
  noEan?: unknown;
  volume?: unknown;
  productType?: unknown;
  productTypeOther?: unknown;
  zones?: unknown;
  inci?: unknown;
  properties?: unknown;
  madeIn?: unknown;
  productUrl?: unknown;
  certify?: unknown;
};

export type BrandSubmission = {
  brand: string;
  company: string | null;
  contactName: string | null;
  contactEmail: string;
  contactRole: string | null;
  brandWebsite: string | null;
  productName: string;
  /** `null` = produit sans code-barres (la marque l'a coché). */
  ean: string | null;
  volume: string;
  productType: string | null;
  zones: BrandZone[];
  inci: string;
  properties: string | null;
  madeIn: string | null;
  productUrl: string | null;
};

export type ValidationResult =
  | { ok: true; data: BrandSubmission }
  | { ok: false; field: string; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function str(v: unknown): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
}

/** Comme `str` mais garde les retours à la ligne (composition, propriétés). */
function text(v: unknown): string {
  return typeof v === "string"
    ? v.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim()
    : "";
}

function truthy(v: unknown): boolean {
  return v === true || v === "true" || v === "on" || v === "1";
}

/** Retire tout sauf les chiffres (espaces, tirets saisis par la marque). */
export function normalizeEan(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Code-barres GTIN valide : 8, 12, 13 ou 14 chiffres et clé de contrôle juste
 * (somme pondérée 3/1 depuis la droite, modulo 10).
 */
export function isValidGtin(ean: string): boolean {
  if (!/^\d+$/.test(ean) || ![8, 12, 13, 14].includes(ean.length)) return false;
  const digits = ean.split("").map(Number);
  const check = digits.pop()!;
  let sum = 0;
  digits.reverse().forEach((d, i) => {
    sum += d * (i % 2 === 0 ? 3 : 1);
  });
  return (10 - (sum % 10)) % 10 === check;
}

/** Adresse http(s) plausible. Ajoute https:// si la marque l'a oublié. */
export function normalizeUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withScheme);
    if (!/^https?:$/.test(u.protocol)) return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Nombre d'ingrédients d'une liste INCI (séparateurs virgule, point-virgule,
 * retour à la ligne). Sert au compteur du formulaire et au garde-fou serveur.
 */
export function countInciIngredients(inci: string): number {
  return inci
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2).length;
}

function fail(field: string, error: string): ValidationResult {
  return { ok: false, field, error };
}

/** Étape 1 du formulaire : la marque seule (saisie une fois pour tous les produits). */
export function validateBrandContact(input: {
  brand?: unknown;
  contactEmail?: unknown;
  contactName?: unknown;
}): { ok: true } | { ok: false; field: string; error: string } {
  const brand = str(input.brand);
  if (!brand) return { ok: false, field: "brand", error: "Indiquez le nom de la marque." };
  if (brand.length > LIMITS.brand) return { ok: false, field: "brand", error: "Nom de marque trop long." };
  const email = str(input.contactEmail);
  if (!email || !EMAIL_RE.test(email) || email.length > LIMITS.contactEmail) {
    return { ok: false, field: "contactEmail", error: "Adresse e-mail invalide." };
  }
  if (str(input.contactName).length > LIMITS.contactName) {
    return { ok: false, field: "contactName", error: "Nom trop long." };
  }
  return { ok: true };
}

/** Nombre maximal de produits par envoi (une marque peut renvoyer ensuite). */
export const MAX_PRODUCTS_PER_BATCH = 50;
/** Nombre maximal de produits par requête (le navigateur découpe l'envoi). */
export const MAX_PRODUCTS_PER_REQUEST = 10;
/** Clé d'une photo dans un envoi groupé (une photo partagée n'est envoyée qu'une fois). */
export const PHOTO_KEY_RE = /^[a-z0-9]{1,16}$/;

export function validateBrandSubmission(input: BrandSubmissionInput): ValidationResult {
  const brand = str(input.brand);
  if (!brand) return fail("brand", "Indiquez le nom de la marque.");
  if (brand.length > LIMITS.brand) return fail("brand", "Nom de marque trop long.");

  const company = str(input.company);
  if (company.length > LIMITS.company) return fail("company", "Raison sociale trop longue.");

  const contactName = str(input.contactName);
  if (contactName.length > LIMITS.contactName) return fail("contactName", "Nom trop long.");

  const contactEmail = str(input.contactEmail).toLowerCase();
  if (!contactEmail || !EMAIL_RE.test(contactEmail) || contactEmail.length > LIMITS.contactEmail) {
    return fail("contactEmail", "Adresse e-mail invalide.");
  }

  const contactRole = str(input.contactRole);
  if (contactRole.length > LIMITS.contactRole) return fail("contactRole", "Fonction trop longue.");

  const websiteRaw = str(input.brandWebsite);
  const brandWebsite = websiteRaw ? normalizeUrl(websiteRaw) : null;
  if (websiteRaw && (!brandWebsite || brandWebsite.length > LIMITS.url)) {
    return fail("brandWebsite", "Adresse du site de la marque invalide.");
  }

  const productName = str(input.productName);
  if (!productName) return fail("productName", "Indiquez le nom du produit.");
  if (productName.length > LIMITS.productName) return fail("productName", "Nom du produit trop long.");

  const noEan = truthy(input.noEan);
  let ean: string | null = null;
  if (!noEan) {
    ean = normalizeEan(str(input.ean));
    if (!ean) return fail("ean", "Indiquez le code-barres, ou cochez « Sans code-barres ».");
    if (!isValidGtin(ean)) {
      return fail("ean", "Ce code-barres semble incomplet ou mal recopié.");
    }
  }

  const volume = str(input.volume);
  if (!volume) return fail("volume", "Indiquez la contenance (ex. 50 ml).");
  if (volume.length > LIMITS.volume) return fail("volume", "Contenance trop longue.");

  const typeChoice = str(input.productType);
  const typeOther = str(input.productTypeOther);
  const productType = typeChoice === "Autre" ? typeOther || "Autre" : typeChoice;
  if (productType.length > LIMITS.productType) return fail("productType", "Type de produit trop long.");

  const rawZones = Array.isArray(input.zones) ? input.zones : input.zones ? [input.zones] : [];
  const zones = Array.from(
    new Set(rawZones.map(str).filter((z): z is BrandZone => (BRAND_ZONES as readonly string[]).includes(z))),
  );
  if (zones.length === 0) return fail("zones", "Choisissez au moins une zone.");

  const inci = text(input.inci);
  if (inci.length < LIMITS.inciMin || countInciIngredients(inci) < 1) {
    return fail("inci", "Collez la liste des ingrédients.");
  }
  if (inci.length > LIMITS.inci) return fail("inci", "Liste d'ingrédients trop longue.");

  const properties = text(input.properties);
  if (properties.length > LIMITS.properties) return fail("properties", "Description trop longue.");

  const madeIn = str(input.madeIn);
  if (madeIn.length > LIMITS.madeIn) return fail("madeIn", "Lieu de fabrication trop long.");

  const urlRaw = str(input.productUrl);
  const productUrl = urlRaw ? normalizeUrl(urlRaw) : null;
  if (urlRaw && (!productUrl || productUrl.length > LIMITS.url)) {
    return fail("productUrl", "Adresse de la page produit invalide.");
  }

  if (!truthy(input.certify)) {
    return fail("certify", "Cochez la case pour confirmer.");
  }

  return {
    ok: true,
    data: {
      brand,
      company: company || null,
      contactName: contactName || null,
      contactEmail,
      contactRole: contactRole || null,
      brandWebsite,
      productName,
      ean,
      volume,
      productType: productType || null,
      zones,
      inci,
      properties: properties || null,
      madeIn: madeIn || null,
      productUrl,
    },
  };
}
