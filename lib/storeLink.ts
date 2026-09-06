/**
 * Résolution de la fiche store à servir en fonction du User-Agent.
 *
 * Isolé de la route `/dl` pour être testable sans `next/server` : ce code est
 * embarqué dans des QR codes imprimés, une erreur se corrige au pilon.
 */

export const APP_STORE_ID = "6803527040";
export const ANDROID_PACKAGE = "com.cosmecheck.app";
export const SITE_URL = "https://www.cosme-check.com/";

/** Slug de campagne borné : la valeur part telle quelle dans une URL externe. */
const CAMPAIGN_RE = /^[a-z0-9_-]{1,32}$/i;
export const DEFAULT_CAMPAIGN = "qr";

export function campaignSlug(raw: string | null | undefined): string {
  return raw && CAMPAIGN_RE.test(raw) ? raw.toLowerCase() : DEFAULT_CAMPAIGN;
}

/**
 * Pas de code pays dans l'URL : Apple redirige lui-même vers la boutique du
 * compte. Un `/us/` en dur afficherait le store américain à tout le monde.
 * `ct` est le champ campagne des Apple Campaign Links ; sans `pt` (provider
 * token) il est ignoré, donc inoffensif, et prêt si on active App Analytics.
 */
export function appleUrl(campaign = DEFAULT_CAMPAIGN): string {
  return `https://apps.apple.com/app/id${APP_STORE_ID}?ct=${encodeURIComponent(campaign)}`;
}

/** `referrer` est lu par l'Install Referrer API de Play : attribution native. */
export function playUrl(campaign = DEFAULT_CAMPAIGN): string {
  const referrer = encodeURIComponent(
    `utm_source=${campaign}&utm_medium=qr_code&utm_campaign=${campaign}`,
  );
  return `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&referrer=${referrer}`;
}

/**
 * Ordre volontaire : Android d'abord, car beaucoup d'UA Android contiennent
 * « Linux » et « Safari » mais aucun ne contient iPhone/iPad/iPod.
 *
 * Le cas `Macintosh` + `Mobile` couvre les webviews iPadOS qui masquent leur
 * plateforme. Un iPad en mode « site pour ordinateur » reste indiscernable d'un
 * Mac côté serveur : il retombe sur le site, qui propose les deux badges.
 * Desktop et bots vont aussi sur le site, jamais sur un store.
 */
export function storeUrlFor(userAgent: string, campaign = DEFAULT_CAMPAIGN): string {
  const platform = detectPlatform(userAgent);
  if (platform === "android") return playUrl(campaign);
  if (platform === "ios") return appleUrl(campaign);
  return SITE_URL;
}

/** Plateforme déduite du User-Agent. `desktop` couvre aussi les bots. */
export type Platform = "ios" | "android" | "desktop";

/**
 * Même logique de détection que `storeUrlFor`, mais elle rend la PLATEFORME au
 * lieu d'une URL. Côté client on ne veut pas toujours rediriger : sur un poste
 * fixe on préfère ouvrir la modale qui montre les deux badges. Un seul endroit
 * porte les expressions régulières, donc `/dl` (serveur) et les boutons
 * (navigateur) ne peuvent pas diverger.
 */
export function detectPlatform(userAgent: string | null | undefined): Platform {
  const ua = userAgent ?? "";
  if (/android/i.test(ua)) return "android";
  if (/(iphone|ipad|ipod)/i.test(ua)) return "ios";
  if (/macintosh/i.test(ua) && /mobile/i.test(ua)) return "ios";
  return "desktop";
}

/**
 * Destination store pour une plateforme déjà résolue, ou `null` sur poste fixe
 * (aucun store à ouvrir : l'appelant affiche la modale à la place).
 */
export function storeUrlForPlatform(
  platform: Platform,
  campaign = DEFAULT_CAMPAIGN,
): string | null {
  if (platform === "android") return playUrl(campaign);
  if (platform === "ios") return appleUrl(campaign);
  return null;
}
