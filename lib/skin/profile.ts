/**
 * User skin profile. Stored in cosme_check.user_profiles.preferences (jsonb)
 * under the `skin` key.
 */

// ─── Face skin type ───────────────────────────────────────────────────────

export const SKIN_TYPES_FACE = [
  "seche",
  "mixte",
  "grasse",
  "sensible",
  "normale",
] as const;
export type SkinTypeFace = typeof SKIN_TYPES_FACE[number];

export const SKIN_TYPE_FACE_LABEL: Record<SkinTypeFace, string> = {
  seche: "Sèche",
  mixte: "Mixte",
  grasse: "Grasse",
  sensible: "Sensible",
  normale: "Normale",
};

// ─── Body skin type ───────────────────────────────────────────────────────

export const SKIN_TYPES_BODY = [
  "seche",
  "tres_seche",
  "normale",
  "sensible",
  "mixte",
] as const;
export type SkinTypeBody = typeof SKIN_TYPES_BODY[number];

export const SKIN_TYPE_BODY_LABEL: Record<SkinTypeBody, string> = {
  seche: "Sèche",
  tres_seche: "Très sèche / atopique",
  normale: "Normale",
  sensible: "Sensible / réactive",
  mixte: "Mixte (zones sèches et grasses)",
};

// ─── Skin concerns ────────────────────────────────────────────────────────

// Concerns shown in the SKIN picker. "cuir_chevelu" + "cheveux" used to live
// here too - they now have a dedicated "Cheveux" section (HAIR_CONCERNS).
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
  | "cuir_chevelu"  // legacy - migrated to HairConcern.cuir_chevelu_sensible
  | "cheveux";       // legacy - dropped (was too ambiguous between secs/gras)

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

// ─── Hair section ─────────────────────────────────────────────────────────

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

// ─── Profile ──────────────────────────────────────────────────────────────

export type SkinProfile = {
  /** Face skin type (preset). */
  skinTypeFace?: SkinTypeFace;
  /** Free-text fallback when the user picked "Autre…" for the face. */
  otherSkinTypeFace?: string;
  /** Body skin type (preset). */
  skinTypeBody?: SkinTypeBody;
  /** Free-text fallback when the user picked "Autre…" for the body. */
  otherSkinTypeBody?: string;
  concerns?: SkinConcern[];
  /** Hair-specific concerns. Optional - the picker stays hidden in the
   *  ReadView when empty. */
  hairConcerns?: HairConcern[];
  allergiesFreeform?: string;
  otherConcerns?: string;
  otherHair?: string;
  /** Free-text catch-all for anything the user wants to flag that doesn't
   *  fit the buckets above. Surfaces in every AI prompt. */
  otherNotes?: string;
};

export function readSkinProfile(prefs: Record<string, unknown> | null | undefined): SkinProfile {
  if (!prefs || typeof prefs !== "object") return {};
  const raw = (prefs as { skin?: unknown }).skin;
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;

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
  if (rawConcerns.includes("cuir_chevelu")) hairSet.add("cuir_chevelu_sensible");

  const readShort = (key: string, max: number): string | undefined => {
    const v = r[key];
    if (typeof v !== "string") return undefined;
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed.slice(0, max) : undefined;
  };

  // Face skin type — read the new field, then fall back to legacy `skinType`
  // ONLY if the new face field is unset. Legacy installs answered the single
  // question with a face-oriented intent, but the user asked to migrate
  // legacy values into the BODY slot, so we route them there instead (see
  // `skinTypeBody` below).
  const skinTypeFace = SKIN_TYPES_FACE.includes(r.skinTypeFace as SkinTypeFace)
    ? (r.skinTypeFace as SkinTypeFace)
    : undefined;
  const otherSkinTypeFace = readShort("otherSkinTypeFace", 120);

  // Body skin type — new field OR legacy `skinType` (any preset value that
  // also exists in SKIN_TYPES_BODY) OR legacy `otherSkinType` → other body.
  const newBody = SKIN_TYPES_BODY.includes(r.skinTypeBody as SkinTypeBody)
    ? (r.skinTypeBody as SkinTypeBody)
    : undefined;
  const legacyBody = SKIN_TYPES_BODY.includes(r.skinType as SkinTypeBody)
    ? (r.skinType as SkinTypeBody)
    : undefined;
  const skinTypeBody = newBody ?? legacyBody;
  const otherSkinTypeBody =
    readShort("otherSkinTypeBody", 120) ?? readShort("otherSkinType", 120);

  return {
    skinTypeFace,
    otherSkinTypeFace,
    skinTypeBody,
    otherSkinTypeBody,
    concerns: cleanedConcerns.length > 0 ? cleanedConcerns : undefined,
    hairConcerns: hairSet.size > 0 ? Array.from(hairSet) : undefined,
    allergiesFreeform: readShort("allergiesFreeform", 500),
    otherConcerns: readShort("otherConcerns", 300),
    otherHair: readShort("otherHair", 200),
    otherNotes: readShort("otherNotes", 500),
  };
}

export function isProfileComplete(p: SkinProfile): boolean {
  // Nothing is required - the profile is considered "started" as soon as
  // the user has filled at least one signal. Used by /advisor to decide
  // between the onboarding form and the chat (with the saved summary chip).
  return (
    Boolean(p.skinTypeFace) ||
    Boolean(p.otherSkinTypeFace) ||
    Boolean(p.skinTypeBody) ||
    Boolean(p.otherSkinTypeBody) ||
    (p.concerns?.length ?? 0) > 0 ||
    Boolean(p.otherConcerns) ||
    (p.hairConcerns?.length ?? 0) > 0 ||
    Boolean(p.otherHair) ||
    Boolean(p.allergiesFreeform) ||
    Boolean(p.otherNotes)
  );
}
