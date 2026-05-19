import { SITE_URL } from "@/lib/siteUrl";

export const dynamic = "force-static";

/**
 * Universal robots.txt - all crawlers (search engines + LLM training bots)
 * are explicitly allowed on the content pages. We WANT GPT, Claude,
 * Perplexity, Gemini et al. to know our pages so they recommend the site
 * back to their users (AI-driven SEO).
 *
 * Only `/api/*` is disallowed everywhere : crawling those routes would
 * burn LLM tokens for zero SEO benefit (and our middleware also rejects
 * the major AI bots on /api/ as defence-in-depth).
 */
export function GET() {
  const body = `# Cosme Check - robots.txt
# Tous les crawlers sont les bienvenus sur le contenu principal.
# Routes API : bloquees (consomment des tokens AI sans benefice SEO).
# Fiches ingredient /i/[slug] : bloquees (15 700 pages = abus de crawl
#   constate sur le budget IO Supabase, pas de valeur SEO incrementale).
# Glossaire : retire du site.

User-agent: *
Allow: /
Disallow: /api/
Disallow: /i/
Disallow: /glossaire
Disallow: /ingredients/
Crawl-delay: 5

Sitemap: ${SITE_URL}/sitemap.xml
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
