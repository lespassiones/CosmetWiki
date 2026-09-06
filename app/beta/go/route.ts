import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * GET /beta/go?token=… - lien d'accès TRACKÉ des emails bêta (attribut Brevo
 * BETA_GO). Si le token est valide, on marque `clicked_at`, puis on redirige
 * vers `/dl`, qui envoie le testeur sur le bon store selon son téléphone.
 * Fail-open : token absent ou invalide → simple redirection.
 *
 * Le cookie `cc_beta` a été retiré avec l'inscription web : il servait à
 * accorder les 50 crédits bêta à un compte créé SUR LE SITE, y compris sous un
 * autre email que celui de l'invitation. Les comptes se créant désormais dans
 * l'application, c'est le trigger base de données (qui matche par EMAIL) qui
 * accorde ces crédits. Conséquence assumée : un testeur qui s'inscrit dans
 * l'app avec un email DIFFÉRENT de celui de son invitation ne reçoit plus le
 * bonus automatiquement, il faut le créditer depuis l'admin.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = (searchParams.get("token") ?? "").trim();
  // `c=beta` propage la campagne aux deux stores pour l'attribution.
  const res = NextResponse.redirect(`${SITE_URL}/dl?c=beta`);

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
      }
    } catch (e) {
      console.warn("[beta] go click-tracking failed:", e);
    }
  }

  return res;
}
