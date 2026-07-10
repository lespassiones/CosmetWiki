"use server";

/**
 * Server actions du funnel BÊTA (page publique /beta, sans session).
 * Écritures via la clé service-role (les tables beta_* ont RLS sans policy →
 * seul le service-role y accède). Tout Brevo est lancé via `after()` pour ne
 * pas rallonger la réponse, et reste fail-open.
 */

import { after } from "next/server";
import { supabaseService } from "@/lib/supabase";
import { setBetaFeedbackDone } from "@/lib/brevo";

export type BetaResult = { ok: true } | { ok: false; error: string };

function clampInt(v: FormDataEntryValue | null, min: number, max: number): number | null {
  const n = Number(String(v ?? "").trim());
  if (!Number.isFinite(n)) return null;
  const r = Math.round(n);
  return r < min || r > max ? null : r;
}

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

/** Enregistre le retour d'un bêta testeur identifié par son token, et coupe
 *  ses relances (drapeau Brevo BETA_FEEDBACK=true). */
export async function submitBetaFeedback(formData: FormData): Promise<BetaResult> {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) return { ok: false, error: "Lien invalide." };

  const ratingOverall = clampInt(formData.get("rating_overall"), 1, 5);
  const recommend = clampInt(formData.get("recommend"), 0, 10);
  const liked = String(formData.get("liked") ?? "").trim().slice(0, 2000) || null;
  const bugs = String(formData.get("bugs") ?? "").trim().slice(0, 2000) || null;
  const missing = String(formData.get("missing") ?? "").trim().slice(0, 2000) || null;

  const sb = supabaseService();

  const { data: tester, error: tErr } = await sb
    .schema("cosme_check")
    .from("beta_testers")
    .select("id, email")
    .eq("token", token)
    .maybeSingle();

  if (tErr || !tester) return { ok: false, error: "Lien de retour invalide ou expiré." };

  const { error } = await sb
    .schema("cosme_check")
    .from("beta_feedback")
    .insert({
      beta_tester_id: tester.id,
      rating_overall: ratingOverall,
      recommend,
      liked,
      bugs,
      missing,
    });

  if (error) {
    console.warn("[beta] feedback insert failed:", error.message);
    return { ok: false, error: "Une erreur est survenue. Réessaie." };
  }

  await sb
    .schema("cosme_check")
    .from("beta_testers")
    .update({ status: "feedback_recu", updated_at: new Date().toISOString() })
    .eq("id", tester.id);

  const email = tester.email as string;
  after(() => setBetaFeedbackDone(email));

  return { ok: true };
}
