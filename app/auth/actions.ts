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
  if (password.length < 6) return { ok: false, error: "Mot de passe trop court (6 caractères minimum)." };

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
