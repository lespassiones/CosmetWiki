import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { getProfile, getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { computeRoutineMetrics, type Frequency, type RoutineProduct } from "@/lib/routine/engine";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import { RoutineProductRow } from "@/components/routine/RoutineProductRow";
import { RoutineSuggestions } from "@/components/routine/RoutineSuggestions";
import { CatalogAlternatives } from "@/components/routine/CatalogAlternatives";
import { TagExposureBar } from "@/components/routine/TagExposureBar";
import { AddProductButton } from "@/components/routine/AddProductButton";
import { RestrictionsLinkButton } from "@/components/routine/RestrictionsLinkButton";
import { RoutineSimulationModal } from "@/components/routine/RoutineSimulationModal";
import { InfoBadge, Tooltip } from "@/components/Tooltip";
import { IngredientBlob } from "@/components/blob/IngredientBlob";
import { readUserRestrictions } from "@/lib/restrictions/types";

export const metadata = { title: "Ma routine · Cosme Check" };
export const dynamic = "force-dynamic";

function RoutineSkeleton() {
  return (
    <div
      className="neu-page mx-auto max-w-6xl px-5 lg:px-8 pt-4 pb-8 lg:py-12"
      aria-busy
      aria-label="Chargement de la routine"
    >
      <div className="h-8 w-56 rounded-xl bg-[#c5ccd6]/50 animate-pulse mb-4" />
      <div className="mt-3 -mx-5 h-px bg-[#c5ccd6] lg:mx-0" />
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        <div className="neu h-28 animate-pulse" />
        <div className="neu h-28 animate-pulse" />
        <div className="neu h-28 animate-pulse" />
      </div>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        <div className="neu h-64 animate-pulse" />
        <div className="neu h-64 animate-pulse" />
      </div>
    </div>
  );
}

function exposureFg(label: string): string {
  if (label === "Faible") return "text-emerald-700";
  if (label === "Modérée") return "text-amber-700";
  if (label === "Élevée") return "text-orange-700";
  return "text-rose-700";
}

/**
 * Small decorative SVG leaf displayed beside the routine title on mobile.
 * Pure decoration - the page works fine without it, but it warms up the
 * "ma routine" header and matches the wellness vibe of the rest of the app.
 */
function LeafAccent({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={`h-7 w-7 shrink-0 ${className}`}
    >
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
  // Two parallel queries: routine items (with their parent analyses joined)
  // + all analyses for the user. The second feeds the "Already scanned"
  // sub-modal of the AddProductButton - we trim out analyses already in the
  // routine so the user doesn't pick a duplicate.
  const [routineRes, analysesRes, profile] = await Promise.all([
    sb
      .schema("cosme_check")
      .from("routine_items")
      .select("id, frequency, added_at, analysis_id, analyses(id, name, product_label, score, result_json)")
      .order("added_at", { ascending: false })
      .limit(100),
    sb
      .schema("cosme_check")
      .from("analyses")
      .select("id, name, product_label, score, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
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
    } | null;
  }[];

  const allAnalyses = (analysesRes.data ?? []) as Array<{
    id: string;
    name: string | null;
    product_label: string | null;
    score: number | null;
    created_at: string;
  }>;
  const routineAnalysisIds = new Set(items.map((it) => it.analysis_id));
  const eligibleAnalyses = allAnalyses
    .filter((a) => !routineAnalysisIds.has(a.id))
    .map((a) => ({
      id: a.id,
      name: a.name,
      product_label: a.product_label,
      score: a.score,
      created_at: a.created_at,
    }));

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
  const exposureFgCls = exposureFg(metrics.exposureLabel);

  // Details for the "Produits pénalisants" tooltip.
  const penalizingDetails = products
    .filter((p) => typeof p.score === "number" && p.score < 13)
    .map((p) => {
      const worst = p.result.items
        .filter((it) => it.colorRating === "Rouge" || it.colorRating === "Orange")
        .sort((a, b) => {
          if (a.colorRating !== b.colorRating) return a.colorRating === "Rouge" ? -1 : 1;
          return (a.position ?? 999) - (b.position ?? 999);
        })
        .slice(0, 3)
        .map((it) => it.name ?? it.input);
      return { name: p.name, score: p.score, worst };
    });

  // Empty state - keep it inviting + make the CTA actually open the scan sheet.
  if (products.length === 0) {
    return (
      <div className="neu-page mx-auto max-w-5xl px-5 lg:px-8 py-8 lg:py-12">
        <header className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-1">Ma routine quotidienne</h1>
            <p className="text-sm text-[#6B7280]">
              Ta routine est vide. Ajoute des produits pour voir ton exposition cumulée.
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap w-full">
            <AddProductButton eligibleAnalyses={eligibleAnalyses} />
            <RestrictionsLinkButton count={restrictionsCount} />
          </div>
        </header>

        <div className="neu-rose p-8 text-center">
          <AddProductButton eligibleAnalyses={eligibleAnalyses} variant="ghost" label="+ Ajouter un produit à ma routine" className="text-[15px]" />
          <p className="text-xs text-[#6B7280] mt-2">
            Cherche un produit, scanne un code-barres ou colle une liste INCI - il sera analysé et ajouté à ta routine.
          </p>
        </div>
      </div>
    );
  }

  const productsCount = products.length;
  const tagsTop = metrics.tagExposure.slice(0, 8);

  // At-risk products (score < 13) — passed to the catalog-suggestions endpoint
  // which resolves each one's precise category (analysis EAN -> catalog, else
  // name classifier) and returns the single best alternative per product.
  const atRiskProducts = products
    .filter((p) => typeof p.score === "number" && p.score < 13)
    .slice(0, 5)
    .map((p) => ({
      name: p.name,
      category: (p.result?.catalogCategory as string | null) ?? null,
      score: typeof p.score === "number" ? p.score : 0,
    }));

  return (
    <div className="neu-page mx-auto max-w-6xl px-5 lg:px-8 pt-4 pb-8 lg:py-12">
      {/* Header - mobile: title (with leaf accent) → separator → desc → button (stacked)
                   desktop: title on top, separator under it, then desc + button row */}
      <header>
        <div className="lg:flex lg:items-baseline lg:justify-between lg:gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold">Ma routine quotidienne</h1>
            {/* Decorative leaf - only on mobile so the desktop header stays
                strictly informational. Matches the "Ma routine" mockup. */}
            <LeafAccent className="lg:hidden" />
          </div>
        </div>

        {/* Separator immediately under the title (both mobile and desktop) */}
        <div className="mt-3 -mx-5 h-px bg-[#c5ccd6] lg:mx-0 lg:mt-4" />

        <div className="lg:flex lg:items-start lg:justify-between lg:gap-4 lg:mt-4">
          <p className="mt-3 text-[12px] text-[#9CA3AF] lg:mt-0">
            Suis l&apos;exposition cumulée de ta routine et repère les produits à ajuster.
          </p>

          {/* Buttons stay on ONE row on every screen size. On mobile they
              share the width with flex-1 + min-w-0 so they shrink in lockstep
              instead of wrapping; inside each button the label is truncated
              with "…" if the slot gets too narrow. Gap stays constant. */}
          <div className="mt-4 lg:mt-0 flex items-center gap-2 w-full lg:w-auto">
            <AddProductButton
              eligibleAnalyses={eligibleAnalyses}
              className="flex-1 lg:flex-initial min-w-0"
            />
            <RestrictionsLinkButton
              count={restrictionsCount}
              className="flex-1 lg:flex-initial min-w-0"
            />
          </div>
        </div>
      </header>

      {/* Stat cards
          MOBILE : 1) Exposition full width  2) Actifs + Pénalisants side-by-side (compact)
          DESKTOP : the 3 cards on a single row (Exposition, Actifs, Pénalisants).
          `lg:contents` on the mobile-only wrapper lets the 2 small cards
          re-join the parent grid on lg+. */}
      <section className="mt-6 mb-6 grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        <div className="neu p-5 flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wide text-black mb-1">Exposition cumulée</div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-bold tabular-nums ${exposureFgCls}`}>
                {metrics.exposureScore.toFixed(1)}
              </span>
              <span className="text-sm text-[#6B7280]">/20</span>
            </div>
            <div className={`mt-1 text-[12px] font-semibold ${exposureFgCls}`}>{metrics.exposureLabel}</div>
          </div>
          <div className="w-[120px] shrink-0">
            <IngredientBlob counts={metrics.colorCounts} variant="md" neumorphic />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:contents">
          <div className="neu p-3.5 lg:p-5">
            <div className="text-[10px] lg:text-[11px] uppercase tracking-wide text-black mb-0.5 lg:mb-1">Produits actifs</div>
            <div className="text-2xl lg:text-3xl font-bold tabular-nums leading-tight">{productsCount}</div>
            <p className="text-[10px] lg:text-[11px] text-[#9CA3AF] mt-0.5 lg:mt-1 leading-snug">
              {metrics.totalUseUnits.toFixed(1)} u/jour
            </p>
          </div>

          <div className="neu p-3.5 lg:p-5">
            <div className="text-[10px] lg:text-[11px] uppercase tracking-wide text-black mb-0.5 lg:mb-1">Produits pénalisants</div>
            <div className="flex items-baseline gap-1.5">
              {metrics.penalizingProductsCount > 0 ? (
                <Tooltip
                  placement="bottom"
                  maxWidth={300}
                  content={
                    <div className="space-y-2.5">
                      {penalizingDetails.map((p, i) => (
                        <div key={i}>
                          <div className="font-semibold text-white leading-tight truncate">
                            {p.name} - {p.score?.toFixed(1)}/20
                          </div>
                          {p.worst.length > 0 && (
                            <div className="text-[11px] text-white/70 mt-0.5 leading-snug">
                              {p.worst.join(" · ")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  }
                >
                  <span className="inline-flex items-baseline gap-1.5 cursor-help">
                    <span className="text-2xl lg:text-3xl font-bold tabular-nums text-rose-600 leading-tight">
                      {metrics.penalizingProductsCount}
                    </span>
                    <span aria-hidden className="text-rose-500 text-base lg:text-xl">⚠</span>
                  </span>
                </Tooltip>
              ) : (
                <span className="text-2xl lg:text-3xl font-bold tabular-nums leading-tight">
                  {metrics.penalizingProductsCount}
                </span>
              )}
            </div>
            <p className="text-[10px] lg:text-[11px] text-[#9CA3AF] mt-0.5 lg:mt-1 leading-snug">
              score &lt; 13/20
            </p>
          </div>
        </div>
      </section>

      {/* 2-column: bar chart + product list */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-3 lg:gap-4 mb-6">
        {/* Left: exposition par catégorie d'ingrédients */}
        <div className="neu p-5">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[15px] font-semibold">Exposition cumulée par catégorie d&apos;ingrédients</h2>
            <Tooltip
              maxWidth={320}
              content={
                <>
                  Cette section regarde tous tes produits ensemble et compte combien
                  de fois chaque <b>famille d&apos;ingrédients</b> revient dans ta
                  routine, en tenant compte de la fréquence d&apos;usage (un produit
                  quotidien pèse plus qu&apos;un hebdo).
                  <br />
                  <br />
                  Exemples de familles : <b>conservateurs</b> (Phenoxyethanol,
                  Sodium Benzoate…), <b>sulfates</b> (SLS, SLES…),{" "}
                  <b>parfums de synthèse</b>, <b>silicones</b>,{" "}
                  <b>allergènes parfumants</b> (Limonene, Linalool…).
                  <br />
                  <br />
                  Plus une barre est longue, plus tu es exposé·e à cette famille
                  au quotidien. Ce n&apos;est pas un verdict de danger : c&apos;est
                  juste une mesure de présence, utile pour repérer les doublons
                  (par exemple : 3 produits qui contiennent tous des allergènes
                  parfumants).
                </>
              }
            >
              <button
                type="button"
                aria-label="À quoi sert cette section ?"
                className="inline-flex items-center"
              >
                <InfoBadge />
              </button>
            </Tooltip>
          </div>
          <p className="text-[11px] text-[#374151] mb-4">
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
                  colorSegments={t.colorSegments}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Right: liste produits */}
        <div className="neu p-5">
          <h2 className="text-[15px] font-semibold mb-3">Mes produits</h2>
          <ul className="divide-y divide-[#F0F0F0]">
            {items
              .filter((it) => it.analyses)
              .map((it) => {
                const c = it.analyses!.result_json?.counts;
                return (
                  <RoutineProductRow
                    key={it.id}
                    routineItemId={it.id}
                    analysisId={it.analysis_id}
                    name={it.analyses!.product_label ?? it.analyses!.name ?? "Analyse"}
                    counts={
                      c
                        ? {
                            vert: c.vert,
                            jaune: c.jaune,
                            orange: c.orange,
                            rouge: c.rouge,
                          }
                        : null
                    }
                    frequency={it.frequency}
                  />
                );
              })}
          </ul>
        </div>
      </section>

      {/* Simulation - only rendered if there's at least one penalizing
          product to remove. Otherwise the suggestion is dishonest: removing a
          well-scored product just to bump the average doesn't reflect a real
          improvement. */}
      {metrics.simulation.removableCount > 0 && (
        <section className="neu p-5 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold mb-1">Simulation</h2>
              <p className="text-[13px] text-[#374151]">
                {metrics.simulation.removableCount === 1
                  ? "Que se passe-t-il si je retire le produit le plus pénalisant ?"
                  : "Que se passe-t-il si je retire les 2 produits les plus pénalisants ?"}
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
      )}

      {/* Allergen overlap warning */}
      {metrics.allergenOverlap.length > 0 && (
        <section className="neu-amber p-4 mb-6">
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

      {/* Catalog alternatives for at-risk products (score < 13) */}
      {atRiskProducts.length > 0 && (
        <div className="mt-4">
          <CatalogAlternatives products={atRiskProducts} />
        </div>
      )}
    </div>
  );
}
