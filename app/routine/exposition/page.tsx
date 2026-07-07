import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { computeRoutineMetrics, type Frequency, type RoutineProduct } from "@/lib/routine/engine";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import { TagExposureBar } from "@/components/routine/TagExposureBar";
import { ExposureSummaryCard } from "@/components/routine/ExposureSummaryCard";

export const metadata = { title: "Exposition cumulée · Cosme Check" };
export const dynamic = "force-dynamic";

export default async function ExpositionPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/routine/exposition");

  return (
    <Suspense
      fallback={
        <div className="neu-page mx-auto max-w-5xl px-5 lg:px-8 pt-4 pb-8 lg:py-12" aria-busy>
          <div className="h-8 w-56 rounded-xl bg-[#c5ccd6]/50 animate-pulse" />
          <div className="mt-6 neu h-28 animate-pulse" />
          <div className="mt-4 neu h-64 animate-pulse" />
        </div>
      }
    >
      <ExpositionContent />
    </Suspense>
  );
}

async function ExpositionContent() {
  const user = await getUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const routineRes = await sb
    .schema("cosme_check")
    .from("routine_items")
    .select(
      "id, frequency, added_at, analysis_id, analyses(id, name, product_label, score, result_json, ean, category_precise)",
    )
    .order("added_at", { ascending: false })
    .limit(100);

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
  const tagsTop = metrics.tagExposure.slice(0, 8);

  return (
    <div className="neu-page mx-auto max-w-5xl px-5 lg:px-8 pt-4 pb-8 lg:py-12">
      <header>
        <Link
          href="/routine"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#6B7280] hover:text-[#111]"
        >
          <span aria-hidden>‹</span> Retour à ma routine
        </Link>
        <h1 className="mt-3 text-2xl lg:text-3xl font-bold">Exposition cumulée</h1>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          Le détail de ce à quoi ta routine t&apos;expose au quotidien.
        </p>
        <div className="mt-3 -mx-5 h-px bg-[#c5ccd6] lg:mx-0" />
      </header>

      {products.length === 0 ? (
        <p className="mt-8 text-sm text-[#6B7280]">
          Ajoute des produits à ta routine pour voir ton exposition détaillée.
        </p>
      ) : (
        <div className="mt-6 space-y-4 lg:space-y-6">
          {/* Rappel du score (mêmes valeurs que l'onglet Routine). */}
          <ExposureSummaryCard
            exposureScore={metrics.exposureScore}
            exposureLabel={metrics.exposureLabel}
            colorCounts={metrics.colorCounts}
          />

          {/* Exposition par catégorie d'ingrédients. */}
          <div className="neu p-5">
            <h2 className="text-[15px] font-semibold mb-1">
              Exposition cumulée par catégorie d&apos;ingrédients
            </h2>
            <p className="text-[11px] text-[#374151] mb-4">
              Plus la barre est longue, plus la catégorie est présente dans ta routine.
            </p>
            {tagsTop.length === 0 ? (
              <p className="text-sm text-[#6B7280]">
                Aucune catégorie pénalisante détectée dans cette routine.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {tagsTop.map((t) => (
                  <TagExposureBar
                    key={t.tag}
                    label={t.label}
                    count={t.cumulativeCount}
                    max={tagsTop[0].cumulativeCount || 1}
                    colorSegments={t.colorSegments}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Allergènes parfumants en doublon. */}
          {metrics.allergenOverlap.length > 0 && (
            <section className="neu-amber p-4">
              <h2 className="text-sm font-semibold text-amber-900 mb-2">
                ⚠️ Allergènes parfumants en doublon
              </h2>
              <p className="text-[13px] text-amber-800 leading-relaxed mb-2">
                Ces substances UE apparaissent dans plusieurs de tes produits :
              </p>
              <ul className="flex flex-wrap gap-2">
                {metrics.allergenOverlap.map((a) => (
                  <li
                    key={a.inciName}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur-md text-amber-800 text-[12px] font-medium px-2.5 py-1 ring-1 ring-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
                  >
                    {a.label}
                    <span className="text-amber-600 text-[10px]">×{a.productCount}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
