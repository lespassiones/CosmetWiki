import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";
import { SITE_URL } from "@/lib/siteUrl";
import { BETA_COOKIE } from "@/lib/beta-credits";

/**
 * GET /beta/go?token=… — lien d'accès TRACKÉ des emails bêta (attribut Brevo
 * BETA_GO). Si le token est valide : marque `clicked_at` ET pose un cookie
 * `cc_beta` → le compte créé ensuite (quel que soit l'email, email/mot de passe
 * OU Google) recevra 50 crédits bêta. Puis redirige vers l'inscription.
 * Fail-open : token absent/invalide → simple redirection, aucun cookie.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = (searchParams.get("token") ?? "").trim();
  const res = NextResponse.redirect(`${SITE_URL}/auth/sign-up`);

  if (token) {
    try {
      const sb = supabaseService();
      const { data: tester } = await sb
        .schema("cosme_check")
        .from("beta_testers")
        .select("id")
        .eq("token", token)
        .maybeSingle();

      if (tester) {
        await sb
          .schema("cosme_check")
          .from("beta_testers")
          .update({ clicked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", tester.id)
          .is("clicked_at", null);

        // Marque ce navigateur comme venant d'un lien bêta → 50 crédits à la
        // création du compte (sameSite lax pour survivre au round-trip Google).
        res.cookies.set(BETA_COOKIE, "1", {
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          path: "/",
          maxAge: 60 * 60 * 24 * 14, // 14 jours
        });
      }
    } catch (e) {
      console.warn("[beta] go click-tracking failed:", e);
    }
  }

  return res;
}
