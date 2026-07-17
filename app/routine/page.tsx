import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { getProfile, getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { computeRoutineMetrics, type Frequency, type RoutineProduct } from "@/lib/routine/engine";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import { RestrictionsLinkButton } from "@/components/routine/RestrictionsLinkButton";
import { ExposureSummaryCard } from "@/components/routine/ExposureSummaryCard";
import { GoalsCoverageCard } from "@/components/routine/GoalsCoverageCard";
import { readUserRestrictions } from "@/lib/restrictions/types";
import { readSkinProfile } from "@/lib/skin/profile";
import {
  collectGoals,
  type GoalCoverageRow,
  goalsSignature,
  routineSignatureFromItems,
} from "@/lib/routine/goalsCoverage";

export const metadata = { title: "Ma routine · Cosme Check" };
export const dynamic = "force-dynamic";

function RoutineSkeleton() {
  return (
    <div
      className="neu-page mx-auto max-w-3xl px-5 lg:px-8 pt-4 pb-8 lg:py-12"
      aria-busy
      aria-label="Chargement de la routine"
    >
      <div className="h-8 w-56 rounded-xl bg-[#c5ccd6]/50 animate-pulse mb-4" />
      <div className="mt-3 -mx-5 h-px bg-[#c5ccd6] lg:mx-0" />
      <div className="mt-6 space-y-3">
        <div className="neu h-28 animate-pulse" />
        <div className="neu h-24 animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Small decorative SVG leaf displayed beside the routine title (parité mobile).
 */
function LeafAccent({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={`h-7 w-7 shrink-0 ${className}`}>
      <defs>
        <linearGradient id="leaf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
      </defs>
      <path
        d="M27 5C19 5 11 9 8 17c-2 6 0 11 4 13 0-7 4-13 11-17-5 5-9 10-10 16 7 1 13-2 16-9 2-6 1-12-2-15z"
        fill="url(#leaf-grad)"
      />
      <path
        d="M9 28c2-5 5-9 10-12"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export default async function RoutinePage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/routine");

  return (
    <Suspense fallback={<RoutineSkeleton />}>
      <RoutineContent />
    </Suspense>
  );
}

async function RoutineContent() {
  const user = await getUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const [routineRes, profile] = await Promise.all([
    sb
      .schema("cosme_check")
      .from("routine_items")
      .select("id, frequency, added_at, analysis_id, analyses(id, name, product_label, score, result_json, ean, category_precise)")
      .order("added_at", { ascending: false })
      .limit(100),
    getProfile(),
  ]);

  const restrictions = readUserRestrictions(profile?.preferences ?? null);
  const restrictionsCount = restrictions.families.length + restrictions.ingredients.length;

  const items = (routineRes.data ?? []) as unknown as {
    id: string;
    frequency: Frequency;
    added_at: string;
    analysis_id: string;
    analyses: {
      id: string;
      name: string | null;
      product_label: string | null;
      score: number | null;
      result_json: AnalyseResponse;
      ean: string | null;
      category_precise: string | null;
    } | null;
  }[];

  const products: RoutineProduct[] = items
    .filter((it) => it.analyses)
    .map((it) => ({
      id: it.analyses!.id,
      name: it.analyses!.product_label ?? it.analyses!.name ?? "Analyse",
      frequency: it.frequency,
      score: it.analyses!.score,
      result: it.analyses!.result_json,
      ean: it.analyses!.ean,
      categoryPrecise: it.analyses!.category_precise,
    }));

  const metrics = computeRoutineMetrics(products);
  const productsCount = products.length;

  // Couverture des objectifs : objectifs + signatures + ligne persistée (RLS).
  const skin = readSkinProfile(profile?.preferences ?? null);
  const goals = collectGoals(skin);
  const goalsSig = goalsSignature(goals);
  const routineSig = routineSignatureFromItems(
    items.map((it) => ({ analysis_id: it.analysis_id, frequency: it.frequency })),
  );
  const covRes = await sb
    .schema("cosme_check")
    .from("routine_goal_coverage")
    .select("coverage, routine_signature, goals_signature, model_version, product_count, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();
  const covRow = (covRes.data as GoalCoverageRow | null) ?? null;

  return (
    <div className="neu-page mx-auto max-w-3xl px-5 lg:px-8 pt-4 pb-8 lg:py-12">
      {/* Header : titre (avec feuille) → séparateur → chip Mes restrictions. */}
      <header>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold">Ma routine</h1>
          <LeafAccent />
        </div>
        <div className="mt-3 -mx-5 h-px bg-[#c5ccd6] lg:mx-0 lg:mt-4" />
        <div className="mt-4">
          <RestrictionsLinkButton count={restrictionsCount} />
        </div>
      </header>

      <section className="mt-6 space-y-3">
        {/* Carte Exposition cumulée → détail. */}
        <ExposureSummaryCard
          exposureScore={metrics.exposureScore}
          exposureLabel={metrics.exposureLabel}
          colorCounts={metrics.colorCounts}
          href="/routine/exposition"
        />

        {/* Carte « Ma routine soin » → liste des produits. */}
        <div>
          <Link
            href="/routine/produits"
            aria-label="Ouvrir ma routine soin"
            className="neu neu-hover flex items-center gap-4 p-5 relative transition"
          >
            <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-50">
              <svg viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
                <path d="m12 3 9 5-9 5-9-5 9-5z" />
                <path d="m3 12 9 5 9-5" />
                <path d="m3 16 9 5 9-5" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-[#111111]">Ma routine soin</div>
              {productsCount > 0 ? (
                <div className="mt-0.5 text-[12px] text-[#6B7280]">
                  {productsCount} {productsCount > 1 ? "produits" : "produit"}
                </div>
              ) : (
                <div className="mt-0.5 text-[12px] text-[#6B7280]">
                  Ajoute tes produits pour suivre ton exposition cumulée
                </div>
              )}
            </div>
            <span aria-hidden className="text-lg leading-none text-[#9CA3AF]">›</span>
          </Link>
          <p className="mt-1.5 px-1 text-[11px] italic text-[#9CA3AF]">
            Tous tes produits, reliés à ton exposition cumulée.
          </p>
        </div>

        {/* Carte « Couverture de tes objectifs » (même edge + design que mobile). */}
        <GoalsCoverageCard
          goalCount={goals.length}
          productCount={productsCount}
          goalsSig={goalsSig}
          routineSig={routineSig}
          initial={covRow}
        />
      </section>
    </div>
  );
}
