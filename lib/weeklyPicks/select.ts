/**
 * Pépites du jour (web) — couche de SÉLECTION pure. MIROIR du mobile
 * (CosmeCheck-App/lib/weeklyPicks/select.ts), câblé sur les primitives web :
 *   - filtrage restrictions via `isExcluded` (+ `buildExclusionSet`) de
 *     lib/alternatives/filter (la version mobile utilise filterAlternatives) ;
 *   - plafond couleur via `colorCapScore` de lib/essentiel/engine ;
 *   - mélange par tier via `orderByTierShuffled` de lib/alternatives/tierShuffle.
 *
 * Pipeline (identique au mobile) :
 *   1. dédoublonnage par EAN ;
 *   2. SÉCURITÉ restrictions (token-exact + freeform) ;
 *   3. PLANCHER SANTÉ : note PLAFONNÉE (colorCapScore) >= minCappedScore ;
 *   4. files par need, chacune ordonnée par tier + mélange seedé ;
 *   5. round-robin entre needs + double garde diversité (sous-cat + famille) ;
 *   6. BACKFILL famille relâchée si mono-famille / matière insuffisante ;
 *   7. coupe à `max`.
 *
 * Pur et déterministe : même input + même seed -> tableau strictement identique.
 * La graine `${userId}:${dayKey}:${restrictionsCanonical}` porte le déterminisme.
 */

import { buildExclusionSet, isExcluded } from "@/lib/alternatives/filter";
import { orderByTierShuffled } from "@/lib/alternatives/tierShuffle";
import { colorCapScore } from "@/lib/essentiel/engine";
import type { UserRestrictions } from "@/lib/restrictions/types";

/** Ensemble d'exclusion tel que renvoyé par buildExclusionSet (web). */
export type ExclusionSet = ReturnType<typeof buildExclusionSet>;

/** Candidat renvoyé par la RPC batch, forme carte produit + need d'origine. */
export interface WeeklyPickCandidate {
  ean: string;
  brand: string | null;
  name: string | null;
  imageUrl: string | null;
  score: number | null;
  ingredientsText: string | null;
  /** Nb d'ingrédients orange/rouge (plancher couleur). */
  countOrange: number;
  countRouge: number;
  /** Need de product_intent_mapping ayant fait remonter le produit. */
  need: string;
  /** Sous-catégorie catalogue (diversité) ; null -> fallback sur need. */
  subCategory: string | null;
  /** Grande famille catalogue (diversité par famille) ; null -> fallback need. */
  family: string | null;
}

export interface SelectWeeklyPicksInput {
  candidates: WeeklyPickCandidate[];
  exclusion: ExclusionSet;
  /** Graine déterministe `${userId}:${dayKey}:${restrictionsCanonical}`. */
  seed: string;
  /** Nombre max de picks (défaut 6). */
  max?: number;
  /** Nb max de produits par sous-catégorie (défaut 2). */
  maxPerSubCategory?: number;
  /** Nb max de produits par grande famille avant backfill (défaut 3). */
  maxPerFamily?: number;
  /**
   * Plancher SANTÉ : note PLAFONNÉE minimale. Défaut 0 (pas de filtre).
   * 13 = uniquement pastilles vertes (feuille ≥13 "Bien", cœur ≥17 "Très bien").
   */
  minCappedScore?: number;
}

/** Graine canonique des picks : user + jour + restrictions. */
export function buildWeeklyPicksSeed(
  userId: string,
  dayKey: string,
  restrictionsCanonical: string,
): string {
  return `${userId}:${dayKey}:${restrictionsCanonical}`;
}

/** Clé de JOUR calendaire (UTC), ex. '2026-07-17' — rotation quotidienne. */
export function dayKey(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Clé canonique des restrictions (familles + ingrédients), triée. Miroir mobile. */
export function restrictionsCanonical(r: UserRestrictions): string {
  const fams = (r.families ?? [])
    .map((f) => (f ?? "").trim().toLowerCase())
    .filter((f) => f.length > 0)
    .sort();
  const ings = (r.ingredients ?? [])
    .map((i) => ((i?.slug ?? i?.name) ?? "").trim().toLowerCase())
    .filter((s) => s.length > 0)
    .sort();
  return `${fams.join(",")}|${ings.join(",")}`;
}

/** Note /20 -> libellé court (mêmes seuils que l'app : 17/13/9). */
export function scoreLabelFromScore(score: number): string {
  if (score >= 17) return "Très bien";
  if (score >= 13) return "Bien";
  if (score >= 9) return "Moyen";
  return "Faible";
}

/** Clé de diversité sous-catégorie : normalisée, sinon le need. */
function diversityKey(c: WeeklyPickCandidate): string {
  const sub = c.subCategory?.trim().toLowerCase();
  return sub && sub.length > 0 ? sub : c.need;
}

/** Clé de diversité famille : grande famille normalisée, sinon le need. */
function familyKey(c: WeeklyPickCandidate): string {
  const fam = c.family?.trim().toLowerCase();
  return fam && fam.length > 0 ? fam : c.need;
}

/** Pipeline complet (voir en-tête). Pur et déterministe. */
export function selectWeeklyPicks(
  input: SelectWeeklyPicksInput,
): WeeklyPickCandidate[] {
  const max = input.max ?? 6;
  const maxPerSub = input.maxPerSubCategory ?? 2;
  const maxPerFamily = input.maxPerFamily ?? 3;
  if (max <= 0 || maxPerSub <= 0 || maxPerFamily <= 0 || input.candidates.length === 0) {
    return [];
  }

  // 1. Dédoublonnage par EAN : première occurrence gardée (= premier need).
  const seenEans = new Set<string>();
  const deduped: WeeklyPickCandidate[] = [];
  for (const c of input.candidates) {
    if (seenEans.has(c.ean)) continue;
    seenEans.add(c.ean);
    deduped.push(c);
  }

  // 2. Sécurité restrictions (même logique que les alternatives).
  const safe = deduped.filter((c) => !isExcluded(c.ingredientsText, input.exclusion));
  if (safe.length === 0) return [];

  // 3. Score plafonné = celui qui détermine la pastille montrée au clic.
  const cappedScore = (c: WeeklyPickCandidate): number =>
    colorCapScore(c.score ?? 0, { orange: c.countOrange, rouge: c.countRouge });

  // 3b. Plancher SANTÉ sur la note PLAFONNÉE (défaut 0 = pas de filtre).
  const minScore = input.minCappedScore ?? 0;
  const healthy = minScore > 0 ? safe.filter((c) => cappedScore(c) >= minScore) : safe;
  if (healthy.length === 0) return [];

  // 4. Files par need (ordre de première apparition = ordre des needs RPC).
  const needOrder: string[] = [];
  const byNeed = new Map<string, WeeklyPickCandidate[]>();
  for (const c of healthy) {
    const q = byNeed.get(c.need);
    if (q) {
      q.push(c);
    } else {
      byNeed.set(c.need, [c]);
      needOrder.push(c.need);
    }
  }
  const queues = needOrder.map((need) => ({
    items: orderByTierShuffled(byNeed.get(need) ?? [], input.seed + ":" + need, cappedScore),
    cursor: 0,
  }));

  // 5. Round-robin entre needs avec DOUBLE garde diversité (sous-cat + famille).
  const picks: WeeklyPickCandidate[] = [];
  const subCount = new Map<string, number>();
  const famCount = new Map<string, number>();
  const deferred: WeeklyPickCandidate[] = [];

  let pickedInRound = true;
  while (picks.length < max && pickedInRound) {
    pickedInRound = false;
    for (const queue of queues) {
      if (picks.length >= max) break;
      while (queue.cursor < queue.items.length) {
        const cand = queue.items[queue.cursor];
        queue.cursor += 1;
        const sub = diversityKey(cand);
        if ((subCount.get(sub) ?? 0) >= maxPerSub) continue; // sous-cat saturée : abandon
        const fam = familyKey(cand);
        if ((famCount.get(fam) ?? 0) >= maxPerFamily) {
          deferred.push(cand); // famille saturée : gardé pour le backfill
          continue;
        }
        subCount.set(sub, (subCount.get(sub) ?? 0) + 1);
        famCount.set(fam, (famCount.get(fam) ?? 0) + 1);
        picks.push(cand);
        pickedInRound = true;
        break;
      }
    }
  }

  // 6. Backfill : famille relâchée (sous-cat toujours plafonnée).
  if (picks.length < max) {
    for (const cand of deferred) {
      if (picks.length >= max) break;
      const sub = diversityKey(cand);
      if ((subCount.get(sub) ?? 0) >= maxPerSub) continue;
      subCount.set(sub, (subCount.get(sub) ?? 0) + 1);
      picks.push(cand);
    }
  }

  return picks;
}
