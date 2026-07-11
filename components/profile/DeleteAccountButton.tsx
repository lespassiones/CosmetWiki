"use client";

/**
 * Bouton « Supprimer mon compte » (RGPD, droit à l'effacement).
 *
 * Réutilise le MÊME mécanisme que l'app mobile : l'Edge Function Supabase
 * `delete-account` (cascade DB → toutes les données purgées + suppression du
 * compte auth). Le client navigateur porte la session courante (cookies), donc
 * l'appel est authentifié automatiquement. Après succès : sign-out + redirect
 * vers l'accueil.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

export function DeleteAccountButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const sb = supabaseBrowser();
      const { error: fnError } = await sb.functions.invoke("delete-account", {
        body: {},
      });
      if (fnError) {
        setDeleting(false);
        setError("La suppression a échoué. Réessaie dans un instant.");
        return;
      }
      // Compte purgé côté serveur : on nettoie la session locale puis on sort.
      await sb.auth.signOut();
      router.replace("/");
      router.refresh();
    } catch {
      setDeleting(false);
      setError("Une erreur est survenue. Vérifie ta connexion.");
    }
  };

  return (
    <div className="px-1 pb-4">
      {!confirming ? (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setConfirming(true);
          }}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[13px] font-medium text-[#B91C1C] hover:bg-red-50 transition"
        >
          <TrashIcon className="h-4 w-4" />
          Supprimer mon compte
        </button>
      ) : (
        <div className="rounded-2xl bg-red-50 ring-1 ring-red-100 p-4">
          <div className="flex items-start gap-3">
            <AlertIcon className="h-5 w-5 text-[#B91C1C] mt-0.5 shrink-0" />
            <div>
              <p className="text-[14px] font-semibold text-[#B91C1C] leading-tight">
                Supprimer définitivement ton compte&nbsp;?
              </p>
              <p className="text-[12px] text-[#7F1D1D] mt-1 leading-relaxed">
                Cette action est définitive. Toutes tes données (profil,
                analyses, routine, promesses) seront supprimées et ne pourront
                pas être récupérées.
              </p>
            </div>
          </div>

          {error && (
            <p className="text-[12px] text-[#B91C1C] font-medium mt-3">{error}</p>
          )}

          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
              className="flex-1 inline-flex items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.08] px-4 py-2.5 text-[13px] font-semibold text-ink hover:bg-black/[0.02] transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#B91C1C] transition disabled:opacity-60"
            >
              {deleting ? "Suppression…" : "Supprimer définitivement"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  );
}
