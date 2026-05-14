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
  if (s === null) return { fg: "text-[#6B7280]", label: "—" };
  if (s >= 17) return { fg: "text-emerald-700", label: "Très bien" };
  if (s >= 13) return { fg: "text-amber-700", label: "Bien" };
  if (s >= 9) return { fg: "text-orange-700", label: "Moyen" };
  return { fg: "text-rose-700", label: "À éviter" };
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
        Décrypte tes cosmétiques en{" "}
        <span className="relative inline-block font-medium text-[#111111]">
          3 secondes
          <span aria-hidden className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-[#F43F5E] rounded-full" />
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
          className={`block ${GLASS_CARD_DARK} p-5 transition group`}
        >
          <div className="flex items-center gap-4">
            <span aria-hidden className="text-2xl">✨</span>
            <div className="flex-1">
              <div className="text-[15px] font-semibold">Skin advisor</div>
              <p className="text-[12px] text-white/70 mt-1 leading-snug">
                Pose tes questions sur ta routine. L&apos;assistant s&apos;appuie sur ton profil et tes analyses.
              </p>
            </div>
            <span aria-hidden className="opacity-60 group-hover:translate-x-1 transition">→</span>
          </div>
        </Link>

        <Link
          href="/promesses"
          className={`block ${GLASS_CARD_DARK} p-5 transition group`}
        >
          <div className="flex items-center gap-4">
            <span aria-hidden className="text-2xl">🔍</span>
            <div className="flex-1">
              <div className="text-[15px] font-semibold">Promesses vs Formule</div>
              <p className="text-[12px] text-white/70 mt-1 leading-snug">
                Vérifie si la description marketing d&apos;un produit correspond vraiment à sa composition INCI.
              </p>
            </div>
            <span aria-hidden className="opacity-60 group-hover:translate-x-1 transition">→</span>
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
        <div className="text-[11px] text-[#6B7280] uppercase tracking-wide">Dernière analyse</div>
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
      className={`block ${GLASS_CARD} ${GLASS_CARD_HOVER} p-5 transition`}
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] text-[#6B7280] uppercase tracking-wide">Dernière analyse</div>
        <span className="text-[11px] text-[#F43F5E] font-medium">Voir →</span>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[#111111] truncate">{title}</div>
          {pctSansPenalite !== null && (
            <div className="mt-1 text-[11px] italic text-emerald-700">
              <span className="font-semibold not-italic">{pctSansPenalite} %</span> sans pénalité
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
        <div className="text-[11px] text-[#6B7280] uppercase tracking-wide">Ta routine</div>
        <div className="mt-3 text-sm text-[#6B7280]">
          Crée ta routine pour suivre ton exposition cumulée.
        </div>
        <div className="mt-2 text-[11px] text-[#F43F5E] font-medium">Commencer →</div>
      </Link>
    );
  }
  const safeCounts = counts ?? { vert: 0, jaune: 0, orange: 0, rouge: 0 };
  // Aggregate ingredient distribution across all routine products. We turn
  // each colour count into a % of the total recognised ingredients in the
  // routine — same numerator definition as on the analyse page so the
  // wording stays consistent ("X % sans pénalité").
  const total
    = safeCounts.vert + safeCounts.jaune + safeCounts.orange + safeCounts.rouge;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const breakdown = [
    { pct: pct(safeCounts.vert), label: "sans pénalité", color: "text-emerald-700" },
    { pct: pct(safeCounts.jaune), label: "pén. faible", color: "text-amber-700" },
    { pct: pct(safeCounts.orange), label: "pén. moyenne", color: "text-orange-700" },
    { pct: pct(safeCounts.rouge), label: "pén. forte", color: "text-rose-700" },
  ].filter((b) => b.pct > 0);
  return (
    <Link
      href="/routine"
      className={`block ${GLASS_CARD} ${GLASS_CARD_HOVER} p-5 transition`}
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] text-[#6B7280] uppercase tracking-wide">Ta routine</div>
        <span className="text-[11px] text-[#F43F5E] font-medium">Voir →</span>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[#111111]">
            {count} produit{count > 1 ? "s" : ""} actif{count > 1 ? "s" : ""}
          </div>
          {breakdown.length > 0 && (
            <ul className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] italic">
              {breakdown.map((b) => (
                <li key={b.label} className={b.color}>
                  <span className="font-semibold not-italic">{b.pct} %</span> {b.label}
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
