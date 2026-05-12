import { searchBrandViaDDG } from "./_shared";
import type { BrandHandler } from "./types";

export const garnier: BrandHandler = {
  name: "Garnier",
  aliases: ["garnier"],
  domain: "garnier.fr",
  async search(query) {
    return searchBrandViaDDG({
      brand: "Garnier",
      domain: "garnier.fr",
      query,
    });
  },
};
