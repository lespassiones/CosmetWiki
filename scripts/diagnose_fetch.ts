/**
 * Throwaway diagnostic: hit each failing URL with the same browser headers
 * the scraper uses and print the raw response (status, headers, body
 * prefix). Helps us understand WHY they were rejected.
 */

const URLS = [
  "https://www.sephora.fr/p/reve-de-miel---baume-levres-ultra-nourrissant-P3658001.html",
  "https://www.laroche-posay.us/effaclar-duo-acne-spot-treatment-effaclarduoacnespottreatment.html",
  "https://www.aroma-zone.com/info/fiche-technique/shampooing-solide-bio-nourrissant-reparateur",
  "https://us.typology.com/products/vitamin-c-serum/",
  // Comparison: a working one
  "https://www.cattier-paris.com/fr/mini-masque-a-l-argile-verte-peaux-grasses.html",
];

const HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Upgrade-Insecure-Requests": "1",
};

async function probe(url: string): Promise<void> {
  const t0 = Date.now();
  console.log("\n" + "─".repeat(70));
  console.log(url);
  try {
    const r = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(10_000),
      redirect: "follow",
    });
    const ms = Date.now() - t0;
    console.log(`  status: ${r.status} ${r.statusText}  (${ms}ms)`);
    console.log(`  final url: ${r.url}`);
    console.log(`  server: ${r.headers.get("server") ?? "—"}`);
    console.log(`  cf-mitigated: ${r.headers.get("cf-mitigated") ?? "—"}`);
    console.log(`  cf-ray: ${r.headers.get("cf-ray") ?? "—"}`);
    console.log(`  set-cookie: ${(r.headers.get("set-cookie") ?? "").slice(0, 100) || "—"}`);
    console.log(`  content-type: ${r.headers.get("content-type") ?? "—"}`);
    console.log(`  content-length: ${r.headers.get("content-length") ?? "—"}`);
    if (r.ok) {
      const text = await r.text();
      console.log(`  body length: ${text.length}`);
      console.log(`  body head (200): ${text.slice(0, 200).replace(/\s+/g, " ")}`);
    } else {
      const text = await r.text().catch(() => "");
      console.log(`  body head (300): ${text.slice(0, 300).replace(/\s+/g, " ")}`);
    }
  } catch (e) {
    const ms = Date.now() - t0;
    console.log(`  EXCEPTION: ${e instanceof Error ? e.message : String(e)}  (${ms}ms)`);
  }
}

async function main(): Promise<void> {
  for (const u of URLS) await probe(u);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
