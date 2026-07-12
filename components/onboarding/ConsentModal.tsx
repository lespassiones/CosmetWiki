"use client";

/**
 * Modal de consentement affiché AVANT les questions de profil dans
 * l'onboarding. Sert de porte d'entrée pour les inscriptions qui n'ont pas
 * recueilli le consentement au formulaire (typiquement « S'inscrire avec
 * Google »). Il ne demande QUE l'acceptation des CGU (obligatoire, gate légal
 * avant de remplir le profil). L'opt-in newsletter est proposé séparément à la
 * FIN de l'onboarding (étape dédiée, à la façon du mobile).
 */

import { useState, useTransition } from "react";
import { saveConsent } from "@/app/onboarding/actions";

export function ConsentModal({
  firstName,
  onAccepted,
}: {
  firstName?: string | null;
  onAccepted: () => void;
}) {
  const [acceptCgu, setAcceptCgu] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!acceptCgu) return;
    setError(null);
    startTransition(async () => {
      const res = await saveConsent();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onAccepted();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <h1
          id="consent-title"
          className="text-[22px] font-bold leading-tight tracking-tight text-[#111111]"
        >
          {firstName ? `Bienvenue ${firstName} !` : "Bienvenue !"}
        </h1>
        <p className="mt-2 text-[14px] leading-5 text-[#6B7280]">
          Avant de continuer, une dernière petite étape.
        </p>

        <div className="mt-6 space-y-3">
          {/* CGU + confidentialité (obligatoire) */}
          <div className="flex items-start gap-3">
            <input
              id="ob_cgu"
              type="checkbox"
              checked={acceptCgu}
              onChange={(e) => setAcceptCgu(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D1D5DB] accent-[#111111]"
            />
            <label
              htmlFor="ob_cgu"
              className="cursor-pointer text-[13px] leading-5 text-[#374151]"
            >
              J&apos;accepte les{" "}
              <a
                href="/cgu"
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-[#111111] underline underline-offset-2"
              >
                conditions d&apos;utilisation
              </a>{" "}
              et la{" "}
              <a
                href="/confidentialite"
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-[#111111] underline underline-offset-2"
              >
                politique de confidentialité
              </a>
              .
            </label>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={pending || !acceptCgu}
          className="mt-6 block h-[52px] w-full rounded-full bg-[#111111] text-[15px] font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Un instant…" : "Continuer"}
        </button>
      </div>
    </div>
  );
}
