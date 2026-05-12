import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { computeRoutineMetrics, type Frequency, type RoutineProduct } from "@/lib/routine/engine";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import { RoutineProductRow } from "@/components/routine/RoutineProductRow";
import { RoutineSuggestions } from "@/components/routine/RoutineSuggestions";
import { TagExposureBar } from "@/components/routine/TagExposureBar";
import { AddProductButton } from "@/components/routine/AddProductButton";
import { RoutineSimulationModal } from "@/components/routine/RoutineSimulationModal";
import { GLASS_CARD, GLASS_CARD_AMBER, GLASS_CARD_ROSE } from "@/lib/ui/glass";

export const metadata = { title: "Ma routine · Cosme Check" };
export const dynamic = "force-dynamic";

function exposureStroke(label: string): string {
  if (label === "Faible") return "#10B981";
  if (label === "Modérée") return "#F59E0B";
  if (label === "Élevée") return "#FB923C";
  return "#EF4444";
}

function exposureFg(label: string): string {
  if (label === "Faible") return "text-emerald-700";
  if (label === "Modérée") return "text-amber-700";
  if (label === "Élevée") return "text-orange-700";
  return "text-rose-700";
}

function ExposureGauge({ score, stroke }: { score: number; stroke: string }) {
  const radius = 50;
  const arcLength = Math.PI * radius;
  const filled = Math.max(0, Math.min(1, score / 20)) * arcLength;
  const path = "M 10 64 A 50 50 0 0 1 110 64";
  return (
    <div className="relative h-[72px] w-[120px] shrink-0">
      <svg viewBox="0 0 120 68" className="h-full w-full" aria-hidden>
        <path d={path} fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="9" strokeLinecap="round" />
        <path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={arcLength - filled}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex items-baseline justify-center">
        <span className="text-[22px] font-bold leading-none text-[#111111] tabular-nums">
          {score.toFixed(1)}
        </span>
        <span className="ml-0.5 text-[11px] font-medium leading-none text-[#6B7280]">/20</span>
      </div>
    </div>
  );
}

export default async function RoutinePage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/routine");

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data } = await sb
    .schema("cosme_check")
    .from("routine_items")
    .select("id, frequency, added_at, analysis_id, analyses(id, name, product_label, score, result_json)")
    .order("added_at", { ascending: false });

  const items = (data ?? []) as unknown as {
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
    }));

  const metrics = computeRoutineMetrics(products);
  const exposureStrokeColor = exposureStroke(metrics.exposureLabel);
  const exposureFgCls = exposureFg(metrics.exposureLabel);

  // Empty state — keep it inviting + make the CTA actually open the scan sheet.
  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-5 lg:px-8 py-8 lg:py-12">
        <header className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-1">Ma routine quotidienne</h1>
            <p className="text-sm text-[#6B7280]">
              Ta routine est vide. Ajoute des produits pour voir ton exposition cumulée.
            </p>
          </div>
          <AddProductButton />
        </header>

        <div className={`${GLASS_CARD_ROSE} p-8 text-center`}>
          <AddProductButton variant="ghost" label="+ Ajouter un produit à ma routine" className="text-[15px]" />
          <p className="text-xs text-[#6B7280] mt-2">
            Cherche un produit, scanne un code-barres ou colle une liste INCI — il sera analysé et ajouté à ta routine.
          </p>
        </div>
      </div>
    );
  }

  const productsCount = products.length;
  const tagsTop = metrics.tagExposure.slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl px-5 lg:px-8 py-8 lg:py-12">
      {/* Header */}
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">Ma routine quotidienne</h1>
          <p className="text-[12px] text-[#9CA3AF]">
            Astuce : sélectionne 2 analyses pour les comparer côte à côte.
          </p>
        </div>
        <AddProductButton />
      </header>

      {/* 3 stat cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 mb-6">
        <div className={`${GLASS_CARD} p-5 flex items-center gap-4`}>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-1">Exposition cumulée</div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-bold tabular-nums ${exposureFgCls}`}>
                {metrics.exposureScore.toFixed(1)}
              </span>
              <span className="text-sm text-[#6B7280]">/20</span>
            </div>
            <div className={`mt-1 text-[12px] font-semibold ${exposureFgCls}`}>{metrics.exposureLabel}</div>
          </div>
          <ExposureGauge score={metrics.exposureScore} stroke={exposureStrokeColor} />
        </div>

        <div className={`${GLASS_CARD} p-5`}>
          <div className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-1">Produits actifs</div>
          <div className="text-3xl font-bold tabular-nums">{productsCount}</div>
          <p className="text-[11px] text-[#9CA3AF] mt-1">
            {metrics.totalUseUnits.toFixed(1)} unités d&apos;usage / jour
          </p>
        </div>

        <div className={`${GLASS_CARD} p-5`}>
          <div className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-1">Produits pénalisants</div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold tabular-nums ${metrics.penalizingProductsCount > 0 ? "text-rose-600" : ""}`}>
              {metrics.penalizingProductsCount}
            </span>
            {metrics.penalizingProductsCount > 0 && (
              <span aria-hidden className="text-rose-500 text-xl">⚠</span>
            )}
          </div>
          <p className="text-[11px] text-[#9CA3AF] mt-1">
            score &lt; 13/20 (orange / rose)
          </p>
        </div>
      </section>

      {/* 2-column: bar chart + product list */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-3 lg:gap-4 mb-6">
        {/* Left: exposition par catégorie d'ingrédients */}
        <div className={`${GLASS_CARD} p-5`}>
          <h2 className="text-[15px] font-semibold mb-1">Exposition cumulée par catégorie d&apos;ingrédients</h2>
          <p className="text-[11px] text-[#9CA3AF] mb-4">
            Plus la barre est longue, plus la catégorie est présente dans ta routine.
          </p>
          {tagsTop.length === 0 ? (
            <p className="text-sm text-[#6B7280]">Aucune catégorie pénalisante détectée dans cette routine.</p>
          ) : (
            <ul className="space-y-2.5">
              {tagsTop.map((t) => (
                <TagExposureBar
                  key={t.tag}
                  label={t.label}
                  count={t.cumulativeCount}
                  max={tagsTop[0].cumulativeCount || 1}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Right: liste produits */}
        <div className={`${GLASS_CARD} p-5`}>
          <h2 className="text-[15px] font-semibold mb-3">Mes produits</h2>
          <ul className="divide-y divide-[#F0F0F0]">
            {items
              .filter((it) => it.analyses)
              .map((it) => (
                <RoutineProductRow
                  key={it.id}
                  routineItemId={it.id}
                  analysisId={it.analysis_id}
                  name={it.analyses!.product_label ?? it.analyses!.name ?? "Analyse"}
                  score={it.analyses!.score}
                  frequency={it.frequency}
                />
              ))}
          </ul>
        </div>
      </section>

      {/* Simulation */}
      <section className={`${GLASS_CARD} p-5 mb-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold mb-1">Simulation</h2>
            <p className="text-[13px] text-[#6B7280]">
              Que se passe-t-il si je retire les 2 produits les plus pénalisants ?
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-[12px] text-[#6B7280]">
              Nouvelle exposition :{" "}
              <span className="text-xl font-bold text-[#111111] tabular-nums">
                {metrics.simulation.minus2.exposureScore.toFixed(1)}
              </span>
              <span className="text-sm text-[#6B7280]">/20</span>
            </div>
            <div className="text-[12px] font-semibold text-emerald-600 flex items-center gap-1">
              <span aria-hidden>↑</span>
              <span className="tabular-nums">
                {(metrics.simulation.minus2.exposureScore - metrics.exposureScore).toFixed(1)}
              </span>
            </div>
            <RoutineSimulationModal metrics={metrics} currentScore={metrics.exposureScore} />
          </div>
        </div>
      </section>

      {/* Allergen overlap warning */}
      {metrics.allergenOverlap.length > 0 && (
        <section className={`${GLASS_CARD_AMBER} p-4 mb-6`}>
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

      {/* AI suggestions */}
      <RoutineSuggestions metrics={metrics} products={products} />
    </div>
  );
}
