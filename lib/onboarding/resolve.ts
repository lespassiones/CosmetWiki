/**
 * Shared onboarding-redirect resolver. Used right after the session is
 * established (post-signup, post-signin, OAuth callback) to decide whether
 * the user should land on the onboarding wizard or skip it.
 *
 * Three branches:
 *   1. `onboardingShown === true` → user has either completed or dismissed
 *      the wizard. Never show it again. Returns `next`.
 *   2. Profile is non-empty BUT no flag → grandfather case (existing user
 *      who filled their profile via /profile before /onboarding existed).
 *      Silently set the flag to true so step 1 catches them next time, then
 *      send them to `next` — DON'T show onboarding to a returning user who
 *      already configured everything.
 *   3. No flag AND empty profile → show onboarding. Returns the prefixed
 *      `/onboarding?next=…` URL.
 *
 * Safe-by-default: any error reading or writing falls back to `next` so we
 * never block a user from logging in just because the profile table is
 * temporarily unreachable.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { isProfileComplete, readOnboardingShown, readSkinProfile } from "@/lib/skin/profile";

export async function resolveOnboardingDestination(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: SupabaseClient<any, "cosme_check", any>,
  userId: string,
  next: string,
): Promise<string> {
  try {
    const { data: row, error } = await sb
      .schema("cosme_check")
      .from("user_profiles")
      .select("preferences")
      .eq("id", userId)
      .maybeSingle();
    if (error) return next; // fail-open: don't trap user behind onboarding

    const prefs = (row?.preferences ?? null) as Record<string, unknown> | null;

    // Branch 1 — already onboarded (completed or skipped).
    if (readOnboardingShown(prefs)) return next;

    // Branch 2 — pre-existing user with a populated profile but no flag.
    // Silently mark them as onboarded so they're never bothered again.
    const profile = readSkinProfile(prefs);
    if (isProfileComplete(profile)) {
      const merged = { ...(prefs ?? {}), onboardingShown: true };
      // Best-effort write. Errors are ignored — the redirect still happens.
      await sb
        .schema("cosme_check")
        .from("user_profiles")
        .update({ preferences: merged, updated_at: new Date().toISOString() })
        .eq("id", userId);
      return next;
    }

    // Branch 3 — fresh slate, send through the wizard.
    return next === "/"
      ? "/onboarding"
      : `/onboarding?next=${encodeURIComponent(next)}`;
  } catch {
    return next;
  }
}
