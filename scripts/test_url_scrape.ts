/**
 * Ephemeral integration tests for the "Coller le lien" backend pieces.
 * Covers the pure functions that don't need network or LLM access:
 *
 *   - validateUserUrl     : SSRF / scheme / hostname checks
 *   - extractProductFromJsonLd : Schema.org Product extraction from raw HTML
 *
 * The orchestrator (`scrapeEcommerceUrl`) and the HTTP route are exercised
 * end-to-end against real shops at QA time; we don't hit live sites from a
 * smoke test because the assertions would be brittle (shops update markup).
 *
 * Run:
 *   npx tsx scripts/test_url_scrape.ts
 */

import { validateUserUrl } from "../lib/productSearch/validateUrl";
import { extractProductFromJsonLd } from "../lib/productSearch/extractJsonLd";

// ─── TAP-ish runner ────────────────────────────────────────────────────────

const failures: string[] = [];
let passCount = 0;

function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passCount++;
    process.stdout.write("  ✓ " + name + "\n");
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    process.stdout.write("  ✗ " + name + (detail ? " — " + detail : "") + "\n");
  }
}

// ─── validateUserUrl ───────────────────────────────────────────────────────

console.log("\n[validateUserUrl] — accepted public URLs");
for (const u of [
  "https://www.lessecretsdeloly.com/products/pink-paradise",
  "https://www.sephora.fr/p/something",
  "https://nuxe.com/fr/products/reve-de-miel",
  "http://example.com/path?query=1",
  "HTTPS://Example.COM/Path",
]) {
  const r = validateUserUrl(u);
  check(`accept ${u}`, r.ok, r.ok ? undefined : r.reason);
}

console.log("\n[validateUserUrl] — rejected: invalid schemes / malformed");
for (const [u, reasonHint] of [
  ["", "vide"],
  ["not-a-url", "invalide"],
  ["ftp://files.example.com/x", "http(s)"],
  ["javascript:alert(1)", "http(s)"],
  ["file:///etc/passwd", "http(s)"],
  // "https://" parses but new URL() in V8 throws — we hit the generic
  // "URL invalide" branch, not "Domaine manquant". Both are acceptable
  // rejections; we just assert that the URL is rejected.
  ["https://", "invalide"],
  ["a".repeat(3000), "trop longue"],
] as Array<[string, string]>) {
  const r = validateUserUrl(u);
  check(`reject "${u.slice(0, 40)}${u.length > 40 ? "…" : ""}"`, !r.ok, r.ok ? "should have failed" : undefined);
  if (!r.ok) {
    check(`  reason mentions "${reasonHint}"`, r.reason.toLowerCase().includes(reasonHint.toLowerCase()), `got: "${r.reason}"`);
  }
}

console.log("\n[validateUserUrl] — rejected: SSRF (private + metadata)");
for (const u of [
  "http://localhost/x",
  "http://127.0.0.1:5432",
  "http://0.0.0.1/test",
  "http://10.0.0.1/admin",
  "http://192.168.1.1/router",
  "http://172.16.0.5/internal",
  "http://172.20.10.2/internal",
  "http://172.31.255.255/internal",
  "http://169.254.169.254/latest/meta-data/",         // AWS metadata
  "http://[::1]/loopback",                            // IPv6 loopback
  "http://[fc00::1]/ula",                             // IPv6 unique-local
  "http://[fe80::1]/link-local",                      // IPv6 link-local
  "http://metadata.google.internal/computeMetadata/",
  "http://host.docker.internal/inside",
  "http://router.local/admin",
  "http://something.internal/svc",
]) {
  const r = validateUserUrl(u);
  check(`reject ${u}`, !r.ok, r.ok ? "should have been blocked" : undefined);
}

console.log("\n[validateUserUrl] — rejected: URLs with embedded credentials");
{
  const r = validateUserUrl("https://user:pass@example.com/path");
  check("reject URL with credentials", !r.ok, r.ok ? "should have failed" : undefined);
}

console.log("\n[validateUserUrl] — accepted: 172 outside RFC1918 range");
for (const u of [
  "http://172.15.0.1/public",  // 172.0.0.0/8 minus 16-31 is public
  "http://172.32.0.1/public",
]) {
  const r = validateUserUrl(u);
  check(`accept ${u}`, r.ok, r.ok ? undefined : r.reason);
}

// ─── extractProductFromJsonLd ──────────────────────────────────────────────

console.log("\n[extractProductFromJsonLd] — Shopify-style JSON-LD");
{
  const html = `<!doctype html><html><head>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": "Pink Paradise",
      "brand": { "@type": "Brand", "name": "Les Secrets de Loly" },
      "description": "<p>Masque hydratant <strong>nourrissant</strong> pour cheveux bouclés.</p>",
      "image": "https://cdn.shopify.com/s/files/1/.../pink-paradise.jpg"
    }
    </script>
  </head><body>...</body></html>`;
  const r = extractProductFromJsonLd(html);
  check("Product extrait", r !== null);
  check("nom du produit", r?.productName === "Pink Paradise", `got: ${r?.productName}`);
  check("marque", r?.brand === "Les Secrets de Loly", `got: ${r?.brand}`);
  check("description (HTML décapé)", r?.description === "Masque hydratant nourrissant pour cheveux bouclés.", `got: ${r?.description}`);
  check("image URL", r?.imageUrl?.includes("pink-paradise.jpg") ?? false);
}

console.log("\n[extractProductFromJsonLd] — image en array + brand en string");
{
  const html = `<script type="application/ld+json">{
    "@type": "Product",
    "name": "Rêve de Miel",
    "brand": "Nuxe",
    "image": ["https://example.com/a.jpg", "https://example.com/b.jpg"]
  }</script>`;
  const r = extractProductFromJsonLd(html);
  check("nom", r?.productName === "Rêve de Miel");
  check("brand string", r?.brand === "Nuxe");
  check("première image de l'array", r?.imageUrl === "https://example.com/a.jpg");
  check("pas de description", r?.description === null);
}

console.log("\n[extractProductFromJsonLd] — graph wrapper @graph");
{
  const html = `<script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@graph": [
      { "@type": "WebSite", "name": "Some shop" },
      { "@type": "Organization", "name": "Some Brand" },
      { "@type": "Product", "name": "Inside Graph", "brand": { "name": "Innerbrand" } }
    ]
  }</script>`;
  const r = extractProductFromJsonLd(html);
  check("trouve le Product dans @graph", r?.productName === "Inside Graph");
  check("brand depuis l'objet imbriqué", r?.brand === "Innerbrand");
}

console.log("\n[extractProductFromJsonLd] — plusieurs blocs JSON-LD");
{
  const html = `
    <script type="application/ld+json">{"@type": "BreadcrumbList", "itemListElement": []}</script>
    <script type="application/ld+json">{"@type": "Product", "name": "Le Bon"}</script>
    <script type="application/ld+json">{"@type": "Organization", "name": "Le Mauvais"}</script>
  `;
  const r = extractProductFromJsonLd(html);
  check("ignore les blocs non-Product, garde le Product", r?.productName === "Le Bon", `got: ${r?.productName}`);
}

console.log("\n[extractProductFromJsonLd] — pas de JSON-LD");
{
  const r = extractProductFromJsonLd("<html><body>No structured data here</body></html>");
  check("retourne null sur page sans JSON-LD", r === null);
}

console.log("\n[extractProductFromJsonLd] — JSON malformé (rescue OK)");
{
  // Trailing comma + &quot; entities, common on WooCommerce themes.
  const html = `<script type="application/ld+json">
  {
    &quot;@type&quot;: &quot;Product&quot;,
    &quot;name&quot;: &quot;Rescued Product&quot;,
    &quot;brand&quot;: &quot;Rescue Brand&quot;,
  }
  </script>`;
  const r = extractProductFromJsonLd(html);
  check("rescue path récupère le Product", r?.productName === "Rescued Product", `got: ${JSON.stringify(r)}`);
  check("brand récupérée", r?.brand === "Rescue Brand");
}

console.log("\n[extractProductFromJsonLd] — JSON-LD vide / sans champs utiles");
{
  // Has @type Product but no name/brand/description → we return null
  // (the orchestrator falls back on LLM extraction).
  const html = `<script type="application/ld+json">{"@type": "Product", "sku": "12345"}</script>`;
  const r = extractProductFromJsonLd(html);
  check("retourne null quand aucun champ utile", r === null, r === null ? undefined : `got: ${JSON.stringify(r)}`);
}

console.log("\n[extractProductFromJsonLd] — @type array (ex: ['Product', 'Thing'])");
{
  const html = `<script type="application/ld+json">{"@type": ["Product", "Thing"], "name": "Combo type"}</script>`;
  const r = extractProductFromJsonLd(html);
  check("@type sous forme d'array fonctionne", r?.productName === "Combo type");
}

console.log("\n[extractProductFromJsonLd] — image en ImageObject");
{
  const html = `<script type="application/ld+json">{
    "@type": "Product",
    "name": "With ImageObject",
    "image": { "@type": "ImageObject", "url": "https://example.com/img.jpg" }
  }</script>`;
  const r = extractProductFromJsonLd(html);
  check("ImageObject.url extraite", r?.imageUrl === "https://example.com/img.jpg");
}

// ─── Summary ───────────────────────────────────────────────────────────────

console.log("\n" + "─".repeat(60));
if (failures.length === 0) {
  console.log(`✅  ${passCount} assertions OK — validateUrl + JSON-LD parser sains.`);
  process.exit(0);
} else {
  console.log(`❌  ${passCount} OK, ${failures.length} ÉCHEC(S):`);
  for (const f of failures) console.log("    - " + f);
  process.exit(1);
}
