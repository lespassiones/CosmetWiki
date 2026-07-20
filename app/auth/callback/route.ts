import { NextResponse, after } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { resolveOnboardingDestination } from "@/lib/onboarding/resolve";
import { BETA_COOKIE, grantBetaCredits } from "@/lib/beta-credits";

function safeNext(value: string | null): string {
  // Chemin interne absolu uniquement. Rejette // et /\ (open redirect), le
  // backslash (0x5c) et les caracteres de controle (< 0x20, 0x7f).
  const raw = value ?? "";
  if (!raw.startsWith("/")) return "/";
  const c1 = raw.charCodeAt(1);
  if (c1 === 0x2f || c1 === 0x5c) return "/";
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i);
    if (c < 0x20 || c === 0x5c || c === 0x7f) return "/";
  }
  return raw;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const cookieStore = await cookies();
    const sb = supabaseServer(cookieStore);
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) {
      // OAuth handles both fresh sign-ups (Google account first-time) AND
      // returning sign-ins through the same callback. The resolver decides
      // whether to route the user through /onboarding or skip straight to
      // `next` (already onboarded, or grandfathered because their profile
      // is non-empty even though the flag was never set).
      const hasBeta = Boolean(cookieStore.get(BETA_COOKIE));
      const { data: { user } } = await sb.auth.getUser();

      let dest = next;
      if (user) {
        dest = await resolveOnboardingDestination(sb, user.id, next);
        // Crédits bêta : compte créé/connecté via le lien bêta (cookie) → 50
        // crédits non renouvelables, quel que soit l'email Google utilisé.
        if (hasBeta) {
          const uid = user.id;
          after(() => grantBetaCredits(uid));
        }
      }

      const res = NextResponse.redirect(`${origin}${dest}`);
      if (hasBeta) res.cookies.set(BETA_COOKIE, "", { path: "/", maxAge: 0 });
      return res;
    }
  }

  return NextResponse.redirect(`${origin}/auth/sign-in?error=oauth`);
}
