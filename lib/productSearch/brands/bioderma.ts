import { searchBrandViaDDG } from "./_shared";
import type { BrandHandler } from "./types";

export const bioderma: BrandHandler = {
  name: "Bioderma",
  aliases: ["bioderma"],
  domain: "bioderma.fr",
  async search(query) {
    return searchBrandViaDDG({
      brand: "Bioderma",
      domain: "bioderma.fr",
      query,
    });
  },
};
