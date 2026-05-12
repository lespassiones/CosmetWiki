/**
 * User skin profile. Stored in cosmetwiki.user_profiles.preferences (jsonb)
 * under the `skin` key.
 */

export const SKIN_TYPES = ["seche", "mixte", "grasse", "sensible", "normale"] as const;
export type SkinType = typeof SKIN_TYPES[number];

export const SKIN_CONCERNS = [
  "acne",
  "anti-age",
  "taches",
  "secheresse",
  "rougeurs",
  "sensibilite",
  "pores_dilates",
  "cuir_chevelu",
] as const;
export type SkinConcern = typeof SKIN_CONCERNS[number];

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
};

export type SkinProfile = {
  skinType?: SkinType;
  concerns?: SkinConcern[];
  allergiesFreeform?: string;
};

export function readSkinProfile(prefs: Record<string, unknown> | null | undefined): SkinProfile {
  if (!prefs || typeof prefs !== "object") return {};
  const raw = (prefs as { skin?: unknown }).skin;
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Partial<Record<keyof SkinProfile, unknown>>;
  return {
    skinType: SKIN_TYPES.includes(r.skinType as SkinType) ? (r.skinType as SkinType) : undefined,
    concerns: Array.isArray(r.concerns)
      ? (r.concerns as unknown[]).filter((c): c is SkinConcern => SKIN_CONCERNS.includes(c as SkinConcern))
      : undefined,
    allergiesFreeform: typeof r.allergiesFreeform === "string" ? r.allergiesFreeform.slice(0, 500) : undefined,
  };
}

export function isProfileComplete(p: SkinProfile): boolean {
  return Boolean(p.skinType && p.concerns && p.concerns.length > 0);
}
