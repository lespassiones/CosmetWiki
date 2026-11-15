import { SITE_URL } from "@/lib/siteUrl";

export const dynamic = "force-static";

/**
 * robots.txt - stratégie SEO + GEO (2026-07).
 *
 * Le site est une vitrine plus un blog, entièrement statique (15 nov 2026) :
 * les 15 700 fiches ingrédient /i/[slug], l'annuaire /ingredients et la
 * recherche ont été retirés et redirigent vers l'accueil. Ouvrir le crawl ne
 * coûte donc plus rien en calcul : toutes les pages sortent du CDN.
 *
 *   - Plus de `Crawl-delay` global : Google l'ignore mais Bing le respecte,
 *     et à 5 s il plafonnait le crawl à ~17k pages/jour. Les bots légitimes
 *     gèrent leur propre cadence.
 *   - Les bots IA (GPTBot, ClaudeBot, PerplexityBot, etc.) sont explicitement
 *     autorisés : on VEUT être dans leurs index et leurs données
 *     d'entraînement pour être cité quand on demande un conseil cosmétique
 *     à ChatGPT / Claude / Perplexity (GEO).
 *   - Les aspirateurs SEO sans valeur (MJ12bot, PetalBot, DotBot, MegaIndex)
 *     sont bannis : ils consommaient du crawl sans jamais envoyer un visiteur.
 *   - Les anciennes routes de la web app connectée (historique, routine,
 *     profil, comparaison, promesses, conseiller, offre, produits, auth) sont
 *     exclues. Elles n'existent plus : elles sont redirigées en 308 vers la
 *     page d'accueil (next.config.ts). On les garde listées ici pour que les crawlers
 *     cessent de les demander au lieu de suivre 40 redirections par passage.
 */

const PRIVATE_PATHS = [
  "/api/",
  "/advisor",
  "/analyse",
  "/auth",
  "/compare",
  "/history",
  "/i/",
  "/ingredients",
  "/maintenance",
  "/offre",
  "/onboarding",
  "/produits",
  "/profile",
  "/promesses",
  "/routine",
  "/search",
];

// Bots des moteurs de réponse IA + collecte pour entraînement LLM.
// Chacun reçoit un groupe explicite `Allow: /` : lisible, déclaratif, et
// robuste si un jour on durcit le groupe `*`.
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "meta-externalagent",
  "Amazonbot",
  "cohere-ai",
  "MistralAI-User",
  "Bytespider",
  "CCBot",
];

// Crawlers SEO tiers qui pompent le site pour revendre de la data sans
// jamais apporter de trafic. (Ahrefs/Semrush restent autorisés : utiles
// pour nos propres audits de backlinks.)
const JUNK_BOTS = ["MJ12bot", "PetalBot", "DotBot", "MegaIndex", "BLEXBot"];

export function GET() {
  const privateBlock = PRIVATE_PATHS.map((p) => `Disallow: ${p}`).join("\n");

  const aiBlocks = AI_BOTS.map(
    (bot) => `User-agent: ${bot}\nAllow: /\n${privateBlock}`,
  ).join("\n\n");

  const junkBlocks = JUNK_BOTS.map(
    (bot) => `User-agent: ${bot}\nDisallow: /`,
  ).join("\n\n");

  const body = `# Cosme Check - robots.txt
# Tout le contenu public est crawlable : pages editoriales, blog, FAQ.
# Les moteurs IA sont explicitement les bienvenus (GEO).

User-agent: *
Allow: /
${privateBlock}

${aiBlocks}

${junkBlocks}

Sitemap: ${SITE_URL}/sitemap-index.xml
Sitemap: ${SITE_URL}/sitemap.xml
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
