'use client'

import { GLASS_CARD } from "@/lib/ui/glass";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCredits } from "@/lib/credits/hooks";

const FEATURES = [
  "Expérience personnalisée",
  "Analyses INCI illimitées",
  "Analyses « Promesses vs Formule » illimitées",
  "Comparaison de produits illimitée",
  "Beauty Advisor avancé (réponses personnalisées)",
  "Historique étendu, sans limite",
  "Export PDF illimité de tes analyses",
  "Accès en avant-première aux nouvelles fonctionnalités",
];

export function OffrePageClient() {
  const router = useRouter();
  const { remaining } = useCredits();
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer l'URL de retour depuis sessionStorage
    const saved = sessionStorage.getItem("returnAfterPaywall");
    if (saved) {
      setReturnUrl(saved);
    }
  }, []);

  const handleBack = () => {
    if (returnUrl && remaining >= 1) {
      // Supprimer l'URL de retour
      sessionStorage.removeItem("returnAfterPaywall");
      router.push(returnUrl);
    } else {
      router.back();
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-5 lg:px-8 py-8 pt-28 lg:py-12 lg:pt-32">
      {/* Bouton Retour */}
      {returnUrl && remaining >= 1 && (
        <button
          onClick={handleBack}
          type="button"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
      )}

      {/* Message si user revient sans crédits */}
      {returnUrl && remaining < 1 && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg">
          <p className="text-sm text-rose-800">
            Tu n'as pas d'offre active. Achète un plan pour continuer.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-10 lg:mb-12">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3">
          Décode tes cosmétiques sans limite
        </h1>
        <p className="text-[15px] text-[#6B7280] max-w-xl mx-auto leading-relaxed">
          Passe Premium pour des analyses illimitées, l&apos;accès à toutes les
          fonctionnalités avancées, et soutiens le développement de Cosme Check.
        </p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 mb-8">
        <PlanCard
          period="Mensuel"
          price="4,99 €"
          unit="/mois"
          trial="3 jours gratuits"
          subline="flexible"
        />
        <PlanCard
          period="Annuel"
          price="49,99 €"
          unit="/an"
          trial="3 jours gratuits"
          subline="Soit ≈ 4,17 € par mois"
          highlight
        />
      </div>

      {/* Features list */}
      <article className={`${GLASS_CARD} p-5 lg:p-7`}>
        <h2 className="text-[15px] lg:text-[17px] font-semibold mb-4">
          Ce qui est inclus
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-[14px]">
              <span
                aria-hidden
                className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 mt-0.5"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path d="M5 12l5 5 9-12" />
                </svg>
              </span>
              <span className="text-ink">{f}</span>
            </li>
          ))}
        </ul>
      </article>

      {/* Disclaimer */}
      <p className="mt-6 text-center text-[12px] text-[#9CA3AF] leading-relaxed">
        Le paiement n&apos;est pas encore disponible. La fonctionnalité Premium
        sera lancée prochainement. Merci pour ta patience !
      </p>
    </div>
  );
}

function PlanCard({
  period,
  price,
  unit,
  subline,
  trial,
  highlight = false,
}: {
  period: string;
  price: string;
  unit: string;
  subline: string;
  trial?: string;
  highlight?: boolean;
}) {
  return (
    <article
      className={`relative rounded-3xl p-6 lg:p-7 transition ${
        highlight
          ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-[0_18px_40px_-12px_rgba(244,63,94,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] ring-1 ring-rose-300"
          : "bg-white ring-1 ring-black/[0.06] shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)]"
      }`}
    >
      <div className="flex items-baseline gap-2 mb-2">
        <h3 className="text-lg font-semibold">{period}</h3>
        {trial && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            highlight
              ? "bg-white/20 text-white"
              : "bg-rose-100 text-rose-600"
          }`}>
            {trial}
          </span>
        )}
      </div>
      <div className="mb-2">
        <span className="text-3xl font-bold">{price}</span>
        <span className="text-sm ml-2">{unit}</span>
      </div>
      <p className="text-sm mb-4">{subline}</p>
      <button className={`w-full py-2 rounded-lg font-medium transition ${
        highlight
          ? "bg-white text-rose-600 hover:bg-gray-50"
          : "bg-rose-600 text-white hover:bg-rose-700"
      }`}>
        Choisir
      </button>
    </article>
  );
}
