import { searchBrandViaDDG } from "./_shared";
import type { BrandHandler } from "./types";

export const avene: BrandHandler = {
  name: "Avène",
  aliases: ["avene", "avène", "eau thermale avene", "eau thermale avène"],
  domain: "eau-thermale-avene.fr",
  async search(query) {
    return searchBrandViaDDG({
      brand: "Avène",
      domain: "eau-thermale-avene.fr",
      query,
    });
  },
};
