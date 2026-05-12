import { searchBrandViaDDG } from "./_shared";
import type { BrandHandler } from "./types";

// Note: yves-rocher.fr returns 403 on direct fetch. Kept registered for
// future-proofing — if their anti-bot loosens or DDG surfaces cached pages,
// we benefit automatically. Cost of an attempt is one DDG call.
export const yvesRocher: BrandHandler = {
  name: "Yves Rocher",
  aliases: ["yves rocher", "yves-rocher"],
  domain: "yves-rocher.fr",
  async search(query) {
    return searchBrandViaDDG({
      brand: "Yves Rocher",
      domain: "yves-rocher.fr",
      query,
    });
  },
};
