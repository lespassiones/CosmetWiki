/**
 * Server-side auth helpers. The browser side is in `components/AuthProvider.tsx`.
 */
import { cookies } from "next/headers";
import { supabaseServer, supabaseService } from "./supabase";
import type { User } from "@supabase/supabase-js";

export type CosmetUserProfile = {
  id: string;
  first_name: string;
  tier: "free" | "premium";
  preferences: Record<string, unknown>;
};

/** Returns the auth user (from Supabase Auth) for the current request, or null. */
export async function getUser() {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

/**
 * Derives a reasonable first_name from a Supabase user, preferring (in order):
 *   1. raw_user_meta_data.first_name (set by our sign-up flow),
 *   2. raw_user_meta_data.full_name (set by OAuth providers if ever added),
 *   3. capitalised local part of the email.
 */
function deriveFirstName(user: User): string {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fromMeta = typeof meta.first_name === "string" ? meta.first_name.trim() : "";
  if (fromMeta) return fromMeta;
  const fromFull = typeof meta.full_name === "string" ? meta.full_name.trim().split(" ")[0] : "";
  if (fromFull) return fromFull;
  const local = (user.email ?? "").split("@")[0];
  if (!local) return "Utilisateur";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

/** Loads the CosmetWiki profile (first_name, tier, preferences) for the current user. */
export async function getProfile(): Promise<CosmetUserProfile | null> {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data } = await sb
    .schema("cosmetwiki")
    .from("user_profiles")
    .select("id, first_name, tier, preferences")
    .eq("id", user.id)
    .maybeSingle();

  if (data) return data as CosmetUserProfile;

  // Defensive lazy creation: the trigger should have created the profile
  // on signup, but if it didn't (legacy account, race, RLS edge case),
  // create it now via the service role and serve a usable profile back.
  const fallbackFirstName = deriveFirstName(user);
  try {
    const svc = supabaseService();
    await svc
      .schema("cosmetwiki")
      .from("user_profiles")
      .upsert(
        { id: user.id, first_name: fallbackFirstName },
        { onConflict: "id", ignoreDuplicates: true },
      );
  } catch {
    // ignore — we'll still return a synthetic profile so the UI shows a name
  }

  return {
    id: user.id,
    first_name: fallbackFirstName,
    tier: "premium",
    preferences: {},
  };
}

/**
 * Feature gating helper. For now everyone has full access; the function is
 * here so we can later restrict premium features without touching call sites.
 */
export function canAccess(_feature: string, _profile: CosmetUserProfile | null) {
  return true;
}
