"use client";

import { useState } from "react";

/**
 * CoherenceMoreSection — masque par défaut les blocs d'analyse détaillés
 * (positions ingrédients, mots-clés emballage, indice marketing) affichés
 * APRÈS la conclusion. Un bouton "Voir plus d'analyse" les déplie.
 *
 * Les blocs eux-mêmes sont rendus côté serveur et passés en `children` :
 * ce composant client ne gère que la bascule ouvert/fermé.
 */
export function CoherenceMoreSection({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-[14px] font-semibold text-[#8B5CF6] shadow-sm transition hover:bg-[#8B5CF6]/5 active:scale-[0.98]"
        >
          Voir plus d&apos;analyse
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      {children}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-[14px] font-semibold text-[#8B5CF6] shadow-sm transition hover:bg-[#8B5CF6]/5 active:scale-[0.98]"
        >
          Voir moins
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
