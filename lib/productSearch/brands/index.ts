// Registry of brand handlers + detection from a free-form user query.
// Adding a new brand = create a new file in this folder, import + push here.

import { laRochePosay } from "./laRochePosay";
import { lorealParis } from "./lorealParis";
import { vichy } from "./vichy";
import { bioderma } from "./bioderma";
import { avene } from "./avene";
import { nuxe } from "./nuxe";
import { caudalie } from "./caudalie";
import { yvesRocher } from "./yvesRocher";
import { garnier } from "./garnier";
import { cattier } from "./cattier";
import type { BrandHandler, BrandResult } from "./types";

const BRANDS: BrandHandler[] = [
  laRochePosay,
  lorealParis,
  vichy,
  bioderma,
  avene,
  nuxe,
  caudalie,
  yvesRocher,
  garnier,
  cattier,
];

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normalizeForMatch(s: string): string {
  return stripAccents(s.toLowerCase()).replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

/** Returns the brand handler whose alias appears earliest in the query, or
 *  null. Longest alias wins on ties (so "la roche posay" beats "la"). */
export function detectBrand(query: string): BrandHandler | null {
  const normQuery = normalizeForMatch(query);
  if (!normQuery) return null;

  let best: { handler: BrandHandler; alias: string; pos: number } | null = null;
  for (const handler of BRANDS) {
    for (const alias of handler.aliases) {
      const normAlias = normalizeForMatch(alias);
      // Whole-token match: must be surrounded by start/end or whitespace.
      const re = new RegExp(`(^|\\s)${normAlias.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&")}(\\s|$)`);
      const m = re.exec(normQuery);
      if (!m) continue;
      const pos = m.index;
      if (!best || pos < best.pos || (pos === best.pos && normAlias.length > best.alias.length)) {
        best = { handler, alias: normAlias, pos };
      }
    }
  }
  return best?.handler ?? null;
}

/** Strip the brand tokens out of the query so the brand's own search isn't
 *  cluttered with its own name ("La Roche-Posay Effaclar Duo" → "Effaclar Duo"). */
export function stripBrandFromQuery(query: string, handler: BrandHandler): string {
  let out = ` ${normalizeForMatch(query)} `;
  for (const alias of handler.aliases) {
    const norm = normalizeForMatch(alias);
    out = out.replace(new RegExp(`\\s${norm.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&")}\\s`, "g"), " ");
  }
  return out.replace(/\s+/g, " ").trim();
}

export type { BrandHandler, BrandResult };
export { BRANDS };
