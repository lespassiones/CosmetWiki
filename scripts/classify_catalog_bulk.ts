/**
 * Bulk classify all catalog products and upsert into product_classifications.
 *
 * Usage:
 *   npx tsx scripts/classify_catalog_bulk.ts          → dry-run, shows stats only
 *   npx tsx scripts/classify_catalog_bulk.ts --insert  → classifies + inserts into DB
 *
 * The script paginates the full catalog (48k products) in batches of 1000,
 * classifies each using the rule-based engine, and either shows distribution
 * stats (dry-run) or upserts the results into cosme_check.product_classifications.
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

const INSERT_MODE = process.argv.includes("--insert");
const BATCH_SIZE = 1000;
const INSERT_BATCH = 500;

type ProductRow = {
  ean: string;
  brand: string | null;
  name: string;
  category: string | null;
  ingredients_text: string | null;
};

async function run() {
  console.log(`Mode: ${INSERT_MODE ? "INSERT" : "DRY-RUN (stats only)"}\n`);

  let offset = 0;
  let totalProcessed = 0;
  let totalClassified = 0;
  let totalUnclassified = 0;

  const subcategoryCounts: Record<string, number> = {};
  const methodCounts: Record<string, number> = {};
  const unclassifiedSamples: string[] = [];

  const toInsert: Array<{
    ean: string;
    category: string;
    subcategory: string;
    method: string;
    confidence: number;
  }> = [];

  while (true) {
    const { data, error } = await sb
      .schema("cosme_check")
      .from("catalog")
      .select("ean, brand, name, category, ingredients_text")
      .range(offset, offset + BATCH_SIZE - 1)
      .order("ean");

    if (error) {
      console.error("DB error:", error.message);
      break;
    }
    if (!data || data.length === 0) break;

    for (const r of data as ProductRow[]) {
      const res = classifyProduct({
        ean: r.ean,
        brand: r.brand,
        name: r.name,
        category: r.category,
        ingredientsText: r.ingredients_text,
      });

      totalProcessed++;

      if (res) {
        totalClassified++;
        subcategoryCounts[res.subcategory] = (subcategoryCounts[res.subcategory] ?? 0) + 1;
        methodCounts[res.method] = (methodCounts[res.method] ?? 0) + 1;

        if (INSERT_MODE) {
          toInsert.push({
            ean: r.ean,
            category: res.category,
            subcategory: res.subcategory,
            method: res.method,
            confidence: res.confidence,
          });
        }
      } else {
        totalUnclassified++;
        if (unclassifiedSamples.length < 30) {
          unclassifiedSamples.push(`  ${r.brand ?? "?"} — ${r.name.slice(0, 60)} [OBF: ${r.category ?? "none"}]`);
        }
      }
    }

    // Flush inserts in batches
    if (INSERT_MODE && toInsert.length >= INSERT_BATCH) {
      await flushInserts(toInsert.splice(0, INSERT_BATCH));
      process.stdout.write(`\r  Processed ${totalProcessed} / ~48000 (classified: ${totalClassified})...`);
    }

    offset += BATCH_SIZE;
    if (!INSERT_MODE) {
      process.stdout.write(`\r  Processed ${totalProcessed}...`);
    }
    if (data.length < BATCH_SIZE) break;
  }

  // Final flush
  if (INSERT_MODE && toInsert.length > 0) {
    await flushInserts(toInsert);
  }

  console.log("\n\n=== RÉSULTATS ===");
  console.log(`Total produits traités : ${totalProcessed.toLocaleString()}`);
  console.log(`Classifiés             : ${totalClassified.toLocaleString()} (${pct(totalClassified, totalProcessed)}%)`);
  console.log(`Non classifiés         : ${totalUnclassified.toLocaleString()} (${pct(totalUnclassified, totalProcessed)}%)`);

  console.log("\n=== PAR MÉTHODE ===");
  for (const [method, count] of Object.entries(methodCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${method.padEnd(15)} : ${count.toLocaleString()} (${pct(count, totalClassified)}%)`);
  }

  console.log("\n=== PAR SOUS-CATÉGORIE (top 40) ===");
  const sorted = Object.entries(subcategoryCounts).sort((a, b) => b[1] - a[1]);
  for (const [sub, count] of sorted.slice(0, 40)) {
    console.log(`  ${String(count).padStart(6)}  ${sub}`);
  }

  if (unclassifiedSamples.length > 0) {
    console.log("\n=== ÉCHANTILLON NON CLASSIFIÉS ===");
    for (const s of unclassifiedSamples) console.log(s);
  }

  if (INSERT_MODE) {
    console.log("\n✓ Upsert terminé dans cosme_check.product_classifications");
  } else {
    console.log("\n→ Lance avec --insert pour insérer en base de données");
  }
}

async function flushInserts(rows: Array<{
  ean: string; category: string; subcategory: string; method: string; confidence: number;
}>) {
  const { error } = await sb
    .schema("cosme_check")
    .from("product_classifications")
    .upsert(rows, { onConflict: "ean" });
  if (error) {
    console.error("\nInsert error:", error.message);
  }
}

function pct(a: number, b: number): string {
  if (!b) return "0";
  return ((a / b) * 100).toFixed(1);
}

run().catch(console.error);
