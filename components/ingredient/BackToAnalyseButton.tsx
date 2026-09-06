"use client";

import { useRouter } from "next/navigation";

/**
 * Bouton « Retour » en haut d'une fiche ingrédient.
 *
 * Il utilise `router.back()` pour ramener l'utilisateur exactement d'où il
 * vient, la page de recherche ou l'index alphabétique la plupart du temps.
 * Sans historique (fiche ouverte directement depuis un lien partagé dans un
 * nouvel onglet), il retombe sur l'URL passée en `?from=<url>`, puis sur `/`.
 *
 * Note : ce bouton servait aussi à revenir sur une analyse en cours
 * (`/analyse?inci=…`, `/history/[id]`) en restaurant la modale d'ingrédients.
 * Ces pages ont été retirées avec la web app, donc `?from=` ne pointe plus
 * jamais vers une analyse. Le comportement de repli, lui, reste correct.
 */
export function BackToAnalyseButton({ fromUrl }: { fromUrl?: string | null }) {
  const router = useRouter();

  function onClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    if (fromUrl) {
      router.push(fromUrl);
      return;
    }
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Retour à la page précédente"
      className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-[13px] font-semibold text-ink ring-1 ring-black/[0.08] shadow-[0_4px_14px_-4px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-md transition hover:bg-white hover:ring-black/20"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      Retour
    </button>
  );
}
