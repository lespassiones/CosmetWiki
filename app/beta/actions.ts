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

/** Réponse persona : l'intitulé de la question + la réponse, pour un affichage
 *  auto-décrit dans l'admin (sans liste de labels dupliquée). */
type IntakeAnswer = { q: string; a: string };

/** Nettoie les réponses persona : clés `i1..i99`, objets { q, a } bornés,
 *  max 60 entrées. Le contenu des questions vit côté client (BetaIntakeWizard)
 *  et peut évoluer librement — c'est pourquoi on stocke aussi l'intitulé. */
function sanitizeIntake(raw: unknown): Record<string, IntakeAnswer> | null {
  if (!raw || typeof raw !== "object") return null;
  const out: Record<string, IntakeAnswer> = {};
  let n = 0;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (n >= 60) break;
    if (!/^i\d{1,2}$/.test(k) || !v || typeof v !== "object") continue;
    const entry = v as Record<string, unknown>;
    const q = String(entry.q ?? "").trim().slice(0, 300);
    const a = String(entry.a ?? "").trim().slice(0, 2000);
    if (q && a) {
      out[k] = { q, a };
      n++;
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** Inscription d'un bêta testeur : coordonnées + consentement + réponses du
 *  questionnaire persona (intake). AUCUN email n'est envoyé ici — l'invitation
 *  part plus tard, au « lancement » manuel (bouton admin → /api/beta/invite).
 *  Permet plusieurs vagues de recrutement. */
export async function joinBeta(input: {
  firstName?: string;
  lastName?: string;
  email: string;
  consent: boolean;
  source?: string | null;
  intake?: Record<string, { q: string; a: string }>;
  /** Honeypot anti-bot : rempli uniquement par les bots. */
  honeypot?: string;
}): Promise<BetaResult> {
  const firstName = String(input.firstName ?? "").trim().slice(0, 80);
  const lastName = String(input.lastName ?? "").trim().slice(0, 80);
  const email = String(input.email ?? "").trim().toLowerCase();
  const consent = Boolean(input.consent);
  const source = String(input.source ?? "").trim().slice(0, 60) || null;

  if (input.honeypot) return { ok: true }; // bot : on ne donne aucun indice
  if (!email.includes("@") || email.length < 5) {
    return { ok: false, error: "Email invalide." };
  }
  if (!consent) {
    return { ok: false, error: "Tu dois accepter d'être contacté pour rejoindre la bêta." };
  }

  const intake = sanitizeIntake(input.intake);
  const sb = supabaseService();

  // Upsert sur l'email → un inscrit qui revient ne crée pas de doublon. On ne
  // touche PAS `invited_at` : s'il a déjà été invité, il ne le sera pas 2×.
  const row: Record<string, unknown> = {
    email,
    first_name: firstName || null,
    last_name: lastName || null,
    consent: true,
    consent_at: new Date().toISOString(),
    source,
    updated_at: new Date().toISOString(),
  };
  if (intake) row.intake = intake;

  const { error } = await sb
    .schema("cosme_check")
    .from("beta_testers")
    .upsert(row, { onConflict: "email" });

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
  answers: Record<string, { q: string; a: string }>;
  final: boolean;
}): Promise<BetaResult> {
  const token = (input.token ?? "").trim();
  if (!token) return { ok: false, error: "Lien invalide." };

  // Ne garder que q1..q20, en stockant l'intitulé + la réponse ({ q, a }) pour
  // un affichage auto-décrit dans l'admin.
  const clean: Record<string, { q: string; a: string }> = {};
  for (const [k, v] of Object.entries(input.answers ?? {})) {
    if (!ANSWER_KEYS.has(k) || !v || typeof v !== "object") continue;
    const q = String((v as { q?: unknown }).q ?? "").trim().slice(0, 300);
    const a = String((v as { a?: unknown }).a ?? "").trim().slice(0, 2000);
    if (a) clean[k] = { q, a };
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
