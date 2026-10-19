import { describe, expect, it } from "vitest";

import {
  ANDROID_PACKAGE,
  APPLE_PROVIDER_TOKEN,
  APP_STORE_ID,
  appleUrl,
  contentSlug,
  SITE_URL,
  campaignSlug,
  detectPlatform,
  mediumSlug,
  playUrl,
  storeUrlFor,
  storeUrlForPlatform,
} from "@/lib/storeLink";

const UA = {
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  iphoneInstagram:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.30.107",
  ipad:
    "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  ipadDesktopMode:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
  samsungBrowser:
    "Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36",
  macSafari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  windowsChrome:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
};

describe("storeUrlFor", () => {
  it("envoie tous les appareils Apple sur l'App Store", () => {
    for (const ua of [UA.iphoneSafari, UA.iphoneInstagram, UA.ipad, UA.ipadDesktopMode]) {
      expect(storeUrlFor(ua)).toContain(`apps.apple.com/app/id${APP_STORE_ID}`);
    }
  });

  it("envoie Android sur Google Play", () => {
    for (const ua of [UA.androidChrome, UA.samsungBrowser]) {
      const url = storeUrlFor(ua);
      expect(url).toContain("play.google.com/store/apps/details");
      expect(url).toContain(`id=${ANDROID_PACKAGE}`);
    }
  });

  it("ne force jamais de code pays dans l'URL Apple (Apple choisit la boutique)", () => {
    expect(storeUrlFor(UA.iphoneSafari)).not.toMatch(/apps\.apple\.com\/[a-z]{2}\//);
  });

  it("renvoie desktop, UA vide et bots vers le site, jamais vers un store", () => {
    for (const ua of [UA.macSafari, UA.windowsChrome, "", "Googlebot/2.1"]) {
      expect(storeUrlFor(ua)).toBe(SITE_URL);
    }
  });

  it("ne confond pas un UA Android contenant Safari avec un iPhone", () => {
    expect(storeUrlFor(UA.androidChrome)).toContain("play.google.com");
  });
});

describe("campaignSlug", () => {
  it("retombe sur qr quand le paramètre est absent ou hors format", () => {
    for (const raw of [null, undefined, "", "a b", "trop_long".repeat(7), "évent", "../etc"]) {
      expect(campaignSlug(raw)).toBe("qr");
    }
  });

  it("normalise en minuscules et accepte tirets et underscores", () => {
    expect(campaignSlug("Flyer_Salon-2026")).toBe("flyer_salon-2026");
  });

  it("propage la campagne dans les deux URLs, encodée", () => {
    expect(storeUrlFor(UA.iphoneSafari, "flyer_salon")).toContain("ct=flyer_salon");
    expect(storeUrlFor(UA.androidChrome, "flyer_salon")).toContain(
      encodeURIComponent("utm_source=flyer_salon"),
    );
  });
});

/**
 * `detectPlatform` est la brique partagée entre la route serveur `/dl` et les
 * boutons du site (`DownloadAppProvider`), qui la font tourner sur
 * `navigator.userAgent`. Si les deux divergeaient, un iPhone pourrait recevoir
 * la modale « choisis ton store » au lieu de l'App Store.
 */
describe("detectPlatform", () => {
  it("reconnaît les appareils Apple, y compris en webview iPadOS", () => {
    for (const ua of [UA.iphoneSafari, UA.iphoneInstagram, UA.ipad, UA.ipadDesktopMode]) {
      expect(detectPlatform(ua)).toBe("ios");
    }
  });

  it("reconnaît Android, sans se laisser piéger par « Safari » dans son UA", () => {
    for (const ua of [UA.androidChrome, UA.samsungBrowser]) {
      expect(detectPlatform(ua)).toBe("android");
    }
  });

  it("classe desktop, UA vide, null et bots en desktop", () => {
    for (const ua of [UA.macSafari, UA.windowsChrome, "", null, undefined, "Googlebot/2.1"]) {
      expect(detectPlatform(ua)).toBe("desktop");
    }
  });

  it("reste cohérent avec storeUrlFor sur chaque UA", () => {
    const all = Object.values(UA);
    for (const ua of all) {
      const viaPlatform = storeUrlForPlatform(detectPlatform(ua));
      const direct = storeUrlFor(ua);
      // Sur poste fixe `storeUrlForPlatform` rend null et `storeUrlFor` rend le
      // site : c'est la même décision, exprimée différemment.
      expect(viaPlatform ?? SITE_URL).toBe(direct);
    }
  });
});

describe("storeUrlForPlatform", () => {
  it("rend null sur ordinateur, pour que l'appelant ouvre la modale", () => {
    expect(storeUrlForPlatform("desktop")).toBeNull();
  });

  it("rend la bonne fiche store et propage la campagne", () => {
    expect(storeUrlForPlatform("ios", "header")).toContain(
      `apps.apple.com/app/id${APP_STORE_ID}`,
    );
    expect(storeUrlForPlatform("ios", "header")).toContain("ct=header");
    expect(storeUrlForPlatform("android", "header")).toContain(`id=${ANDROID_PACKAGE}`);
    expect(storeUrlForPlatform("android", "header")).toContain(
      encodeURIComponent("utm_source=header"),
    );
  });
});

/**
 * Le média part dans le `referrer` lu par l'Install Referrer API de Play. Sans
 * lui, un clic depuis une bio Instagram remontait en `utm_medium=qr_code` dans
 * Play Console. Le défaut reste `qr_code` : des QR pointant sur `/dl` sans
 * paramètre sont déjà imprimés, on ne peut pas réécrire leur attribution.
 */
describe("mediumSlug", () => {
  it("retombe sur qr_code quand le paramètre est absent ou hors format", () => {
    for (const raw of [null, undefined, "", "a b", "x".repeat(33), "réseaux", "../etc"]) {
      expect(mediumSlug(raw)).toBe("qr_code");
    }
  });

  it("normalise en minuscules et accepte tirets et underscores", () => {
    expect(mediumSlug("Social-Paid_2026")).toBe("social-paid_2026");
  });
});

describe("média dans le referrer Play", () => {
  it("garde qr_code par défaut, pour les QR déjà imprimés", () => {
    expect(playUrl("flyer_salon")).toContain(encodeURIComponent("utm_medium=qr_code"));
  });

  it("propage le média demandé, dans les trois points d'entrée", () => {
    const expected = encodeURIComponent(
      "utm_source=insta_bio&utm_medium=social&utm_campaign=insta_bio",
    );
    expect(playUrl("insta_bio", "social")).toContain(expected);
    expect(storeUrlFor(UA.androidChrome, "insta_bio", "social")).toContain(expected);
    expect(storeUrlForPlatform("android", "insta_bio", "social")).toContain(expected);
  });

  it("n'ajoute rien à l'URL Apple, qui n'a pas de champ média", () => {
    expect(storeUrlFor(UA.iphoneSafari, "insta_bio", "social")).toBe(
      storeUrlFor(UA.iphoneSafari, "insta_bio"),
    );
  });

  it("laisse desktop et bots sur le site, quel que soit le média", () => {
    expect(storeUrlFor(UA.windowsChrome, "insta_bio", "social")).toBe(SITE_URL);
    expect(storeUrlFor("Googlebot/2.1", "insta_bio", "social")).toBe(SITE_URL);
  });
});

/**
 * Les appels des articles du blog : `/dl?c=<slug>&m=blog&e=<emplacement>`.
 * Un slug d'article va jusqu'à 60 caractères, Apple ne garde que 40
 * caractères de `ct` et ne compte rien sans le jeton de fournisseur `pt`.
 */
describe("campagnes des articles", () => {
  const slug = "perturbateurs-endocriniens-cosmetiques-2026";

  it("accepte un slug d'article de 60 caractères comme campagne", () => {
    expect(campaignSlug("a".repeat(60))).toBe("a".repeat(60));
    expect(campaignSlug("a".repeat(61))).toBe("qr");
    expect(campaignSlug(slug)).toBe(slug);
  });

  it("porte le jeton de fournisseur et tronque ct à 40 caractères chez Apple", () => {
    const url = appleUrl(slug);
    expect(url).toContain(`pt=${APPLE_PROVIDER_TOKEN}`);
    expect(url).toContain(`ct=${slug.slice(0, 40)}&`);
    expect(url).toContain("mt=8");
  });

  it("transmet l'emplacement en utm_content chez Google Play, et rien chez Apple", () => {
    const attendu = encodeURIComponent(
      `utm_source=${slug}&utm_medium=blog&utm_campaign=${slug}&utm_content=milieu`,
    );
    expect(storeUrlFor(UA.androidChrome, slug, "blog", "milieu")).toContain(attendu);
    expect(storeUrlFor(UA.iphoneSafari, slug, "blog", "milieu")).toBe(appleUrl(slug));
  });

  it("ignore un emplacement hors format", () => {
    expect(contentSlug("milieu")).toBe("milieu");
    for (const raw of [null, "", "a b", "<script>", "x".repeat(33)]) expect(contentSlug(raw)).toBeNull();
    expect(playUrl(slug, "blog", contentSlug("a&b"))).not.toContain("utm_content");
  });
});
