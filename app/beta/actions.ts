"use server";

/**
 * Server actions du funnel BÊTA (page publique /beta, sans session).
 * Écritures via la clé service-role (les tables beta_* ont RLS sans policy →
 * seul le service-role y accède). Tout Brevo est lancé via `after()` pour ne
 * pas rallonger la réponse, et reste fail-open.
 */

import { after } from "next/server";
import { supabaseService } from "@/lib/supabase";
import { sendBetaTemplateEmail, setBetaFeedbackDone } from "@/lib/brevo";

export type BetaResult = { ok: true } | { ok: false; error: string };

/** Inscription d'un bêta testeur : enregistre juste ses coordonnées + son
 *  consentement. AUCUN email n'est envoyé ici — l'invitation part plus tard,
 *  au « lancement » manuel (bouton admin → /api/beta/invite), pour ne traiter
 *  que les inscrits `invited_at IS NULL`. Permet plusieurs vagues de
 *  recrutement. */
export async function joinBeta(formData: FormData): Promise<BetaResult> {
  const firstName = String(formData.get("first_name") ?? "").trim().slice(0, 80);
  const lastName = String(formData.get("last_name") ?? "").trim().slice(0, 80);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const consent = Boolean(formData.get("consent"));
  const source = String(formData.get("source") ?? "").trim().slice(0, 60) || null;
  // Honeypot anti-bot : champ caché que seuls les bots remplissent.
  const honeypot = String(formData.get("company") ?? "").trim();

  if (honeypot) return { ok: true }; // bot : on ne donne aucun indice
  if (!email.includes("@") || email.length < 5) {
    return { ok: false, error: "Email invalide." };
  }
  if (!consent) {
    return { ok: false, error: "Tu dois accepter d'être contacté pour rejoindre la bêta." };
  }

  const sb = supabaseService();

  // Upsert sur l'email → un inscrit qui revient ne crée pas de doublon. On ne
  // touche PAS `invited_at` : s'il a déjà été invité, il ne le sera pas 2×.
  const { error } = await sb
    .schema("cosme_check")
    .from("beta_testers")
    .upsert(
      {
        email,
        first_name: firstName || null,
        last_name: lastName || null,
        consent: true,
        consent_at: new Date().toISOString(),
        source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );

  if (error) {
    console.warn("[beta] upsert failed:", error.message);
    return { ok: false, error: "Une erreur est survenue. Réessaie dans un instant." };
  }

  return { ok: true };
}

/** Clés de réponses acceptées par le formulaire de retour (questions 1..20). */
const ANSWER_KEYS = new Set(Array.from({ length: 20 }, (_, i) => `q${i + 1}`));

/**
 * Sauvegarde (par étape) les réponses du formulaire de retour dans
 * beta_feedback.answers (jsonb, fusionné). Appelé à chaque « Suivant » du
 * wizard pour ne rien perdre si le testeur abandonne en cours de route.
 *
 * `final = true` (dernière étape) marque le retour comme reçu :
 *   - beta_testers.status = 'feedback_recu' (stoppe les relances CRON)
 *   - attribut Brevo BETA_FEEDBACK = true
 *   - email de remerciement (template 4) envoyé immédiatement, UNE seule fois
 *     (thanked_at le garantit même si le testeur re-soumet).
 */
export async function saveBetaFeedback(input: {
  token: string;
  answers: Record<string, string>;
  final: boolean;
}): Promise<BetaResult> {
  const token = (input.token ?? "").trim();
  if (!token) return { ok: false, error: "Lien invalide." };

  // Ne garder que q1..q20, valeurs texte bornées.
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.answers ?? {})) {
    if (!ANSWER_KEYS.has(k)) continue;
    const val = String(v ?? "").trim().slice(0, 2000);
    if (val) clean[k] = val;
  }

  const sb = supabaseService();

  const { data: tester, error: tErr } = await sb
    .schema("cosme_check")
    .from("beta_testers")
    .select("id, email, first_name, thanked_at")
    .eq("token", token)
    .maybeSingle();

  if (tErr || !tester) return { ok: false, error: "Lien de retour invalide ou expiré." };

  // Fusion avec les réponses déjà sauvegardées (une ligne par testeur).
  const { data: existing } = await sb
    .schema("cosme_check")
    .from("beta_feedback")
    .select("answers")
    .eq("beta_tester_id", tester.id)
    .maybeSingle();

  const merged = {
    ...((existing?.answers as Record<string, unknown> | null) ?? {}),
    ...clean,
  };

  const { error } = await sb
    .schema("cosme_check")
    .from("beta_feedback")
    .upsert(
      { beta_tester_id: tester.id, answers: merged },
      { onConflict: "beta_tester_id" },
    );

  if (error) {
    console.warn("[beta] feedback save failed:", error.message);
    return { ok: false, error: "Une erreur est survenue. Réessaie." };
  }

  if (input.final) {
    await sb
      .schema("cosme_check")
      .from("beta_testers")
      .update({
        status: "feedback_recu",
        thanked_at: tester.thanked_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", tester.id);

    const email = tester.email as string;
    const firstName = (tester.first_name as string | null) ?? null;
    const alreadyThanked = Boolean(tester.thanked_at);
    after(async () => {
      await setBetaFeedbackDone(email);
      if (!alreadyThanked) {
        await sendBetaTemplateEmail("merci", { email, firstName });
      }
    });
  }

  return { ok: true };
}
