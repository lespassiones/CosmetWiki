/**
 * User skin profile. Stored in cosme_check.user_profiles.preferences (jsonb)
 * under the `skin` key.
 */

export const SKIN_TYPES = ["seche", "mixte", "grasse", "sensible", "normale"] as const;
export type SkinType = typeof SKIN_TYPES[number];

// Concerns shown in the SKIN picker. "cuir_chevelu" + "cheveux" used to live
// here too — they now have a dedicated "Cheveux" section (HAIR_CONCERNS).
// The values are kept in the SkinConcern union for backwards compatibility
// with profiles saved before the split, but they no longer appear in the
// picker. `readSkinProfile` migrates any leftover values into the new
// hairConcerns array so users don't lose their previous choice.
export const SKIN_CONCERNS = [
  "acne",
  "anti-age",
  "taches",
  "secheresse",
  "rougeurs",
  "sensibilite",
  "pores_dilates",
] as const;
export type SkinConcern =
  | typeof SKIN_CONCERNS[number]
  | "cuir_chevelu"  // legacy — migrated to HairConcern.cuir_chevelu_sensible
  | "cheveux";       // legacy — dropped (was too ambiguous between secs/gras)

export const SKIN_TYPE_LABEL: Record<SkinType, string> = {
  seche: "Sèche",
  mixte: "Mixte",
  grasse: "Grasse",
  sensible: "Sensible",
  normale: "Normale",
};

export const SKIN_CONCERN_LABEL: Record<SkinConcern, string> = {
  acne: "Acné / imperfections",
  "anti-age": "Anti-âge",
  taches: "Taches pigmentaires",
  secheresse: "Sécheresse",
  rougeurs: "Rougeurs",
  sensibilite: "Sensibilité",
  pores_dilates: "Pores dilatés",
  cuir_chevelu: "Cuir chevelu",
  cheveux: "Cheveux (longueurs)",
};

// ─── Hair section (separate picker) ───────────────────────────────────────

export const HAIR_CONCERNS = [
  "secs",
  "gras",
  "cuir_chevelu_sensible",
] as const;
export type HairConcern = typeof HAIR_CONCERNS[number];

export const HAIR_CONCERN_LABEL: Record<HairConcern, string> = {
  secs: "Secs",
  gras: "Gras",
  cuir_chevelu_sensible: "Cuir chevelu sensible / affecté",
};

export type SkinProfile = {
  skinType?: SkinType;
  concerns?: SkinConcern[];
  /** Hair-specific concerns. Optional — the picker stays hidden in the
   *  ReadView when empty. */
  hairConcerns?: HairConcern[];
  allergiesFreeform?: string;
};

export function readSkinProfile(prefs: Record<string, unknown> | null | undefined): SkinProfile {
  if (!prefs || typeof prefs !== "object") return {};
  const raw = (prefs as { skin?: unknown }).skin;
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Partial<Record<keyof SkinProfile, unknown>>;

  // Read concerns, but split out the legacy "cuir_chevelu" / "cheveux" entries
  // and migrate them into the hair section instead.
  const rawConcerns: SkinConcern[] = Array.isArray(r.concerns)
    ? (r.concerns as unknown[]).filter(
        (c): c is SkinConcern =>
          SKIN_CONCERNS.includes(c as (typeof SKIN_CONCERNS)[number])
          || c === "cuir_chevelu"
          || c === "cheveux",
      )
    : [];

  // Concerns to keep in the skin section (drop legacy hair-ish ones).
  const cleanedConcerns = rawConcerns.filter(
    (c) => c !== "cuir_chevelu" && c !== "cheveux",
  ) as SkinConcern[];

  // Hair concerns: read existing + migrate from legacy.
  const rawHair = Array.isArray(r.hairConcerns)
    ? (r.hairConcerns as unknown[]).filter((c): c is HairConcern =>
        HAIR_CONCERNS.includes(c as HairConcern),
      )
    : [];
  const hairSet = new Set<HairConcern>(rawHair);
  // Legacy "cuir_chevelu" in concerns → "cuir_chevelu_sensible" in hairConcerns.
  // Legacy "cheveux" is too vague (secs vs gras) — we drop it silently.
  if (rawConcerns.includes("cuir_chevelu")) hairSet.add("cuir_chevelu_sensible");

  return {
    skinType: SKIN_TYPES.includes(r.skinType as SkinType) ? (r.skinType as SkinType) : undefined,
    concerns: cleanedConcerns.length > 0 ? cleanedConcerns : undefined,
    hairConcerns: hairSet.size > 0 ? Array.from(hairSet) : undefined,
    allergiesFreeform: typeof r.allergiesFreeform === "string" ? r.allergiesFreeform.slice(0, 500) : undefined,
  };
}

export function isProfileComplete(p: SkinProfile): boolean {
  return Boolean(p.skinType && p.concerns && p.concerns.length > 0);
}
