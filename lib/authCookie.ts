import { cookies } from "next/headers";

/**
 * Détection « connecté ? » ultra-légère basée uniquement sur la présence du
 * cookie d'auth Supabase (`sb-*-auth-token`), sans round-trip réseau.
 *
 * On l'utilise là où l'on veut décider quel chrome afficher (dashboard vs
 * public) sur des pages 100 % statiques — le layout root fait le même calcul
 * pour les `PUBLIC_LANDING_PREFIXES`. Ne PAS l'utiliser pour de l'autorisation :
 * un cookie présent ne prouve pas une session valide, seulement l'intention.
 */
export async function hasAuthCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-") && cookie.name.includes("auth-token")) {
      return true;
    }
  }
  return false;
}
