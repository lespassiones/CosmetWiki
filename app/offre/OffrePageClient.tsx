'use client'

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useCredits } from "@/lib/credits/hooks";

type PlanId = "monthly" | "yearly";

export function OffrePageClient() {
  const router = useRouter();
  const { remaining } = useCredits();
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  const [selected, setSelected] = useState<PlanId>("yearly");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("returnAfterPaywall");
    if (saved) setReturnUrl(saved);
  }, []);

  const handleClose = () => {
    if (returnUrl && remaining >= 1) {
      sessionStorage.removeItem("returnAfterPaywall");
      router.push(returnUrl);
    } else {
      router.back();
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selected }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Une erreur est survenue. Réessaie.");
      }
    } catch {
      alert("Une erreur est survenue. Vérifie ta connexion et réessaie.");
    } finally {
      setLoading(false);
    }
  };

  const priceLine = selected === "yearly" ? "Puis 49,99 €/an." : "Puis 7,99 €/mois.";

  return (
    <div className="min-h-screen bg-[#FBF6EF]">
      <div className="mx-auto w-full max-w-[460px] px-5 pb-44 pt-5">
        {/* Header : croix (gauche) + logo (centré) */}
        <div className="relative flex h-12 items-center justify-center">
          <button
            onClick={handleClose}
            type="button"
            aria-label="Fermer"
            className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full text-[#111111] transition hover:bg-black/5"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image/logo-cc.webp" alt="Cosme Check" className="h-6 w-auto" />
        </div>

        {/* Message si retour sans crédits */}
        {returnUrl && remaining < 1 && (
          <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
            <p className="text-[13px] text-rose-800">
              Tu n&apos;as plus de crédits. Passe Premium pour continuer sans limite.
            </p>
          </div>
        )}

        {/* Hero — jauge de notation (aiguille vers le vert) */}
        <div className="mt-1 flex justify-center">
          <Image
            src="/image/petiteImage/paywall-gauge.webp"
            alt=""
            width={820}
            height={565}
            priority
            className="h-auto w-[82%] object-contain"
          />
        </div>

        <h1 className="mt-2 text-center text-[30px] font-bold leading-tight tracking-tight text-[#111111]">
          Débloque ton analyse<br />
          <span className="text-[#F43F5E]">personnalisée</span>
        </h1>
        <p className="mx-auto mt-3 max-w-[360px] text-center text-[15px] leading-relaxed text-[#6B7280]">
          Chaque produit, chaque conseil, chaque alternative : pensés pour toi, ta peau et ton profil.
        </p>

        {/* Plans côte à côte — juste après l'accroche. */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <PlanCol
            selected={selected === "yearly"}
            onSelect={() => setSelected("yearly")}
            badge="ÉCONOMISE 48%"
            name="Annuel"
            price="49,99 €"
            sub="~4,17 €/mois"
          />
          <PlanCol
            selected={selected === "monthly"}
            onSelect={() => setSelected("monthly")}
            name="Mensuel"
            price="7,99 €"
            sub="/mois"
          />
        </div>

        {/* Bénéfices — tous personnalisés « pour toi » */}
        <div className="mt-6 rounded-3xl bg-white p-5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)] ring-1 ring-black/[0.04]">
          <BenefitRow>
            Analyse de chaque produit <b className="font-semibold">personnalisée</b> à ton profil
          </BenefitRow>
          <BenefitRow>
            <b className="font-semibold">Alternatives</b> plus propres choisies pour toi
          </BenefitRow>
          <BenefitRow>
            Suggestions et <b className="font-semibold">conseils adaptés</b> à ta peau
          </BenefitRow>
          <BenefitRow>
            Analyse des <b className="font-semibold">promesses produit</b> selon ton profil
          </BenefitRow>
          <BenefitRow>
            Amélioration de ta routine, <b className="font-semibold">sur-mesure</b>
          </BenefitRow>
          <BenefitRow>
            <b className="font-semibold">100 crédits/mois</b> pour trouver les produits faits pour toi
          </BenefitRow>
        </div>

        {/* Réassurance */}
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#F7F1E8] px-3 py-2.5">
          <svg className="h-3.5 w-3.5 shrink-0 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="text-[12px] text-[#6B7280]">
            Sans engagement · Annulable en 1 tap · Essai gratuit 3 jours
          </span>
          <svg className="h-4 w-4 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2 4 5v6c0 5 3.4 7.7 8 9 4.6-1.3 8-4 8-9V5l-8-3z" />
          </svg>
        </div>

        {/* Légal */}
        <p className="mt-4 text-center text-[11px] leading-4 text-[#9CA3AF]">
          Renouvellement automatique sauf annulation avant la fin de période. Gérable dans les réglages de ton compte.
        </p>

        {/* Liens */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-[#6B7280]">
          <Link href="/cgu" className="underline">Conditions d&apos;utilisation</Link>
          <span className="text-[#9CA3AF]">·</span>
          <Link href="/confidentialite" className="underline">Politique de confidentialité</Link>
        </div>
      </div>

      {/* Footer CTA — toujours visible, ne scrolle pas. Décalé de la largeur de
          la sidebar sur desktop (lg:left-60) : il ne chevauche plus la sidebar
          et son contenu centré s'aligne avec la colonne de la page. */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-60 z-50 border-t border-black/[0.06] bg-[#FBF6EF]/95 backdrop-blur">
        <div className="mx-auto w-full max-w-[460px] px-5 pt-3 pb-5">
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={loading}
            className="h-14 w-full rounded-full bg-emerald-500 text-[15px] font-semibold text-white transition hover:bg-emerald-600 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Chargement…" : "Commencer l’essai gratuit"}
          </button>
          <p className="mt-2 text-center text-[13px] text-[#6B7280]">
            {priceLine} Annule quand tu veux.
          </p>
        </div>
      </div>
    </div>
  );
}

function BenefitRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5 9-12" />
        </svg>
      </span>
      <span className="text-[14px] text-[#111111]">{children}</span>
    </div>
  );
}

function PlanCol({
  selected,
  onSelect,
  name,
  price,
  sub,
  badge,
}: {
  selected: boolean;
  onSelect: () => void;
  name: string;
  price: string;
  sub: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex flex-col items-center rounded-3xl border-2 bg-white px-3 pb-4 pt-6 shadow-[0_6px_16px_-10px_rgba(15,23,42,0.18)] transition ${
        selected ? "border-emerald-500" : "border-[#ECECEC]"
      }`}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white">
          {badge}
        </span>
      )}
      <span className="text-[15px] font-semibold text-[#111111]">{name}</span>
      <span className={`mt-1 text-[26px] font-bold ${selected ? "text-emerald-600" : "text-emerald-700"}`}>{price}</span>
      <span className="mt-0.5 text-[13px] text-[#6B7280]">{sub}</span>
      <span
        aria-hidden
        className={`mt-3 grid h-5 w-5 place-items-center rounded-full border-2 ${
          selected ? "border-emerald-500" : "border-[#CBD5E1]"
        }`}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />}
      </span>
    </button>
  );
}
