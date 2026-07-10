"use client";

import { usePathname } from "next/navigation";
import { LandingFooter } from "./LandingFooter";

/**
 * Affiche le LandingFooter sur les pages publiques uniquement :
 *  - Cache si l'utilisateur est connecté (signedIn).
 *  - Cache sur /auth/* (sign-in, sign-up, forgot/reset password).
 */
export function ConditionalLandingFooter({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  if (signedIn) return null;
  if (pathname?.startsWith("/auth")) return null;
  if (pathname?.startsWith("/beta")) return null;
  return <LandingFooter />;
}
