import { GLASS_CARD } from "@/lib/ui/glass";
import { DiamondIcon } from "@/components/nav/NavIcons";

export const metadata = { title: "Passez Premium · Cosme Check" };

const FEATURES = [
  "Analyses INCI illimitées",
  "Analyses « Promesses vs Formule » illimitées",
  "Comparaison de produits illimitée",
  "Beauty Advisor avancé (réponses personnalisées)",
  "Historique étendu, sans limite",
  "Export PDF illimité de tes analyses",
  "Accès en avant-première aux nouvelles fonctionnalités",
];

export default function OffrePage() {
  return (
    <div className="mx-auto max-w-5xl px-5 lg:px-8 py-8 lg:py-12">
      {/* Header */}
      <div className="text-center mb-10 lg:mb-12">
        <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 ring-1 ring-rose-200 px-3 py-1 text-[12px] font-semibold text-[#F43F5E] mb-4">
          <DiamondIcon className="h-3.5 w-3.5" />
          Premium
        </span>
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
          price="2,99 €"
          unit="/mois"
          subline="Sans engagement, résiliable à tout moment."
        />
        <PlanCard
          period="Annuel"
          price="24,99 €"
          unit="/an"
          subline="Soit ≈ 2,08 € par mois - 2 mois offerts."
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
  highlight = false,
}: {
  period: string;
  price: string;
  unit: string;
  subline: string;
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
      {highlight && (
        <span className="absolute -top-3 right-5 rounded-full bg-white text-[10px] font-bold uppercase tracking-wider text-[#F43F5E] px-3 py-1 ring-1 ring-rose-200 shadow-[0_4px_10px_-2px_rgba(244,63,94,0.35)]">
          Recommandé
        </span>
      )}
      <div className={`text-[12px] font-semibold uppercase tracking-wider mb-3 ${highlight ? "text-white/80" : "text-[#6B7280]"}`}>
        {period}
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-[44px] font-bold leading-none tabular-nums">{price}</span>
        <span className={`text-[16px] font-medium ${highlight ? "text-white/85" : "text-[#6B7280]"}`}>
          {unit}
        </span>
      </div>
      <p className={`text-[12px] leading-snug mb-5 ${highlight ? "text-white/85" : "text-[#6B7280]"}`}>
        {subline}
      </p>

      {/* Disabled CTA - payment not wired yet */}
      <button
        type="button"
        disabled
        aria-disabled="true"
        className={`w-full rounded-full px-4 py-3 text-[13px] font-semibold cursor-not-allowed ${
          highlight
            ? "bg-white/20 text-white ring-1 ring-white/30"
            : "bg-[#F3F4F6] text-[#9CA3AF] ring-1 ring-[#E5E7EB]"
        }`}
      >
        Bientôt disponible
      </button>
    </article>
  );
}
