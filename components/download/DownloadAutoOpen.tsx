"use client";

/**
 * Ouvre la modale de téléchargement automatiquement quand le visiteur arrive
 * depuis un ancien lien de la web app.
 *
 * La connexion et l'espace connecté n'existent plus sur cosme-check.com. Les
 * anciennes URLs (`/history`, `/routine`, `/profile`, `/auth/sign-in`, un
 * favori, un lien dans un vieil email) sont redirigées par la middleware vers
 * `/?app=<raison>`. Ce composant lit ce paramètre et explique la situation au
 * lieu de laisser l'utilisateur devant une page d'accueil sans réponse.
 *
 * Le paramètre est ensuite retiré de l'URL avec `replaceState`, pour trois
 * raisons : un rechargement ne relance pas la modale, un partage de l'URL ne
 * propage pas le message, et Google ne référence pas `/?app=...` comme une
 * variante de la page d'accueil.
 */

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

import { useDownloadApp } from "./DownloadAppProvider";

/** Messages par raison. Une raison inconnue retombe sur `default`. */
const MESSAGES: Record<string, { title: string; subtitle: string }> = {
  default: {
    title: "Cosme Check est maintenant sur mobile",
    subtitle:
      "Ton compte, tes analyses et ta routine vivent dans l'application. Télécharge-la gratuitement sur l'App Store ou Google Play, connecte-toi avec le même email et tu retrouveras tout.",
  },
  auth: {
    title: "La connexion se fait dans l'app",
    subtitle:
      "On ne se connecte plus depuis le site. Télécharge Cosme Check sur l'App Store ou Google Play et connecte-toi avec le même email : tes analyses et ta routine t'attendent.",
  },
  premium: {
    title: "Premium se prend dans l'app",
    subtitle:
      "L'abonnement se gère directement dans l'application, avec 3 jours d'essai gratuit. Télécharge Cosme Check sur l'App Store ou Google Play.",
  },
};

export function DownloadAutoOpen() {
  const params = useSearchParams();
  const { openModal } = useDownloadApp();
  // Garde de montage : en développement React monte deux fois les effets, et
  // sans ce verrou la modale se rouvrirait juste après sa fermeture.
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    const reason = params.get("app");
    if (!reason) return;
    firedRef.current = true;

    const message = MESSAGES[reason] ?? MESSAGES.default;
    openModal({ campaign: `web_${reason}`, ...message });

    // Nettoyage de l'URL sans nouvelle navigation Next.js : `router.replace`
    // relancerait un rendu serveur de la page d'accueil pour rien.
    const url = new URL(window.location.href);
    url.searchParams.delete("app");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, [params, openModal]);

  return null;
}
