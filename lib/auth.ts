/**
 * Server-side auth helpers. The browser side is in `components/AuthProvider.tsx`.
 */
import { cache } from "react";
import { cookies } from "next/headers";
import { supabaseServer, supabaseService } from "./supabase";
import type { User } from "@supabase/supabase-js";

export type CosmetUserProfile = {
  id: string;
  first_name: string;
  tier: "free" | "premium";
  preferences: Record<string, unknown>;
};

/**
 * Returns the auth user (from Supabase Auth) for the current request, or null.
 *
 * Wrapped in React's `cache()` so all `getUser()` calls inside the same server
 * request (layout + page + nested helpers) share a single Supabase round-trip.
 */
export const getUser = cache(async (): Promise<User | null> => {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
});

/**
 * Capitalise a single token: "STELA" → "Stela", "will" → "Will".
 */
function capitaliseToken(token: string): string {
  if (!token) return "";
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

/**
 * Take the first word of a Google-style name and capitalise it cleanly.
 * "will biendou" → "Will", "Stela BIENDOU" → "Stela".
 */
function firstWord(value: string): string {
  const head = value.trim().split(/\s+/)[0] ?? "";
  return capitaliseToken(head);
}

/**
 * Best-effort name from the email local part. Splits on separators so
 * "stela.biendou" → "Stela" (first chunk), strips trailing digits so
 * "manno42" → "Manno".
 */
function fromEmailLocal(email: string | null | undefined): string {
  const local = (email ?? "").split("@")[0] ?? "";
  if (!local) return "";
  const head = local.split(/[._\-+]/)[0] ?? local;
  const cleaned = head.replace(/\d+$/, "");
  return capitaliseToken(cleaned);
}

/**
 * Derives a reasonable first_name from a Supabase user, in priority order:
 *   1. raw_user_meta_data.first_name (email/password sign-up flow),
 *   2. raw_user_meta_data.given_name (Google's preferred first-name field),
 *   3. first word of raw_user_meta_data.name (Google's display name),
 *   4. first word of raw_user_meta_data.full_name (other OAuth providers),
 *   5. capitalised local part of the email (e.g. "stelabiendou" → "Stelabiendou").
 *
 * Returns "Utilisateur" only as a last resort when even the email is missing.
 */
export function deriveFirstName(user: Pick<User, "email" | "user_metadata">): string {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

  const fromFirst = typeof meta.first_name === "string" ? meta.first_name.trim() : "";
  if (fromFirst) return capitaliseToken(firstWord(fromFirst) || fromFirst);

  const fromGiven = typeof meta.given_name === "string" ? meta.given_name.trim() : "";
  if (fromGiven) return capitaliseToken(fromGiven);

  const fromName = typeof meta.name === "string" ? firstWord(meta.name) : "";
  if (fromName) return fromName;

  const fromFull = typeof meta.full_name === "string" ? firstWord(meta.full_name) : "";
  if (fromFull) return fromFull;

  const fromEmail = fromEmailLocal(user.email);
  if (fromEmail) return fromEmail;

  return "Utilisateur";
}

/**
 * A stored `first_name` value that should be replaced by a better derivation.
 * Includes the legacy "Utilisateur" default that the SQL trigger wrote for
 * pre-fix Google sign-ups.
 */
function needsBackfill(stored: string | null | undefined): boolean {
  if (!stored) return true;
  const trimmed = stored.trim();
  return trimmed === "" || trimmed === "Utilisateur";
}

/**
 * Loads the Cosme Check profile (first_name, tier, preferences) for the current
 * user.
 *
 * Wrapped in `cache()` so concurrent calls from the layout and the page resolve
 * to a single DB query, and reuses the cached `getUser()` so we don't perform a
 * second `auth.getUser()` round-trip.
 */
export const getProfile = cache(async (): Promise<CosmetUserProfile | null> => {
  const user = await getUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data } = await sb
    .schema("cosme_check")
    .from("user_profiles")
    .select("id, first_name, tier, preferences")
    .eq("id", user.id)
    .maybeSingle();

  // Lazy backfill: a row exists but with the legacy "Utilisateur" default
  // (Google sign-ups before the trigger learned to read full_name/name).
  // Re-derive and persist via the service role so the fix sticks.
  if (data && needsBackfill((data as CosmetUserProfile).first_name)) {
    const derived = deriveFirstName(user);
    if (derived && derived !== "Utilisateur") {
      try {
        const svc = supabaseService();
        await svc
          .schema("cosme_check")
          .from("user_profiles")
          .update({ first_name: derived })
          .eq("id", user.id);
      } catch {
        // ignore - we still want to serve the derived name to the UI below
      }
      return { ...(data as CosmetUserProfile), first_name: derived };
    }
  }

  if (data) return data as CosmetUserProfile;

  // Defensive lazy creation: the trigger should have created the profile
  // on signup, but if it didn't (legacy account, race, RLS edge case),
  // create it now via the service role and serve a usable profile back.
  const fallbackFirstName = deriveFirstName(user);
  try {
    const svc = supabaseService();
    await svc
      .schema("cosme_check")
      .from("user_profiles")
      .upsert(
        { id: user.id, first_name: fallbackFirstName },
        { onConflict: "id", ignoreDuplicates: true },
      );
  } catch {
    // ignore - we'll still return a synthetic profile so the UI shows a name
  }

  return {
    id: user.id,
    first_name: fallbackFirstName,
    tier: "premium",
    preferences: {},
  };
});

/**
 * Feature gating helper. For now everyone has full access; the function is
 * here so we can later restrict premium features without touching call sites.
 */
export function canAccess(_feature: string, _profile: CosmetUserProfile | null) {
  return true;
}
