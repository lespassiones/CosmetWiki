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
import { commonNameForRaw } from "@/lib/inciCommonNames";

// ─── Verdict ──────────────────────────────────────────────────────────────

export type VerdictTone =
  | "very-safe"
  | "safe"
  | "caution"
  | "warning"
  | "danger"
  | "high-risk"
  | "unknown";

/**
 * Dérive le tone de la pastille directement depuis le score 0-20.
 * Seuils identiques à la table catalog et à l'app mobile.
 * À utiliser pour le VerdictGauge sur l'écran d'analyse afin que la
 * pastille affichée soit cohérente avec celle du catalogue/recherche.
 */
export function verdictToneFromScore(score: number | null | undefined): VerdictTone {
  if (score == null || Number.isNaN(score)) return "unknown";
  if (score >= 17) return "very-safe";
  if (score >= 13) return "safe";
  if (score >= 9)  return "caution";
  if (score >= 5)  return "warning";
  return "danger";
}

export type Verdict = {
  tone: VerdictTone;
  phrase: string;
};

/**
 * Threshold for the position-weighted yellow sum above which the verdict
 * drops from "safe" (feuille verte) to "caution" (œil jaune).
 *
 * Tuned so that:
 *   - 3 jaunes en tête de liste (positions 1-3 / 10) ≈ 2.88  → caution
 *   - 3 jaunes en milieu de liste (positions 6-8 / 10) ≈ 2.00 → safe
 *   - 4 jaunes répartis (positions 1, 3, 5, 7 / 10) ≈ 3.42   → caution
 *   - 4 jaunes en fin de liste (positions 17-20 / 20) ≈ 0.80 → safe
 *
 * Replaces the old count-blind rule (`jaune >= 4`) which classified a
 * formula with 3 jaunes très concentrés comme "feuille verte" — alors
 * qu'une autre formule avec 3 jaunes en fin de liste recevait la même
 * pastille malgré une exposition réelle bien plus faible.
 */
const YELLOW_WEIGHTED_CAUTION_THRESHOLD = 2.5;

/**
 * Position weight matching `computeScore` in lib/inciParser.ts:
 *   w(p) = log(N - p + 1) / log(N + 1)   avec p en 0-indexé.
 * Pèse 1.0 pour la 1ʳᵉ position (plus forte concentration) et tend vers 0
 * en fin de liste.
 */
function positionWeight(positionOneIndexed: number, total: number): number {
  if (total <= 0) return 0;
  const N = Math.max(total, 1);
  const p = Math.max(0, positionOneIndexed - 1);
  return Math.log(N - p + 1) / Math.log(N + 1);
}

/**
 * Somme pondérée par position des ingrédients jaunes — mirroir de la
 * pénalité jaune dans `computeScore`. Permet à `pickTone` de distinguer
 * "3 jaunes très concentrés" de "3 jaunes en fin de liste" au lieu de les
 * traiter comme équivalents.
 */
function weightedYellowSum(items: AnalyseItem[]): number {
  if (items.length === 0) return 0;
  const total = items.length;
  let sum = 0;
  for (const it of items) {
    if (it.colorRating === "Jaune") {
      sum += positionWeight(it.position, total);
    }
  }
  return sum;
}

/** Pick the appropriate verdict tier from the colour counts. */
function pickTone(
  counts: AnalyseResponse["counts"],
  items: AnalyseItem[],
): VerdictTone {
  const { jaune, orange, rouge, matched } = counts;
  if (matched === 0) return "unknown";
  if (rouge >= 2) return "high-risk";
  if (rouge >= 1) return "danger";
  if (orange >= 3) return "danger";
  if (orange >= 1) return "warning";
  if (jaune >= 1 && weightedYellowSum(items) >= YELLOW_WEIGHTED_CAUTION_THRESHOLD) {
    return "caution";
  }
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

/**
 * One bullet point in the "Ce qui est bien" card.
 *
 * - `verb`      : the primary role verb (the most user-facing benefit the
 *                 ingredient brings to this category — comes from the
 *                 highest-priority family present on the ingredient).
 * - `secondary` : optional short complement verb describing a second family
 *                 of functions the ingredient also serves (e.g. "parfume
 *                 naturellement" pour une huile aussi parfumante).
 *
 * The UI renders them as `{name} → {verb} · {secondary}` so a 15-year-old
 * reader gets a mini-story in one line instead of a flat single verb that
 * may hide most of what the ingredient actually does.
 */
export type Positive = { name: string; verb: string; secondary?: string };

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
  // 2026-05 phrasing rewrite: replaced one-word verbs ("nettoie", "épaissit")
  // with short descriptive sentences (4-7 words) that explain WHAT the
  // ingredient does in the formula and WHY it's there. Matches the style
  // already used on the "À surveiller" side ("asséchants en grande
  // quantité", "agent chélateur, non biodégradable").
  "Agent d'entretien de la peau": "maintient la peau en bon état",
  "Agent d'entretien de la peau - Divers": "maintient l'équilibre de la peau",
  "Agent d'entretien de la peau - Humectant": "attire l'eau dans les couches superficielles",
  "Agent d'entretien de la peau - Occlusif": "verrouille l'hydratation à la surface",
  "Emollient": "adoucit et assouplit la peau",
  "Agent émulsifiant": "lie l'eau et les corps gras",
  "Agent parfumant": "parfume naturellement",
  "Agent masquant": "masque les autres odeurs",
  "Agent de contrôle de la viscosité": "donne sa texture à la formule",
  "Antioxydant": "protège la formule de l'oxydation",
  "Agent de protection de la peau": "renforce la barrière cutanée",
  "Humectant": "attire l'eau dans la peau",
  "Agent filmogène": "forme un film protecteur en surface",
  "Antistatique": {
    default: null,
    by: {
      shampooing: "réduit l'électricité statique des cheveux",
      apres_shampooing: "réduit l'électricité statique des cheveux",
    },
  },
  "Antimicrobien": "limite la prolifération bactérienne",
  "Solvant": "dissout les autres ingrédients de la formule",
  "Astringent": "resserre les pores et tonifie la peau",
  "Stabilisateur d'émulsion": "garde le mélange eau/huile homogène",
  "Tonifiant": "apporte un effet tonifiant immédiat",
  "Agent Abrasif": "exfolie mécaniquement les cellules mortes",
  "Colorant cosmétique": "donne sa couleur au produit",
  "Sinergiste de mousse": {
    default: null,
    by: {
      shampooing: "rend la mousse plus dense",
      nettoyant_visage: "rend la mousse plus dense",
      creme_corps: "rend la mousse plus dense",
    },
  },
  "Régulateur de pH": "équilibre le pH au plus près de la peau",
  "Opacifiant": "rend la formule opaque visuellement",
  "Agent de foisonnement": "épaissit pour stabiliser la texture",
  "Conservateur": "protège la formule des micro-organismes",
  "Agent apaisant": "calme les rougeurs et tiraillements",
  "Agent Absorbant": "absorbe l'excès de sébum et l'humidité",
  "Agent arômatisant": "donne son arôme au produit",
  "Agent stabilisant": "garde la formule stable dans le temps",
  "Non classé": "rôle non documenté dans la base",
  "Agent de chélation": "neutralise les métaux de l'eau du robinet",
  "Agent plastifiant": "assouplit les films cosmétiques",
  "Anti Agglomérant": "empêche les poudres de s'agglomérer",
  "Hydrotrope": "aide à dissoudre les ingrédients peu solubles",
  "Anti-séborrhée": "régule la production de sébum",
  "Hydratant": "apporte de l'eau à la peau",
  "Agent réducteur": "joue un rôle chimique de réduction",
  "Agent rafraîchissant": "procure une sensation de fraîcheur",
  "Agent lissant": "lisse la surface de la peau",
  "Dénaturant": "rend l'alcool impropre à la consommation",
  "Anti-moussant": "limite la formation de mousse indésirable",
  "Agent Oxydant": "joue un rôle chimique d'oxydation",
  "Gélifiant": "donne sa consistance gélifiée au produit",
  "Anticorrosif": "protège le contenant de la corrosion",
  "Kératolytique": "élimine les cellules mortes en surface",
  "Agent propulseur": "propulse le produit hors de l'aérosol",
  "Agent de restauration lipidique": "reconstitue le film lipidique de la peau",
  "Modificateurs de glissement": "améliore le toucher et l'étalement",
  "Dispersion des agents de surface": "disperse les actifs uniformément",
  "Ajusteurs de pH": "ajuste le pH au niveau cutané",
  "Exfoliant": "élimine les cellules mortes de surface",
  "Dispersant non tensioactif": "disperse pigments et poudres",
  "Agent tensioactif - Solubilisant": "solubilise les huiles dans l'eau",
  "Modificateur de surface": "modifie la texture de surface",
  "Agent nacrant": "donne un effet nacré au produit",

  // ─── Context-aware verbs ─────────────────────────────────────────────

  /** Binding / cohesion agent (NOT a hair fixative). The old mapping naively
   *  said "fixe la coiffure" everywhere — which is wrong on a deodorant,
   *  cream, etc. Real hair-fixative chemistry sits under
   *  "Agent de fixation capillaire" below. */
  "Agent fixant": {
    default: "lie les ingrédients entre eux",
    by: {
      shampooing: "lie les ingrédients entre eux",
      apres_shampooing: "tient la coiffure en place",
    },
  },

  /** True hair fixative — only relevant in hair-care contexts. Skipped in
   *  any other category so it doesn't surface as "tient la coiffure" on a
   *  body lotion. */
  "Agent de fixation capillaire": {
    default: null,
    by: {
      shampooing: "tient la coiffure en place",
      apres_shampooing: "tient la coiffure en place",
    },
  },

  "Conditionneur capillaire": {
    default: null,
    by: {
      shampooing: "lisse et démêle les cheveux",
      apres_shampooing: "lisse et démêle les cheveux",
    },
  },

  "Agent colorant pour cheveux": {
    default: null,
    by: {
      shampooing: "colore les cheveux durablement",
      apres_shampooing: "colore les cheveux durablement",
    },
  },

  "Antipelliculaire": {
    default: null,
    by: {
      shampooing: "limite la formation de pellicules",
      apres_shampooing: "limite la formation de pellicules",
    },
  },

  "Agent bouclant ou lissant (coiffant)": {
    default: null,
    by: {
      shampooing: "discipline boucles et frisottis",
      apres_shampooing: "discipline boucles et frisottis",
    },
  },

  "Agent démêlant": {
    default: null,
    by: {
      shampooing: "démêle pour faciliter le coiffage",
      apres_shampooing: "démêle pour faciliter le coiffage",
    },
  },

  /** A deodorising agent on a non-deodorant (e.g. magnesium hydroxide in a
   *  cream) doesn't really "limit body odour" in the worn-product sense —
   *  it's there for pH or scent masking. We keep a soft default verb but
   *  the strong claim only fires for true deodorants. */
  "Déodorant": {
    default: "neutralise les odeurs corporelles",
    by: {
      deodorant: "limite les odeurs sous les aisselles",
    },
  },

  "Anti-transpirant": {
    default: null,
    by: {
      deodorant: "réduit la transpiration des aisselles",
    },
  },

  "Filtre UV": {
    default: null,
    by: {
      solaire: "filtre les rayons UV nocifs",
      creme_visage: "filtre les rayons UV nocifs",
      creme_corps: "filtre les rayons UV nocifs",
      maquillage: "filtre les rayons UV nocifs",
    },
  },

  "Absorbant UV": {
    default: null,
    by: {
      solaire: "absorbe une partie des rayons UV",
      creme_visage: "absorbe une partie des rayons UV",
      creme_corps: "absorbe une partie des rayons UV",
      maquillage: "absorbe une partie des rayons UV",
    },
  },

  "Dépilatoire": {
    default: null,
    // "autre" covers depilatory creams which we don't have as their own
    // category — better to show the verb than skip it entirely.
    by: { autre: "élimine les poils au contact" },
  },

  "Agent de bronzage": {
    default: null,
    by: {
      creme_visage: "donne un effet bronzé sans soleil",
      creme_corps: "donne un effet bronzé sans soleil",
      autre: "donne un effet bronzé sans soleil",
    },
  },

  "Agent éclaircissant": {
    default: null,
    by: {
      creme_visage: "éclaircit progressivement le teint",
      creme_corps: "éclaircit progressivement le teint",
      maquillage: "éclaircit progressivement le teint",
    },
  },

  /** Oral hygiene — only meaningful on dental products (not in our 10-cat
   *  enum). Falls back to "autre" so a toothpaste tagged as autre still
   *  surfaces the right verb. */
  "Agent d'hygiène buccale": {
    default: null,
    by: { autre: "contribue à l'hygiène bucco-dentaire" },
  },

  "Antiplaque": {
    default: null,
    by: { autre: "limite la formation de plaque dentaire" },
  },

  "Agent d'entretien des ongles": {
    default: null,
    by: {
      maquillage: "entretient et fortifie les ongles",
      autre: "entretient et fortifie les ongles",
    },
  },

  "Sculpture des ongles": {
    default: null,
    by: {
      maquillage: "sculpte et structure les ongles",
      autre: "sculpte et structure les ongles",
    },
  },

  /** Cleansing surfactants — every category gets a cleansing verb but we
   *  tune the phrasing so it stays natural (a deodorant doesn't say
   *  "nettoie en douceur"). */
  "Tensioactif": {
    default: "nettoie en captant sébum et impuretés",
    by: {
      shampooing: "détache le sébum du cuir chevelu",
      nettoyant_visage: "nettoie la peau en douceur",
      apres_shampooing: "détache le sébum du cuir chevelu",
    },
  },

  "Agent nettoyant": {
    default: "nettoie en captant sébum et impuretés",
    by: {
      shampooing: "lave les cheveux et le cuir chevelu",
      nettoyant_visage: "lave la peau sans la décaper",
      apres_shampooing: "lave les cheveux et le cuir chevelu",
    },
  },

  "Agent moussant": {
    default: "génère la mousse au contact de l'eau",
    by: {
      shampooing: "génère la mousse au contact de l'eau",
      nettoyant_visage: "génère la mousse au contact de l'eau",
      apres_shampooing: "génère la mousse au contact de l'eau",
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

// ─── Function families ────────────────────────────────────────────────────
//
// An ingredient typically carries several INCI functions (Olea Europaea =
// "Agent masquant" + "Agent d'entretien de la peau" + "Agent parfumant").
// Showing only the first verb often misses the point ("masque les odeurs"
// alors que l'huile d'olive est là pour nourrir la peau).
//
// Instead, we group functions into 7 user-meaningful families, pick the
// highest-priority family present as the **primary** role, and the next
// family as a short **secondary** complement. Within a family, multiple
// functions collapse into a single verb (we pick the most specific one
// available — Hydratant > Emollient > Humectant > … > generic "entretien").
//
// Result: a Vert ingredient with 3-4 functions surfaces as
//   `nom → verbe principal · verbe secondaire`
// instead of arbitrarily picking one of the functions.

type FunctionFamily =
  | "soin"
  | "cheveu"
  | "protection"
  | "nettoyage"
  | "parfum"
  | "texture"
  | "technique";

/**
 * Family priority — first family present on an ingredient wins as the
 * primary role; second present family becomes the secondary complement.
 * Ordering encodes "what matters to the user reading the analysis":
 * a skin benefit beats a texture role beats a purely technical role.
 */
const FAMILY_PRIORITY: ReadonlyArray<FunctionFamily> = [
  "soin",
  "cheveu",
  "protection",
  "nettoyage",
  "parfum",
  "texture",
  "technique",
];

/**
 * Mapping from each known DB function name to its family. The list mirrors
 * the 76 distinct values found in `cosme_check.ingredients.functions[].name`
 * (audit done 2026-06-01). Unknown future functions fall back to "technique".
 */
const FUNCTION_TO_FAMILY: Record<string, FunctionFamily> = {
  // 🌿 Soin — bénéfices peau / ongles user-facing
  "Agent d'entretien de la peau": "soin",
  "Agent d'entretien de la peau - Divers": "soin",
  "Agent d'entretien de la peau - Humectant": "soin",
  "Agent d'entretien de la peau - Occlusif": "soin",
  "Emollient": "soin",
  "Humectant": "soin",
  "Hydratant": "soin",
  "Agent de protection de la peau": "soin",
  "Agent de restauration lipidique": "soin",
  "Agent apaisant": "soin",
  "Agent éclaircissant": "soin",
  "Anti-séborrhée": "soin",
  "Agent lissant": "soin",
  "Agent rafraîchissant": "soin",
  "Tonifiant": "soin",
  "Astringent": "soin",
  "Kératolytique": "soin",
  "Exfoliant": "soin",
  "Agent Abrasif": "soin",
  "Dépilatoire": "soin",
  "Agent de bronzage": "soin",
  "Agent d'entretien des ongles": "soin",
  "Sculpture des ongles": "soin",

  // 💆 Cheveu — fonctions spécifiquement capillaires
  "Conditionneur capillaire": "cheveu",
  "Agent démêlant": "cheveu",
  "Antipelliculaire": "cheveu",
  "Agent de fixation capillaire": "cheveu",
  "Agent bouclant ou lissant (coiffant)": "cheveu",
  "Agent colorant pour cheveux": "cheveu",
  "Antistatique": "cheveu",
  // "Agent fixant" is context-dependent (binding agent on most products vs
  // hair fixative on shampoo/après-shampooing). The verb mapping handles
  // the binding-agent default; here we keep it in the hair family so that
  // the verb resolver can route the right phrasing per category.
  "Agent fixant": "cheveu",

  // ☀️ Protection — préserve formule / peau / cheveux des agressions
  "Filtre UV": "protection",
  "Absorbant UV": "protection",
  "Antioxydant": "protection",
  "Conservateur": "protection",
  "Antimicrobien": "protection",
  "Anti-transpirant": "protection",
  "Déodorant": "protection",
  "Agent d'hygiène buccale": "protection",
  "Antiplaque": "protection",

  // 🧼 Nettoyage — fonctions tensioactives, lavantes, moussantes
  "Tensioactif": "nettoyage",
  "Agent nettoyant": "nettoyage",
  "Agent moussant": "nettoyage",
  "Sinergiste de mousse": "nettoyage",
  "Agent tensioactif - Solubilisant": "nettoyage",

  // 🌸 Parfum — odeur, masquage, arôme
  "Agent parfumant": "parfum",
  "Agent masquant": "parfum",
  "Agent arômatisant": "parfum",

  // 🫧 Texture — structure et rendu visuel de la formule
  "Agent émulsifiant": "texture",
  "Stabilisateur d'émulsion": "texture",
  "Agent de contrôle de la viscosité": "texture",
  "Agent filmogène": "texture",
  "Opacifiant": "texture",
  "Gélifiant": "texture",
  "Agent stabilisant": "texture",
  "Agent de foisonnement": "texture",
  "Agent plastifiant": "texture",
  "Agent nacrant": "texture",
  "Colorant cosmétique": "texture",
  "Agent Absorbant": "texture",
  "Modificateurs de glissement": "texture",
  "Modificateur de surface": "texture",

  // ⚙️ Technique — fallback de dernier recours, rarement parlant pour un user
  "Solvant": "technique",
  "Régulateur de pH": "technique",
  "Ajusteurs de pH": "technique",
  "Agent de chélation": "technique",
  "Anti Agglomérant": "technique",
  "Hydrotrope": "technique",
  "Agent réducteur": "technique",
  "Agent Oxydant": "technique",
  "Dénaturant": "technique",
  "Anti-moussant": "technique",
  "Anticorrosif": "technique",
  "Agent propulseur": "technique",
  "Dispersion des agents de surface": "technique",
  "Dispersant non tensioactif": "technique",
  "Non classé": "technique",
};

/**
 * Within each family, an ordered list of functions from MOST specific to
 * LEAST specific. When an ingredient carries multiple functions in the same
 * family, we walk this list to pick the verb of the most informative one.
 *
 * Example — Glycérine has both `Humectant` and `Agent d'entretien de la peau`
 * in the Soin family. The list says Humectant > Agent d'entretien, so we
 * emit "attire l'eau dans la peau" rather than the generic "maintient la
 * peau en bon état".
 */
const FAMILY_FUNCTION_PRIORITY: Record<FunctionFamily, ReadonlyArray<string>> = {
  soin: [
    "Hydratant",
    "Emollient",
    "Humectant",
    "Agent d'entretien de la peau - Humectant",
    "Agent de protection de la peau",
    "Agent d'entretien de la peau - Occlusif",
    "Agent de restauration lipidique",
    "Agent apaisant",
    "Agent éclaircissant",
    "Anti-séborrhée",
    "Agent lissant",
    "Agent rafraîchissant",
    "Tonifiant",
    "Astringent",
    "Kératolytique",
    "Exfoliant",
    "Agent Abrasif",
    "Dépilatoire",
    "Agent de bronzage",
    "Agent d'entretien des ongles",
    "Sculpture des ongles",
    "Agent d'entretien de la peau",
    "Agent d'entretien de la peau - Divers",
  ],
  cheveu: [
    "Antipelliculaire",
    "Agent colorant pour cheveux",
    "Agent bouclant ou lissant (coiffant)",
    "Agent démêlant",
    "Conditionneur capillaire",
    "Agent de fixation capillaire",
    "Antistatique",
    "Agent fixant",
  ],
  protection: [
    "Filtre UV",
    "Absorbant UV",
    "Anti-transpirant",
    "Déodorant",
    "Antiplaque",
    "Agent d'hygiène buccale",
    "Antimicrobien",
    "Conservateur",
    "Antioxydant",
  ],
  nettoyage: [
    "Agent moussant",
    "Sinergiste de mousse",
    "Agent tensioactif - Solubilisant",
    "Agent nettoyant",
    "Tensioactif",
  ],
  parfum: [
    "Agent parfumant",
    "Agent arômatisant",
    "Agent masquant",
  ],
  texture: [
    "Colorant cosmétique",
    "Agent nacrant",
    "Agent émulsifiant",
    "Gélifiant",
    "Opacifiant",
    "Agent filmogène",
    "Stabilisateur d'émulsion",
    "Agent Absorbant",
    "Agent plastifiant",
    "Agent de contrôle de la viscosité",
    "Agent de foisonnement",
    "Agent stabilisant",
    "Modificateurs de glissement",
    "Modificateur de surface",
  ],
  technique: [
    "Agent de chélation",
    "Régulateur de pH",
    "Ajusteurs de pH",
    "Anti Agglomérant",
    "Hydrotrope",
    "Anti-moussant",
    "Agent propulseur",
    "Dénaturant",
    "Anticorrosif",
    "Agent réducteur",
    "Agent Oxydant",
    "Dispersion des agents de surface",
    "Dispersant non tensioactif",
    "Solvant",
    "Non classé",
  ],
};

/**
 * Group an ingredient's function list into families → preserved order
 * (each family contains only functions present on this ingredient,
 * sorted by within-family priority).
 */
function groupFunctionsByFamily(fns: ReadonlyArray<string>): Map<FunctionFamily, string[]> {
  const byFamily = new Map<FunctionFamily, string[]>();
  for (const fn of fns) {
    const fam = FUNCTION_TO_FAMILY[fn] ?? "technique";
    if (!byFamily.has(fam)) byFamily.set(fam, []);
    byFamily.get(fam)!.push(fn);
  }
  for (const [fam, list] of byFamily) {
    const order = FAMILY_FUNCTION_PRIORITY[fam];
    list.sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      // Unknown-in-priority-list functions go last but stay deterministic
      return (ia < 0 ? Number.POSITIVE_INFINITY : ia) - (ib < 0 ? Number.POSITIVE_INFINITY : ib);
    });
  }
  return byFamily;
}

/**
 * Synthesise an ingredient's function list into a `(primary, secondary?)`
 * pair of context-aware verbs. Returns `null` when no function resolves
 * to a verb in the current category — callers should skip the ingredient
 * rather than emit an empty bullet.
 *
 * Algorithm :
 *   1. Group all functions by family (Soin / Cheveu / …).
 *   2. Walk families in FAMILY_PRIORITY order.
 *   3. For each family present, walk its functions (within-family priority)
 *      until one resolves to a non-null verb via verbForFunction(fn, cat).
 *   4. Collect up to TWO resolved verbs (primary + secondary). Return.
 */
function synthesiseFunctions(
  item: AnalyseItem,
  category: ProductCategory | null,
): { primary: string; secondary?: string } | null {
  const fns: string[] = item.allFunctions?.length
    ? [...item.allFunctions]
    : item.primaryFunction
    ? [item.primaryFunction]
    : [];
  if (!fns.length) return null;

  const byFamily = groupFunctionsByFamily(fns);
  const resolved: string[] = [];

  for (const fam of FAMILY_PRIORITY) {
    const present = byFamily.get(fam);
    if (!present?.length) continue;
    // Technique = fallback only. Used as PRIMARY when no other family is
    // available, but never as a SECONDARY complement. We don't want a soin
    // verb followed by "dissout les autres ingrédients" — that's noise.
    if (fam === "technique" && resolved.length > 0) break;
    for (const fn of present) {
      const v = verbForFunction(fn, category);
      if (v) {
        // Avoid emitting the same verb twice if two families happen to map
        // their selected function to identical text (rare but possible).
        if (!resolved.includes(v)) resolved.push(v);
        break;
      }
    }
    if (resolved.length >= 2) break;
  }

  if (resolved.length === 0) return null;
  return {
    primary: resolved[0],
    secondary: resolved[1],
  };
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
    const rawName = (it.name ?? it.input ?? "").trim();
    if (!rawName) continue;
    const synth = synthesiseFunctions(it, category);
    if (!synth) continue;
    // Display-name priority:
    //   1. it.translationFr  — DB French translation shown in the full
    //      "Liste des ingrédients" sheet (e.g. "Glycérine / Glycérol",
    //      "Ferment de radis"). Already properly cased, use as-is.
    //   2. commonNameForRaw  — grand-public override for the ~50 most
    //      visible ingredients (Aqua → eau, Persea Gratissima → huile
    //      d'avocat) when translationFr is missing.
    //   3. raw INCI          — final fallback, capitalised.
    const trFr = it.translationFr?.trim();
    const displayName = trFr
      ? trFr
      : capitalise(commonNameForRaw(rawName) ?? rawName);
    out.push({ name: displayName, verb: synth.primary, secondary: synth.secondary });
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
  "parfum-synthese": "à surveiller sur peaux sensibles",
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
  const tone = pickTone(result.counts, result.items);
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
