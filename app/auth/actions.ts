"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { SITE_URL } from "@/lib/siteUrl";
import { resolveOnboardingDestination } from "@/lib/onboarding/resolve";

export type AuthResult = { ok: true } | { ok: false; error: string };

// SITE_URL is the canonical, env-driven origin (NEXT_PUBLIC_SITE_URL in prod,
// VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL as fallbacks). Using a request
// header here (x-forwarded-host) would let a forged Host send the OAuth /
// password-reset redirect to an attacker-controlled domain → session theft.
function authOrigin(): string {
  return SITE_URL;
}

/**
 * Accept only same-origin, absolute-path redirect targets so a hostile `next`
 * value can't bounce a signed-in user to a third-party site.
 */
function safeNext(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value : "";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (firstName.length < 1) return { ok: false, error: "Prénom requis." };
  if (!email.includes("@")) return { ok: false, error: "Email invalide." };
  if (password.length < 8) return { ok: false, error: "Mot de passe trop court (8 caractères minimum)." };
  if (!/[a-z]/.test(password)) return { ok: false, error: "Le mot de passe doit contenir au moins une minuscule." };
  if (!/[A-Z]/.test(password)) return { ok: false, error: "Le mot de passe doit contenir au moins une majuscule." };
  if (!/[0-9]/.test(password)) return { ok: false, error: "Le mot de passe doit contenir au moins un chiffre." };

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);

  const { error } = await sb.auth.signUp({
    email,
    password,
    // `signup_platform` est copié dans user_profiles.signup_platform par le
    // trigger handle_new_user → distingue les inscriptions web vs mobile.
    options: { data: { first_name: firstName, signup_platform: "web" } },
  });

  if (error) return { ok: false, error: error.message };
  // Send fresh signups through the 3-step onboarding wizard. The wizard
  // forwards to `next` once the user finishes or dismisses. A returning user
  // would never hit this branch (signUp creates a new account here).
  const onboardingUrl =
    next === "/"
      ? "/onboarding"
      : `/onboarding?next=${encodeURIComponent(next)}`;
  redirect(onboardingUrl);
}

/** Timeout dur sur l'appel Auth pour ne pas tenir une Server Action 25 s
 *  quand Supabase Auth (pgbouncer / GoTrue) est indisponible. Renvoie un
 *  message distinct du vrai "mauvais mot de passe". */
const SIGNIN_TIMEOUT_MS = 8000;

export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email.includes("@")) return { ok: false, error: "Email invalide." };
  if (password.length < 1) return { ok: false, error: "Mot de passe requis." };

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);

  type SimplifiedError = { message: string; code?: string } | null;
  const { error } = await Promise.race<{ error: SimplifiedError }>([
    sb.auth.signInWithPassword({ email, password }) as Promise<{ error: SimplifiedError }>,
    new Promise<{ error: SimplifiedError }>((resolve) =>
      setTimeout(
        () => resolve({ error: { message: "client_timeout", code: "timeout" } }),
        SIGNIN_TIMEOUT_MS,
      ),
    ),
  ]);

  if (error) {
    const msg = error.message?.toLowerCase() ?? "";
    // Erreurs réseau / timeout : afficher un message distinct du vrai
    // "mauvais mot de passe" pour ne pas désorienter l'utilisateur.
    if (
      msg.includes("client_timeout") ||
      msg.includes("fetch") ||
      msg.includes("network") ||
      msg.includes("timeout") ||
      msg.includes("upstream") ||
      error.code === "timeout"
    ) {
      return {
        ok: false,
        error: "Service temporairement indisponible. Réessaye dans quelques secondes.",
      };
    }
    if (msg.includes("not confirmed") || msg.includes("email_not_confirmed")) {
      return { ok: false, error: "Email non confirmé. Vérifie ta boîte mail." };
    }
    return { ok: false, error: "Email ou mot de passe incorrect." };
  }
  // After a successful sign-in we route the user through /onboarding if they
  // have never been shown the wizard AND their profile is still empty. This
  // catches pre-existing accounts created before /onboarding existed: the
  // FIRST login after the feature ships sends them there once. The resolver
  // is fail-open (any error → just go to `next`).
  const { data: { user } } = await sb.auth.getUser();
  if (user) {
    const dest = await resolveOnboardingDestination(sb, user.id, next);
    redirect(dest);
  }
  redirect(next);
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  await sb.auth.signOut();
  redirect("/");
}

/**
 * Sends a password-reset email. Always returns `ok: true` to avoid leaking
 * whether the email exists in our user base (anti-enumeration).
 */
export async function requestPasswordReset(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { ok: false, error: "Email invalide." };

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);

  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${authOrigin()}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    console.warn("[auth] resetPasswordForEmail:", error.message);
  }
  return { ok: true };
}

/**
 * Updates the password of the currently signed-in user. Used by the
 * /auth/reset-password page, which requires a fresh recovery session set by
 * the email callback. Same complexity rules as signUp.
 */
export async function updatePassword(formData: FormData): Promise<AuthResult> {
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) return { ok: false, error: "Mot de passe trop court (8 caractères minimum)." };
  if (!/[a-z]/.test(password)) return { ok: false, error: "Le mot de passe doit contenir au moins une minuscule." };
  if (!/[A-Z]/.test(password)) return { ok: false, error: "Le mot de passe doit contenir au moins une majuscule." };
  if (!/[0-9]/.test(password)) return { ok: false, error: "Le mot de passe doit contenir au moins un chiffre." };

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);

  const { data: userData } = await sb.auth.getUser();
  if (!userData.user) return { ok: false, error: "Session expirée. Demandez un nouveau lien de réinitialisation." };

  const { error } = await sb.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const next = safeNext(formData.get("next"));
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);

  const redirectTo = `${authOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;

  const { data, error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error || !data?.url) {
    redirect(`/auth/sign-in?error=oauth`);
  }
  redirect(data.url);
}
