import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { resolveOnboardingDestination } from "@/lib/onboarding/resolve";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
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
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const dest = await resolveOnboardingDestination(sb, user.id, next);
        return NextResponse.redirect(`${origin}${dest}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/sign-in?error=oauth`);
}
