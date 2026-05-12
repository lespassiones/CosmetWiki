import { searchBrandViaDDG } from "./_shared";
import type { BrandHandler } from "./types";

export const laRochePosay: BrandHandler = {
  name: "La Roche-Posay",
  aliases: ["la roche posay", "la roche-posay", "lrp", "roche posay"],
  domain: "laroche-posay.fr",
  async search(query) {
    return searchBrandViaDDG({
      brand: "La Roche-Posay",
      domain: "laroche-posay.fr",
      query,
    });
  },
};
