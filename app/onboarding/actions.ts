"use server";

import { cookies } from "next/headers";
import { phCapture } from "@/lib/posthogServer";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase";
import { buildConsent } from "@/lib/consent";
import { syncBrevoContact } from "@/lib/brevo";
import {
  HAIR_CONCERNS,
  PROFILE_GOAL_LABEL,
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
 *  determines which fields we touch - every other field on `skin` is left
 *  intact (no clobbering across steps). */
type OnboardingStep = "skin" | "concerns" | "goals";

const VALID_STEPS = new Set<OnboardingStep>(["skin", "concerns", "goals"]);

/**
 * Save the partial profile for a single onboarding step.
 *
 * - Each step touches only its own fields.
 * - Empty submissions are allowed (the user clicked "Suivant" without filling
 *   anything) - we still mark `onboardingShown` so they don't see the wizard
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

    const hairConcernsRaw = form
      .getAll("hair_concerns")
      .map(String)
      .filter((c): c is HairConcern => HAIR_CONCERNS.includes(c as HairConcern));
    const otherHair = String(form.get("other_hair") ?? "").slice(0, 200).trim();

    // Step 1 owns the "Type / état général des cheveux" sub-set (Secs / Gras
    // / Cuir chevelu sensible). Keep any step-2 hair problems (chute,
    // pellicules, ternes_cassants) the user may have already saved so we
    // don't clobber them when they navigate back to step 1.
    const STEP1_HAIR = new Set<HairConcern>(["secs", "gras", "cuir_chevelu_sensible"]);
    const previousHair = new Set(existingSkin.hairConcerns ?? []);
    const mergedHair = new Set<HairConcern>();
    previousHair.forEach((c) => {
      if (!STEP1_HAIR.has(c)) mergedHair.add(c);
    });
    hairConcernsRaw.forEach((c) => {
      if (STEP1_HAIR.has(c)) mergedHair.add(c);
    });

    updatedSkin = {
      ...updatedSkin,
      skinTypeFace,
      otherSkinTypeFace: otherSkinTypeFace || undefined,
      skinTypeBody,
      otherSkinTypeBody: otherSkinTypeBody || undefined,
      hairConcerns: mergedHair.size > 0 ? Array.from(mergedHair) : undefined,
      otherHair: otherHair || undefined,
    };
  } else if (step === "concerns") {
    const concerns = form
      .getAll("concerns")
      .map(String)
      .filter((c): c is SkinConcern =>
        SKIN_CONCERNS.includes(c as (typeof SKIN_CONCERNS)[number]),
      );
    // Step 2 now also surfaces a handful of hair-only concerns (chute,
    // pellicules, ternes/cassants) in the same picker. We accept those
    // alongside the skin concerns and merge them into `hairConcerns` so the
    // downstream AI sees a unified picture.
    const hairProblemConcerns = form
      .getAll("hair_problem_concerns")
      .map(String)
      .filter((c): c is HairConcern =>
        HAIR_CONCERNS.includes(c as HairConcern),
      );
    const otherConcerns = String(form.get("other_concerns") ?? "")
      .slice(0, 300)
      .trim();
    const allergiesFreeform = String(form.get("allergies") ?? "")
      .slice(0, 500)
      .trim();
    const otherNotes = String(form.get("other_notes") ?? "").slice(0, 500).trim();

    // Merge step-2 hair problems into the hairConcerns array WITHOUT clobbering
    // step-1 state (Secs / Gras / Cuir chevelu sensible). We keep the step-1
    // entries and add the step-2 ones; values absent from the form are removed
    // from the step-2 sub-set only.
    const previousHair = new Set(existingSkin.hairConcerns ?? []);
    const STEP1_HAIR = new Set<HairConcern>(["secs", "gras", "cuir_chevelu_sensible"]);
    const STEP2_HAIR = new Set<HairConcern>(["chute", "pellicules", "ternes_cassants"]);
    const mergedHair = new Set<HairConcern>();
    previousHair.forEach((c) => {
      if (STEP1_HAIR.has(c)) mergedHair.add(c);
    });
    hairProblemConcerns.forEach((c) => {
      if (STEP2_HAIR.has(c)) mergedHair.add(c);
    });

    updatedSkin = {
      ...updatedSkin,
      concerns: concerns.length > 0 ? concerns : undefined,
      hairConcerns: mergedHair.size > 0 ? Array.from(mergedHair) : undefined,
      otherConcerns: otherConcerns || undefined,
      allergiesFreeform: allergiesFreeform || undefined,
      otherNotes: otherNotes || undefined,
    };
  } else {
    // step === "goals"
    const goals = form
      .getAll("goals")
      .map(String)
      // Accept the new picker values AND any legacy ones still stored on old
      // profiles (PROFILE_GOAL_LABEL has both, PROFILE_GOALS only the new).
      .filter((g): g is ProfileGoal => g in PROFILE_GOAL_LABEL);
    const otherGoals = String(form.get("other_goals") ?? "").slice(0, 300).trim();

    updatedSkin = {
      ...updatedSkin,
      goals: goals.length > 0 ? goals : undefined,
      otherGoals: otherGoals || undefined,
    };
  }

  // IMPORTANT - we DON'T set `onboardingShown: true` here. This action runs
  // on every keystroke via the auto-save effect, so flipping the flag would
  // immediately bounce the user out of the wizard (the page reads the flag
  // server-side and redirect()s when true). The flag is set only by
  // `completeOnboarding` (final step's Continuer) or `dismissOnboarding`
  // (Plus tard / Passer).
  //
  // We also DON'T call revalidatePath("/onboarding") here for the same
  // reason: it forces the server component to re-run and would interrupt
  // the user mid-input. Other paths (/profile, /advisor) are revalidated by
  // the terminal actions below - no need on every keystroke either.
  const merged = {
    ...prefs,
    skin: updatedSkin,
  };

  const { error } = await sb
    .schema("cosme_check")
    .from("user_profiles")
    .update({ preferences: merged, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Terminal action called on the very last "Continuer" click of the wizard.
 * Marks the onboarding as completed (sets `onboardingShown: true`) and
 * revalidates the surrounding pages so they pick up the fresh profile on
 * the next navigation. Safe to call multiple times.
 */
export async function completeOnboarding(): Promise<OnboardingResult> {
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
  if (prefs.onboardingShown === true) {
    revalidatePath("/onboarding");
    revalidatePath("/profile");
    revalidatePath("/advisor");
    return { ok: true };
  }

  const merged = { ...prefs, onboardingShown: true };
  const { error } = await sb
    .schema("cosme_check")
    .from("user_profiles")
    .update({ preferences: merged, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  phCapture("onboarding_completed", user.id);

  revalidatePath("/onboarding");
  revalidatePath("/profile");
  revalidatePath("/advisor");
  return { ok: true };
}

/**
 * Mark the onboarding as "shown" without saving any profile field. Called
 * when the user clicks "Passer" on a step (or "Plus tard" globally). Once
 * this flag is set, /onboarding won't auto-trigger on subsequent logins -
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

/**
 * Enregistre le consentement (CGU obligatoire + opt-in marketing) capté par le
 * modal affiché AVANT les questions de profil. Cible principalement les
 * inscriptions Google, qui ne passent pas par le formulaire email (où le
 * consentement est déjà recueilli). Stocke dans preferences.consent et, si
 * l'opt-in marketing est coché, synchronise le contact vers Brevo après la
 * réponse (fail-open).
 */
export async function saveConsent(marketing: boolean): Promise<OnboardingResult> {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Non connecté." };

  const { data: existing } = await sb
    .schema("cosme_check")
    .from("user_profiles")
    .select("preferences, first_name")
    .eq("id", user.id)
    .maybeSingle();

  const prefs = (existing?.preferences ?? {}) as Record<string, unknown>;
  const consent = buildConsent(marketing);

  const { error } = await sb
    .schema("cosme_check")
    .from("user_profiles")
    .update({
      preferences: { ...prefs, consent },
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  // Synchro Brevo pour TOUS les inscrits (liste « Tous les inscrits ») ; l'opt-in
  // marketing les ajoute en plus à « Newsletter » (géré par syncBrevoContact).
  if (user.email) {
    const firstName = (existing?.first_name as string | null) ?? null;
    const email = user.email;
    after(() => syncBrevoContact({ email, firstName, marketing }));
  }

  return { ok: true };
}
