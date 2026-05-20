// Probe direct des RPCs prod pour mesurer leur latence réelle après upgrade Pro.
// Usage : node scripts/probe-supabase.mjs
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

async function time(label, fn) {
  const t0 = Date.now();
  try {
    const r = await fn();
    const dt = Date.now() - t0;
    const ok = !r?.error;
    const rows = Array.isArray(r?.data) ? r.data.length : r?.data ? 1 : 0;
    console.log(
      `${ok ? "OK " : "ERR"}  ${dt.toString().padStart(5)} ms  ${label.padEnd(45)} ${
        ok ? `(${rows} rows)` : `← ${r.error.message?.slice(0, 80)}`
      }`,
    );
    return r;
  } catch (err) {
    const dt = Date.now() - t0;
    console.log(`ERR  ${dt.toString().padStart(5)} ms  ${label.padEnd(45)} ← ${err.message?.slice(0, 80)}`);
  }
}

console.log("=== Probe des RPCs Cosme-Check ===\n");

// Run each twice : first hit = cold, second = warm.
for (let i = 1; i <= 2; i++) {
  console.log(`\n--- Run ${i} ---`);
  await time("cosme_check_letter_counts (no args)", () =>
    sb.rpc("cosme_check_letter_counts"),
  );
  await time("cosme_check_list_ingredients_by_letter (F)", () =>
    sb.rpc("cosme_check_list_ingredients_by_letter", { p_letter: "F" }),
  );
  await time("cosme_check_list_ingredients_by_letter (A)", () =>
    sb.rpc("cosme_check_list_ingredients_by_letter", { p_letter: "A" }),
  );
  await time("cosme_check_get_ingredient (glycerin)", () =>
    sb.rpc("cosme_check_get_ingredient", { p_slug: "glycerin" }),
  );
  await time("SELECT user_credits count (health check)", () =>
    sb.schema("cosme_check").from("user_credits").select("user_id", { count: "exact", head: true }).limit(1),
  );
}
