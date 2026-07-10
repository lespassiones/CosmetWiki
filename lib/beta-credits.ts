/**
 * Crédits bêta — CÔTÉ SERVEUR UNIQUEMENT.
 *
 * Les 50 crédits non renouvelables sont accordés quand l'inscription vient du
 * LIEN bêta (cookie `cc_beta` posé par /beta/go), quel que soit l'email ou la
 * méthode (email/mot de passe ou Google). C'est le complément du trigger DB
 * qui, lui, matche par email (utile pour le mobile ou un même email).
 *
 * Idempotent : un compte ne peut avoir qu'UN grant `grant_type='beta'`.
 * Fail-open : ne bloque jamais l'inscription.
 */
import { supabaseService } from "@/lib/supabase";

/** Cookie marquant un navigateur venu d'un lien d'invitation bêta. */
export const BETA_COOKIE = "cc_beta";

/** Accorde 50 crédits non renouvelables (grant_type='beta') à un compte, une
 *  seule fois. Sûr à rappeler (idempotent). */
export async function grantBetaCredits(userId: string): Promise<void> {
  try {
    const sb = supabaseService();
    const { data: existing } = await sb
      .schema("cosme_check")
      .from("credit_grants")
      .select("id")
      .eq("user_id", userId)
      .eq("grant_type", "beta")
      .limit(1);
    if (existing && existing.length > 0) return; // déjà accordé

    await sb.schema("cosme_check").from("credit_grants").insert({
      user_id: userId,
      amount: 50,
      remaining: 50,
      note: "Bonus bêta testeur (lien d'inscription)",
      created_by: "beta_signup",
      grant_type: "beta",
    });
  } catch (e) {
    console.warn("[beta] grantBetaCredits failed:", e);
  }
}
