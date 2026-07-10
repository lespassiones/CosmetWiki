import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";
import { sendBetaTemplateEmail } from "@/lib/brevo";

/**
 * GET /api/beta/cron — CRON quotidien du programme bêta (vercel.json).
 * Vercel l'appelle avec `Authorization: Bearer ${CRON_SECRET}`.
 *
 * 1. Synchronise les états via la RPC cosme_check_beta_sync_states :
 *    compte créé (auth.users) + a testé (≥1 activité app).
 * 2. Relance A « pas encore testé » (template 2) — invités SANS compte :
 *    J+2 après l'invitation, puis une dernière relance 3 jours plus tard.
 * 3. Demande de retour (template 3) — compte créé SANS feedback :
 *    J+2 après la création du compte, relance +3 j, dernière +5 j.
 *
 * Les relances s'arrêtent dès que status = 'feedback_recu' (formulaire rempli).
 * L'email de remerciement (template 4) part immédiatement à la soumission du
 * formulaire (action submitBetaFeedback), pas ici.
 *
 * Garde-fous : plafond d'envois par run (plan Brevo gratuit = 300/jour) ;
 * fail-open par testeur (un envoi raté = réessayé au prochain run).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_SENDS_PER_RUN = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

type TesterRow = {
  id: string;
  email: string;
  first_name: string | null;
  invited_at: string | null;
  account_created_at: string | null;
  no_test_relances: number;
  no_test_last_at: string | null;
  feedback_asks: number;
  feedback_ask_last_at: string | null;
};

function olderThan(iso: string | null, days: number, now: number): boolean {
  if (!iso) return false;
  return now - new Date(iso).getTime() >= days * DAY_MS;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const sb = supabaseService();
  const now = Date.now();

  // 1. Synchronisation des états (compte créé / a testé).
  const { data: sync, error: syncErr } = await sb.rpc("cosme_check_beta_sync_states");
  if (syncErr) console.warn("[beta-cron] sync states failed:", syncErr.message);

  // 2+3. Candidats : invités, consentants, sans feedback.
  const { data: rows, error } = await sb
    .schema("cosme_check")
    .from("beta_testers")
    .select(
      "id, email, first_name, invited_at, account_created_at, no_test_relances, no_test_last_at, feedback_asks, feedback_ask_last_at",
    )
    .eq("consent", true)
    .neq("status", "feedback_recu")
    .not("invited_at", "is", null)
    .limit(500);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let sentRelance = 0;
  let sentFeedbackAsk = 0;
  let failed = 0;

  for (const t of (rows ?? []) as TesterRow[]) {
    if (sentRelance + sentFeedbackAsk >= MAX_SENDS_PER_RUN) break;

    const base = { email: t.email, firstName: t.first_name };

    if (!t.account_created_at) {
      // ── Étage A : invité mais pas de compte (pas ouvert / pas cliqué /
      //    cliqué sans compte — même lot). Max 2 relances : J+2 puis +3 j.
      const due =
        (t.no_test_relances === 0 && olderThan(t.invited_at, 2, now)) ||
        (t.no_test_relances === 1 && olderThan(t.no_test_last_at, 3, now));
      if (!due) continue;

      const sent = await sendBetaTemplateEmail("relance", base);
      if (!sent.synced) {
        failed++;
        continue;
      }
      const { error: upErr } = await sb
        .schema("cosme_check")
        .from("beta_testers")
        .update({
          no_test_relances: t.no_test_relances + 1,
          no_test_last_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", t.id);
      if (upErr) console.warn("[beta-cron] relance counter update failed:", upErr.message);
      sentRelance++;
    } else {
      // ── Étage B : compte créé mais pas de retour. Max 3 envois :
      //    J+2 après le compte, puis +3 j, puis +5 j.
      const due =
        (t.feedback_asks === 0 && olderThan(t.account_created_at, 2, now)) ||
        (t.feedback_asks === 1 && olderThan(t.feedback_ask_last_at, 3, now)) ||
        (t.feedback_asks === 2 && olderThan(t.feedback_ask_last_at, 5, now));
      if (!due) continue;

      const sent = await sendBetaTemplateEmail("feedback", base);
      if (!sent.synced) {
        failed++;
        continue;
      }
      const { error: upErr } = await sb
        .schema("cosme_check")
        .from("beta_testers")
        .update({
          feedback_asks: t.feedback_asks + 1,
          feedback_ask_last_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", t.id);
      if (upErr) console.warn("[beta-cron] feedback counter update failed:", upErr.message);
      sentFeedbackAsk++;
    }
  }

  return NextResponse.json({
    ok: true,
    sync: sync ?? null,
    sent_relance_no_test: sentRelance,
    sent_feedback_ask: sentFeedbackAsk,
    failed,
  });
}
