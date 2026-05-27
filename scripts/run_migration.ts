/**
 * Apply the product_classifications migration to Supabase.
 * Run: npx tsx scripts/run_migration.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

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

// Execute each statement separately (Supabase REST doesn't support multi-statement)
const statements = [
  `CREATE TABLE IF NOT EXISTS cosme_check.product_classifications (
    ean              TEXT        NOT NULL PRIMARY KEY
                                 REFERENCES cosme_check.catalog(ean)
                                 ON DELETE CASCADE,
    category         TEXT        NOT NULL,
    subcategory      TEXT        NOT NULL,
    method           TEXT        NOT NULL DEFAULT 'obf',
    confidence       FLOAT       NOT NULL DEFAULT 0.95,
    gpt_verified     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_product_classifications_category
    ON cosme_check.product_classifications(category)`,
  `CREATE INDEX IF NOT EXISTS idx_product_classifications_subcategory
    ON cosme_check.product_classifications(subcategory)`,
];

async function run() {
  // Try via rpc exec (if available), otherwise show instructions
  for (const sql of statements) {
    const { error } = await (sb as unknown as { rpc: (fn: string, args: { sql: string }) => Promise<{ error: unknown }> })
      .rpc("exec_sql", { sql }) as { error: { message: string } | null };
    if (error) {
      console.log("RPC exec_sql not available. Please run this SQL in Supabase dashboard:");
      console.log("\n" + "─".repeat(60));
      const fullSql = readFileSync(
        resolve(process.cwd(), "supabase/migrations/20260527_product_classifications.sql"),
        "utf-8"
      );
      console.log(fullSql);
      console.log("─".repeat(60));
      console.log("\nAfter running the SQL, run: npx tsx scripts/classify_catalog_bulk.ts --insert");
      process.exit(0);
    }
  }
  console.log("Migration applied successfully.");
}

run().catch(console.error);
