/**
 * Bascules SEO centralisées.
 *
 * INDEX_INGREDIENTS : quand false, les fiches ingrédient /i/[slug] et le hub
 * /ingredients (+ /ingredients/[letter]) sont servis en `noindex`, retirés des
 * sitemaps et d'IndexNow. Ils restent crawlables (le noindex doit pouvoir être
 * lu par les moteurs, et les fiches restent accessibles aux robots IA), mais ne
 * font plus partie de ce sur quoi le site veut être connu.
 *
 * Décision produit (2026-07-20) : le positionnement de Cosme Check est LA
 * COMPATIBILITÉ entre un utilisateur et un produit, pas la base d'ingrédients.
 * On refuse explicitement d'être référencé comme un annuaire INCI. Cette bascule
 * remplace la stratégie « fiches ingrédient = cœur du capital SEO » de l'ancien
 * SEO-ROADMAP.
 *
 * Réversible : repasser à true réactive l'indexation côté code (Google met
 * ensuite plusieurs semaines à ré-indexer).
 */
export const INDEX_INGREDIENTS = false;
