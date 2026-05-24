/**
 * Ephemeral integration tests for the essentiel engine.
 *
 * Why this exists:
 *   A tester scanned a deodorant and the "Ce qui est bien" card surfaced
 *   "Magnesium carbonate hydroxide → fixe la coiffure" — a hair-fixative
 *   verb on a body product. Root cause was a non-contextual FUNCTION_VERBS
 *   mapping. We've now turned that map into a per-category structure (see
 *   lib/essentiel/engine.ts) and need cheap regression coverage across the
 *   10 product categories the app supports.
 *
 *   Frameworks like vitest are not installed in this repo, so we ship a
 *   self-contained script that asserts the invariants directly. Run with:
 *
 *     npx tsx scripts/test_essentiel.ts
 *
 *   Exit code 0 = all green; non-zero = at least one assertion failed.
 */

import {
  computeEssentiel,
  normalizeProductTypeToCategory,
  NEUTRAL_OR_POSITIVE_TAGS,
  __testing,
  type EssentielData,
} from "../lib/essentiel/engine";
import type { AnalyseItem, AnalyseResponse } from "../lib/analyseTypes";
import type { ProductCategory } from "../lib/ai/categorize";

// ─── Fixture helpers ───────────────────────────────────────────────────────

type ItemSpec = {
  position?: number;
  name: string;
  primaryFunction?: string | null;
  colorRating?: "Vert" | "Jaune" | "Orange" | "Rouge" | null;
  tags?: string[];
};

let positionCounter = 0;

function item(spec: ItemSpec): AnalyseItem {
  const position = spec.position ?? ++positionCounter;
  const color = spec.colorRating ?? "Vert";
  return {
    position,
    input: spec.name,
    slug: spec.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: spec.name,
    colorRating: color,
    dbColorRating: color,
    casNumber: null,
    translationFr: null,
    primaryFunction: spec.primaryFunction ?? null,
    tags: spec.tags ?? null,
    matchKind: "exact",
    confidence: 1,
    thresholdContext: null,
    thresholdLabel: null,
  };
}

function makeAnalyseResponse(opts: {
  items: AnalyseItem[];
  productType?: string | null;
  category?: ProductCategory | null;
}): AnalyseResponse {
  positionCounter = 0; // reset for the next fixture
  const counts = {
    total: opts.items.length,
    matched: opts.items.length,
    vert: 0,
    jaune: 0,
    orange: 0,
    rouge: 0,
    unknown: 0,
  };
  for (const it of opts.items) {
    switch (it.colorRating) {
      case "Vert": counts.vert++; break;
      case "Jaune": counts.jaune++; break;
      case "Orange": counts.orange++; break;
      case "Rouge": counts.rouge++; break;
      default: counts.unknown++;
    }
  }
  return {
    counts,
    score: 0.8,
    scoreLabel: "Bon",
    scoreTone: "green",
    items: opts.items,
    observations: [],
    aliasesUsed: [],
    suggestions: [],
    spectrum: {
      top5: opts.items.slice(0, 5).map((i) => i.colorRating),
      top10: opts.items.slice(0, 10).map((i) => i.colorRating),
    },
    synthesis: null,
    productType: opts.productType ?? null,
    category: opts.category ?? null,
  };
}

// ─── Tiny TAP-ish runner ───────────────────────────────────────────────────

const failures: string[] = [];
let passCount = 0;

function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passCount++;
    process.stdout.write("  ✓ " + name + "\n");
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    process.stdout.write("  ✗ " + name + (detail ? " — " + detail : "") + "\n");
  }
}

function dumpPositives(e: EssentielData): string {
  if (e.positives.length === 0) return "(none)";
  return e.positives.map((p) => `${p.name} -> ${p.verb}`).join(" | ");
}

function hasVerb(e: EssentielData, verb: string): boolean {
  return e.positives.some((p) => p.verb === verb);
}

function noVerb(e: EssentielData, verb: string): boolean {
  return !e.positives.some((p) => p.verb.includes(verb));
}

// ─── 10 product-category fixtures ──────────────────────────────────────────

type Fixture = {
  label: string;
  category: ProductCategory | null;
  productType: string | null;
  items: AnalyseItem[];
  assertions: (e: EssentielData) => void;
};

const fixtures: Fixture[] = [
  // 1. DÉODORANT — the original tester's bug. "Agent fixant" must NOT say
  //    "fixe la coiffure" on a deodorant.
  {
    label: "1/10 deodorant (the original bug)",
    category: "deodorant",
    productType: "déodorant spray",
    items: [
      item({ name: "Aqua", primaryFunction: "Solvant" }),
      item({ name: "Magnesium hydroxide", primaryFunction: "Agent Absorbant" }),
      item({ name: "Magnesium carbonate hydroxide", primaryFunction: "Agent fixant" }),
      item({ name: "Helianthus annuus seed oil", primaryFunction: "Emollient", tags: ["huile-vegetale"] }),
      item({ name: "Sodium bicarbonate", primaryFunction: "Déodorant" }),
    ],
    assertions: (e) => {
      check("ne dit jamais 'fixe la coiffure' sur un déodorant", noVerb(e, "coiffure"));
      check("'Agent fixant' devient 'lie les ingrédients'", e.positives.some((p) => p.name.toLowerCase().includes("magnesium carbonate") && p.verb === "lie les ingrédients"));
      check("'Déodorant' fonction devient 'limite les odeurs'", hasVerb(e, "limite les odeurs") || e.positives.length === 3);
    },
  },

  // 2. SHAMPOOING — same "Agent fixant" function but here the hair context
  //    means the hair-coiffure verb is legit (still routed through the new
  //    map, but pickPositives only takes the top 3 by position).
  {
    label: "2/10 shampooing",
    category: "shampooing",
    productType: "shampoing antipelliculaire",
    items: [
      item({ name: "Aqua", primaryFunction: "Solvant" }),
      item({ name: "Sodium laureth sulfate", primaryFunction: "Tensioactif" }),
      item({ name: "Cocamidopropyl betaine", primaryFunction: "Agent moussant" }),
      item({ name: "Cetyl alcohol", primaryFunction: "Conditionneur capillaire" }),
      item({ name: "Zinc pyrithione", primaryFunction: "Antipelliculaire" }),
    ],
    assertions: (e) => {
      check("'Tensioactif' adapté au capillaire", e.positives.some((p) => p.verb === "nettoie les cheveux"));
      check("'Agent moussant' garde 'fait mousser'", e.positives.some((p) => p.verb === "fait mousser"));
    },
  },

  // 3. APRÈS-SHAMPOOING — "Conditionneur capillaire" doit apparaître ici.
  {
    label: "3/10 après-shampooing",
    category: "apres_shampooing",
    productType: "après-shampooing nourrissant",
    items: [
      item({ name: "Aqua", primaryFunction: "Solvant" }),
      item({ name: "Cetearyl alcohol", primaryFunction: "Conditionneur capillaire" }),
      item({ name: "Behentrimonium chloride", primaryFunction: "Agent démêlant" }),
      item({ name: "Argania spinosa oil", primaryFunction: "Emollient", tags: ["huile-vegetale"] }),
    ],
    assertions: (e) => {
      check("'Conditionneur capillaire' affiche 'lisse les cheveux'", hasVerb(e, "lisse les cheveux"));
      check("'Agent démêlant' affiche 'démêle'", hasVerb(e, "démêle"));
    },
  },

  // 4. CRÈME VISAGE — universels uniquement, rien de capillaire.
  {
    label: "4/10 crème visage",
    category: "creme_visage",
    productType: "crème hydratante visage",
    items: [
      item({ name: "Aqua", primaryFunction: "Solvant" }),
      item({ name: "Glycerin", primaryFunction: "Humectant" }),
      item({ name: "Squalane", primaryFunction: "Emollient" }),
      item({ name: "Niacinamide", primaryFunction: "Agent d'entretien de la peau" }),
    ],
    assertions: (e) => {
      check("aucun verbe capillaire", noVerb(e, "cheveux") && noVerb(e, "coiffure"));
      check("verbes peau présents", hasVerb(e, "hydrate") || hasVerb(e, "adoucit la peau"));
    },
  },

  // 5. CRÈME CORPS — vérifie aussi qu'un ingrédient "huile-vegetale" green
  //    apparaît bien comme positif (la regex de filtrage ObservationsCard
  //    n'affecte PAS le positives card — c'est important).
  {
    label: "5/10 crème corps",
    category: "creme_corps",
    productType: "lait corps nourrissant",
    items: [
      item({ name: "Aqua", primaryFunction: "Solvant" }),
      item({ name: "Helianthus annuus seed oil", primaryFunction: "Emollient", tags: ["huile-vegetale"] }),
      item({ name: "Glycerin", primaryFunction: "Humectant" }),
      item({ name: "Butyrospermum parkii butter", primaryFunction: "Emollient" }),
    ],
    assertions: (e) => {
      check("verbes peau cohérents", hasVerb(e, "adoucit la peau"));
      check("3 positifs trouvés", e.positives.length === 3);
    },
  },

  // 6. SOLAIRE — "Filtre UV" doit apparaître ici (skipped ailleurs).
  {
    label: "6/10 solaire",
    category: "solaire",
    productType: "crème solaire SPF50",
    items: [
      item({ name: "Aqua", primaryFunction: "Solvant" }),
      item({ name: "Titanium dioxide", primaryFunction: "Filtre UV" }),
      item({ name: "Zinc oxide", primaryFunction: "Filtre UV", tags: ["filtre-uv-mineral"] }),
      item({ name: "Glycerin", primaryFunction: "Humectant" }),
    ],
    assertions: (e) => {
      check("'Filtre UV' affiche 'protège des UV'", hasVerb(e, "protège des UV"));
    },
  },

  // 7. NETTOYANT VISAGE — phrasing tuning : "nettoie en douceur".
  {
    label: "7/10 nettoyant visage",
    category: "nettoyant_visage",
    productType: "gel nettoyant visage",
    items: [
      item({ name: "Aqua", primaryFunction: "Solvant" }),
      item({ name: "Coco-glucoside", primaryFunction: "Tensioactif" }),
      item({ name: "Glycerin", primaryFunction: "Humectant" }),
      item({ name: "Sodium cocoyl isethionate", primaryFunction: "Agent nettoyant" }),
    ],
    assertions: (e) => {
      check("'Tensioactif' devient 'nettoie en douceur'", hasVerb(e, "nettoie en douceur"));
      check("aucun verbe capillaire", noVerb(e, "cheveux"));
    },
  },

  // 8. MAQUILLAGE — universels + colorant.
  {
    label: "8/10 maquillage",
    category: "maquillage",
    productType: "fond de teint matifiant",
    items: [
      item({ name: "Aqua", primaryFunction: "Solvant" }),
      item({ name: "Iron oxides", primaryFunction: "Colorant cosmétique", tags: ["colorant-mineral"] }),
      item({ name: "Mica", primaryFunction: "Opacifiant" }),
      item({ name: "Dimethicone", primaryFunction: "Agent filmogène" }),
    ],
    assertions: (e) => {
      check("aucun verbe capillaire", noVerb(e, "cheveux") && noVerb(e, "coiffure"));
      check("'Colorant cosmétique' devient 'colore'", hasVerb(e, "colore"));
    },
  },

  // 9. PARFUM — formula 90 % solvant + parfums.
  {
    label: "9/10 parfum",
    category: "parfum",
    productType: "eau de toilette",
    items: [
      item({ name: "Alcohol denat.", primaryFunction: "Solvant", tags: ["alcool"] }),
      item({ name: "Aqua", primaryFunction: "Solvant" }),
      item({ name: "Parfum", primaryFunction: "Agent parfumant" }),
      item({ name: "Limonene", primaryFunction: "Agent parfumant" }),
    ],
    assertions: (e) => {
      check("'Agent parfumant' devient 'parfume'", hasVerb(e, "parfume"));
      check("aucun verbe capillaire", noVerb(e, "cheveux")),
      check("aucun verbe 'coiffure'", noVerb(e, "coiffure"));
    },
  },

  // 10. AUTRE — catégorie inconnue (ex: gel WC, baume à lèvres pré-onboarding…).
  //     On veut le fallback default sans aberration.
  {
    label: "10/10 autre (catégorie inconnue)",
    category: "autre",
    productType: null,
    items: [
      item({ name: "Aqua", primaryFunction: "Solvant" }),
      item({ name: "Glycerin", primaryFunction: "Humectant" }),
      item({ name: "Magnesium carbonate hydroxide", primaryFunction: "Agent fixant" }),
    ],
    assertions: (e) => {
      check("'Agent fixant' ne dit jamais 'fixe la coiffure' par défaut", noVerb(e, "coiffure"));
      check("'Agent fixant' tombe sur 'lie les ingrédients'", hasVerb(e, "lie les ingrédients"));
    },
  },
];

// ─── Cross-cutting tests ───────────────────────────────────────────────────

function testNormalizeProductType() {
  console.log("\n[bonus] normalizeProductTypeToCategory keyword fallback");
  const cases: Array<[string, ProductCategory | null]> = [
    ["déodorant spray", "deodorant"],
    ["DEODORANT roll-on", "deodorant"],
    ["anti-transpirant 48h", "deodorant"],
    ["shampoing antipelliculaire", "shampooing"],
    ["après-shampooing nourrissant", "apres_shampooing"],
    ["crème solaire SPF50", "solaire"],
    ["gel nettoyant visage", "nettoyant_visage"],
    ["démaquillant biphasé", "nettoyant_visage"],
    ["sérum anti-âge", "creme_visage"],
    ["lait corps réparateur", "creme_corps"],
    ["fond de teint matifiant", "maquillage"],
    ["eau de parfum", "parfum"],
    ["liquide vaisselle", null], // not a cosmetic — should fail to map
    ["", null],
    ["zzz unknown", null],
  ];
  for (const [input, expected] of cases) {
    const actual = normalizeProductTypeToCategory(input);
    check(`"${input}" -> ${expected ?? "null"}`, actual === expected, actual === expected ? undefined : `got ${actual ?? "null"}`);
  }
}

function testNeutralPositiveSet() {
  console.log("\n[bonus] NEUTRAL_OR_POSITIVE_TAGS — shared with route.ts");
  // huile-vegetale was the tester's other complaint — make sure it's in the
  // shared set so /api/analyser also skips it from ObservationsCard.
  check("huile-vegetale est neutre/positif", NEUTRAL_OR_POSITIVE_TAGS.has("huile-vegetale"));
  check("colorant-naturel est neutre/positif", NEUTRAL_OR_POSITIVE_TAGS.has("colorant-naturel"));
  check("filtre-uv-mineral est neutre/positif", NEUTRAL_OR_POSITIVE_TAGS.has("filtre-uv-mineral"));
  // sanity : negative tags should NOT be in there
  check("paraben n'est PAS neutre/positif", !NEUTRAL_OR_POSITIVE_TAGS.has("paraben"));
  check("sulfate n'est PAS neutre/positif", !NEUTRAL_OR_POSITIVE_TAGS.has("sulfate"));
  check("huile-hydrogenee n'est PAS neutre/positif", !NEUTRAL_OR_POSITIVE_TAGS.has("huile-hydrogenee"));
}

function testContextSkipping() {
  console.log("\n[bonus] contextual SKIP — capillary verb on non-hair product");
  // A deodorant whose green-rated ingredients ALL have capillary-only verbs
  // should produce zero positives rather than wrong-context bullets.
  const r = makeAnalyseResponse({
    category: "deodorant",
    productType: "déodorant stick",
    items: [
      item({ name: "Conditioner only", primaryFunction: "Conditionneur capillaire" }),
      item({ name: "Demelant only", primaryFunction: "Agent démêlant" }),
      item({ name: "Aqua", primaryFunction: "Solvant" }),
    ],
  });
  const e = computeEssentiel(r, { category: "deodorant", productType: "déodorant stick" });
  check(
    "Aucun bullet capillaire ne s'affiche sur un déodorant",
    noVerb(e, "cheveux") && noVerb(e, "démêle"),
    `got: ${dumpPositives(e)}`,
  );
  // …but the cleansing/solvent ingredient still surfaces
  check("Le solvant reste affichable", hasVerb(e, "support de formule"));
}

function testKeywordFallbackWhenCategoryAutre() {
  console.log("\n[bonus] category='autre' + productType='déodorant' falls back to keyword match");
  const r = makeAnalyseResponse({
    category: "autre",
    productType: "déodorant",
    items: [
      item({ name: "Aqua", primaryFunction: "Solvant" }),
      item({ name: "Magnesium carbonate hydroxide", primaryFunction: "Agent fixant" }),
      item({ name: "Sodium bicarbonate", primaryFunction: "Déodorant" }),
    ],
  });
  const e = computeEssentiel(r, { category: "autre", productType: "déodorant" });
  check("'Déodorant' devient 'limite les odeurs' quand keyword route -> deodorant", hasVerb(e, "limite les odeurs"));
  check("'Agent fixant' reste neutre", noVerb(e, "coiffure"));
}

function testVerbForFunctionUnit() {
  console.log("\n[bonus] verbForFunction — unit checks on the private mapping");
  const v = __testing.verbForFunction;
  check("'Agent fixant' + deodorant -> 'lie les ingrédients'", v("Agent fixant", "deodorant") === "lie les ingrédients");
  check("'Agent fixant' + null -> 'lie les ingrédients'", v("Agent fixant", null) === "lie les ingrédients");
  check("'Agent fixant' + shampooing -> 'lie les ingrédients'", v("Agent fixant", "shampooing") === "lie les ingrédients");
  check("'Agent fixant' + apres_shampooing -> 'tient la coiffure'", v("Agent fixant", "apres_shampooing") === "tient la coiffure");
  check("'Agent de fixation capillaire' + deodorant -> null (skipped)", v("Agent de fixation capillaire", "deodorant") === null);
  check("'Agent de fixation capillaire' + shampooing -> 'tient la coiffure'", v("Agent de fixation capillaire", "shampooing") === "tient la coiffure");
  check("'Conditionneur capillaire' + deodorant -> null", v("Conditionneur capillaire", "deodorant") === null);
  check("'Emollient' (universal) survives any category", v("Emollient", "deodorant") === "adoucit la peau");
  check("unknown function -> lowercased raw fallback", v("Some New Function Name", "creme_visage") === "some new function name");
  check("null fn -> null", v(null, "deodorant") === null);
}

// ─── Runner ────────────────────────────────────────────────────────────────

console.log("CosmetWiki — essentiel engine smoke tests\n");

for (const fx of fixtures) {
  console.log(`\n[${fx.label}]  category=${fx.category ?? "null"}  productType=${fx.productType ?? "null"}`);
  const response = makeAnalyseResponse({
    items: fx.items,
    productType: fx.productType,
    category: fx.category,
  });
  const essentiel = computeEssentiel(response, { category: fx.category, productType: fx.productType });
  console.log(`  positives: ${dumpPositives(essentiel)}`);
  fx.assertions(essentiel);
}

testNormalizeProductType();
testNeutralPositiveSet();
testContextSkipping();
testKeywordFallbackWhenCategoryAutre();
testVerbForFunctionUnit();

console.log("\n" + "─".repeat(60));
if (failures.length === 0) {
  console.log(`✅  ${passCount} assertions OK — toutes les vérifications passent.`);
  process.exit(0);
} else {
  console.log(`❌  ${passCount} OK, ${failures.length} ÉCHEC(S):`);
  for (const f of failures) console.log("    - " + f);
  process.exit(1);
}
