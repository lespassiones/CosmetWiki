/**
 * Rules-based engine that turns an analysis result into the 3-block "essentiel"
 * view shown on top of the full analysis page:
 *
 *   1. A short verdict phrase + tone ("Formule très douce, rien à signaler.")
 *   2. The 3 main green ingredients with a one-verb effect ("hydrate")
 *   3. One concern line per problematic tier (jaune / orange / rouge) — a
 *      family label + a plain-French effect, with NO ingredient name cited
 *
 * Everything here is deterministic: it works only from data already in the
 * `AnalyseResponse` (counts, items, tags, primaryFunction). No LLM call.
 *
 * Context-aware verbs (2026-05): each ingredient's "what does it do" verb is
 * now resolved against the product's category (déodorant, shampooing, …).
 * That way a binding agent on a deodorant no longer gets the hair-fixative
 * verb that fits a shampoo. See `FUNCTION_VERBS` below and the regression
 * tests in `lib/essentiel/__tests__/engine.test.ts`.
 */

import type { AnalyseItem, AnalyseResponse } from "@/lib/analyseTypes";
import type { ProductCategory } from "@/lib/ai/categorize";

// ─── Verdict ──────────────────────────────────────────────────────────────

export type VerdictTone =
  | "very-safe"
  | "safe"
  | "caution"
  | "warning"
  | "danger"
  | "high-risk"
  | "unknown";

export type Verdict = {
  tone: VerdictTone;
  phrase: string;
};

/** Pick the appropriate verdict tier from the colour counts. */
function pickTone(counts: AnalyseResponse["counts"]): VerdictTone {
  const { jaune, orange, rouge, matched } = counts;
  if (matched === 0) return "unknown";
  if (rouge >= 2) return "high-risk";
  if (rouge >= 1) return "danger";
  if (orange >= 3) return "danger";
  if (orange >= 1) return "warning";
  if (jaune >= 4) return "caution";
  if (jaune >= 1) return "safe";
  return "very-safe";
}

function pickPhrase(tone: VerdictTone, counts: AnalyseResponse["counts"]): string {
  const flagged = counts.jaune + counts.orange + counts.rouge;
  switch (tone) {
    case "very-safe":
      return "Formule très douce, rien à signaler.";
    case "safe":
      return counts.jaune <= 1
        ? "Formule globalement saine, un ingrédient à connaître."
        : `Formule globalement saine, ${counts.jaune} ingrédients à connaître.`;
    case "caution":
      return `Formule correcte, ${counts.jaune} ingrédients à surveiller.`;
    case "warning":
      return counts.orange === 1
        ? "Formule moyenne, un ingrédient pénalisant."
        : `Formule moyenne, ${counts.orange} ingrédients pénalisants.`;
    case "danger":
      return "Formule à examiner attentivement.";
    case "high-risk":
      return `Plusieurs ingrédients à risque (${flagged} au total). À considérer avec attention.`;
    case "unknown":
      return "On n'a pas réussi à analyser cette formule.";
  }
}

// ─── Product type → Category normalisation ────────────────────────────────

/**
 * Convert the free-form `productType` string returned by the front-photo OCR
 * (e.g. "déodorant spray", "shampoing antipelliculaire") into the closed-enum
 * `ProductCategory` used by the verb mapping.
 *
 * This is a deliberate string-match fallback used when the backend's LLM
 * categorisation hasn't run yet (first scan, cache miss) and we still want
 * the "Ce qui est bien" verbs to be context-aware. Returns `null` when no
 * confident match — callers should treat that as "unknown context" and fall
 * back to the universal `default` verbs.
 */
// ORDER MATTERS: patterns are tested top-to-bottom and the first hit wins.
// More-specific compounds (e.g. "après-shampooing") MUST be listed before
// substrings they overlap with (e.g. "shampooing"), otherwise the broad
// pattern shadows the narrow one. The smoke test in
// scripts/test_essentiel.ts has a "après-shampooing nourrissant" case to
// keep this ordering honest.
const PRODUCT_TYPE_PATTERNS: Array<{ category: ProductCategory; keywords: string[] }> = [
  { category: "deodorant", keywords: ["deodorant", "déodorant", "anti-perspirant", "antitranspirant", "anti-transpirant"] },
  { category: "apres_shampooing", keywords: ["apres-shampooing", "après-shampooing", "apres shampoing", "après shampoing", "conditioner", "soin capillaire", "masque capillaire", "masque cheveux", "huile capillaire", "soin cheveux"] },
  { category: "shampooing", keywords: ["shampooing", "shampoing", "shampoo", "shampoing sec", "antipelliculaire"] },
  { category: "solaire", keywords: ["solaire", "creme solaire", "crème solaire", "ecran solaire", "écran solaire", "spf", "sunscreen", "after-sun", "apres-soleil", "après-soleil"] },
  { category: "nettoyant_visage", keywords: ["nettoyant visage", "gel nettoyant", "mousse nettoyante", "demaquillant", "démaquillant", "eau micellaire", "cleanser"] },
  { category: "creme_visage", keywords: ["creme visage", "crème visage", "soin visage", "serum visage", "sérum visage", "serum", "sérum", "contour des yeux", "contour yeux", "creme de jour", "crème de jour", "creme de nuit", "crème de nuit", "anti-age", "anti-âge", "anti-rides", "anti-ride", "creme hydratante", "crème hydratante"] },
  { category: "creme_corps", keywords: ["creme corps", "crème corps", "lait corps", "baume corps", "huile corps", "soin corps", "gel douche", "savon", "huile de douche", "lait hydratant", "beurre corporel", "body lotion", "body cream"] },
  { category: "maquillage", keywords: ["fond de teint", "rouge a levres", "rouge à lèvres", "mascara", "fard", "blush", "eyeliner", "anticerne", "anti-cerne", "vernis a ongles", "vernis à ongles", "vernis", "poudre"] },
  { category: "parfum", keywords: ["parfum", "eau de toilette", "eau de parfum", "eau de cologne", "edt", "edp", "fragrance"] },
];

// Strip diacritics + lowercase for keyword matching. Uses the Combining
// Diacritical Marks Unicode block (U+0300–U+036F) so we never depend on the
// editor preserving literal accents in the source file.
const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

function deburr(s: string): string {
  return s.normalize("NFD").replace(DIACRITICS_RE, "").toLowerCase().trim();
}

export function normalizeProductTypeToCategory(
  productType: string | null | undefined,
): ProductCategory | null {
  if (!productType) return null;
  const needle = deburr(productType);
  if (!needle) return null;
  for (const { category, keywords } of PRODUCT_TYPE_PATTERNS) {
    for (const kw of keywords) {
      if (needle.includes(deburr(kw))) return category;
    }
  }
  return null;
}

// ─── Positives ────────────────────────────────────────────────────────────

export type Positive = { name: string; verb: string };

/**
 * A function's verb can be a plain string (universal — same effect regardless
 * of product type) or a contextual map. Use `null` in `by` or `default` to
 * mark the function as IRRELEVANT for that context: pickPositives will then
 * skip the ingredient rather than show a wrong-context bullet point.
 */
type VerbsByCategory = {
  /** Verb used when the category is null/autre or not present in `by`.
   *  `null` means: skip this ingredient when the context isn't matched. */
  default: string | null;
  /** Per-category overrides. Use `null` to skip in that exact category. */
  by?: Partial<Record<ProductCategory, string | null>>;
};

type VerbConfig = string | VerbsByCategory;

/**
 * Short action verb attached to each primaryFunction value we see in the DB.
 * The full list of ~75 function names was extracted from
 * `cosme_check.ingredients.functions[].name`.
 *
 * Two flavours:
 *   - plain string  : universal verb, applied regardless of product category.
 *   - VerbsByCategory : default fallback + optional per-category overrides.
 *
 * Contextual entries exist to avoid wrong-context phrases such as
 * "fixe la coiffure" surfacing on a deodorant (where "Agent fixant" really
 * means "binding agent", not hair fixative).
 */
const FUNCTION_VERBS: Record<string, VerbConfig> = {
  // ─── Universal verbs (safe in any category) ──────────────────────────
  "Agent d'entretien de la peau": "maintient la peau en bon état",
  "Agent d'entretien de la peau - Divers": "entretient la peau",
  "Agent d'entretien de la peau - Humectant": "hydrate la peau",
  "Agent d'entretien de la peau - Occlusif": "verrouille l'hydratation",
  "Emollient": "adoucit la peau",
  "Agent émulsifiant": "lie l'eau et l'huile",
  "Agent parfumant": "parfume",
  "Agent masquant": "neutralise les odeurs",
  "Agent de contrôle de la viscosité": "donne la texture",
  "Antioxydant": "limite l'oxydation",
  "Agent de protection de la peau": "protège la peau",
  "Humectant": "hydrate",
  "Agent filmogène": "forme un film protecteur",
  "Antistatique": {
    default: null,
    by: {
      shampooing: "réduit l'électricité statique",
      apres_shampooing: "réduit l'électricité statique",
    },
  },
  "Antimicrobien": "limite les bactéries",
  "Solvant": "support de formule",
  "Astringent": "resserre les pores",
  "Stabilisateur d'émulsion": "stabilise la texture",
  "Tonifiant": "tonifie",
  "Agent Abrasif": "exfolie",
  "Colorant cosmétique": "colore",
  "Sinergiste de mousse": {
    default: null,
    by: {
      shampooing: "renforce la mousse",
      nettoyant_visage: "renforce la mousse",
      creme_corps: "renforce la mousse",
    },
  },
  "Régulateur de pH": "équilibre le pH",
  "Opacifiant": "rend la formule opaque",
  "Agent de foisonnement": "épaissit",
  "Conservateur": "préserve la formule",
  "Agent apaisant": "apaise",
  "Agent Absorbant": "absorbe l'excès de sébum",
  "Agent arômatisant": "parfume",
  "Agent stabilisant": "stabilise la formule",
  "Non classé": "rôle non classé",
  "Agent de chélation": "stabilise la formule",
  "Agent plastifiant": "assouplit",
  "Anti Agglomérant": "empêche l'agglomérat",
  "Hydrotrope": "solubilise",
  "Anti-séborrhée": "régule le sébum",
  "Hydratant": "hydrate",
  "Agent réducteur": "agent réducteur",
  "Agent rafraîchissant": "rafraîchit",
  "Agent lissant": "lisse",
  "Dénaturant": "dénature l'alcool",
  "Anti-moussant": "empêche la mousse",
  "Agent Oxydant": "oxyde",
  "Gélifiant": "gélifie",
  "Anticorrosif": "anti-corrosion",
  "Kératolytique": "exfolie les cellules mortes",
  "Agent propulseur": "propulse l'aérosol",
  "Agent de restauration lipidique": "reconstitue le film lipidique",
  "Modificateurs de glissement": "améliore le toucher",
  "Dispersion des agents de surface": "disperse",
  "Ajusteurs de pH": "équilibre le pH",
  "Exfoliant": "exfolie",
  "Dispersant non tensioactif": "disperse",
  "Agent tensioactif - Solubilisant": "solubilise",
  "Modificateur de surface": "modifie la surface",
  "Agent nacrant": "donne un effet nacré",

  // ─── Context-aware verbs ─────────────────────────────────────────────

  /** Binding / cohesion agent (NOT a hair fixative). The old mapping naively
   *  said "fixe la coiffure" everywhere — which is wrong on a deodorant,
   *  cream, etc. Real hair-fixative chemistry sits under
   *  "Agent de fixation capillaire" below. */
  "Agent fixant": {
    default: "lie les ingrédients",
    by: {
      shampooing: "lie les ingrédients",
      apres_shampooing: "tient la coiffure",
    },
  },

  /** True hair fixative — only relevant in hair-care contexts. Skipped in
   *  any other category so it doesn't surface as "tient la coiffure" on a
   *  body lotion. */
  "Agent de fixation capillaire": {
    default: null,
    by: {
      shampooing: "tient la coiffure",
      apres_shampooing: "tient la coiffure",
    },
  },

  "Conditionneur capillaire": {
    default: null,
    by: {
      shampooing: "lisse les cheveux",
      apres_shampooing: "lisse les cheveux",
    },
  },

  "Agent colorant pour cheveux": {
    default: null,
    by: {
      shampooing: "colore les cheveux",
      apres_shampooing: "colore les cheveux",
    },
  },

  "Antipelliculaire": {
    default: null,
    by: {
      shampooing: "anti-pelliculaire",
      apres_shampooing: "anti-pelliculaire",
    },
  },

  "Agent bouclant ou lissant (coiffant)": {
    default: null,
    by: {
      shampooing: "discipline les cheveux",
      apres_shampooing: "discipline les cheveux",
    },
  },

  "Agent démêlant": {
    default: null,
    by: {
      shampooing: "démêle",
      apres_shampooing: "démêle",
    },
  },

  /** A deodorising agent on a non-deodorant (e.g. magnesium hydroxide in a
   *  cream) doesn't really "limit body odour" in the worn-product sense —
   *  it's there for pH or scent masking. We keep a soft default verb but
   *  the strong claim only fires for true deodorants. */
  "Déodorant": {
    default: "neutralise les odeurs",
    by: {
      deodorant: "limite les odeurs",
    },
  },

  "Anti-transpirant": {
    default: null,
    by: {
      deodorant: "limite la transpiration",
    },
  },

  "Filtre UV": {
    default: null,
    by: {
      solaire: "protège des UV",
      creme_visage: "protège des UV",
      creme_corps: "protège des UV",
      maquillage: "protège des UV",
    },
  },

  "Absorbant UV": {
    default: null,
    by: {
      solaire: "absorbe les UV",
      creme_visage: "absorbe les UV",
      creme_corps: "absorbe les UV",
      maquillage: "absorbe les UV",
    },
  },

  "Dépilatoire": {
    default: null,
    // "autre" covers depilatory creams which we don't have as their own
    // category — better to show the verb than skip it entirely.
    by: { autre: "élimine les poils" },
  },

  "Agent de bronzage": {
    default: null,
    by: { creme_visage: "bronze sans soleil", creme_corps: "bronze sans soleil", autre: "bronze sans soleil" },
  },

  "Agent éclaircissant": {
    default: null,
    by: { creme_visage: "éclaircit", creme_corps: "éclaircit", maquillage: "éclaircit" },
  },

  /** Oral hygiene — only meaningful on dental products (not in our 10-cat
   *  enum). Falls back to "autre" so a toothpaste tagged as autre still
   *  surfaces the right verb. */
  "Agent d'hygiène buccale": {
    default: null,
    by: { autre: "hygiène buccale" },
  },

  "Antiplaque": {
    default: null,
    by: { autre: "anti-plaque dentaire" },
  },

  "Agent d'entretien des ongles": {
    default: null,
    by: { maquillage: "entretient les ongles", autre: "entretient les ongles" },
  },

  "Sculpture des ongles": {
    default: null,
    by: { maquillage: "sculpte les ongles", autre: "sculpte les ongles" },
  },

  /** Cleansing surfactants — every category gets a cleansing verb but we
   *  tune the phrasing so it stays natural (a deodorant doesn't say
   *  "nettoie en douceur"). */
  "Tensioactif": {
    default: "nettoie",
    by: {
      shampooing: "nettoie les cheveux",
      nettoyant_visage: "nettoie en douceur",
      apres_shampooing: "nettoie les cheveux",
    },
  },

  "Agent nettoyant": {
    default: "nettoie",
    by: {
      shampooing: "nettoie les cheveux",
      nettoyant_visage: "nettoie en douceur",
      apres_shampooing: "nettoie les cheveux",
    },
  },

  "Agent moussant": {
    default: "fait mousser",
    by: {
      shampooing: "fait mousser",
      nettoyant_visage: "fait mousser",
      apres_shampooing: "fait mousser",
    },
  },
};

/**
 * Resolve a primaryFunction to its action verb for the given product
 * category. Returns `null` when the function is contextually irrelevant —
 * callers should skip the ingredient entirely instead of falling back to a
 * raw function-name string (which historically produced bullets like
 * "Magnesium carbonate hydroxide — agent fixant" on a deodorant).
 */
function verbForFunction(
  fn: string | null,
  category: ProductCategory | null,
): string | null {
  if (!fn) return null;
  const entry = FUNCTION_VERBS[fn];
  if (entry === undefined) {
    // Unknown function — soft fallback so the engine still renders something
    // readable when the DB introduces a brand-new function name.
    return fn.toLowerCase();
  }
  if (typeof entry === "string") return entry;
  if (category && entry.by && Object.prototype.hasOwnProperty.call(entry.by, category)) {
    // Explicit per-category override — including an explicit `null` which
    // means "skip in this exact category".
    const override = entry.by[category];
    return override ?? null;
  }
  return entry.default;
}

/**
 * Functions that serve a purely technical/regulatory role and carry no
 * user-facing benefit. When an ingredient has other functions available we
 * prefer those; we only fall back to a technical function when it's the
 * only one present.
 */
const TECHNICAL_FUNCTIONS = new Set([
  "Dénaturant",
  "Agent propulseur",
  "Anti-moussant",
  "Anticorrosif",
  "Opacifiant",
  "Modificateur de surface",
  "Dispersant non tensioactif",
  "Dispersion des agents de surface",
  "Modificateurs de glissement",
  "Anti Agglomérant",
  "Agent réducteur",
  "Agent Oxydant",
]);

/**
 * Pick the best display verb for an ingredient given its full function list
 * and the product category. Non-technical functions are tried first; we fall
 * back to technical ones only when no other option produces a verb.
 */
function bestVerbForItem(
  item: AnalyseItem,
  category: ProductCategory | null,
): string | null {
  const fns: string[] = [];
  if (item.allFunctions?.length) {
    fns.push(...item.allFunctions);
  } else if (item.primaryFunction) {
    fns.push(item.primaryFunction);
  }
  if (!fns.length) return null;

  // First pass: skip technical functions — prefer a user-facing benefit verb.
  for (const fn of fns) {
    if (TECHNICAL_FUNCTIONS.has(fn)) continue;
    const v = verbForFunction(fn, category);
    if (v) return v;
  }
  // Second pass: accept technical functions as fallback.
  for (const fn of fns) {
    const v = verbForFunction(fn, category);
    if (v) return v;
  }
  return null;
}

/** Best green ingredients first (by INCI position = highest concentration).
 *
 *  We walk the green ingredients ordered by position and stop once we have
 *  three positives with a context-valid verb. If an ingredient has no verb
 *  in the current context (e.g. "Conditionneur capillaire" on a deodorant)
 *  we silently skip it rather than burn a slot — that way a body lotion
 *  with one mismatched green ingredient still shows three valid bullets. */
function pickPositives(items: AnalyseItem[], category: ProductCategory | null): Positive[] {
  const greens = items
    .filter((it) => it.colorRating === "Vert")
    .sort((a, b) => a.position - b.position);

  const out: Positive[] = [];
  for (const it of greens) {
    if (out.length >= 3) break;
    const name = (it.name ?? it.input ?? "").trim();
    if (!name) continue;
    const verb = bestVerbForItem(it, category);
    if (!verb) continue;
    out.push({ name: capitalise(name), verb });
  }
  return out;
}

function capitalise(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// ─── Concerns ─────────────────────────────────────────────────────────────

export type ConcernTier = "jaune" | "orange" | "rouge";

export type Concern = {
  tier: ConcernTier;
  /** Famille / "nom commun" du pire ingrédient (ex. "Conservateurs"). */
  family: string;
  /** Effet en français simple (ex. "peuvent sensibiliser les peaux réactives"). */
  effect: string;
};

/**
 * Friendly label per ingredient family (tag). The tag list was pulled from
 * `cosme_check.ingredients.tags`. We keep positive families (huile-vegetale,
 * colorant-naturel, filtre-uv-mineral) so the labels still render if they
 * somehow surface in a flagged ingredient.
 */
const TAG_LABELS: Record<string, string> = {
  paraben: "Parabens",
  silicone: "Silicones",
  sulfate: "Sulfates",
  "huile-minerale": "Huiles minérales",
  ethoxyle: "Composés éthoxylés",
  "colorant-synthese": "Colorants de synthèse",
  "ammonium-quaternaire": "Ammoniums quaternaires",
  "allergene-parfumant": "Allergènes parfumants",
  conservateur: "Conservateurs",
  "parfum-synthese": "Parfums de synthèse",
  "huile-essentielle": "Huiles essentielles",
  "peg-ppg": "Composés PEG/PPG",
  "polymere-synthese": "Polymères de synthèse",
  "huile-vegetale": "Huiles végétales",
  propoxyle: "Composés propoxylés",
  gluten: "Gluten",
  "colorant-capillaire": "Colorants capillaires",
  "huile-hydrogenee": "Huiles hydrogénées",
  "filtre-uv": "Filtres UV chimiques",
  "huile-esterifiee": "Huiles estérifiées",
  "colorant-naturel": "Colorants naturels",
  "acide-salicylique": "Acide salicylique",
  "allergene-reglemente": "Allergènes réglementés",
  colophane: "Colophane",
  pfas: "Composés perfluorés (PFAS)",
  tea: "Triéthanolamine (TEA)",
  mea: "Monoéthanolamine (MEA)",
  glycol: "Glycols",
  "perturbateur-endocrinien": "Perturbateurs endocriniens présumés",
  cmr: "Classés CMR",
  cov: "Composés organiques volatils",
  "huile-palme": "Huile de palme",
  ppd: "PPD (colorant capillaire)",
  retinoides: "Rétinoïdes",
  "colorant-mineral": "Colorants minéraux",
  phtalate: "Phtalates",
  dea: "Diéthanolamine (DEA)",
  fluor: "Fluor",
  alcool: "Alcool dénaturé",
  "sel-aluminium": "Sels d'aluminium",
  edta: "EDTA",
  "liberateur-formaldehyde": "Libérateurs de formaldéhyde",
  arachides: "Arachides",
  persulfate: "Persulfates",
  "filtre-uv-mineral": "Filtres UV minéraux",
  ogm: "OGM",
};

/**
 * Short, plain-French effect per family. Phrased to follow the family label
 * grammatically: "Conservateurs — peuvent sensibiliser les peaux réactives."
 */
const TAG_CONSEQUENCES: Record<string, string> = {
  paraben: "régulièrement pointés du doigt comme perturbateurs présumés",
  silicone: "effet film qui s'accumule lavage après lavage",
  sulfate: "peuvent dessécher la peau et le cuir chevelu",
  "huile-minerale": "issues du pétrole, peuvent obstruer les pores",
  ethoxyle: "procédé de fabrication qui peut laisser des résidus indésirables",
  "colorant-synthese": "risque d'allergie ou de sensibilisation cutanée",
  "ammonium-quaternaire": "doux immédiat mais irritation possible à long terme",
  "allergene-parfumant": "risque accru d'allergie sur peau sensible",
  conservateur: "peuvent irriter ou sensibiliser les peaux réactives",
  "parfum-synthese": "source fréquente d'irritation des peaux réactives",
  "huile-essentielle": "peuvent sensibiliser, à éviter sur peaux fragiles",
  "peg-ppg": "issus de l'éthoxylation, traces de résidus possibles",
  "polymere-synthese": "non biodégradables, persistent dans l'environnement",
  "huile-vegetale": "nourrissent et adoucissent la peau",
  propoxyle: "procédé chimique avec possibles résidus",
  gluten: "à éviter en cas d'intolérance",
  "colorant-capillaire": "potentiellement allergisants, surtout en coloration permanente",
  "huile-hydrogenee": "graisses solidifiées, peuvent obstruer les pores",
  "filtre-uv": "certains sont controversés (perturbateurs présumés)",
  "huile-esterifiee": "huiles transformées, sensorialité élevée mais formulation chimique",
  "colorant-naturel": "colorants d'origine naturelle",
  "acide-salicylique": "exfoliant, peut sensibiliser à doses élevées",
  "allergene-reglemente": "déclarés obligatoirement (UE), à éviter sur peau réactive",
  colophane: "résine pouvant déclencher des allergies de contact",
  pfas: "composés perfluorés persistants, fortement controversés",
  tea: "peut former des nitrosamines, possiblement cancérigènes",
  mea: "peut former des nitrosamines, possiblement cancérigènes",
  glycol: "asséchants en grande quantité",
  "perturbateur-endocrinien": "suspectés d'interférer avec le système hormonal",
  cmr: "classés cancérigènes, mutagènes ou reprotoxiques",
  cov: "composés volatils, irritation respiratoire possible",
  "huile-palme": "controverse environnementale forte",
  ppd: "fort potentiel allergisant",
  retinoides: "actifs puissants, photosensibilisants",
  "colorant-mineral": "colorants à base de minéraux",
  phtalate: "perturbateurs endocriniens présumés",
  dea: "peut former des nitrosamines, possiblement cancérigènes",
  fluor: "renforce l'émail dentaire, à doser",
  alcool: "peut dessécher la peau à long terme",
  "sel-aluminium": "controverses sur l'innocuité à long terme",
  edta: "agent chélateur, non biodégradable",
  "liberateur-formaldehyde": "libèrent du formaldéhyde, irritant et allergisant",
  arachides: "à éviter en cas d'allergie",
  persulfate: "fortement irritants pour le cuir chevelu",
  "filtre-uv-mineral": "filtres minéraux, peu controversés",
  ogm: "issus d'organismes génétiquement modifiés",
};

/** Tags that we'd rather NOT highlight as "what's wrong" — they're either
 *  positive (huile-vegetale) or neutral classifications. Exported so the
 *  /api/analyser route can use the SAME set to filter observations and we
 *  never get the "huile-vegetale flagged in orange in the Observations
 *  panel while it's been excluded from the À-surveiller card" inconsistency
 *  the tester ran into. */
export const NEUTRAL_OR_POSITIVE_TAGS: ReadonlySet<string> = new Set([
  "huile-vegetale",
  "colorant-naturel",
  "filtre-uv-mineral",
  "colorant-mineral",
]);

const TIER_FALLBACK: Record<ConcernTier, { family: string; effect: string }> = {
  jaune: {
    family: "Ingrédients à surveiller",
    effect: "sensibilisation possible sur peau réactive",
  },
  orange: {
    family: "Ingrédients pénalisants",
    effect: "irritation ou impact à long terme possibles",
  },
  rouge: {
    family: "Ingrédients à risque",
    effect: "à considérer avec attention, surtout en usage régulier",
  },
};

const TIER_RATING_MAP: Record<ConcernTier, AnalyseItem["colorRating"]> = {
  jaune: "Jaune",
  orange: "Orange",
  rouge: "Rouge",
};

/**
 * For one tier, pick the "worst" ingredient (= first in the INCI list, since
 * INCI is ordered by descending concentration) and translate its dominant
 * problematic tag into a {family, effect} pair.
 */
function buildConcern(items: AnalyseItem[], tier: ConcernTier): Concern | null {
  const rating = TIER_RATING_MAP[tier];
  const tierItems = items
    .filter((it) => it.colorRating === rating)
    .sort((a, b) => a.position - b.position);
  if (tierItems.length === 0) return null;

  // Walk the tier from the most concentrated downwards and grab the first
  // *problematic* tag we recognise — that becomes the family + effect line.
  for (const it of tierItems) {
    for (const tag of it.tags ?? []) {
      if (NEUTRAL_OR_POSITIVE_TAGS.has(tag)) continue;
      const family = TAG_LABELS[tag];
      const effect = TAG_CONSEQUENCES[tag];
      if (family && effect) {
        return { tier, family, effect };
      }
    }
  }

  // No recognised problematic tag — fall back to a generic tier line so the
  // block still tells the user *something* concrete.
  return { tier, ...TIER_FALLBACK[tier] };
}

// ─── Public API ───────────────────────────────────────────────────────────

export type EssentielData = {
  verdict: Verdict;
  positives: Positive[];
  /** One entry per tier present (jaune / orange / rouge), in that order. */
  concerns: Concern[];
};

export type EssentielOptions = {
  /** Closed-enum product category (from the backend's LLM categorisation).
   *  Takes precedence over `productType` when both are provided. */
  category?: ProductCategory | null;
  /** Raw front-OCR product type string (e.g. "déodorant spray"). Used as a
   *  fallback when `category` is null/autre — we keyword-match it back to a
   *  category so the verbs stay contextual even on the very first scan. */
  productType?: string | null;
};

export function computeEssentiel(
  result: AnalyseResponse,
  opts?: EssentielOptions,
): EssentielData {
  const tone = pickTone(result.counts);
  const phrase = pickPhrase(tone, result.counts);
  const resolvedCategory: ProductCategory | null =
    (opts?.category && opts.category !== "autre" ? opts.category : null)
    ?? normalizeProductTypeToCategory(opts?.productType)
    ?? (opts?.category ?? null);
  const positives = pickPositives(result.items, resolvedCategory);
  const concerns: Concern[] = [];
  for (const tier of ["rouge", "orange", "jaune"] as const) {
    const c = buildConcern(result.items, tier);
    if (c) concerns.push(c);
  }
  return {
    verdict: { tone, phrase },
    positives,
    concerns,
  };
}

// ─── Test-only exports ────────────────────────────────────────────────────
// Kept module-private under a single namespace so the integration tests can
// poke at the verb mapping without us widening the public API.
export const __testing = {
  verbForFunction,
  pickPositives,
  FUNCTION_VERBS,
};
