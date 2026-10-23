import { describe, expect, it } from "vitest";

import { estRobot, libelleVues, slugValide } from "@/lib/vuesArticles";

describe("compteur de vues des articles", () => {
  it("accorde le libellé : 0 et 1 au singulier, au-delà au pluriel", () => {
    expect(libelleVues(0)).toBe("0 vue");
    expect(libelleVues(1)).toBe("1 vue");
    expect(libelleVues(2)).toBe("2 vues");
    expect(libelleVues(-3)).toBe("0 vue");
    expect(libelleVues(12345).replace(/\s/g, " ")).toBe("12 345 vues");
  });

  it("n'accepte que les slugs que la fonction SQL accepte", () => {
    expect(slugValide("calendrier-avent-beaute")).toBe(true);
    expect(slugValide("niacinamide")).toBe(true);
    expect(slugValide("Bad Slug")).toBe(false);
    expect(slugValide("double--tiret")).toBe(false);
    expect(slugValide("-debut")).toBe(false);
    expect(slugValide("a".repeat(81))).toBe(false);
  });

  it("écarte les robots connus et les navigateurs pilotés", () => {
    const humain =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
    expect(estRobot(humain)).toBe(false);
    expect(estRobot(humain, true)).toBe(true);
    expect(estRobot("")).toBe(true);
    for (const ua of [
      "Mozilla/5.0 (compatible; Googlebot/2.0; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/131.0 Safari/537.36",
      "facebookexternalhit/1.1",
      "WhatsApp/2.23",
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2",
      "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36 Chrome-Lighthouse",
    ]) {
      expect(estRobot(ua)).toBe(true);
    }
  });
});
