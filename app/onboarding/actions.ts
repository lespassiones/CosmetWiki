"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase";
import {
  HAIR_CONCERNS,
  PROFILE_GOALS,
  SKIN_CONCERNS,
  SKIN_TYPES_BODY,
  SKIN_TYPES_FACE,
  type HairConcern,
  type ProfileGoal,
  type SkinConcern,
  type SkinProfile,
  type SkinTypeBody,
  type SkinTypeFace,
} from "@/lib/skin/profile";

export type OnboardingResult = { ok: true } | { ok: false; error: string };

/** Identifies which of the 3 onboarding steps the form belongs to. The step
 *  determines which fields we touch — every other field on `skin` is left
 *  intact (no clobbering across steps). */
type OnboardingStep = "skin" | "concerns" | "goals";

const VALID_STEPS = new Set<OnboardingStep>(["skin", "concerns", "goals"]);

/**
 * Save the partial profile for a single onboarding step.
 *
 * - Each step touches only its own fields.
 * - Empty submissions are allowed (the user clicked "Suivant" without filling
 *   anything) — we still mark `onboardingShown` so they don't see the wizard
 *   again on next login.
 */
export async function saveOnboardingStep(form: FormData): Promise<OnboardingResult> {
  const stepRaw = String(form.get("step") ?? "");
  if (!VALID_STEPS.has(stepRaw as OnboardingStep)) {
    return { ok: false, error: "Étape invalide." };
  }
  const step = stepRaw as OnboardingStep;

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Non connecté." };

  // Read existing preferences so we merge fields per-step rather than
  // replacing the whole `skin` blob each time.
  const { data: existing } = await sb
    .schema("cosme_check")
    .from("user_profiles")
    .select("preferences")
    .eq("id", user.id)
    .maybeSingle();

  const prefs = (existing?.preferences ?? {}) as Record<string, unknown>;
  const existingSkin: SkinProfile = (prefs.skin as SkinProfile | undefined) ?? {};

  let updatedSkin: SkinProfile = { ...existingSkin };

  if (step === "skin") {
    const skinTypeFaceRaw = String(form.get("skin_type_face") ?? "");
    const otherSkinTypeFace = String(form.get("other_skin_type_face") ?? "")
      .slice(0, 120)
      .trim();
    const skinTypeFace: SkinTypeFace | undefined = SKIN_TYPES_FACE.includes(
      skinTypeFaceRaw as SkinTypeFace,
    )
      ? (skinTypeFaceRaw as SkinTypeFace)
      : undefined;

    const skinTypeBodyRaw = String(form.get("skin_type_body") ?? "");
    const otherSkinTypeBody = String(form.get("other_skin_type_body") ?? "")
      .slice(0, 120)
      .trim();
    const skinTypeBody: SkinTypeBody | undefined = SKIN_TYPES_BODY.includes(
      skinTypeBodyRaw as SkinTypeBody,
    )
      ? (skinTypeBodyRaw as SkinTypeBody)
      : undefined;

    const hairConcerns = form
      .getAll("hair_concerns")
      .map(String)
      .filter((c): c is HairConcern => HAIR_CONCERNS.includes(c as HairConcern));
    const otherHair = String(form.get("other_hair") ?? "").slice(0, 200).trim();

    updatedSkin = {
      ...updatedSkin,
      skinTypeFace,
      otherSkinTypeFace: otherSkinTypeFace || undefined,
      skinTypeBody,
      otherSkinTypeBody: otherSkinTypeBody || undefined,
      hairConcerns: hairConcerns.length > 0 ? hairConcerns : undefined,
      otherHair: otherHair || undefined,
    };
  } else if (step === "concerns") {
    const concerns = form
      .getAll("concerns")
      .map(String)
      .filter((c): c is SkinConcern =>
        SKIN_CONCERNS.includes(c as (typeof SKIN_CONCERNS)[number]),
      );
    const otherConcerns = String(form.get("other_concerns") ?? "")
      .slice(0, 300)
      .trim();
    const allergiesFreeform = String(form.get("allergies") ?? "")
      .slice(0, 500)
      .trim();
    const otherNotes = String(form.get("other_notes") ?? "").slice(0, 500).trim();

    updatedSkin = {
      ...updatedSkin,
      concerns: concerns.length > 0 ? concerns : undefined,
      otherConcerns: otherConcerns || undefined,
      allergiesFreeform: allergiesFreeform || undefined,
      otherNotes: otherNotes || undefined,
    };
  } else {
    // step === "goals"
    const goals = form
      .getAll("goals")
      .map(String)
      .filter((g): g is ProfileGoal => PROFILE_GOALS.includes(g as ProfileGoal));
    const otherGoals = String(form.get("other_goals") ?? "").slice(0, 300).trim();

    updatedSkin = {
      ...updatedSkin,
      goals: goals.length > 0 ? goals : undefined,
      otherGoals: otherGoals || undefined,
    };
  }

  const merged = {
    ...prefs,
    skin: updatedSkin,
    onboardingShown: true,
  };

  const { error } = await sb
    .schema("cosme_check")
    .from("user_profiles")
    .update({ preferences: merged, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/onboarding");
  revalidatePath("/profile");
  revalidatePath("/advisor");
  return { ok: true };
}

/**
 * Mark the onboarding as "shown" without saving any profile field. Called
 * when the user clicks "Passer" on a step (or "Plus tard" globally). Once
 * this flag is set, /onboarding won't auto-trigger on subsequent logins —
 * the user can still complete the profile manually from /profile.
 */
export async function dismissOnboarding(): Promise<OnboardingResult> {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Non connecté." };

  const { data: existing } = await sb
    .schema("cosme_check")
    .from("user_profiles")
    .select("preferences")
    .eq("id", user.id)
    .maybeSingle();

  const prefs = (existing?.preferences ?? {}) as Record<string, unknown>;
  if (prefs.onboardingShown === true) return { ok: true };

  const merged = { ...prefs, onboardingShown: true };
  const { error } = await sb
    .schema("cosme_check")
    .from("user_profiles")
    .update({ preferences: merged, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
