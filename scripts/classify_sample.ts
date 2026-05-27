/**
 * Classify a sample of catalog products and print results for manual review.
 *
 * Samples 5 products from each top OBF category + 20 products with no OBF
 * category (name-rule path). Outputs a readable table so Claude can verify
 * every classification before bulk import.
 *
 * Run: npx tsx scripts/classify_sample.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { classifyProduct } from "../lib/classification/classify";

// Load .env
try {
  const envFile = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
  for (const line of envFile.split("\n")) {
    const idx = line.indexOf("=");
    if (idx === -1 || line.trimStart().startsWith("#")) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key) process.env[key] = val;
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

const TOP_OBF_CATS = [
  "shampoos", "moisturizers", "face-serums", "sunscreens", "deodorants",
  "soaps", "shower-gels", "body-oils", "gel", "toothpastes",
  "hair-care", "face-creams", "face-toners", "body-lotions", "perfumes",
  "foundations", "eye-creams", "hand-creams", "face-cleansers", "body-creams",
  "lip-balms", "conditioners", "lipsticks", "concealers", "mascaras",
  "hair-color", "hair-styling", "baby-care", "micellar-waters", "body-scrubs",
  "shaving", "nail-polishes", "toothpaste", "mouthwashes", "hair-masks",
  "blushes", "after-sun-care", "self-tanners", "intimate-hygiene", "eyeliners",
];

async function fetchSample(cat: string, n: number) {
  const { data } = await sb
    .schema("cosme_check")
    .from("catalog")
    .select("ean, brand, name, category, ingredients_text")
    .eq("category", cat)
    .not("ingredients_text", "is", null)
    .limit(n);
  return data ?? [];
}

async function run() {
  console.log("=== VÉRIFICATION CLASSIFICATION - ÉCHANTILLON ===\n");

  let totalOk = 0, totalWrong = 0, totalMiss = 0;

  // OBF-mapped categories
  for (const cat of TOP_OBF_CATS) {
    const rows = await fetchSample(cat, 4);
    if (rows.length === 0) continue;

    console.log(`\n── OBF: ${cat} ──`);
    for (const r of rows as Array<{ ean: string; brand: string | null; name: string; category: string | null; ingredients_text: string | null }>) {
      const res = classifyProduct({
        ean: r.ean,
        brand: r.brand,
        name: r.name,
        category: r.category,
        ingredientsText: r.ingredients_text,
      });
      const verdict = res ? `[${res.category}] → ${res.subcategory} (${res.method})` : "[non classifié]";
      if (res) totalOk++; else totalMiss++;
      console.log(`  ${r.brand ?? "?"} — ${r.name.slice(0, 60)}`);
      console.log(`    ${verdict}`);
    }
  }

  // Products WITHOUT OBF category (name-rule path)
  console.log("\n── SANS CATÉGORIE OBF (règles sur le nom) ──");
  const { data: nocat } = await sb
    .schema("cosme_check")
    .from("catalog")
    .select("ean, brand, name, category, ingredients_text")
    .or("category.is.null,category.eq.")
    .not("ingredients_text", "is", null)
    .limit(30);

  let namehit = 0, namemiss = 0;
  for (const r of (nocat ?? []) as Array<{ ean: string; brand: string | null; name: string; category: string | null; ingredients_text: string | null }>) {
    const res = classifyProduct({
      ean: r.ean,
      brand: r.brand,
      name: r.name,
      category: r.category,
      ingredientsText: r.ingredients_text,
    });
    const verdict = res
      ? `[${res.category}] → ${res.subcategory} (${res.method})`
      : "[non classifié]";
    if (res) namehit++; else namemiss++;
    console.log(`  ${r.brand ?? "?"} — ${r.name.slice(0, 60)}`);
    console.log(`    ${verdict}`);
  }

  console.log(`\n  Hits: ${namehit}/${(nocat ?? []).length}  Miss: ${namemiss}`);
  console.log(`\n=== RÉSUMÉ ===`);
  console.log(`OBF-mapped : ${totalOk} OK, ${totalMiss} miss`);

  // Estimate total coverage
  const { data: allSample } = await sb
    .schema("cosme_check")
    .from("catalog")
    .select("ean, brand, name, category, ingredients_text")
    .limit(500)
    .range(0, 499);

  let hits = 0;
  for (const r of (allSample ?? []) as Array<{ ean: string; brand: string | null; name: string; category: string | null; ingredients_text: string | null }>) {
    const res = classifyProduct({ ean: r.ean, brand: r.brand, name: r.name, category: r.category, ingredientsText: r.ingredients_text });
    if (res) hits++;
  }
  console.log(`\nEstimation couverture (500 produits aléatoires) : ${hits}/500 (${(hits / 5).toFixed(1)}%)`);
}

run().catch(console.error);
