import Link from "next/link";
import { GLASS_CARD } from "@/lib/ui/glass";

export const metadata = { title: "Crédits & fonctionnalités · Cosme Check" };

/**
 * Page « Crédits & fonctionnalités » (web) — twin de l'écran mobile
 * profile/credits. Purement informative : détaille le coût réel en crédits de
 * chaque fonctionnalité (aligné sur les débits serveur gate/consumeCredit).
 *   - scan + lecture = gratuit · fonctions IA = 1 crédit · objectifs = 3 crédits
 */

type Feature = { label: string; desc: string };
type Section = { cost: 0 | 1 | 3; title: string; items: Feature[] };

const SECTIONS: Section[] = [
  {
    cost: 0,
    title: "Toujours gratuit",
    items: [
      {
        label: "Scanner et analyser un produit",
        desc: "Analyse de la composition et note de qualité de la formule.",
      },
      {
        label: "Routine, historique et fiches",
        desc: "Consulter tes analyses, ta routine et les ingrédients.",
      },
    ],
  },
  {
    cost: 1,
    title: "Fonctions IA personnalisées",
    items: [
      { label: "Analyse complète « pour toi »", desc: "Ton score de compatibilité et les 3 conseils personnalisés." },
      { label: "Analyse d'une promesse", desc: "Vérifier si un produit tient ce qu'il annonce." },
      { label: "Message au conseiller beauté", desc: "Une réponse personnalisée, par message envoyé." },
      { label: "Suggestion intelligente", desc: "Un meilleur produit proposé, par produit." },
      { label: "Alternatives & comparaison", desc: "Comparer deux produits ou trouver mieux." },
      { label: "Conflits de routine", desc: "Analyse des incompatibilités entre tes produits." },
      { label: "Recherche approfondie internet", desc: "Retrouver un produit absent du catalogue." },
    ],
  },
  {
    cost: 3,
    title: "Analyse avancée",
    items: [
      {
        label: "Couverture de tes objectifs",
        desc: "Mesure à quel point ta routine atteint chaque objectif.",
      },
    ],
  },
];

function CostBadge({ cost }: { cost: 0 | 1 | 3 }) {
  if (cost === 0) {
    return (
      <span className="shrink-0 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[11px] font-semibold text-[#16A34A]">
        Gratuit
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#EDE9FE] px-2.5 py-1 text-[11px] font-semibold text-[#8B5CF6]">
      <StarIcon className="h-3 w-3" />
      {cost} {cost > 1 ? "crédits" : "crédit"}
    </span>
  );
}

export default function CreditsInfoPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 lg:px-8 py-8 lg:py-12 space-y-4">
      <div className="mb-1">
        <h1 className="text-xl lg:text-2xl font-bold">Crédits &amp; fonctionnalités</h1>
        <p className="text-sm text-[#6B7280]">Ce que coûte chaque fonctionnalité, simplement.</p>
      </div>

      {/* Intro */}
      <section className={`${GLASS_CARD} p-5`}>
        <div className="flex items-center gap-2.5 mb-2">
          <StarIcon className="h-5 w-5 text-[#8B5CF6]" />
          <h2 className="text-[15px] font-semibold text-ink">Comment marchent les crédits ?</h2>
        </div>
        <p className="text-[13px] text-[#6B7280] leading-relaxed">
          Chaque jour, tu reçois des crédits gratuits qui se rechargent automatiquement.
          Scanner un produit et consulter tes analyses reste toujours gratuit. Seules les
          fonctions IA en consomment.
        </p>
        <Link
          href="/offre"
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#8B5CF6] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#7C3AED]"
        >
          <DiamondIcon className="h-4 w-4" />
          {"Passe Premium pour l'illimité"}
        </Link>
      </section>

      {SECTIONS.map((section) => (
        <section key={section.title} className={`${GLASS_CARD} overflow-hidden`}>
          <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
            <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-semibold">
              {section.title}
            </p>
            <CostBadge cost={section.cost} />
          </div>
          <ul className="divide-y divide-black/[0.05]">
            {section.items.map((item) => (
              <li key={item.label} className="flex items-start gap-3 px-5 py-3.5">
                <span
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: section.cost === 0 ? "#16A34A" : "#8B5CF6" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-ink">{item.label}</p>
                  <p className="text-[12px] text-[#6B7280] mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="px-1 text-[11px] text-[#9CA3AF] italic leading-relaxed">
        {"Les crédits déjà dépensés pour un contenu ne sont jamais redébités si nous l'améliorons ou si tu le rouvres."}
      </p>
    </div>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z" />
    </svg>
  );
}
function DiamondIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 3h12l4 6-10 12L2 9z" />
      <path d="M2 9h20M12 3 8 9l4 12 4-12-4-6" />
    </svg>
  );
}
