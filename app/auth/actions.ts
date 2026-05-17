"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { SITE_URL } from "@/lib/siteUrl";

export type AuthResult = { ok: true } | { ok: false; error: string };

async function resolveOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "https";
    if (host) return `${proto}://${host}`;
  } catch {
    // ignored
  }
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
    options: { data: { first_name: firstName } },
  });

  if (error) return { ok: false, error: error.message };
  redirect(next);
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email.includes("@")) return { ok: false, error: "Email invalide." };
  if (password.length < 1) return { ok: false, error: "Mot de passe requis." };

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: "Email ou mot de passe incorrect." };
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
  const origin = await resolveOrigin();

  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
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

  const origin = await resolveOrigin();
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

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
