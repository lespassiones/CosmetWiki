"use client";

import { useState } from "react";
import { GLASS_CARD } from "@/lib/ui/glass";

interface Props {
  tier: string;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  hasStripeCustomer: boolean;
}

export function SubscriptionManager({
  tier,
  subscriptionStatus,
  currentPeriodEnd,
  trialEnd,
  hasStripeCustomer,
}: Props) {
  const [loading, setLoading] = useState(false);

  const isPremium = tier === "premium";
  const isTrial = subscriptionStatus === "trialing";
  const isActive = subscriptionStatus === "active" || isTrial;
  const isCanceling = subscriptionStatus === "cancel_at_period_end";

  const periodEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
  const trialEndDate = trialEnd ? new Date(trialEnd) : null;

  const formatDate = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const handlePortal = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else alert(data.error ?? "Une erreur est survenue.");
    } catch {
      alert("Une erreur est survenue. Vérifie ta connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`${GLASS_CARD} p-5`}>
      <header className="flex items-start gap-3 mb-4">
        <StarIcon className="h-6 w-6 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <h2 className="text-[15px] font-semibold text-ink leading-tight">Abonnement</h2>
          <p className="text-[12px] text-[#6B7280] mt-0.5">
            {isPremium ? "Cosme Check Premium" : "Plan gratuit"}
          </p>
        </div>
        <div className="ml-auto">
          <StatusBadge tier={tier} status={subscriptionStatus} />
        </div>
      </header>

      {/* Détails */}
      {isPremium && isActive && (
        <ul className="space-y-2 mb-4">
          {isTrial && trialEndDate && (
            <li className="flex items-center gap-2 text-[13px] text-[#6B7280]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
              Essai gratuit jusqu&apos;au{" "}
              <strong className="text-ink">{formatDate(trialEndDate)}</strong>
            </li>
          )}
          {periodEnd && !isTrial && (
            <li className="flex items-center gap-2 text-[13px] text-[#6B7280]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
              {isCanceling
                ? <>Accès jusqu&apos;au <strong className="text-ink">{formatDate(periodEnd)}</strong></>
                : <>Prochain renouvellement : <strong className="text-ink">{formatDate(periodEnd)}</strong></>
              }
            </li>
          )}
          <li className="flex items-center gap-2 text-[13px] text-[#6B7280]">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0" />
            100 crédits / renouvellement · Analyses personnalisées
          </li>
        </ul>
      )}

      {!isPremium && (
        <div className="mb-4 rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 ring-1 ring-amber-100 p-4">
          <p className="text-[13px] text-[#6B7280] leading-relaxed">
            Passe Premium pour accéder aux analyses personnalisées, 100 crédits/mois, et des alternatives sur-mesure.
          </p>
          <a
            href="/offre"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 transition"
          >
            <StarIcon className="h-3.5 w-3.5" />
            Découvrir Premium
          </a>
        </div>
      )}

      {/* Bouton portail Stripe */}
      {hasStripeCustomer && (
        <button
          type="button"
          onClick={handlePortal}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-white ring-1 ring-black/[0.08] px-5 py-3 text-sm font-semibold text-[#374151] hover:bg-black/[0.02] transition disabled:opacity-60"
        >
          <SettingsIcon className="h-4 w-4 text-[#6B7280]" />
          {loading ? "Chargement…" : "Gérer mon abonnement"}
        </button>
      )}
    </section>
  );
}

function StatusBadge({ tier, status }: { tier: string; status: string | null }) {
  if (tier === "premium") {
    if (status === "trialing") {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 ring-1 ring-amber-200 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
          Essai
        </span>
      );
    }
    if (status === "cancel_at_period_end") {
      return (
        <span className="inline-flex items-center rounded-full bg-orange-50 ring-1 ring-orange-200 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
          Résiliation en cours
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 ring-1 ring-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Premium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-[#F3F4F6] ring-1 ring-black/[0.06] px-2.5 py-1 text-[11px] font-semibold text-[#6B7280]">
      Gratuit
    </span>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
