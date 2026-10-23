"use client";

import { useEffect, useState } from "react";

import { compterEtLireVue, libelleVues } from "@/lib/vuesArticles";

/**
 * « 👁 N vues » dans l'en-tête d'un article, à côté de la date et du temps de
 * lecture. Les règles du comptage vivent dans `lib/vuesArticles.ts`.
 *
 * Le compte part une fois la page affichée : un onglet ouvert en arrière-plan
 * ou une page préchargée attend d'être regardé. Tant que le chiffre n'est pas
 * là, la place est gardée sans rien montrer (pas de « 0 vue » qui clignote),
 * et si la base ne répond pas, rien ne s'affiche.
 */
export function VuesArticle({ slug, className = "" }: { slug: string; className?: string }) {
  const [vues, setVues] = useState<number | null>(null);
  const [echec, setEchec] = useState(false);

  useEffect(() => {
    let annule = false;
    const lancer = () => {
      compterEtLireVue(slug).then((n) => {
        if (annule) return;
        if (n === null) setEchec(true);
        else setVues(n);
      });
    };

    if (document.visibilityState === "visible") {
      lancer();
      return () => {
        annule = true;
      };
    }
    const surVisibilite = () => {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", surVisibilite);
      lancer();
    };
    document.addEventListener("visibilitychange", surVisibilite);
    return () => {
      annule = true;
      document.removeEventListener("visibilitychange", surVisibilite);
    };
  }, [slug]);

  if (echec) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 transition-opacity duration-300 ${vues === null ? "opacity-0" : "opacity-100"} ${className}`}
      aria-hidden={vues === null}
    >
      <IconeOeil className="h-4 w-4" />
      {vues === null ? "0 vue" : libelleVues(vues)}
    </span>
  );
}

export function IconeOeil({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
