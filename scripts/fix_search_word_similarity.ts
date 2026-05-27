/**
 * Fix cosme_check_search_catalog to use word_similarity instead of similarity.
 * word_similarity(query, text) finds the best matching substring → position-independent.
 * Run: npx tsx scripts/fix_search_word_similarity.ts
 */

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

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
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
  if (!res.ok) return { error: `HTTP ${res.status}: ${text.slice(0, 300)}` };
  return {};
}

const SQL = `
CREATE OR REPLACE FUNCTION cosme_check_search_catalog(
  p_query TEXT,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  ean              TEXT,
  brand            TEXT,
  name             TEXT,
  category         TEXT,
  image_url        TEXT,
  source_url       TEXT,
  score            REAL,
  score_label      TEXT,
  score_tone       TEXT,
  count_total      INT,
  ingredients_text TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = cosme_check, public
AS $$
  SELECT
    c.ean, c.brand, c.name, c.category,
    c.image_url, c.source_url,
    c.score, c.score_label, c.score_tone,
    c.count_total, c.ingredients_text
  FROM cosme_check.catalog c
  WHERE
    (COALESCE(c.brand, '') || ' ' || c.name)
      ILIKE '%' || p_query || '%'
  ORDER BY
    word_similarity(p_query, COALESCE(c.brand, '') || ' ' || c.name) DESC,
    c.score DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION cosme_check_search_catalog(TEXT, INT)
  TO anon, authenticated;
`;

async function run() {
  console.log(`Project: ${PROJECT_REF}`);
  process.stdout.write("Applying word_similarity fix... ");
  const { error } = await execSQL(SQL);
  if (error) {
    console.log(`ERROR: ${error}`);
    process.exit(1);
  }
  console.log("ok");
  console.log("\n✓ Recherche insensible à la position.");
}

run().catch(console.error);
