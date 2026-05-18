// Canonical site URL used by metadata, sitemap, robots and JSON-LD.
//
// Resolution order (first match wins):
//   1. NEXT_PUBLIC_SITE_URL - explicit override, set this to your custom
//      domain (e.g. "https://cosme-check.com") once you have one.
//   2. VERCEL_PROJECT_PRODUCTION_URL - auto-injected by Vercel, points to the
//      project's stable production URL regardless of preview/branch deploys.
//   3. VERCEL_URL - auto-injected by Vercel, the *current* deploy's URL
//      (preview branches included). Useful so OG/sitemap links work on previews.
//   4. Localhost fallback for `next dev`.
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl().replace(/\/$/, "");
