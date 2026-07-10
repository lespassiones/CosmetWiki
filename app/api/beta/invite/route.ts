import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";
import { SITE_URL } from "@/lib/siteUrl";
import { addBetaContact, sendBetaInvitationEmail } from "@/lib/brevo";

/**
 * POST /api/beta/invite — envoie l'email d'invitation aux bêta testeurs en
 * attente (`invited_at IS NULL`) et les marque comme invités. Déclenché par le
 * bouton « Envoyer les invitations (N) » du back-office CosmeCheckAdmin.
 *
 * Protégé par un secret partagé (header `x-beta-invite-secret`) car l'admin est
 * un projet Vercel distinct qui appelle cet endpoint côté serveur. On ne marque
 * `invited_at` QUE si l'email est bien parti (fail-open : sans clé Brevo, les
 * inscrits restent en attente et pourront être invités plus tard).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Garde-fou vs le plafond Brevo (300 emails/jour en gratuit). S'il reste des
// inscrits après un appel, l'admin peut relancer le bouton.
const MAX_PER_CALL = 150;

export async function POST(req: Request) {
  const secret = process.env.BETA_INVITE_SECRET;
  const provided = req.headers.get("x-beta-invite-secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const sb = supabaseService();

  const { data: pending, error } = await sb
    .schema("cosme_check")
    .from("beta_testers")
    .select("id, email, first_name, token")
    .is("invited_at", null)
    .order("created_at", { ascending: true })
    .limit(MAX_PER_CALL);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const list = pending ?? [];
  let invited = 0;
  const failed: string[] = [];

  for (const t of list) {
    const email = t.email as string;
    const firstName = (t.first_name as string | null) ?? null;
    const token = t.token as string;
    const accessUrl = `${SITE_URL}/auth/sign-up`;
    const feedbackUrl = `${SITE_URL}/beta/retour?token=${token}`;
    // Lien d'accès tracké : /beta/go note le clic puis redirige vers sign-up.
    const goUrl = `${SITE_URL}/beta/go?token=${token}`;

    // Ajoute à la liste Brevo (avec BETA_URL + BETA_GO) puis envoie l'invitation.
    await addBetaContact({ email, firstName, feedbackUrl, goUrl });
    const sent = await sendBetaInvitationEmail({ email, firstName, accessUrl, feedbackUrl });
    if (!sent.synced) {
      failed.push(email);
      continue; // on NE marque PAS invité → réessayable
    }

    const { error: upErr } = await sb
      .schema("cosme_check")
      .from("beta_testers")
      .update({ invited_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", t.id);
    if (upErr) {
      failed.push(email);
      continue;
    }
    invited++;
  }

  const { count: remaining } = await sb
    .schema("cosme_check")
    .from("beta_testers")
    .select("id", { count: "exact", head: true })
    .is("invited_at", null);

  return NextResponse.json({
    ok: true,
    invited,
    failed: failed.length,
    remaining: remaining ?? 0,
  });
}
