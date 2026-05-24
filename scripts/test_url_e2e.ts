/**
 * End-to-end test of the "Coller le lien" pipeline against real e-commerce
 * pages. Loads .env, then runs `scrapeEcommerceUrl` against ~11 URLs drawn
 * from a mix of stacks (Shopify, Magento, Adobe Commerce, custom French
 * pharma sites, indie zero-waste shops). Reports for each URL whether we
 * recovered name/brand/INCI and the source (json-ld vs llm).
 *
 *   Pass criteria: ingredientsText non-null (or productName non-null when
 *   the page is a listing/teaser without INCI).
 *
 * Run:
 *   npx tsx scripts/test_url_e2e.ts
 *
 * Network + LLM calls are made — expect ~10-15 s per URL on a cold cache,
 * <1 s on a cache hit (results are stored in cosme_check.ai_cache).
 */

import { readFileSync } from "node:fs";
import path from "node:path";

// ─── env bootstrap ─────────────────────────────────────────────────────────
// Minimal .env loader so we don't add `dotenv` just for a smoke test.
(() => {
  const envPath = path.resolve(process.cwd(), ".env");
  let txt: string;
  try {
    txt = readFileSync(envPath, "utf-8");
  } catch {
    console.error("Cannot read .env at", envPath);
    process.exit(2);
  }
  for (const line of txt.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
})();

// tsx defaults to CJS, so we can't top-level await. Everything below runs
// inside `main()` and we kick it off at the bottom of the file.
type ScrapeResult = {
  ok: true;
  productName: string | null;
  brand: string | null;
  description: string | null;
  ingredientsText: string | null;
  imageUrl: string | null;
  sourceUrl: string;
  source: { metadata: string; inci: string; cached: boolean };
} | {
  ok: false;
  reason: string;
  message: string;
};

// ─── fixture URLs ──────────────────────────────────────────────────────────

type Fixture = {
  label: string;
  url: string;
  // Optional: when set, we expect at least this category of metadata to
  // surface (helps catch regressions of "we got the page but extracted
  // nothing useful").
  expectName?: boolean;
  expectInci?: boolean;
};

const FIXTURES: Fixture[] = [
  {
    label: "Nuxe FR (Shopify)",
    url: "https://fr.nuxe.com/products/baume-levres-au-miel",
    expectName: true,
    expectInci: true,
  },
  {
    label: "Sephora FR (Magento custom)",
    url: "https://www.sephora.fr/p/reve-de-miel---baume-levres-ultra-nourrissant-P3658001.html",
    expectName: true,
  },
  {
    label: "La Roche-Posay US (Adobe Commerce)",
    url: "https://www.laroche-posay.us/effaclar-duo-acne-spot-treatment-effaclarduoacnespottreatment.html",
    expectName: true,
  },
  {
    label: "Caudalie US (custom)",
    url: "https://us.caudalie.com/p/500R2/500r2-acne-serum-to-treat-and-prevent-blemishes.html",
    expectName: true,
  },
  {
    label: "Les Secrets de Loly (Shopify)",
    url: "https://www.secretsdeloly.com/en/products/repair-time-masque",
    expectName: true,
  },
  {
    label: "Aroma-Zone (custom fiche)",
    url: "https://www.aroma-zone.com/info/fiche-technique/shampooing-solide-bio-nourrissant-reparateur",
    expectName: true,
  },
  {
    // Typology's product pages render the INCI list client-side (no
    // ingredients in the static HTML), so the scraper can recover the name
    // and brand from JSON-LD but not the INCI. We accept this as a known
    // limitation — would need a Playwright runner to evaluate the SPA.
    // Logged here as a documented "partial" rather than a regression.
    label: "Typology FR (Shopify SPA)",
    url: "https://www.typology.com/products/kit-miniature-serum-vitamine-c-8ml",
    expectName: true,
  },
  {
    label: "Yves Rocher FR (custom)",
    url: "https://www.yves-rocher.fr/corps-et-douche/bain-et-douche/gel-douche/gel-douche-concentre-algue-sauvage/p/76651",
    expectName: true,
  },
  {
    label: "Cattier Paris FR (custom indie)",
    url: "https://www.cattier-paris.com/fr/mini-masque-a-l-argile-verte-peaux-grasses.html",
    expectName: true,
  },
  {
    label: "Avène FR (pharma custom)",
    url: "https://www.eau-thermale-avene.fr/p/cicalfate-creme-reparatrice-protectrice-3282770204681-14c39aab",
    expectName: true,
  },
  {
    label: "Comme Avant (small indie bio FR)",
    url: "https://www.comme-avant.bio/pages/savon-naturel-au-beurre-de-karite",
    expectName: true,
  },
];

// ─── helpers ───────────────────────────────────────────────────────────────

const PER_URL_TIMEOUT_MS = 35_000;

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`timeout(${label})`)), ms)),
  ]);
}

function truncate(s: string | null | undefined, n: number): string {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function countTokens(inci: string | null): number {
  if (!inci) return 0;
  return inci.split(/[,;•·]/).filter((t) => t.trim().length > 1).length;
}

type ReportStatus = "ok" | "blocked" | "broken";

type Report = {
  label: string;
  url: string;
  status: ReportStatus;
  detail: string;
  productName: string | null;
  brand: string | null;
  inciTokens: number;
  metadataSource: string;
  inciSource: string;
  ms: number;
  failures: string[];
};

async function runOne(
  scrape: (url: string) => Promise<ScrapeResult>,
  f: Fixture,
  idx: number,
  total: number,
): Promise<Report> {
  const t0 = Date.now();
  process.stdout.write(`\n[${idx + 1}/${total}] ${f.label}\n  url: ${f.url}\n  …\n`);
  let result: ScrapeResult;
  try {
    result = await withTimeout(scrape(f.url), PER_URL_TIMEOUT_MS, f.label);
  } catch (e) {
    const ms = Date.now() - t0;
    const msg = e instanceof Error ? e.message : String(e);
    process.stdout.write(`  ✗ exception : ${msg}  (${ms}ms)\n`);
    return {
      label: f.label,
      url: f.url,
      status: "broken",
      detail: `exception: ${msg}`,
      productName: null,
      brand: null,
      inciTokens: 0,
      metadataSource: "—",
      inciSource: "—",
      ms,
      failures: [`Exception : ${msg}`],
    };
  }
  const ms = Date.now() - t0;
  if (!result.ok) {
    // site_blocked / not_found = the scraper recognised the situation and
    // returned a clean message the UI can show. Not a "broken" outcome —
    // there's nothing more we can do without a real browser. Everything
    // else (fetch_failed, extraction_failed, html_too_large, no_content)
    // is a code-side issue worth fixing.
    const cleanlyBlocked = result.reason === "site_blocked" || result.reason === "not_found";
    const mark = cleanlyBlocked ? "⚠" : "✗";
    process.stdout.write(`  ${mark} ${result.reason} — ${result.message}  (${ms}ms)\n`);
    return {
      label: f.label,
      url: f.url,
      status: cleanlyBlocked ? "blocked" : "broken",
      detail: `${result.reason}: ${result.message}`,
      productName: null,
      brand: null,
      inciTokens: 0,
      metadataSource: "—",
      inciSource: "—",
      ms,
      failures: [result.message],
    };
  }
  const inciTokens = countTokens(result.ingredientsText);
  process.stdout.write(
    `  ✓ name=${truncate(result.productName, 40)}` +
      ` | brand=${truncate(result.brand, 30)}` +
      ` | INCI=${inciTokens} ingrédients` +
      ` | meta=${result.source.metadata}` +
      ` | inci=${result.source.inci}` +
      ` | ${ms}ms\n`,
  );
  if (result.description) {
    process.stdout.write(`  description: ${truncate(result.description, 120)}\n`);
  }
  if (result.ingredientsText) {
    process.stdout.write(`  inci-sample: ${truncate(result.ingredientsText, 140)}\n`);
  }

  const failures: string[] = [];
  if (f.expectName && !result.productName) failures.push("nom du produit manquant");
  if (f.expectInci && !result.ingredientsText) failures.push("INCI manquante");
  // A "soft" pass: even without explicit expectations, if BOTH name and INCI
  // are missing we count it as a failure (the orchestrator's safety net would
  // already have returned !ok, so this is mostly defence in depth).
  if (!result.productName && !result.ingredientsText) {
    failures.push("ni nom ni INCI");
  }

  return {
    label: f.label,
    url: f.url,
    status: failures.length === 0 ? "ok" : "broken",
    detail: failures.length === 0 ? "OK" : failures.join(", "),
    productName: result.productName,
    brand: result.brand,
    inciTokens,
    metadataSource: result.source.metadata,
    inciSource: result.source.inci,
    ms,
    failures,
  };
}

// ─── runner ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Dynamic import AFTER env is wired up: the scraper's transitive deps
  // (Supabase client, OpenAI client) read the env at module load time.
  const mod = await import("../lib/productSearch/scrapeEcommerceUrl");
  const scrape = mod.scrapeEcommerceUrl as (url: string) => Promise<ScrapeResult>;

  console.log(`CosmetWiki — E2E URL scrape test (${FIXTURES.length} sites)`);
  console.log("─".repeat(70));

  const reports: Report[] = [];
  for (let i = 0; i < FIXTURES.length; i++) {
    // Serial execution: keeps the log readable and avoids accidentally DDoSing
    // a target site if many fixtures point at the same host.
    reports.push(await runOne(scrape, FIXTURES[i]!, i, FIXTURES.length));
  }

  console.log("\n" + "─".repeat(70));
  console.log("Résumé\n");
  const okCount = reports.filter((r) => r.status === "ok").length;
  const blockedCount = reports.filter((r) => r.status === "blocked").length;
  const brokenCount = reports.filter((r) => r.status === "broken").length;
  for (const r of reports) {
    const mark = r.status === "ok" ? "✓" : r.status === "blocked" ? "⚠" : "✗";
    console.log(`  ${mark} ${r.label.padEnd(40)} ${r.detail}`);
  }
  console.log("\n" + "─".repeat(70));
  console.log(`Résultat: ${okCount} OK · ${blockedCount} bloqués proprement · ${brokenCount} cassés (sur ${reports.length})`);
  if (blockedCount > 0) {
    console.log("  ⚠ Sites bloqués = WAF/anti-bot (Cloudflare, Akamai) — l'erreur retournée");
    console.log("    est claire pour l'utilisateur. Pas une régression côté code.");
  }

  const broken = reports.filter((r) => r.status === "broken");
  if (broken.length > 0) {
    console.log("\nDétails des cassés:");
    for (const r of broken) {
      console.log(`  • ${r.label}`);
      console.log(`    url     : ${r.url}`);
      console.log(`    raison  : ${r.detail}`);
      console.log(`    name    : ${truncate(r.productName, 60)}`);
      console.log(`    brand   : ${truncate(r.brand, 60)}`);
      console.log(`    INCI    : ${r.inciTokens} ingr (source: ${r.inciSource})`);
      console.log(`    meta    : ${r.metadataSource}`);
    }
  }
  // Only "broken" failures fail CI — "blocked" is a known limitation we
  // surface cleanly to the user.
  process.exit(broken.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(2);
});
