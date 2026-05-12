import { searchBrandViaDDG } from "./_shared";
import type { BrandHandler } from "./types";

export const lorealParis: BrandHandler = {
  name: "L'Oréal Paris",
  aliases: ["loreal", "l'oreal", "l oreal", "loreal paris", "l'oreal paris"],
  domain: "loreal-paris.fr",
  async search(query) {
    return searchBrandViaDDG({
      brand: "L'Oréal Paris",
      domain: "loreal-paris.fr",
      query,
    });
  },
};
