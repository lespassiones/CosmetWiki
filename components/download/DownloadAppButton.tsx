"use client";

/**
 * Bouton « télécharger l'app », réactif à l'appareil.
 *
 * Un clic appelle `goToApp` du contexte : iPhone vers l'App Store, Android vers
 * Google Play, ordinateur vers la modale avec les deux badges et le QR code.
 *
 * Rendu en `<button>` et non en `<a href="/dl">` : sur mobile on veut sauter la
 * redirection serveur pour éviter un aller-retour réseau avant l'ouverture du
 * store. Le repli est assuré, `useDownloadApp` renvoie vers `/dl` quand le
 * provider est absent, et `/dl` fait exactement la même détection côté serveur.
 */

import type { ReactNode } from "react";

import { useDownloadApp } from "./DownloadAppProvider";

type Props = {
  children?: ReactNode;
  className?: string;
  /** Slug de campagne propagé au store pour l'attribution. */
  campaign?: string;
  /** Titre de la modale sur ordinateur, si ce CTA mérite un message dédié. */
  modalTitle?: string;
  /** Sous-titre de la modale sur ordinateur. */
  modalSubtitle?: string;
  /** Flèche animée au survol, comme sur les CTA du hero. */
  withArrow?: boolean;
  ariaLabel?: string;
  /**
   * Effet de bord à jouer AVANT de partir vers le store, par exemple fermer le
   * tiroir de navigation qui contient le bouton. Sur ordinateur la modale
   * s'ouvre par-dessus, donc laisser un menu ouvert derrière serait visible.
   */
  onClickExtra?: () => void;
};

export function DownloadAppButton({
  children = "Télécharger l'app",
  className = "",
  campaign = "web",
  modalTitle,
  modalSubtitle,
  withArrow = false,
  ariaLabel,
  onClickExtra,
}: Props) {
  const { goToApp } = useDownloadApp();

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={() => {
        onClickExtra?.();
        goToApp({ campaign, title: modalTitle, subtitle: modalSubtitle });
      }}
      className={className}
    >
      {children}
      {withArrow ? (
        <span aria-hidden className="transition group-hover:translate-x-0.5">
          &rarr;
        </span>
      ) : null}
    </button>
  );
}
