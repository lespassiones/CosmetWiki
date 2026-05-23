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
 */

import type { AnalyseItem, AnalyseResponse } from "@/lib/analyseTypes";

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

// ─── Positives ────────────────────────────────────────────────────────────

export type Positive = { name: string; verb: string };

/**
 * Short action verb attached to each primaryFunction value we see in the DB.
 * The full list of ~75 function names was extracted from
 * `cosme_check.ingredients.functions[].name`. Anything not mapped here falls
 * back to the raw function string in lowercase.
 */
const FUNCTION_VERBS: Record<string, string> = {
  "Agent d'entretien de la peau": "soigne la peau",
  "Agent d'entretien de la peau - Divers": "soigne la peau",
  "Agent d'entretien de la peau - Humectant": "hydrate la peau",
  "Agent d'entretien de la peau - Occlusif": "verrouille l'hydratation",
  "Conditionneur capillaire": "lisse les cheveux",
  "Emollient": "adoucit la peau",
  "Tensioactif": "nettoie",
  "Agent émulsifiant": "lie l'eau et l'huile",
  "Agent parfumant": "parfume",
  "Agent masquant": "neutralise les odeurs",
  "Agent de contrôle de la viscosité": "donne la texture",
  "Antioxydant": "protège du vieillissement",
  "Agent de protection de la peau": "protège la peau",
  "Humectant": "hydrate",
  "Agent filmogène": "forme un film protecteur",
  "Agent nettoyant": "nettoie en douceur",
  "Antistatique": "anti-électricité statique",
  "Antimicrobien": "limite les bactéries",
  "Solvant": "support de formule",
  "Astringent": "resserre les pores",
  "Stabilisateur d'émulsion": "stabilise la texture",
  "Agent fixant": "fixe la coiffure",
  "Tonifiant": "tonifie",
  "Agent Abrasif": "exfolie",
  "Agent colorant pour cheveux": "colore les cheveux",
  "Colorant cosmétique": "colore",
  "Sinergiste de mousse": "renforce la mousse",
  "Régulateur de pH": "équilibre le pH",
  "Opacifiant": "rend la formule opaque",
  "Agent de foisonnement": "épaissit",
  "Agent de fixation capillaire": "tient la coiffure",
  "Conservateur": "préserve la formule",
  "Agent d'hygiène buccale": "hygiène buccale",
  "Déodorant": "limite les odeurs",
  "Agent apaisant": "apaise",
  "Agent Absorbant": "absorbe l'excès de sébum",
  "Agent arômatisant": "parfume",
  "Agent moussant": "fait mousser",
  "Agent stabilisant": "stabilise la formule",
  "Non classé": "rôle non classé",
  "Agent de chélation": "stabilise la formule",
  "Agent plastifiant": "assouplit",
  "Absorbant UV": "absorbe les UV",
  "Anti Agglomérant": "empêche l'agglomérat",
  "Agent éclaircissant": "éclaircit",
  "Hydrotrope": "solubilise",
  "Anti-séborrhée": "régule le sébum",
  "Agent d'entretien des ongles": "soigne les ongles",
  "Antipelliculaire": "anti-pelliculaire",
  "Hydratant": "hydrate",
  "Agent bouclant ou lissant (coiffant)": "discipline les cheveux",
  "Agent réducteur": "agent réducteur",
  "Agent rafraîchissant": "rafraîchit",
  "Antiplaque": "anti-plaque dentaire",
  "Agent lissant": "lisse",
  "Filtre UV": "protège des UV",
  "Dénaturant": "dénature l'alcool",
  "Anti-moussant": "empêche la mousse",
  "Agent Oxydant": "oxyde",
  "Dépilatoire": "élimine les poils",
  "Anti-transpirant": "limite la transpiration",
  "Gélifiant": "gélifie",
  "Anticorrosif": "anti-corrosion",
  "Kératolytique": "exfolie les cellules mortes",
  "Agent propulseur": "propulse l'aérosol",
  "Agent de restauration lipidique": "restaure le film lipidique",
  "Modificateurs de glissement": "améliore le toucher",
  "Agent démêlant": "démêle",
  "Dispersion des agents de surface": "disperse",
  "Ajusteurs de pH": "équilibre le pH",
  "Sculpture des ongles": "sculpte les ongles",
  "Agent de bronzage": "bronze sans soleil",
  "Exfoliant": "exfolie",
  "Dispersant non tensioactif": "disperse",
  "Agent tensioactif - Solubilisant": "solubilise",
  "Modificateur de surface": "modifie la surface",
  "Agent nacrant": "donne un effet nacré",
};

/**
 * Map a raw primaryFunction string to a short verb phrase. Falls back to the
 * raw string (lowercased + leading "Agent " stripped) if we don't have an
 * explicit entry — so new function names appearing in the DB still render
 * something readable rather than nothing.
 */
function verbForFunction(fn: string | null): string | null {
  if (!fn) return null;
  const direct = FUNCTION_VERBS[fn];
  if (direct) return direct;
  // Soft fallback: "Agent moussant" → "agent moussant"
  return fn.toLowerCase();
}

/** Best green ingredients first (by INCI position = highest concentration). */
function pickPositives(items: AnalyseItem[]): Positive[] {
  const greens = items
    .filter((it) => it.colorRating === "Vert")
    .sort((a, b) => a.position - b.position)
    .slice(0, 3);

  const out: Positive[] = [];
  for (const it of greens) {
    const name = (it.name ?? it.input ?? "").trim();
    if (!name) continue;
    const verb = verbForFunction(it.primaryFunction);
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
 *  positive (huile-vegetale) or neutral classifications. When the worst
 *  ingredient of a tier only carries these, we fall back to a generic
 *  tier-level message instead. */
const NEUTRAL_OR_POSITIVE_TAGS = new Set([
  "huile-vegetale",
  "colorant-naturel",
  "filtre-uv-mineral",
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

export function computeEssentiel(result: AnalyseResponse): EssentielData {
  const tone = pickTone(result.counts);
  const phrase = pickPhrase(tone, result.counts);
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
