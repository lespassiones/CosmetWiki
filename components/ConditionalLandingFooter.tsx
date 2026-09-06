"use client";

import { usePathname } from "next/navigation";
import { LandingFooter } from "./LandingFooter";

/**
 * Affiche le pied de page vitrine, sauf sur les deux parcours qui ont leur
 * propre mise en page plein écran :
 *   - `/auth/reset-password`, seule page `/auth` restante (elle sert le lien de
 *     réinitialisation envoyé par l'application mobile),
 *   - `/beta/*`, le tunnel de recrutement des bêta testeurs.
 *
 * Le paramètre `signedIn` a disparu avec la connexion : il n'y a plus de session
 * sur le site, donc plus de pied de page à masquer pour un utilisateur connecté.
 */
export function ConditionalLandingFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/auth")) return null;
  if (pathname?.startsWith("/beta")) return null;
  return <LandingFooter />;
}
