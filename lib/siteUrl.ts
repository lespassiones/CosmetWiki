// Canonical site URL used by metadata, sitemap, robots and JSON-LD.
// Override via NEXT_PUBLIC_SITE_URL in .env, e.g. "https://cosmetwiki.com".
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://cosmetwiki.vercel.app"
).replace(/\/$/, "");
