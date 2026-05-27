/**
 * Diagnostic: état de la colonne `category` dans cosme_check.catalog
 *
 * Montre :
 *   1. Total de produits dans le catalog
 *   2. Combien ont une category non-nulle
 *   3. Distribution des catégories OBF (top 30)
 *   4. Exemples de valeurs pour comprendre le format
 *
 * Run: npx tsx scripts/diagnose_categories.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
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

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

async function run() {
  // 1. Total
  const { count: total } = await sb
    .schema("cosme_check")
    .from("catalog")
    .select("*", { count: "exact", head: true });

  // 2. With category
  const { count: withCat } = await sb
    .schema("cosme_check")
    .from("catalog")
    .select("*", { count: "exact", head: true })
    .not("category", "is", null)
    .neq("category", "");

  // 3. With INCI
  const { count: withInci } = await sb
    .schema("cosme_check")
    .from("catalog")
    .select("*", { count: "exact", head: true })
    .not("ingredients_text", "is", null)
    .neq("ingredients_text", "");

  // 4. Both category AND INCI
  const { count: withBoth } = await sb
    .schema("cosme_check")
    .from("catalog")
    .select("*", { count: "exact", head: true })
    .not("category", "is", null)
    .neq("category", "")
    .not("ingredients_text", "is", null)
    .neq("ingredients_text", "");

  console.log("=== CATALOG STATS ===");
  console.log(`Total produits       : ${total?.toLocaleString()}`);
  console.log(`Avec category        : ${withCat?.toLocaleString()} (${pct(withCat, total)}%)`);
  console.log(`Avec INCI            : ${withInci?.toLocaleString()} (${pct(withInci, total)}%)`);
  console.log(`Avec category + INCI : ${withBoth?.toLocaleString()} (${pct(withBoth, total)}%)`);

  // 5. All distinct categories with real counts via raw SQL
  console.log("\n=== TOUTES LES CATÉGORIES OBF (counts réels) ===");
  const { data: catCounts, error: catErr } = await sb.rpc(
    "cosme_check_exec_sql" as never,
    {
      sql: `
        SELECT category, COUNT(*)::int AS cnt
        FROM cosme_check.catalog
        WHERE category IS NOT NULL AND category <> ''
        GROUP BY category
        ORDER BY cnt DESC
      `,
    } as never,
  );

  if (catErr || !catCounts) {
    // Fallback: paginate manually
    console.log("  (RPC non dispo, pagination manuelle...)");
    let page = 0;
    const freq: Record<string, number> = {};
    while (true) {
      const { data } = await sb
        .schema("cosme_check")
        .from("catalog")
        .select("category")
        .not("category", "is", null)
        .neq("category", "")
        .range(page * 1000, page * 1000 + 999);
      if (!data || data.length === 0) break;
      for (const r of data) {
        const cat = (r.category as string).trim();
        freq[cat] = (freq[cat] ?? 0) + 1;
      }
      page++;
      if (data.length < 1000) break;
    }
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    for (const [cat, count] of sorted) {
      console.log(`  ${String(count).padStart(6)}  ${cat}`);
    }
    console.log(`\n  Total catégories distinctes : ${Object.keys(freq).length}`);
  } else {
    for (const row of catCounts as Array<{ category: string; cnt: number }>) {
      console.log(`  ${String(row.cnt).padStart(6)}  ${row.category}`);
    }
    console.log(`\n  Total : ${(catCounts as Array<unknown>).length} catégories`);
  }

  // 7. Score stats
  const { count: withScore } = await sb
    .schema("cosme_check")
    .from("catalog")
    .select("*", { count: "exact", head: true })
    .not("score", "is", null);

  console.log(`\n=== SCORES ===`);
  console.log(`Produits avec score  : ${withScore?.toLocaleString()} (${pct(withScore, total)}%)`);
}

function pct(a: number | null | undefined, b: number | null | undefined): string {
  if (!a || !b) return "0";
  return ((a / b) * 100).toFixed(1);
}

run().catch(console.error);
