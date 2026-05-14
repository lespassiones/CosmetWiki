/**
 * Catalogue of cosmetic promise categories and the documented actives that
 * support each one.
 *
 * This is the **anti-hallucination knowledge base**: the LLM is constrained
 * to propose actives FROM this list only. Actives are referenced by their
 * canonical INCI slug (matches `cosme_check.ingredients.slug`) so the engine
 * can mechanically check their presence in the parent formula.
 *
 * NOTES
 * - For MVP we keep 12 broad categories. The list is meant to be enriched
 *   over time by domain experts (cosmétologues / chimistes).
 * - `evidence` levels:
 *     - "documented"  → biologically active at usage doses, peer-reviewed.
 *     - "supportive"  → contributes indirectly (e.g. emollients for hair
 *                       feel) but isn't the actual driver of the claim.
 *     - "marketing"   → cosmetic / sensory effect only, no biological action.
 * - `keywords` are French phrases / morphemes the LLM can use to map a
 *   marketing description fragment to this category (it's also used as a
 *   safety net regex if the LLM misses something).
 */

export type EvidenceLevel = "documented" | "supportive" | "marketing";

export type ActiveEntry = {
  /** Canonical INCI slug as stored in cosme_check.ingredients.slug. */
  slug: string;
  /** Display name (FR/EN, depending on what the literature uses). */
  name: string;
  evidence: EvidenceLevel;
};

export type ClaimCategory = {
  slug: string;
  label: string;
  /** Plain-French keywords that hint at this category in marketing text. */
  keywords: string[];
  /** Documented + supportive + cosmetic actives, in display order. */
  actives: ActiveEntry[];
  /** Short hint shown if the LLM falls back to "non_demontree". */
  hint: string;
};

/**
 * 12 promise categories covering ~80% of mainstream cosmetic claims.
 */
export const CLAIM_CATEGORIES: ClaimCategory[] = [
  {
    slug: "anti_chute",
    label: "Anti-chute",
    keywords: ["anti-chute", "chute", "anti chute", "stop chute", "tombe", "tomber", "ralentir la chute"],
    actives: [
      { slug: "caffeine", name: "Caféine", evidence: "documented" },
      { slug: "minoxidil", name: "Minoxidil", evidence: "documented" },
      { slug: "biotin", name: "Biotine", evidence: "supportive" },
      { slug: "saw-palmetto-extract", name: "Saw palmetto", evidence: "supportive" },
      { slug: "redensyl", name: "Redensyl", evidence: "documented" },
      { slug: "aminexil", name: "Aminexil", evidence: "documented" },
      { slug: "capilectine", name: "Capilectine", evidence: "documented" },
      { slug: "anageline", name: "Anagéline", evidence: "documented" },
      { slug: "procapil", name: "Procapil", evidence: "documented" },
    ],
    hint: "Aucun actif anti-chute documenté (caféine, minoxidil, peptides anti-chute…) n'a été trouvé.",
  },
  {
    slug: "densification",
    label: "Densification",
    keywords: ["densifie", "densification", "densité", "épaissi", "épaisseur", "volume capillaire", "ancrage"],
    actives: [
      { slug: "redensyl", name: "Redensyl", evidence: "documented" },
      { slug: "capixyl", name: "Capixyl", evidence: "documented" },
      { slug: "biotinyl-tripeptide-1", name: "Biotinyl-Tripeptide-1", evidence: "documented" },
      { slug: "hydrolyzed-keratin", name: "Kératine hydrolysée", evidence: "supportive" },
      { slug: "hydrolyzed-rice-protein", name: "Protéines de riz hydrolysées", evidence: "supportive" },
      // Cosmetic-only fillers (give visual volume, not biological density)
      { slug: "polyquaternium-7", name: "Polyquaternium-7", evidence: "marketing" },
      { slug: "polyquaternium-10", name: "Polyquaternium-10", evidence: "marketing" },
      { slug: "algae-extract", name: "Polysaccharides d'algues", evidence: "marketing" },
    ],
    hint: "Densification biologique non démontrée — la formule peut donner un effet visuel/sensoriel sans agir sur l'épaisseur réelle de la fibre.",
  },
  {
    slug: "hydratation",
    label: "Hydratation",
    keywords: ["hydrate", "hydratation", "hydratant", "humidité", "humidifie"],
    actives: [
      { slug: "glycerin", name: "Glycérine", evidence: "documented" },
      { slug: "sodium-hyaluronate", name: "Acide hyaluronique (sel de sodium)", evidence: "documented" },
      { slug: "hyaluronic-acid", name: "Acide hyaluronique", evidence: "documented" },
      { slug: "panthenol", name: "Panthénol (provitamine B5)", evidence: "documented" },
      { slug: "urea", name: "Urée", evidence: "documented" },
      { slug: "aloe-barbadensis-leaf-juice", name: "Aloe vera", evidence: "documented" },
      { slug: "betaine", name: "Bétaïne", evidence: "documented" },
      { slug: "propanediol", name: "Propanediol", evidence: "supportive" },
      { slug: "sodium-pca", name: "Sodium PCA", evidence: "documented" },
    ],
    hint: "Aucun humectant ou actif hydratant documenté trouvé en quantité utile.",
  },
  {
    slug: "anti_age",
    label: "Anti-âge",
    keywords: ["anti-âge", "anti age", "rides", "fermeté", "raffermi", "jeunesse", "rajeunit"],
    actives: [
      { slug: "retinol", name: "Rétinol", evidence: "documented" },
      { slug: "retinyl-palmitate", name: "Rétinyl palmitate", evidence: "documented" },
      { slug: "ascorbic-acid", name: "Vitamine C (acide ascorbique)", evidence: "documented" },
      { slug: "tetrahexyldecyl-ascorbate", name: "Vitamine C stable (tétrahexyldécyl ascorbate)", evidence: "documented" },
      { slug: "niacinamide", name: "Niacinamide (vitamine B3)", evidence: "documented" },
      { slug: "bakuchiol", name: "Bakuchiol", evidence: "documented" },
      { slug: "palmitoyl-tripeptide-1", name: "Peptides anti-âge", evidence: "documented" },
      { slug: "palmitoyl-pentapeptide-4", name: "Matrixyl", evidence: "documented" },
      { slug: "tocopherol", name: "Vitamine E (tocophérol)", evidence: "supportive" },
    ],
    hint: "Aucun actif anti-âge documenté (rétinol, vitamine C, peptides…) trouvé.",
  },
  {
    slug: "raffermissement",
    label: "Raffermissement",
    keywords: ["raffermi", "ferme", "tonifi", "tone", "élasticité"],
    actives: [
      { slug: "caffeine", name: "Caféine", evidence: "documented" },
      { slug: "centella-asiatica-extract", name: "Centella asiatica", evidence: "documented" },
      { slug: "palmitoyl-tripeptide-1", name: "Peptides", evidence: "documented" },
      { slug: "ascorbic-acid", name: "Vitamine C", evidence: "documented" },
      { slug: "retinol", name: "Rétinol", evidence: "documented" },
      { slug: "dmae", name: "DMAE", evidence: "supportive" },
    ],
    hint: "Aucun actif raffermissant documenté trouvé.",
  },
  {
    slug: "anti_pellicules",
    label: "Anti-pellicules",
    keywords: ["pellicules", "antipelliculaire", "anti-pelliculaire", "pellicule", "squames"],
    actives: [
      { slug: "piroctone-olamine", name: "Piroctone olamine", evidence: "documented" },
      { slug: "zinc-pyrithione", name: "Zinc pyrithione", evidence: "documented" },
      { slug: "selenium-disulfide", name: "Sulfure de sélénium", evidence: "documented" },
      { slug: "ketoconazole", name: "Kétoconazole", evidence: "documented" },
      { slug: "salicylic-acid", name: "Acide salicylique", evidence: "documented" },
      { slug: "climbazole", name: "Climbazole", evidence: "documented" },
      { slug: "melaleuca-alternifolia-leaf-oil", name: "Tea tree (huile)", evidence: "supportive" },
    ],
    hint: "Aucun actif antipelliculaire documenté trouvé.",
  },
  {
    slug: "demelage",
    label: "Démêlage",
    keywords: ["démêle", "démêlant", "demele", "demelant", "facile à coiffer"],
    actives: [
      { slug: "behentrimonium-methosulfate", name: "Behentrimonium methosulfate", evidence: "documented" },
      { slug: "behenamidopropyl-dimethylamine", name: "Behenamidopropyl dimethylamine", evidence: "documented" },
      { slug: "cetrimonium-chloride", name: "Cetrimonium chloride", evidence: "documented" },
      { slug: "cetearyl-alcohol", name: "Alcool cétéarylique (alcool gras)", evidence: "supportive" },
      { slug: "behenyl-alcohol", name: "Alcool béhénylique", evidence: "supportive" },
      { slug: "polyquaternium-7", name: "Polyquaternium-7", evidence: "documented" },
      { slug: "polyquaternium-10", name: "Polyquaternium-10", evidence: "documented" },
      { slug: "amodimethicone", name: "Amodiméthicone", evidence: "documented" },
    ],
    hint: "Aucun conditionneur cationique ou silicone démêlant documenté trouvé.",
  },
  {
    slug: "brillance",
    label: "Brillance",
    keywords: ["brillance", "brillant", "éclat", "lumière", "shine"],
    actives: [
      { slug: "dimethicone", name: "Diméthicone", evidence: "documented" },
      { slug: "cyclopentasiloxane", name: "Cyclopentasiloxane", evidence: "documented" },
      { slug: "argania-spinosa-kernel-oil", name: "Huile d'argan", evidence: "supportive" },
      { slug: "amodimethicone", name: "Amodiméthicone", evidence: "documented" },
    ],
    hint: "Aucun agent filmogène documenté pour la brillance trouvé.",
  },
  {
    slug: "anti_frisottis",
    label: "Anti-frisottis",
    keywords: ["frisottis", "anti-frisottis", "frizz", "lisse", "défrisé"],
    actives: [
      { slug: "amodimethicone", name: "Amodiméthicone", evidence: "documented" },
      { slug: "dimethicone", name: "Diméthicone", evidence: "documented" },
      { slug: "argania-spinosa-kernel-oil", name: "Huile d'argan", evidence: "supportive" },
      { slug: "behentrimonium-methosulfate", name: "Behentrimonium methosulfate", evidence: "documented" },
    ],
    hint: "Aucun agent filmogène ou conditionneur anti-frisottis trouvé.",
  },
  {
    slug: "apaisement",
    label: "Apaisement",
    keywords: ["apaise", "apaisant", "calme", "irritation", "rougeur", "sensibilité"],
    actives: [
      { slug: "centella-asiatica-extract", name: "Centella asiatica", evidence: "documented" },
      { slug: "panthenol", name: "Panthénol", evidence: "documented" },
      { slug: "aloe-barbadensis-leaf-juice", name: "Aloe vera", evidence: "documented" },
      { slug: "bisabolol", name: "Bisabolol", evidence: "documented" },
      { slug: "allantoin", name: "Allantoïne", evidence: "documented" },
      { slug: "niacinamide", name: "Niacinamide", evidence: "documented" },
      { slug: "calendula-officinalis-flower-extract", name: "Calendula", evidence: "supportive" },
    ],
    hint: "Aucun actif apaisant documenté trouvé.",
  },
  {
    slug: "exfoliation",
    label: "Exfoliation",
    keywords: ["exfolie", "exfoliant", "peeling", "renouvellement", "gomme", "scrub"],
    actives: [
      { slug: "glycolic-acid", name: "Acide glycolique (AHA)", evidence: "documented" },
      { slug: "lactic-acid", name: "Acide lactique (AHA)", evidence: "documented" },
      { slug: "salicylic-acid", name: "Acide salicylique (BHA)", evidence: "documented" },
      { slug: "mandelic-acid", name: "Acide mandélique (AHA)", evidence: "documented" },
      { slug: "polyhydroxyacid", name: "PHA", evidence: "documented" },
      { slug: "papain", name: "Papaïne (enzyme)", evidence: "documented" },
      { slug: "bromelain", name: "Bromélaïne (enzyme)", evidence: "documented" },
    ],
    hint: "Aucun acide exfoliant ou enzyme exfoliante documentée trouvée.",
  },
  {
    slug: "eclat",
    label: "Éclaircissement / Éclat",
    keywords: ["éclat", "éclaircit", "éclaircissant", "tache", "pigmentation", "uniformise", "anti-tache"],
    actives: [
      { slug: "niacinamide", name: "Niacinamide", evidence: "documented" },
      { slug: "ascorbic-acid", name: "Vitamine C", evidence: "documented" },
      { slug: "alpha-arbutin", name: "Alpha-arbutine", evidence: "documented" },
      { slug: "kojic-acid", name: "Acide kojique", evidence: "documented" },
      { slug: "tranexamic-acid", name: "Acide tranexamique", evidence: "documented" },
      { slug: "azelaic-acid", name: "Acide azélaïque", evidence: "documented" },
      { slug: "licorice-root-extract", name: "Extrait de réglisse", evidence: "supportive" },
    ],
    hint: "Aucun actif éclaircissant ou anti-taches documenté trouvé.",
  },
];

/** Lookup by slug. */
export function findCategoryBySlug(slug: string): ClaimCategory | undefined {
  return CLAIM_CATEGORIES.find((c) => c.slug === slug);
}

/** Compact list for the LLM prompt — slug + label + 1 example active per category. */
export function categoriesForPrompt(): { slug: string; label: string; example_actives: string[] }[] {
  return CLAIM_CATEGORIES.map((c) => ({
    slug: c.slug,
    label: c.label,
    example_actives: c.actives
      .filter((a) => a.evidence === "documented")
      .slice(0, 4)
      .map((a) => a.name),
  }));
}

/** All known active slugs (used by the engine to constrain matching). */
export function allKnownActiveSlugs(): Set<string> {
  const s = new Set<string>();
  for (const cat of CLAIM_CATEGORIES) {
    for (const a of cat.actives) s.add(a.slug);
  }
  return s;
}
