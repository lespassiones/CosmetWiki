import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { computeRoutineMetrics, type Frequency, type RoutineProduct } from "@/lib/routine/engine";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import { RoutineProductRow } from "@/components/routine/RoutineProductRow";
import { RoutineSuggestions } from "@/components/routine/RoutineSuggestions";
import { TagExposureBar } from "@/components/routine/TagExposureBar";
import {
  GLASS_CARD,
  GLASS_CARD_AMBER,
  GLASS_CARD_EMERALD,
  GLASS_CARD_ORANGE,
  GLASS_CARD_ROSE,
} from "@/lib/ui/glass";

const EXPOSURE_GLASS: Record<string, string> = {
  Faible: GLASS_CARD_EMERALD,
  Modérée: GLASS_CARD_AMBER,
  Élevée: GLASS_CARD_ORANGE,
};

function exposureGlass(label: string): string {
  return EXPOSURE_GLASS[label] ?? GLASS_CARD_ROSE;
}

export const metadata = { title: "Ma routine · Cosme Check" };
export const dynamic = "force-dynamic";

function exposureFg(label: string): string {
  if (label === "Faible") return "text-emerald-700";
  if (label === "Modérée") return "text-amber-700";
  if (label === "Élevée") return "text-orange-700";
  return "text-rose-700";
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
  const exposureGlassCls = exposureGlass(metrics.exposureLabel);
  const exposureFgCls = exposureFg(metrics.exposureLabel);

  return (
    <div className="mx-auto max-w-5xl px-5 lg:px-8 py-8 lg:py-12">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-1">Ma routine quotidienne</h1>
        <p className="text-sm text-[#6B7280]">
          {products.length === 0
            ? "Ta routine est vide. Ajoute des produits depuis l'historique pour voir ton exposition cumulée."
            : `${products.length} produit${products.length > 1 ? "s" : ""} actif${products.length > 1 ? "s" : ""}.`}
        </p>
      </header>

      {products.length === 0 ? (
        <div className={`${GLASS_CARD_ROSE} p-8 text-center`}>
          <p className="text-sm text-[#F43F5E] font-semibold mb-2">+ Ajouter un produit à ma routine</p>
          <p className="text-xs text-[#6B7280] mb-4">
            Analyse un produit puis ajoute-le à ta routine pour suivre ton exposition cumulée.
          </p>
          <Link
            href="/history"
            className="inline-block text-sm font-semibold text-[#111111] hover:underline"
          >
            Voir mon historique →
          </Link>
        </div>
      ) : (
        <>
          {/* Hero: exposure score + simulation teaser */}
          <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr] gap-3 lg:gap-4 mb-6">
            <div className={`${exposureGlassCls} p-5`}>
              <div className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-1">Exposition cumulée</div>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${exposureFgCls}`}>{metrics.exposureScore}</span>
                <span className="text-sm text-[#6B7280]">/20</span>
                <span className={`ml-auto text-sm font-semibold ${exposureFgCls}`}>{metrics.exposureLabel}</span>
              </div>
              <p className="text-[12px] text-[#6B7280] mt-3 leading-relaxed">
                Score pondéré par la fréquence d&apos;usage. Plus tu utilises un produit pénalisant, plus
                il pèse dans le total.
              </p>
            </div>
            <div className={`${GLASS_CARD} p-5`}>
              <div className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-1">Produits actifs</div>
              <div className="text-3xl font-bold">{products.length}</div>
              <p className="text-[11px] text-[#9CA3AF] mt-1">
                {metrics.totalUseUnits.toFixed(1)} unités d&apos;usage / jour
              </p>
            </div>
            <div className={`${GLASS_CARD} p-5`}>
              <div className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-1">Catégories pénalisantes</div>
              <div className="text-3xl font-bold">{metrics.tagExposure.length}</div>
              <p className="text-[11px] text-[#9CA3AF] mt-1">tags cumulés détectés</p>
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

          {/* Top problematic ingredients across the whole routine */}
          {metrics.topIngredients.length > 0 && (
            <section className={`${GLASS_CARD} p-5 mb-6`}>
              <h2 className="text-[15px] font-semibold mb-3">
                Ingrédients à surveiller dans ta routine
              </h2>
              <p className="text-[12px] text-[#6B7280] mb-4">
                Pondéré par fréquence d&apos;usage × pénalité. Plus la barre est longue, plus tu y es exposé.
              </p>
              <ul className="space-y-3">
                {metrics.topIngredients.map((i, idx) => {
                  const max = metrics.topIngredients[0].weightedExposure || 1;
                  const pct = Math.max(8, Math.round((i.weightedExposure / max) * 100));
                  const bar = i.colorRating === "Rouge"
                    ? "bg-rose-400"
                    : i.colorRating === "Orange"
                      ? "bg-orange-400"
                      : "bg-amber-400";
                  return (
                    <li key={`${i.slug ?? i.name}-${idx}`}>
                      <div className="flex items-baseline justify-between text-[13px] mb-1">
                        <div className="font-semibold truncate pr-3">
                          {i.slug ? (
                            <Link href={`/i/${i.slug}`} className="hover:underline">
                              {i.name}
                            </Link>
                          ) : i.name}
                        </div>
                        <div className="text-[11px] text-[#6B7280] shrink-0">
                          dans {i.productCount} produit{i.productCount > 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Tag exposure (heat map) */}
          {metrics.tagExposure.length > 0 && (
            <section className={`${GLASS_CARD} p-5 mb-6`}>
              <h2 className="text-[15px] font-semibold mb-2">Exposition par catégorie</h2>
              <p className="text-[12px] text-[#6B7280] mb-4">
                Combien de fois par jour tu rencontres chaque famille d&apos;ingrédients.
              </p>
              <ul className="space-y-2">
                {metrics.tagExposure.slice(0, 8).map((t) => (
                  <TagExposureBar
                    key={t.tag}
                    label={t.label}
                    count={t.cumulativeCount}
                    max={metrics.tagExposure[0].cumulativeCount || 1}
                  />
                ))}
              </ul>
            </section>
          )}

          {/* Simulation: what-if I remove the worst */}
          <section className={`${GLASS_CARD_ROSE} p-5 mb-6`}>
            <h2 className="text-[15px] font-semibold mb-2 text-[#9F1239]">Simulation</h2>
            <p className="text-[13px] text-[#9F1239] mb-4 leading-relaxed">
              Si tu retirais les produits les plus pénalisants, voici comment ton score évoluerait :
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {metrics.simulation.minus1.removedName && (
                <div className="rounded-2xl bg-white/70 ring-1 ring-white/80 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] p-4">
                  <div className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-1">Sans le pire</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{metrics.simulation.minus1.exposureScore}</span>
                    <span className="text-sm text-[#6B7280]">/20</span>
                    <span className="ml-auto text-[12px] font-semibold text-emerald-700">
                      +{(metrics.simulation.minus1.exposureScore - metrics.exposureScore).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-2 truncate">
                    Sans : <span className="font-medium">{metrics.simulation.minus1.removedName}</span>
                  </p>
                </div>
              )}
              {metrics.simulation.minus2.removedNames.length === 2 && (
                <div className="rounded-2xl bg-white/70 ring-1 ring-white/80 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] p-4">
                  <div className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-1">Sans les 2 pires</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{metrics.simulation.minus2.exposureScore}</span>
                    <span className="text-sm text-[#6B7280]">/20</span>
                    <span className="ml-auto text-[12px] font-semibold text-emerald-700">
                      +{(metrics.simulation.minus2.exposureScore - metrics.exposureScore).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-2 truncate">
                    Sans : <span className="font-medium">{metrics.simulation.minus2.removedNames.join(", ")}</span>
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Smart AI suggestions (6.6) */}
          <RoutineSuggestions metrics={metrics} products={products} />

          {/* Products list with frequency selector */}
          <section className={`${GLASS_CARD} p-5`}>
            <h2 className="text-[15px] font-semibold mb-4">Mes produits</h2>
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
          </section>
        </>
      )}
    </div>
  );
}
