import { searchBrandViaDDG } from "./_shared";
import type { BrandHandler } from "./types";

export const nuxe: BrandHandler = {
  name: "Nuxe",
  aliases: ["nuxe"],
  domain: "nuxe.com",
  async search(query) {
    return searchBrandViaDDG({
      brand: "Nuxe",
      domain: "nuxe.com",
      query,
    });
  },
};
