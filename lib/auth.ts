/**
 * Helper d'authentification côté serveur, réduit à sa seule utilité restante.
 *
 * Le site n'a plus de connexion : `getProfile()`, `deriveFirstName()` et
 * `canAccess()` ont été retirés avec la web app connectée. `getProfile()`
 * portait aussi un rattrapage paresseux du prénom (les inscriptions Google
 * d'avant le correctif du trigger stockaient « Utilisateur ») ; ce rattrapage
 * ne pouvait se déclencher qu'à la visite d'une page connectée, il n'existe
 * donc plus de chemin pour l'atteindre.
 *
 * `getUser()` reste utilisé par un seul appelant, la page
 * `/auth/reset-password`, qui doit savoir si le lien de réinitialisation
 * envoyé par l'APPLICATION MOBILE a déjà posé une session de récupération en
 * cookie.
 */
import { cache } from "react";
import { cookies } from "next/headers";
import { supabaseServer } from "./supabase";
import type { User } from "@supabase/supabase-js";

/**
 * Renvoie l'utilisateur authentifié pour la requête courante, ou `null`.
 *
 * Enveloppé dans le `cache()` de React pour que plusieurs appels au sein d'une
 * même requête serveur ne déclenchent qu'un seul aller-retour Supabase.
 */
export const getUser = cache(async (): Promise<User | null> => {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
});
