/**
 * Direct test of the post-OCR INCI validation against the DB. Hits the same
 * RPC the analyser uses (`cosme_check_match_inci_batch`).
 */
import path from "node:path";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const envText = await readFile(path.resolve(process.cwd(), ".env"), "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } },
);

const samples = [
  { label: "Yves Rocher (P1 output)", text: "AQUA, GLYCERIN, CETYL ALCOHOL, BRASSICA CAMPESTRIS SEED OIL, HYDROLYZED STARCH PHOSPHATE, ACETIC ACID, ACETYLDIETHYLENEDIAMINE, CITRIC ACID, XANTHAN GUM, SODIUM BENZOATE, POTASSIUM SORBATE" },
  { label: "Dove face avant (P1 output)", text: "AQUA, COCOGLUCOSIDE, LAURYL GLUCOSIDE, SODIUM LAURYL SULFATE, SODIUM COCO-SULFATE, GLYCERYL OLEATE, SODIUM CHLORIDE, CITRIC ACID, SODIUM BENZOATE, POTASSIUM SORBATE, PARFUM, TOCOPHEROL" },
  { label: "Evoluderm (P1 output)", text: "AQUA, GLYCERIN, BRASSICA CAMPESTRIS (CANOLA) SEED OIL, ISOPROPYL MYRISTATE, PRUNUS AMYGDALUS DULCIS (SWEET ALMOND) OIL, FRAGRANCE, XANTHAN GUM, CHLORELLA VULGARIS EXTRACT, SODIUM HYDROXIDE, POTASSIUM SORBATE, CITRIC ACID" },
  { label: "Garbage", text: "BLAH BLAH BLAH, FOO BAR, MILK BALSAM HOITOAINE" },
];

function tokenize(text) {
  return text
    .split(/[,;]/)
    .map((t) => t.trim().toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, ""))
    .filter((t) => t.length > 1);
}

for (const { label, text } of samples) {
  const tokens = tokenize(text);
  const { data, error } = await sb.rpc("cosme_check_match_inci_batch", { p_tokens: tokens });
  if (error) {
    console.log(`${label}: RPC error -> ${error.message}`);
    continue;
  }
  const rows = data ?? [];
  const exact = rows.filter((r) => r.match_kind === "exact").length;
  const alias = rows.filter((r) => r.match_kind === "alias").length;
  const fuzzy = rows.filter((r) => r.match_kind === "fuzzy_high").length;
  const sugg = rows.filter((r) => r.match_kind === "suggestion").length;
  const none = rows.filter((r) => r.match_kind === null).length;
  const matched = exact + alias;
  const rate = matched / tokens.length;
  console.log(`\n=== ${label} ===`);
  console.log(`tokens=${tokens.length}  exact=${exact} alias=${alias} fuzzy_high=${fuzzy} suggestion=${sugg} none=${none}`);
  console.log(`matched=${matched}/${tokens.length} (${(rate * 100).toFixed(0)}%) ${rate >= 0.7 ? "OK" : rate >= 0.3 ? "WARN" : "BAD"}`);
  const unmatched = rows
    .map((r, i) => ({ r, t: tokens[i] }))
    .filter(({ r }) => r.match_kind !== "exact" && r.match_kind !== "alias")
    .map(({ r, t }) => `${t}(${r.match_kind ?? "none"})`);
  if (unmatched.length) console.log(`unmatched: ${unmatched.join(", ")}`);
}
