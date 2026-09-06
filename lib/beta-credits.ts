/**
 * Crédits bêta - CÔTÉ SERVEUR UNIQUEMENT.
 *
 * Les 50 crédits non renouvelables sont accordés par le trigger base de données,
 * qui matche l'EMAIL de l'invitation à la création du compte, dans
 * l'application. Cette fonction reste le point d'entrée manuel et idempotent
 * pour créditer un compte depuis l'admin (testeur inscrit sous un autre email
 * que celui invité, par exemple).
 *
 * Le cookie `cc_beta` et son constante ont été retirés avec l'inscription web :
 * ils permettaient d'accorder le bonus à un compte créé SUR LE SITE. Plus
 * d'inscription sur le site, plus de cookie à lire.
 *
 * Idempotent : un compte ne peut avoir qu'UN grant `grant_type='beta'`.
 * Fail-open : ne bloque jamais rien.
 */
import { supabaseService } from "@/lib/supabase";

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
