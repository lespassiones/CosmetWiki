/**
 * Résolution de la fiche store à servir en fonction du User-Agent.
 *
 * Isolé de la route `/dl` pour être testable sans `next/server` : ce code est
 * embarqué dans des QR codes imprimés, une erreur se corrige au pilon.
 */

export const APP_STORE_ID = "6803527040";
export const ANDROID_PACKAGE = "com.cosmecheck.app";
export const SITE_URL = "https://www.cosme-check.com/";

/** Slug borné : la valeur part telle quelle dans une URL externe. */
const SLUG_RE = /^[a-z0-9_-]{1,32}$/i;
/**
 * Une campagne peut être plus longue qu'un média : les appels des articles du
 * blog prennent le slug de l'article comme campagne (`/dl?c=<slug>`), et un
 * slug d'article va jusqu'à 60 caractères (`contenu/articles.ts`).
 */
const CAMPAGNE_RE = /^[a-z0-9_-]{1,60}$/i;
/**
 * Apple ne garde que 40 caractères de `ct` : au-delà, la campagne est
 * tronquée ici plutôt que refusée par l'App Store. Le slug complet reste lu
 * par Google Play et par PostHog.
 */
const APPLE_CT_MAX = 40;
/**
 * Le jeton de fournisseur d'App Store Connect (`pt`). Sans lui, Apple ignore
 * `ct` et ne compte aucune installation par campagne. Il est propre au compte
 * développeur, pas à l'app : c'est celui de MemoryPilot et de RevealChat
 * (même équipe, même émetteur de clé d'API, vérifié le 19/10/2026).
 */
export const APPLE_PROVIDER_TOKEN = "129333123";
export const DEFAULT_CAMPAIGN = "qr";
/**
 * Média par défaut. Reste `qr_code` : des QR pointant sur `/dl` sans paramètre
 * sont déjà imprimés, changer ce défaut réécrirait leur attribution.
 */
export const DEFAULT_MEDIUM = "qr_code";

export function campaignSlug(raw: string | null | undefined): string {
  return raw && CAMPAGNE_RE.test(raw) ? raw.toLowerCase() : DEFAULT_CAMPAIGN;
}

/**
 * L'emplacement de l'appel dans un article (`haut`, `milieu`, `colonne`,
 * `fin`, `barre`), ou `null`. Il part dans `utm_content` côté Play ; Apple
 * n'a pas de champ pour lui, PostHog le mesure (`cta_clic`).
 */
export function contentSlug(raw: string | null | undefined): string | null {
  return raw && SLUG_RE.test(raw) ? raw.toLowerCase() : null;
}

/**
 * Média du lien, `qr_code` par défaut. Un lien collé dans une bio Instagram
 * n'est pas un QR scanné : sans ce paramètre, tous les clics remontaient dans
 * Play Console sous `utm_medium=qr_code`.
 */
export function mediumSlug(raw: string | null | undefined): string {
  return raw && SLUG_RE.test(raw) ? raw.toLowerCase() : DEFAULT_MEDIUM;
}

/**
 * Pas de code pays dans l'URL : Apple redirige lui-même vers la boutique du
 * compte. Un `/us/` en dur afficherait le store américain à tout le monde.
 * `ct` est le champ campagne des Apple Campaign Links, compté dans App Store
 * Connect grâce à `pt` (le jeton de fournisseur, voir `APPLE_PROVIDER_TOKEN`).
 * Apple n'a pas de champ « média », d'où l'absence de second paramètre ici.
 */
export function appleUrl(campaign = DEFAULT_CAMPAIGN): string {
  const ct = encodeURIComponent(campaign.slice(0, APPLE_CT_MAX));
  return `https://apps.apple.com/app/id${APP_STORE_ID}?pt=${APPLE_PROVIDER_TOKEN}&ct=${ct}&mt=8`;
}

/** `referrer` est lu par l'Install Referrer API de Play : attribution native. */
export function playUrl(
  campaign = DEFAULT_CAMPAIGN,
  medium = DEFAULT_MEDIUM,
  content: string | null = null,
): string {
  const referrer = encodeURIComponent(
    `utm_source=${campaign}&utm_medium=${medium}&utm_campaign=${campaign}` +
      (content ? `&utm_content=${content}` : ""),
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
export function storeUrlFor(
  userAgent: string,
  campaign = DEFAULT_CAMPAIGN,
  medium = DEFAULT_MEDIUM,
  content: string | null = null,
): string {
  const platform = detectPlatform(userAgent);
  if (platform === "android") return playUrl(campaign, medium, content);
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
  medium = DEFAULT_MEDIUM,
): string | null {
  if (platform === "android") return playUrl(campaign, medium);
  if (platform === "ios") return appleUrl(campaign);
  return null;
}
