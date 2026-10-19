"use client";

import type { ReactNode } from "react";

import { useDownloadApp } from "@/components/download/DownloadAppProvider";
import { suivre } from "@/lib/mesure";
import { detectPlatform } from "@/lib/storeLink";

/** Les cinq emplacements d'un article. Chacun se mesure à part. */
export type EmplacementAppel = "haut" | "milieu" | "colonne" | "fin" | "barre";

/**
 * Un appel à télécharger d'article : le seul bouton par lequel ils passent tous.
 *
 * C'est un vrai lien vers `/dl?c=<slug>&m=blog&e=<emplacement>` : avant
 * l'hydratation, et pour qui n'exécute pas de JavaScript, le clic suit
 * l'adresse et le serveur envoie le téléphone sur son magasin, campagne
 * comprise (`ct` et `pt` chez Apple, `referrer` chez Google Play, voir
 * `lib/storeLink.ts`). Un `button` ne ferait rien tant que React n'a pas pris
 * la main.
 *
 * Au clic, une fois la page vivante :
 *
 * | | |
 * |---|---|
 * | téléphone | le lien part vers `/dl`, et l'événement part par balise (`sendBeacon`), seul transport qui survit à la navigation |
 * | ordinateur | le lien ne part pas (`/dl` y renverrait sur l'accueil) : la modale de téléchargement s'ouvre, et ses badges reprennent la campagne |
 *
 * Chaque clic envoie `cta_clic` `{ source: '<slug>-<emplacement>', destination:
 * 'magasin' | 'modale', slug, emplacement }`, les mêmes noms que MemoryPilot et
 * RevealChat : le robot SEO lit les trois sites avec les mêmes requêtes.
 */
export function AppelTelecharger({
  slug,
  emplacement,
  className,
  children,
}: {
  slug: string;
  emplacement: EmplacementAppel;
  className?: string;
  children: ReactNode;
}) {
  const { openModal } = useDownloadApp();
  const href = `/dl?c=${slug}&m=blog&e=${emplacement}`;

  return (
    <a
      href={href}
      className={className}
      data-appel={emplacement}
      rel="nofollow"
      onClick={(e) => {
        const plateforme = detectPlatform(navigator.userAgent);
        const magasin = plateforme !== "desktop";
        suivre(
          "cta_clic",
          {
            source: `${slug}-${emplacement}`,
            destination: magasin ? "magasin" : "modale",
            slug,
            emplacement,
          },
          magasin,
        );
        if (!magasin) {
          e.preventDefault();
          openModal({ campaign: slug, medium: "blog" });
        }
      }}
    >
      {children}
    </a>
  );
}
