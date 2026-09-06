"use server";

/**
 * Actions d'authentification restantes du site : une seule.
 *
 * `signUp`, `signIn`, `signOut`, `requestPasswordReset` et `signInWithGoogle`
 * ont été retirés avec la connexion web. On ne crée plus de compte et on ne se
 * connecte plus sur cosme-check.com, tout se passe dans l'application mobile.
 *
 * `updatePassword` reste, et il est INDISPENSABLE : l'application mobile envoie
 * ses emails de « mot de passe oublié » vers `https://cosme-check.com/auth/reset-password`
 * (cf. `PASSWORD_RESET_WEB_URL` dans le dépôt mobile, `lib/auth/session.ts`).
 * Le lien pose une session de récupération, la page lit le fragment d'URL via
 * `RecoveryGate`, puis appelle cette action. Supprimer ce fichier ou cette
 * fonction casserait la réinitialisation de mot de passe sur mobile.
 *
 * La demande d'envoi de l'email, elle, est faite par l'app via
 * `supabase.auth.resetPasswordForEmail`, pas par le site : il n'y a donc plus
 * de `requestPasswordReset` ici.
 */

import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";

export type AuthResult = { ok: true } | { ok: false; error: string };

/**
 * Met à jour le mot de passe de l'utilisateur dont la session de récupération
 * est active. Appelé par la page `/auth/reset-password`. Mêmes règles de
 * complexité que celles appliquées côté application.
 */
export async function updatePassword(formData: FormData): Promise<AuthResult> {
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) return { ok: false, error: "Mot de passe trop court (8 caractères minimum)." };
  if (!/[a-z]/.test(password)) return { ok: false, error: "Le mot de passe doit contenir au moins une minuscule." };
  if (!/[A-Z]/.test(password)) return { ok: false, error: "Le mot de passe doit contenir au moins une majuscule." };
  if (!/[0-9]/.test(password)) return { ok: false, error: "Le mot de passe doit contenir au moins un chiffre." };

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);

  const { data: userData } = await sb.auth.getUser();
  if (!userData.user) return { ok: false, error: "Session expirée. Demande un nouveau lien de réinitialisation depuis l'application." };

  const { error } = await sb.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };

  // Sécurité : un mot de passe est souvent réinitialisé PARCE QUE le compte est
  // soupçonné compromis. On révoque toutes les AUTRES sessions et refresh-tokens
  // pour qu'un token volé ne survive pas au reset (le scope "others" conserve la
  // session de récupération courante). Best-effort : un échec ne bloque pas le
  // changement de mot de passe, qui est déjà appliqué.
  try {
    await sb.auth.signOut({ scope: "others" });
  } catch {
    // ignore : le mot de passe est déjà changé, la révocation est un bonus
  }

  return { ok: true };
}
