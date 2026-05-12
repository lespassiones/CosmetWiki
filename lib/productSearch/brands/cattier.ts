import { searchBrandViaDDG } from "./_shared";
import type { BrandHandler } from "./types";

export const cattier: BrandHandler = {
  name: "Cattier",
  aliases: ["cattier", "cattier paris"],
  domain: "cattier-paris.com",
  async search(query) {
    return searchBrandViaDDG({
      brand: "Cattier",
      domain: "cattier-paris.com",
      query,
    });
  },
};
