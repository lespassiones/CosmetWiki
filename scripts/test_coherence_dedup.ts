/**
 * Ephemeral tests for the coherence reclassification + deduplication pipeline.
 *
 * Specifically: the bug where the LLM hands back two semantically equivalent
 * promises as separate rows — one catalogue ("Brillance"), one "autre"
 * ("Éclat de la fibre capillaire") — which then get scored 0 % vs 100 %
 * because each goes through a different resolver.
 *
 *   Fix path: lib/coherence/engine.ts `reclassifyOpenProposals` re-routes
 *   the open variant to the catalogue slug; the subsequent `dedupProposals`
 *   then merges the twin into one row.
 *
 * No network, no LLM — pure-function tests.
 *
 * Run:  npx tsx scripts/test_coherence_dedup.ts
 */

import {
  dedupProposals,
  reclassifyOpenProposals,
  type LlmPromiseProposal,
} from "../lib/coherence/engine";
import type { ProductType } from "../lib/coherence/types";

// ─── TAP-ish runner ────────────────────────────────────────────────────────

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

// Convenience builder for proposals.
function p(opts: {
  slug: string;
  label: string;
  excerpt?: string;
}): LlmPromiseProposal {
  return {
    category_slug: opts.slug,
    label: opts.label,
    excerpt: opts.excerpt ?? `Phrase contenant "${opts.label}".`,
  };
}

function pipe(proposals: LlmPromiseProposal[], productType: ProductType | null) {
  return dedupProposals(reclassifyOpenProposals(proposals, productType));
}

function slugs(list: LlmPromiseProposal[]): string[] {
  return list.map((x) => x.category_slug).sort();
}

// ─── The original tester bug ───────────────────────────────────────────────

console.log("\n[bug original] capillaire — 'Brillance' (catalogue) + 'Éclat de la fibre capillaire' ('autre')");
{
  const input: LlmPromiseProposal[] = [
    p({ slug: "brillance", label: "Brillance", excerpt: "Apporte de la brillance aux cheveux." }),
    p({
      slug: "autre",
      label: "Éclat de la fibre capillaire",
      excerpt: "Éclat de la fibre capillaire visible dès la 1ère application.",
    }),
  ];
  const out = pipe(input, "cheveux");
  check("fusionné en 1 seule promesse", out.length === 1, `got ${out.length}: ${JSON.stringify(slugs(out))}`);
  check("survivant a le slug 'brillance'", out[0]?.category_slug === "brillance");
  // Excerpt gardé doit être le plus long (celui de la variante "autre")
  check(
    "excerpt = le plus informatif",
    (out[0]?.excerpt ?? "").includes("Éclat de la fibre capillaire"),
    `got: ${out[0]?.excerpt}`,
  );
}

// ─── Le même mot-clé doit rester dans 'eclat' pour un produit visage ───────

console.log("\n[ambiguité 'éclat'] peau_visage — promesse 'éclat du teint' doit aller à 'eclat', PAS 'brillance'");
{
  const input: LlmPromiseProposal[] = [
    p({
      slug: "autre",
      label: "Éclat du teint",
      excerpt: "Redonne de l'éclat au teint terne et fatigué.",
    }),
  ];
  const out = pipe(input, "peau_visage");
  check("a été reclassifié dans le catalogue", out.length === 1 && out[0]?.category_slug !== "autre");
  check("a été reclassifié dans 'eclat' (pas 'brillance')", out[0]?.category_slug === "eclat", `got: ${out[0]?.category_slug}`);
}

// ─── Et la même promesse sur un produit cheveux ────────────────────────────

console.log("\n[ambiguité 'éclat'] cheveux — 'éclat' doit aller à 'brillance', pas à 'eclat' (peau)");
{
  const input: LlmPromiseProposal[] = [
    p({ slug: "autre", label: "Plus d'éclat", excerpt: "Donne plus d'éclat et de lumière aux cheveux." }),
  ];
  const out = pipe(input, "cheveux");
  check("reclassifié dans 'brillance'", out.length === 1 && out[0]?.category_slug === "brillance", `got: ${out[0]?.category_slug}`);
}

// ─── Douceur / souplesse sur cheveux → demelage ────────────────────────────

console.log("\n[doublon] cheveux — 'Douceur des cheveux' + 'Souplesse des cheveux' fusionnent dans 'demelage'");
{
  const input: LlmPromiseProposal[] = [
    p({ slug: "autre", label: "Douceur des cheveux", excerpt: "Apporte douceur des cheveux et facilite le démêlage." }),
    p({ slug: "autre", label: "Souplesse des cheveux", excerpt: "Confère une souplesse des cheveux remarquable." }),
  ];
  const out = pipe(input, "cheveux");
  check(
    "les deux fusionnent en 1 promesse 'demelage'",
    out.length === 1 && out[0]?.category_slug === "demelage",
    `got ${out.length} entries: ${JSON.stringify(out.map((x) => x.category_slug))}`,
  );
}

// ─── Multiples promesses catalogue + une 'autre' qui doublonne ─────────────

console.log("\n[mixte] cheveux — catalogue {hydratation, brillance} + 'autre' {éclat (=brillance)}");
{
  const input: LlmPromiseProposal[] = [
    p({ slug: "hydratation", label: "Hydratation" }),
    p({ slug: "brillance", label: "Brillance" }),
    p({ slug: "autre", label: "Éclat de la fibre", excerpt: "Donne un bel éclat à la fibre capillaire." }),
  ];
  const out = pipe(input, "cheveux");
  const sl = slugs(out);
  check("2 promesses finales (hydratation + brillance)", out.length === 2, `got ${out.length}`);
  check("slugs = [brillance, hydratation]", sl.join(",") === "brillance,hydratation", `got: ${sl.join(",")}`);
}

// ─── Promesse 'autre' NON-mappable doit rester 'autre' ─────────────────────

console.log("\n[passthrough] 'autre' sans aucun keyword catalogue → conservée");
{
  const input: LlmPromiseProposal[] = [
    p({ slug: "autre", label: "Texture fondante", excerpt: "Une texture fondante, agréable à appliquer." }),
  ];
  const out = pipe(input, "peau_visage");
  check("reste en 'autre'", out.length === 1 && out[0]?.category_slug === "autre", `got slug: ${out[0]?.category_slug}`);
}

// ─── Promesses catalogue indépendantes ne sont pas fusionnées ──────────────

console.log("\n[indépendantes] cheveux — hydratation + brillance ne sont PAS fusionnées");
{
  const input: LlmPromiseProposal[] = [
    p({ slug: "hydratation", label: "Hydratation" }),
    p({ slug: "brillance", label: "Brillance" }),
  ];
  const out = pipe(input, "cheveux");
  check("toujours 2 promesses", out.length === 2);
  check("ordres préservés (avec dedup)", slugs(out).join(",") === "brillance,hydratation");
}

// ─── Doublons exactes sur même slug fusionnent (rôle de dedupProposals) ────

console.log("\n[dedup pur] 2x 'brillance' avec excerpts différents → 1 seule (la + longue)");
{
  const short = "Brillance.";
  const long = "Brillance intense des cheveux longue durée et reflets lumineux.";
  const input: LlmPromiseProposal[] = [
    p({ slug: "brillance", label: "Brillance", excerpt: short }),
    p({ slug: "brillance", label: "Brillance", excerpt: long }),
  ];
  const out = pipe(input, "cheveux");
  check("fusionnées en 1", out.length === 1);
  check("garde le excerpt le plus long", out[0]?.excerpt === long, `got: ${out[0]?.excerpt}`);
}

// ─── productType absent (null) ─────────────────────────────────────────────

console.log("\n[productType null] reclassifier ne gate pas sur le type — accepte tout match");
{
  const input: LlmPromiseProposal[] = [
    p({ slug: "autre", label: "Hydrate intensément" }),
  ];
  const out = pipe(input, null);
  check("reclassifié dans 'hydratation' même sans productType", out[0]?.category_slug === "hydratation");
}

// ─── Anti-frisottis ambigu : 'lisse' matche aussi anti_frisottis (cheveux) ─

console.log("\n[anti-frisottis] cheveux — 'cheveux lisses sans frizz' → anti_frisottis");
{
  const input: LlmPromiseProposal[] = [
    p({ slug: "autre", label: "Lisse les frisottis", excerpt: "Pour des cheveux lisses sans frizz." }),
  ];
  const out = pipe(input, "cheveux");
  check("reclassifié dans 'anti_frisottis'", out[0]?.category_slug === "anti_frisottis", `got: ${out[0]?.category_slug}`);
}

// ─── Régression : 'autre' sur produit peau ne se mappe PAS sur brillance ───

console.log("\n[régression] peau_visage — 'brillant' (peau brillante = défaut, pas une promesse capillaire)");
{
  // On simule une promesse "matifie" qui mentionne "brillance" comme défaut.
  // Avec productType=peau_visage, 'brillance' (cheveux-only) ne doit pas matcher.
  const input: LlmPromiseProposal[] = [
    p({ slug: "autre", label: "Matifie la peau brillante", excerpt: "Réduit les zones de brillance du visage." }),
  ];
  const out = pipe(input, "peau_visage");
  check(
    "ne reclassifie PAS dans 'brillance' (incompatible peau_visage)",
    out[0]?.category_slug !== "brillance",
    `got: ${out[0]?.category_slug}`,
  );
}

// ─── Cas absence : pas de reclassif vers absence_* ────────────────────────

console.log("\n[absence non-touchée] 'autre' contenant 'sans sulfate' → resté en 'autre'");
{
  // Les absence categories ont forbiddenTag et sont skip dans reclassify.
  // Une promesse "Sans sulfate" devrait idéalement être détectée en amont
  // par le LLM, mais si elle slip à travers en "autre" on ne la touche pas
  // ici (le reclassifier ne couvre que les catégories effet).
  const input: LlmPromiseProposal[] = [
    p({ slug: "autre", label: "Sans sulfate", excerpt: "Formulé sans sulfate agressif." }),
  ];
  const out = pipe(input, "cheveux");
  check("reste 'autre' (pas dans absence_*)", out[0]?.category_slug === "autre");
}

// ─── Summary ───────────────────────────────────────────────────────────────

console.log("\n" + "─".repeat(60));
if (failures.length === 0) {
  console.log(`✅  ${passCount} assertions OK — reclassif + dedup sains.`);
  process.exit(0);
} else {
  console.log(`❌  ${passCount} OK, ${failures.length} ÉCHEC(S):`);
  for (const f of failures) console.log("    - " + f);
  process.exit(1);
}
