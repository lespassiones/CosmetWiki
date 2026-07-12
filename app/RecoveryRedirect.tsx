"use client";

import { useEffect } from "react";

/**
 * Filet de sécurité pour le reset mot de passe (notamment depuis le mobile).
 *
 * Quand Supabase ne peut pas honorer le redirect_to exact, il retombe sur le
 * SITE_URL (souvent l'accueil) avec les jetons dans le fragment
 * (#access_token=…&type=recovery). Ce composant, monté globalement, détecte ce
 * cas sur N'IMPORTE QUELLE page et renvoie vers /auth/reset-password EN
 * CONSERVANT le fragment, pour que RecoveryGate puisse poser la session.
 *
 * No-op si l'URL n'est pas un lien de récupération (aucun impact sur le reste).
 */
export function RecoveryRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token") || !hash.includes("type=recovery")) return;
    if (window.location.pathname === "/auth/reset-password") return;
    window.location.replace("/auth/reset-password" + hash);
  }, []);

  return null;
}
