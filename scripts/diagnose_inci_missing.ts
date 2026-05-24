/**
 * Throwaway diagnostic: fetch the pages where we recovered name/brand but
 * NOT INCI, and check whether the ingredient list is physically present in
 * the static HTML or rendered client-side (in which case nothing short of
 * Playwright can rescue it).
 */

const URLS = [
  "https://www.typology.com/products/kit-miniature-serum-vitamine-c-8ml",
  "https://www.eau-thermale-avene.fr/p/cicalfate-creme-reparatrice-protectrice-3282770204681-14c39aab",
];

const HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
};

async function probe(url: string): Promise<void> {
  console.log("\n" + "─".repeat(70));
  console.log(url);
  const r = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(15_000),
    redirect: "follow",
  });
  const html = await r.text();
  console.log(`  status=${r.status} length=${html.length}`);

  // Quick keyword sniff.
  for (const kw of ["ingredient", "composition", "inci", "aqua", "ingrédients", "Liste"]) {
    const re = new RegExp(kw, "gi");
    const matches = [...html.matchAll(re)];
    if (matches.length > 0) {
      const first = matches[0]!;
      const start = Math.max(0, (first.index ?? 0) - 60);
      const sample = html
        .slice(start, (first.index ?? 0) + 200)
        .replace(/\s+/g, " ");
      console.log(`  "${kw}": ${matches.length} hits — sample: ${sample.slice(0, 240)}`);
    } else {
      console.log(`  "${kw}": 0 hits`);
    }
  }

  // Try to find a JSON-LD with ingredients?
  const ld = html.match(/<script[^>]+ld\+json[^>]*>([\s\S]*?)<\/script>/gi);
  if (ld && ld.length > 0) {
    console.log(`  JSON-LD blocks: ${ld.length}`);
    for (const block of ld.slice(0, 3)) {
      const body = block.replace(/<\/?script[^>]*>/gi, "").trim();
      console.log(`    head: ${body.slice(0, 200).replace(/\s+/g, " ")}`);
    }
  } else {
    console.log("  JSON-LD blocks: 0");
  }

  // Look for AQUA-like INCI tokens anywhere
  const inciMatches = html.match(/\bAQUA\b[^,]*,[^,]*,[^,]*,/g);
  if (inciMatches) {
    console.log(`  AQUA-style sequences: ${inciMatches.length}`);
    console.log(`    first: ${inciMatches[0]!.slice(0, 200)}`);
  } else {
    console.log("  AQUA-style sequences: 0");
  }
}

async function main(): Promise<void> {
  for (const u of URLS) await probe(u);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
