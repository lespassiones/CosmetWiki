import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  GLASS_CARD,
  GLASS_CARD_DARK,
  GLASS_CARD_HOVER,
} from "@/lib/ui/glass";
import { IngredientBlob, type BlobCounts } from "../blob/IngredientBlob";
import { TipCarousel } from "./TipCarousel";

export type DashboardData = {
  firstName: string | null;
  lastAnalysis: {
    id: string;
    name: string | null;
    product_label: string | null;
    score: number | null;
    created_at: string;
    counts: BlobCounts | null;
  } | null;
  routineCount: number;
  routineAvgScore: number | null;
  routineCounts: BlobCounts | null;
  tips: string[];
};

function scoreTone(s: number | null) {
  if (s === null) return { fg: "text-[#6B7280]", label: "-" };
  if (s >= 17) return { fg: "text-emerald-700", label: "Très bien" };
  if (s >= 13) return { fg: "text-amber-700", label: "Bien" };
  if (s >= 9) return { fg: "text-orange-700", label: "Moyen" };
  return { fg: "text-rose-700", label: "À éviter" };
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
    </svg>
  );
}

const PENALTY_PILL = {
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  orange: "bg-orange-50 text-orange-700",
  rose: "bg-rose-50 text-rose-700",
} as const;

type PenaltyTone = keyof typeof PENALTY_PILL;

function PenaltyPill({
  pct,
  label,
  tone,
  size = "md",
}: {
  pct: number;
  label: string;
  tone: PenaltyTone;
  size?: "sm" | "md";
}) {
  const sizeCls
    = size === "sm"
      ? "gap-0.5 px-1.5 py-0 text-[10px]"
      : "gap-1 px-2 py-0.5 text-[12px]";
  const iconCls = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <span
      className={`inline-flex items-center rounded-full ${sizeCls} ${PENALTY_PILL[tone]}`}
    >
      <LeafIcon className={iconCls} />
      <span className="font-semibold">{pct} %</span>
      <span className="italic">{label}</span>
    </span>
  );
}

export function HomeDashboard({
  data,
  trendingSlot,
}: {
  data: DashboardData;
  trendingSlot: ReactNode;
}) {
  const greeting = data.firstName ? `Bonjour ${data.firstName} 👋` : "Bienvenue 👋";

  return (
    <section aria-label="Tableau de bord" className="mx-auto w-full max-w-6xl px-5 lg:px-8 mt-2 lg:mt-6">
      <h1 className="text-[26px] lg:text-[36px] leading-tight font-bold tracking-tight">{greeting}</h1>

      <div className="mt-3 -mx-5 h-[2px] bg-black/30 lg:mx-0 lg:mt-4 lg:h-px lg:bg-black/[0.08]" />

      <p className="mt-3 lg:mt-4 text-sm lg:text-base text-[#6B7280]">
        Décrypte tes cosmétiques{" "}
        <span className="relative inline-block whitespace-nowrap font-medium text-[#111111]">
          en un clin d&apos;œil
          <svg
            aria-hidden
            viewBox="0 -3 200 17"
            preserveAspectRatio="none"
            className="pointer-events-none absolute -bottom-2 left-0 h-2.5 w-full text-violet-500"
          >
            <path
              d="M5,11 Q100,-3 195,11 Q100,7 5,11 Z"
              fill="currentColor"
            />
          </svg>
        </span>
        .
      </p>

      <TipCarousel tips={data.tips} />

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        <LastAnalysisCard last={data.lastAnalysis} />
        <RoutineCard
          count={data.routineCount}
          avgScore={data.routineAvgScore}
          counts={data.routineCounts}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        <Link
          href="/advisor"
          className="block rounded-3xl overflow-hidden transition group relative"
          style={{ background: "linear-gradient(135deg, #6C3FD8 0%, #4F46E5 55%, #7C3AED 100%)" }}
        >
          <div className="flex items-stretch">
            {/* Personnage — remplit toute la hauteur, tête clippée en haut par overflow-hidden */}
            <div className="relative w-[100px] shrink-0">
              <Image
                src="/image/petiteImage/portion.webp"
                alt=""
                width={327}
                height={400}
                className="absolute bottom-0 left-1 h-[100%] w-auto object-contain object-bottom drop-shadow-[0_6px_18px_rgba(0,0,0,0.28)]"
              />
            </div>

            {/* Texte */}
            <div className="flex-1 min-w-0 py-3 pl-3 pr-2">
              <div className="text-[13px] font-bold text-white tracking-tight leading-tight">
                Beauty Advisor <span aria-hidden>✨</span>
              </div>
              <p className="text-[11px] text-white/80 mt-1 leading-snug">
                Pose tes questions sur ta routine.
                L&apos;assistant t&apos;appuie sur ton profil et tes analyses.
              </p>
              {/* Bouton visible sur mobile uniquement */}
              <div className="lg:hidden mt-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] text-white font-semibold ring-1 ring-white/25">
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Poser une question
              </div>
            </div>

            {/* Séparateur + bouton + flèche — desktop uniquement */}
            <div className="hidden lg:flex items-center gap-3 py-4 pr-4 shrink-0">
              <div className="self-stretch w-px bg-white/20 mx-1" />
              <div className="flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 transition px-4 py-2 text-[12px] text-white font-semibold ring-1 ring-white/25">
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Poser une question
              </div>
              <div className="h-8 w-8 rounded-full bg-white/15 ring-1 ring-white/25 flex items-center justify-center text-white group-hover:translate-x-0.5 transition shrink-0">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        <Link
          href="/promesses"
          className="block rounded-3xl overflow-hidden transition group relative"
          style={{ background: "linear-gradient(135deg, #D6F5D6 0%, #E8FAE8 50%, #C8F0C8 100%)" }}
        >
          <div className="flex items-stretch">
            {/* Illustration */}
            <div className="relative w-[110px] shrink-0">
              <Image
                src="/image/petiteImage/promesse.webp"
                alt=""
                width={248}
                height={202}
                className="absolute top-1/2 -translate-y-1/2 left-2 h-[90%] w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,100,0,0.15)]"
              />
            </div>

            {/* Texte */}
            <div className="flex-1 min-w-0 py-4 pl-5 pr-4">
              <span className="inline-block rounded-full bg-emerald-600/15 text-emerald-700 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-0.5 mb-2">
                Promesses vs Formule
              </span>
              <p className="text-[11px] text-[#3a5a3a]/80 leading-snug text-justify hyphens-auto">
                Vérifie si la description marketing d&apos;un produit correspond vraiment à sa composition INCI.
              </p>
            </div>

            {/* Flèche */}
            <div className="flex items-center pr-4 shrink-0">
              <div className="h-8 w-8 rounded-full bg-white/80 ring-1 ring-emerald-200 flex items-center justify-center text-emerald-700 group-hover:translate-x-0.5 transition shadow-sm">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-4">{trendingSlot}</div>
    </section>
  );
}

function LastAnalysisCard({ last }: { last: DashboardData["lastAnalysis"] }) {
  if (!last) {
    return (
      <div className={`${GLASS_CARD} p-5`}>
        <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] uppercase tracking-wide">
          <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
          Dernière analyse
        </div>
        <div className="mt-2 text-sm text-[#6B7280]">
          Aucune analyse pour le moment. Lance ta première analyse via le bouton scan.
        </div>
      </div>
    );
  }
  const title = last.product_label ?? last.name ?? "Analyse";
  const counts = last.counts ?? { vert: 0, jaune: 0, orange: 0, rouge: 0 };
  const matched = counts.vert + counts.jaune + counts.orange + counts.rouge;
  const pctSansPenalite
    = matched > 0 ? Math.round((counts.vert / matched) * 100) : null;
  return (
    <Link
      href={`/history/${last.id}`}
      className={`block ${GLASS_CARD} ${GLASS_CARD_HOVER} px-5 pt-5 pb-3 transition`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] uppercase tracking-wide">
          <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
          Dernière analyse
        </div>
        <span className="text-[12px] text-[#F43F5E] font-medium">Voir →</span>
      </div>
      <div className="mt-0.5 flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-semibold text-[#111111] truncate">{title}</div>
          {pctSansPenalite !== null && (
            <div className="mt-2">
              <PenaltyPill pct={pctSansPenalite} label="sans pénalité" tone="emerald" />
            </div>
          )}
        </div>
        <div className="w-[140px] shrink-0">
          <IngredientBlob counts={counts} variant="md" />
        </div>
      </div>
    </Link>
  );
}

function RoutineCard({
  count,
  avgScore,
  counts,
}: {
  count: number;
  avgScore: number | null;
  counts: BlobCounts | null;
}) {
  if (count === 0) {
    return (
      <Link
        href="/routine"
        className={`block ${GLASS_CARD} ${GLASS_CARD_HOVER} p-5 transition`}
      >
        <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] uppercase tracking-wide">
          <HeartIcon className="h-4 w-4 text-rose-500" />
          Ta routine
        </div>
        <div className="mt-3 text-sm text-[#6B7280]">
          Crée ta routine pour suivre ton exposition cumulée.
        </div>
        <div className="mt-2 text-[12px] text-[#F43F5E] font-medium">Commencer →</div>
      </Link>
    );
  }
  const safeCounts = counts ?? { vert: 0, jaune: 0, orange: 0, rouge: 0 };
  // Aggregate ingredient distribution across all routine products. We turn
  // each colour count into a % of the total recognised ingredients in the
  // routine - same numerator definition as on the analyse page so the
  // wording stays consistent ("X % sans pénalité").
  const total
    = safeCounts.vert + safeCounts.jaune + safeCounts.orange + safeCounts.rouge;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const breakdown = [
    { pct: pct(safeCounts.vert), label: "sans pénalité", tone: "emerald" as const },
    { pct: pct(safeCounts.jaune), label: "pén. faible", tone: "amber" as const },
    { pct: pct(safeCounts.orange), label: "pén. moyenne", tone: "orange" as const },
    { pct: pct(safeCounts.rouge), label: "pén. forte", tone: "rose" as const },
  ].filter((b) => b.pct > 0);
  return (
    <Link
      href="/routine"
      className={`block ${GLASS_CARD} ${GLASS_CARD_HOVER} px-5 pt-5 pb-3 transition`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] uppercase tracking-wide">
          <HeartIcon className="h-4 w-4 text-rose-500" />
          Ta routine
        </div>
        <span className="text-[12px] text-[#F43F5E] font-medium">Voir →</span>
      </div>
      <div className="mt-1 flex items-end gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-semibold text-[#111111]">
            {count} produit{count > 1 ? "s" : ""} actif{count > 1 ? "s" : ""}
          </div>
          {breakdown.length > 0 && (
            <ul className="mt-0.5 flex flex-wrap gap-x-1 gap-y-0.5">
              {breakdown.map((b) => (
                <li key={b.label}>
                  <PenaltyPill pct={b.pct} label={b.label} tone={b.tone} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="w-[140px] shrink-0">
          <IngredientBlob counts={safeCounts} variant="md" />
        </div>
      </div>
    </Link>
  );
}
