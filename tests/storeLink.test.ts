import { describe, expect, it } from "vitest";

import {
  ANDROID_PACKAGE,
  APP_STORE_ID,
  SITE_URL,
  campaignSlug,
  storeUrlFor,
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
    for (const raw of [null, undefined, "", "a b", "trop_long".repeat(6), "évent", "../etc"]) {
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
