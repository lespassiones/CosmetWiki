/**
 * End-to-end OCR pipeline smoke test.
 *
 * For each image in DOWNLOADS_DIR matching the WhatsApp pattern, POSTs it to
 * /api/ocr, then pipes the extracted text into /api/analyser. Prints a
 * compact report so we can eyeball OCR fidelity and the score the analyser
 * assigns. Sequential (not parallel) to respect the rate limits
 * (5/min analyser, 10/min OCR).
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR
  ?? path.join(process.env.USERPROFILE ?? process.env.HOME ?? "", "Downloads");
const PATTERN = /^WhatsApp Image 2026-05-12 at 22\.54\.3[3-7]\.jpeg$/;

function summarizeItems(items) {
  const counts = { Vert: 0, Jaune: 0, Orange: 0, Rouge: 0, unknown: 0 };
  for (const it of items) {
    const k = it.colorRating ?? "unknown";
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
}

function topProblems(items, n = 5) {
  return items
    .filter((it) => it.colorRating === "Rouge" || it.colorRating === "Orange")
    .sort((a, b) => {
      if (a.colorRating !== b.colorRating) return a.colorRating === "Rouge" ? -1 : 1;
      return (a.position ?? 999) - (b.position ?? 999);
    })
    .slice(0, n)
    .map((it) => `${it.colorRating[0]} ${it.name ?? it.input}`);
}

async function runOne(file) {
  const filePath = path.join(DOWNLOADS_DIR, file);
  const buf = await readFile(filePath);
  console.log(`\n=== ${file} (${(buf.length / 1024).toFixed(0)} KB) ===`);

  // --- 1. OCR ---
  const t0 = Date.now();
  const form = new FormData();
  form.append("image", new Blob([buf], { type: "image/jpeg" }), file);
  let ocr;
  try {
    const r = await fetch(`${BASE}/api/ocr`, { method: "POST", body: form });
    ocr = await r.json();
    console.log(`OCR  status=${r.status}  in ${Date.now() - t0}ms`);
  } catch (e) {
    console.log(`OCR  FAILED  ${e.message}`);
    return;
  }
  if (!ocr.found) {
    console.log(`OCR  not-found  reason=${ocr.reason}`);
    return;
  }
  const text = String(ocr.text ?? "").trim();
  const uncertain = Array.isArray(ocr.uncertain) ? ocr.uncertain : [];
  console.log(`OCR  text (${text.length} chars):`);
  console.log(`     ${text.slice(0, 300)}${text.length > 300 ? "…" : ""}`);
  if (uncertain.length) console.log(`OCR  uncertain: ${uncertain.join(", ")}`);
  if (ocr.validation) {
    const v = ocr.validation;
    const flag = v.level === "ok" ? "OK" : v.level === "low_match" ? "WARN" : "BAD";
    console.log(`OCR  validation: [${flag}] ${v.matched}/${v.total} matched (${(v.rate * 100).toFixed(0)}%)  level=${v.level}`);
    if (v.message) console.log(`     -> ${v.message}`);
  } else {
    console.log(`OCR  validation: <missing>  ocr keys=${Object.keys(ocr).join(",")}`);
  }

  // --- 2. Analyser ---
  const t1 = Date.now();
  let ana;
  try {
    const r = await fetch(`${BASE}/api/analyser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, withSynthesis: false }),
    });
    ana = await r.json();
    console.log(`ANA  status=${r.status}  in ${Date.now() - t1}ms`);
  } catch (e) {
    console.log(`ANA  FAILED  ${e.message}`);
    return;
  }
  if (ana.error) {
    console.log(`ANA  error: ${ana.error}`);
    return;
  }

  const counts = ana.counts ?? summarizeItems(ana.items ?? []);
  console.log(
    `ANA  score=${ana.score?.toFixed?.(1) ?? "?"}/20 (${ana.scoreLabel})  total=${counts.total}  V=${counts.vert} J=${counts.jaune} O=${counts.orange} R=${counts.rouge} ?=${counts.unknown}`,
  );
  const problems = topProblems(ana.items ?? []);
  if (problems.length) console.log(`     Top problems: ${problems.join(" · ")}`);
}

const files = (await readdir(DOWNLOADS_DIR))
  .filter((f) => PATTERN.test(f))
  .sort();

console.log(`Found ${files.length} images in ${DOWNLOADS_DIR}`);
for (const f of files) {
  await runOne(f);
  // small gap to stay clear of the rate limit (5 analyser / min)
  await new Promise((r) => setTimeout(r, 1500));
}
console.log("\nDone.");
