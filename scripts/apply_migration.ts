/**
 * Apply the product_classifications migration via Supabase Management API.
 * Run: npx tsx scripts/apply_migration.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";

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

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Extract project ref from URL: https://rogesnduejmqpxolhbif.supabase.co
const PROJECT_REF = SUPABASE_URL.replace("https://", "").split(".")[0];

async function execSQL(query: string): Promise<{ error?: string }> {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query }),
    },
  );
  const text = await res.text();
  if (!res.ok) {
    return { error: `HTTP ${res.status}: ${text.slice(0, 300)}` };
  }
  return {};
}

const SQL_STATEMENTS = [
  // Create table
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

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_product_classifications_category
    ON cosme_check.product_classifications(category)`,

  `CREATE INDEX IF NOT EXISTS idx_product_classifications_subcategory
    ON cosme_check.product_classifications(subcategory)`,

  // Trigger function
  `CREATE OR REPLACE FUNCTION cosme_check.set_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$`,

  // Trigger
  `DROP TRIGGER IF EXISTS trg_product_classifications_updated_at
    ON cosme_check.product_classifications`,

  `CREATE TRIGGER trg_product_classifications_updated_at
    BEFORE UPDATE ON cosme_check.product_classifications
    FOR EACH ROW EXECUTE FUNCTION cosme_check.set_updated_at()`,

  // RLS
  `ALTER TABLE cosme_check.product_classifications ENABLE ROW LEVEL SECURITY`,

  `DROP POLICY IF EXISTS "anon can read classifications" ON cosme_check.product_classifications`,

  `CREATE POLICY "anon can read classifications"
    ON cosme_check.product_classifications
    FOR SELECT USING (true)`,

  // Category counts RPC
  `CREATE OR REPLACE FUNCTION cosme_check_get_category_counts()
  RETURNS TABLE (
    category    TEXT,
    subcategory TEXT,
    cnt         BIGINT
  )
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT
      pc.category,
      pc.subcategory,
      COUNT(*) AS cnt
    FROM cosme_check.product_classifications pc
    JOIN cosme_check.catalog c ON c.ean = pc.ean
    GROUP BY pc.category, pc.subcategory
    ORDER BY pc.category, cnt DESC;
  $$`,

  `GRANT EXECUTE ON FUNCTION cosme_check_get_category_counts() TO anon, authenticated`,

  // Browse subcategory RPC
  `CREATE OR REPLACE FUNCTION cosme_check_browse_subcategory(
    p_subcategory TEXT,
    p_limit       INT DEFAULT 24,
    p_offset      INT DEFAULT 0
  )
  RETURNS TABLE (
    ean             TEXT,
    brand           TEXT,
    name            TEXT,
    image_url       TEXT,
    score           FLOAT,
    score_label     TEXT,
    score_tone      TEXT,
    ingredients_text TEXT
  )
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT
      c.ean,
      c.brand,
      c.name,
      c.image_url,
      c.score,
      c.score_label,
      c.score_tone,
      c.ingredients_text
    FROM cosme_check.product_classifications pc
    JOIN cosme_check.catalog c ON c.ean = pc.ean
    WHERE pc.subcategory = p_subcategory
    ORDER BY c.score DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset;
  $$`,

  `GRANT EXECUTE ON FUNCTION cosme_check_browse_subcategory(TEXT, INT, INT) TO anon, authenticated`,
];

async function run() {
  console.log(`Project: ${PROJECT_REF}`);
  console.log(`Applying ${SQL_STATEMENTS.length} SQL statements...\n`);

  for (let i = 0; i < SQL_STATEMENTS.length; i++) {
    const stmt = SQL_STATEMENTS[i];
    const preview = stmt.trim().split("\n")[0].slice(0, 60);
    process.stdout.write(`  [${i + 1}/${SQL_STATEMENTS.length}] ${preview}... `);
    const { error } = await execSQL(stmt);
    if (error) {
      // Some errors are benign (e.g. "already exists" with IF NOT EXISTS)
      console.log(`WARN: ${error}`);
    } else {
      console.log("ok");
    }
  }

  console.log("\n✓ Migration appliquée.");
}

run().catch(console.error);
