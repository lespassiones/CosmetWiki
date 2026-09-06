"use client";

/**
 * Section tarifs de la page d'accueil.
 *
 * L'abonnement se prend UNIQUEMENT dans l'application aujourd'hui, donc chaque
 * bouton de plan mène au téléchargement, avec la détection d'appareil habituelle
 * (App Store sur iPhone, Google Play sur Android, modale avec les deux badges
 * sur ordinateur).
 *
 * Les prix, les bénéfices et la mention de facturation viennent de
 * `lib/pricingPlans.ts`, pas de ce fichier. C'est volontaire : le jour où on
 * ouvre l'achat directement sur le site pour éviter la commission des stores, un
 * plan reçoit un `checkoutPath` et `hasWebCheckout()` bascule les boutons sans
 * retoucher cette mise en page. Voir l'en-tête de `lib/pricingPlans.ts`.
 */

import { useState } from "react";

import { FadeInSection } from "@/components/FadeInSection";
import { DownloadAppButton } from "@/components/download/DownloadAppButton";
import {
  BILLING_NOTICE,
  FREE_BENEFITS,
  PREMIUM_BENEFITS,
  PRICING_PLANS,
  TRIAL_LABEL,
  type BillingPeriod,
} from "@/lib/pricingPlans";

const MODAL_TITLE = "Premium se prend dans l'app";
const MODAL_SUBTITLE =
  "Télécharge Cosme Check, crée ton profil en quelques secondes et démarre ton essai gratuit de 3 jours. Tu peux annuler en un tap.";

export function LandingPricing() {
  const [period, setPeriod] = useState<BillingPeriod>("yearly");
  const plan = PRICING_PLANS.find((p) => p.period === period) ?? PRICING_PLANS[0];

  return (
    <section
      id="tarifs"
      aria-labelledby="tarifs-heading"
      // `scroll-mt-24` compense l'en-tête fixe de 77 px : sans ça, l'ancre
      // `/#tarifs` cacherait le titre sous la barre de navigation.
      // Fond crème `#FBF6EF` : couleur du paywall Premium dans l'app (design
      // system, « hero offre Premium : fond crème uni »). Elle détache la
      // section des deux blocs `#FAFAFA` qui la précèdent, sans le dégradé
      // rose vers violet écarté par la DA.
      className="relative w-full scroll-mt-24 bg-[#FBF6EF] py-16 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1280px] px-6 sm:px-8">
        <FadeInSection>
          <div className="mx-auto max-w-[38rem] text-center">
            <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F43F5E]">
              <span aria-hidden className="h-px w-6 bg-[#F43F5E]/60" />
              Tarifs
              <span aria-hidden className="h-px w-6 bg-[#F43F5E]/60" />
            </div>
            <h2
              id="tarifs-heading"
              className="mt-4 text-[28px] font-bold leading-[1.15] tracking-tight text-ink sm:text-[34px] lg:text-[40px]"
            >
              Commence gratuitement,{" "}
              <span className="text-[#F43F5E]">passe Premium</span> si tu veux
              du sur-mesure
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
              L&apos;analyse de la formule est gratuite, sans limite de produits.
              Premium ajoute la personnalisation à ton profil, les alternatives
              et les conseils adaptés à ta peau.
            </p>
          </div>
        </FadeInSection>

        <FadeInSection>
          <div className="mt-8 flex justify-center">
            <PeriodToggle period={period} onChange={setPeriod} />
          </div>
        </FadeInSection>

        <FadeInSection>
          <div className="mx-auto mt-8 grid w-full max-w-[880px] gap-5 lg:mt-10 lg:grid-cols-2">
            {/* Plan gratuit */}
            <article className="flex flex-col rounded-3xl bg-white p-6 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.06] sm:p-7">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                Gratuit
              </h3>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-[36px] font-bold leading-none tracking-tight text-ink">
                  0 €
                </span>
                <span className="text-[14px] text-ink-muted">pour toujours</span>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
                Tout ce qu&apos;il faut pour décrypter une composition et savoir
                ce que tu mets sur ta peau.
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {FREE_BENEFITS.map((benefit) => (
                  <BenefitRow key={benefit} tone="neutral">
                    {benefit}
                  </BenefitRow>
                ))}
              </ul>

              <DownloadAppButton
                campaign="tarifs_gratuit"
                modalTitle="Cosme Check est gratuit à télécharger"
                modalSubtitle="Scanne, analyse et décrypte les compositions sans payer. Disponible sur l'App Store et Google Play."
                className="mt-7 w-full rounded-full border border-[#111111]/15 bg-white py-3 text-[14px] font-semibold text-[#111111] transition hover:bg-black/[0.04] active:scale-[0.99]"
              >
                Télécharger l&apos;app
              </DownloadAppButton>
            </article>

            {/* Plan Premium */}
            <article className="relative flex flex-col rounded-3xl bg-white p-6 shadow-[0_18px_44px_-20px_rgba(244,63,94,0.35)] ring-2 ring-[#F43F5E] sm:p-7">
              {plan.badge ? (
                <span className="absolute -top-3 left-6 rounded-full bg-[#F43F5E] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-[0_6px_16px_-6px_rgba(244,63,94,0.6)]">
                  {plan.badge}
                </span>
              ) : null}

              <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#F43F5E]">
                Premium
              </h3>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-[36px] font-bold leading-none tracking-tight text-ink">
                  {plan.priceLabel}
                </span>
                <span className="text-[14px] text-ink-muted">
                  {plan.period === "yearly" ? "par an" : "par mois"}
                </span>
              </div>
              <p className="mt-1.5 text-[13px] font-medium text-emerald-700">
                {plan.subLabel} · {TRIAL_LABEL}
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {PREMIUM_BENEFITS.map((benefit) => (
                  <BenefitRow key={benefit} tone="premium">
                    {benefit}
                  </BenefitRow>
                ))}
              </ul>

              <DownloadAppButton
                campaign={`tarifs_${plan.period}`}
                modalTitle={MODAL_TITLE}
                modalSubtitle={MODAL_SUBTITLE}
                className="mt-7 w-full rounded-full bg-gradient-to-br from-[#F43F5E] to-[#E11D48] py-3 text-[14px] font-semibold text-white shadow-[0_12px_28px_-10px_rgba(244,63,94,0.55),inset_0_1px_0_rgba(255,255,255,0.30)] transition hover:brightness-110 active:scale-[0.99]"
              >
                Commencer l&apos;essai gratuit
              </DownloadAppButton>
              <p className="mt-2.5 text-center text-[12px] text-ink-muted">
                L&apos;abonnement se prend dans l&apos;application.
              </p>
            </article>
          </div>
        </FadeInSection>

        <FadeInSection>
          <p className="mx-auto mt-7 max-w-[46rem] text-center text-[12px] leading-relaxed text-ink-muted/80">
            {BILLING_NOTICE}
          </p>
        </FadeInSection>
      </div>
    </section>
  );
}

/** Bascule annuel / mensuel. Le prix Premium suit la sélection. */
function PeriodToggle({
  period,
  onChange,
}: {
  period: BillingPeriod;
  onChange: (next: BillingPeriod) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Périodicité de l'abonnement"
      className="inline-flex items-center rounded-full bg-white p-1 shadow-[0_6px_18px_-12px_rgba(15,23,42,0.25)] ring-1 ring-black/[0.06]"
    >
      {PRICING_PLANS.map((p) => {
        const active = p.period === period;
        return (
          <button
            key={p.period}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(p.period)}
            className={`rounded-full px-5 py-2 text-[13.5px] font-semibold transition ${
              active
                ? "bg-[#111111] text-white"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {p.name}
          </button>
        );
      })}
    </div>
  );
}

function BenefitRow({
  children,
  tone,
}: {
  children: string;
  tone: "neutral" | "premium";
}) {
  const dot =
    tone === "premium"
      ? "bg-emerald-600 text-white"
      : "bg-black/[0.06] text-[#111111]";
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden
        className={`mt-0.5 grid h-[20px] w-[20px] shrink-0 place-items-center rounded-full ${dot}`}
      >
        <svg
          className="h-3 w-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12l5 5 9-12" />
        </svg>
      </span>
      <span className="text-[14px] leading-relaxed text-ink">{children}</span>
    </li>
  );
}
