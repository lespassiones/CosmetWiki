import { searchBrandViaDDG } from "./_shared";
import type { BrandHandler } from "./types";

// Note: vichy.fr returns 403 on direct fetch (Cloudflare). The DDG site:
// search may still surface cached or rendered pages — we keep the handler
// registered so we benefit automatically if anti-bot loosens.
export const vichy: BrandHandler = {
  name: "Vichy",
  aliases: ["vichy"],
  domain: "vichy.fr",
  async search(query) {
    return searchBrandViaDDG({
      brand: "Vichy",
      domain: "vichy.fr",
      query,
    });
  },
};
