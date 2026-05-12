import { searchBrandViaDDG } from "./_shared";
import type { BrandHandler } from "./types";

export const caudalie: BrandHandler = {
  name: "Caudalie",
  aliases: ["caudalie"],
  domain: "caudalie.com",
  async search(query) {
    return searchBrandViaDDG({
      brand: "Caudalie",
      domain: "caudalie.com",
      query,
    });
  },
};
