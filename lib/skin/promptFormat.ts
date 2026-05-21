/**
 * Helpers that load a user's skin profile and render it as a short block of
 * text that AI prompts can splice in. Centralises the format so analyser /
 * coherence / advisor stay consistent — change the wording here and all
 * three routes pick it up.
 *
 * Returns `null` (not an empty string) when the user is anonymous or has
 * filled nothing useful, so callers can branch cheaply on truthiness:
 *
 *   const profileBlock = await loadProfileForPrompt(userId);
 *   const systemPrompt = profileBlock
 *     ? `${BASE_PROMPT}\n\n${profileBlock}`
 *     : BASE_PROMPT;
 */
import "server-only";
import { cookies } from "next/headers";
import { supabaseServer } from "../supabase";
import {
  HAIR_CONCERN_LABEL,
  readSkinProfile,
  SKIN_CONCERN_LABEL,
  SKIN_TYPE_BODY_LABEL,
  SKIN_TYPE_FACE_LABEL,
  type SkinProfile,
} from "./profile";

/**
 * Convert a SkinProfile into a French summary block suitable for an LLM
 * system prompt. Skips empty/missing fields rather than printing
 * "(non renseigné)" so the LLM doesn't burn tokens on irrelevant info.
 *
 * Returns `null` if the profile is essentially empty (no signal worth
 * passing to the model).
 */
export function formatSkinProfileForPrompt(skin: SkinProfile): string | null {
  const lines: string[] = [];

  // Face & body skin type — preset, custom, or both. Each section is its
  // own line so the LLM can recommend face vs body products independently.
  const faceParts: string[] = [];
  if (skin.skinTypeFace) faceParts.push(SKIN_TYPE_FACE_LABEL[skin.skinTypeFace]);
  if (skin.otherSkinTypeFace) faceParts.push(`précision : ${skin.otherSkinTypeFace}`);
  if (faceParts.length > 0) {
    lines.push(`- Type de peau visage : ${faceParts.join(" — ")}`);
  }

  const bodyParts: string[] = [];
  if (skin.skinTypeBody) bodyParts.push(SKIN_TYPE_BODY_LABEL[skin.skinTypeBody]);
  if (skin.otherSkinTypeBody) bodyParts.push(`précision : ${skin.otherSkinTypeBody}`);
  if (bodyParts.length > 0) {
    lines.push(`- Type de peau corps : ${bodyParts.join(" — ")}`);
  }

  // Concerns
  const concernParts: string[] = [];
  if (skin.concerns && skin.concerns.length > 0) {
    concernParts.push(skin.concerns.map((c) => SKIN_CONCERN_LABEL[c]).join(", "));
  }
  if (skin.otherConcerns) concernParts.push(skin.otherConcerns);
  if (concernParts.length > 0) {
    lines.push(`- Préoccupations : ${concernParts.join(" ; ")}`);
  }

  // Hair
  const hairParts: string[] = [];
  if (skin.hairConcerns && skin.hairConcerns.length > 0) {
    hairParts.push(skin.hairConcerns.map((c) => HAIR_CONCERN_LABEL[c]).join(", "));
  }
  if (skin.otherHair) hairParts.push(skin.otherHair);
  if (hairParts.length > 0) {
    lines.push(`- Cheveux : ${hairParts.join(" ; ")}`);
  }

  if (skin.allergiesFreeform) {
    lines.push(`- Allergies / intolérances : ${skin.allergiesFreeform}`);
  }

  if (skin.otherNotes) {
    lines.push(`- Autres précisions : ${skin.otherNotes}`);
  }

  if (lines.length === 0) return null;

  return [
    "PROFIL DE L'UTILISATEUR (à prendre en compte pour personnaliser ta réponse) :",
    ...lines,
    "Adapte tes recommandations à ce profil. Cite les éléments du profil quand c'est pertinent (ex : « pour une peau sèche, … »).",
  ].join("\n");
}

/**
 * Load the signed-in user's skin profile from cosme_check.user_profiles and
 * format it for prompt injection in one call. Returns `null` if the user is
 * anonymous, the row is missing, or the profile is empty.
 *
 * Safe to call from any server route — fails closed (returns null on error).
 */
export async function loadProfileForPrompt(userId: string): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sb = supabaseServer(cookieStore);
    const { data } = await sb
      .schema("cosme_check")
      .from("user_profiles")
      .select("preferences")
      .eq("id", userId)
      .maybeSingle();
    const prefs = (data?.preferences ?? null) as Record<string, unknown> | null;
    const skin = readSkinProfile(prefs);
    return formatSkinProfileForPrompt(skin);
  } catch {
    // Best-effort enrichment — never let a profile-fetch error break an
    // analyse. The route just runs without personalisation.
    return null;
  }
}
