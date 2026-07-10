import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * GET /beta/go?token=… — lien d'accès TRACKÉ des emails bêta (attribut Brevo
 * BETA_GO). Marque `clicked_at` sur le testeur puis redirige vers la page
 * d'inscription. Fail-open : token absent/invalide → on redirige quand même,
 * on ne bloque jamais l'accès d'un testeur pour un souci de tracking.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = (searchParams.get("token") ?? "").trim();

  if (token) {
    try {
      const sb = supabaseService();
      await sb
        .schema("cosme_check")
        .from("beta_testers")
        .update({ clicked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("token", token)
        .is("clicked_at", null);
    } catch (e) {
      console.warn("[beta] go click-tracking failed:", e);
    }
  }

  return NextResponse.redirect(`${SITE_URL}/auth/sign-up`);
}
