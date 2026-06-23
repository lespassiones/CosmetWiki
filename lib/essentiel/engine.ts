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
  const penalisant = counts.orange + counts.rouge;
  const suffix =
    penalisant > 1
      ? `, ${penalisant} ingrédients pénalisants.`
      : penalisant === 1
      ? ", un ingrédient pénalisant."
      : ".";
  switch (tone) {
    case "very-safe":  return `Formule très douce${suffix}`;
    case "safe":       return `Formule globalement saine${suffix}`;
    case "caution":    return `Formule correcte${suffix}`;
    case "warning":    return `Formule moyenne${suffix}`;
    case "danger":
    case "high-risk":  return `Formule à examiner attentivement${suffix}`;
    case "unknown":    return "On n'a pas réussi à analyser cette formule.";
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
 * - `name`      : public display name of the ingredient.
 * - `functions` : its real documented functions (1 to 3), straight from the
 *                 DB, deduplicated, with "Non classé" filtered out.
 *
 * The UI renders them as `{name} -> {fn1} · {fn2} · {fn3}`. No verb table, no
 * family logic: we show the raw functions so the card stays trivial to
 * maintain and consistent with the mobile app (handoff §4).
 */
export type Positive = { name: string; functions: string[] };

const WATER_INCI_TOKENS = new Set(["AQUA", "WATER", "EAU"]);

function isWaterIngredient(rawName: string): boolean {
  const tokens = rawName.toUpperCase().split(/[\s/,]+/).filter(Boolean);
  return tokens.length > 0 && tokens.every((t) => WATER_INCI_TOKENS.has(t));
}

const NON_CLASSE = "non classé";

/** The 3 best-placed green ingredients (by INCI position = highest
 *  concentration), shown with their REAL documented functions.
 *
 *  Deterministic, no verb table, no family logic (handoff §4):
 *   - only water (Aqua / Water / Eau) is excluded, everything else is kept;
 *   - functions are shown as-is (1 to 3), deduplicated, "Non classé" dropped;
 *   - a green ingredient with no documented function left is skipped rather
 *     than burning a slot, so a formula with one bare green still fills the
 *     three bullets when other greens have functions.
 *  Display-name priority: FR translation -> grand-public name -> raw INCI. */
function pickPositives(items: AnalyseItem[]): Positive[] {
  const greens = items
    .filter((it) => it.colorRating === "Vert")
    .sort((a, b) => a.position - b.position);

  const out: Positive[] = [];
  for (const it of greens) {
    if (out.length >= 3) break;
    const rawName = (it.name ?? it.input ?? "").trim();
    if (!rawName) continue;
    if (isWaterIngredient(rawName)) continue;

    const rawFns = it.allFunctions?.length
      ? it.allFunctions
      : it.primaryFunction
      ? [it.primaryFunction]
      : [];
    // Real functions, as-is: trim, drop empties + "Non classé", dedup
    // (case-insensitive), keep at most 3 in their original order.
    const seen = new Set<string>();
    const functions: string[] = [];
    for (const f of rawFns) {
      const fn = (f ?? "").trim();
      if (!fn || fn.toLowerCase() === NON_CLASSE) continue;
      const key = fn.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      functions.push(fn);
      if (functions.length >= 3) break;
    }
    if (functions.length === 0) continue;

    const trFr = it.translationFr?.trim();
    const displayName = trFr ? trFr : capitalise(commonNameForRaw(rawName) ?? rawName);
    out.push({ name: displayName, functions });
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

/**
 * Apply a color-based safety floor to the display score (pastille only —
 * does NOT modify the stored score). Rules:
 *   - ≥1 rouge OR ≥3 orange → cap at 8.9  (pastille ≤ triangle)
 *   - 1–2 orange            → cap at 12.9 (pastille ≤ œil)
 *   - else                  → no cap
 * Using `min(score, cap)` so a score already below the cap is never raised.
 */
export function colorCapScore(
  score: number,
  counts: Pick<AnalyseResponse["counts"], "orange" | "rouge">,
): number {
  const { orange, rouge } = counts;
  if (rouge >= 1 || orange >= 3) return Math.min(score, 8.9);
  if (orange >= 1)               return Math.min(score, 12.9);
  return score;
}

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
  const cappedScore = colorCapScore(result.score, result.counts);
  const tone = verdictToneFromScore(cappedScore);
  const phrase = pickPhrase(tone, result.counts);
  // `opts` (category / productType) is no longer needed for the positives card
  // since we display raw functions, not context-aware verbs. Kept in the public
  // signature for API stability and potential future use.
  void opts;
  const positives = pickPositives(result.items);
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
// Kept module-private under a single namespace so the regression tests can
// poke at the positives selection without us widening the public API.
export const __testing = {
  pickPositives,
};
