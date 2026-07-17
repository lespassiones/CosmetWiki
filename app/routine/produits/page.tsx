import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { getAppConfig } from "@/lib/appConfig";
import type { Frequency } from "@/lib/routine/engine";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import type { BlobCounts } from "@/components/blob/IngredientBlob";
import { AddProductButton } from "@/components/routine/AddProductButton";
import type { EligibleAnalysis } from "@/components/routine/AddProductChoiceModal";
import { RoutineProductCard } from "@/components/routine/RoutineProductCard";

export const metadata = { title: "Ma routine soin · Cosme Check" };
export const dynamic = "force-dynamic";

export default async function ProduitsPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/routine/produits");

  return (
    <Suspense
      fallback={
        <div className="neu-page mx-auto max-w-3xl px-5 lg:px-8 pt-4 pb-8 lg:py-12" aria-busy>
          <div className="h-6 w-40 rounded-xl bg-[#c5ccd6]/50 animate-pulse" />
          <div className="mt-6 space-y-3">
            <div className="neu h-20 animate-pulse" />
            <div className="neu h-20 animate-pulse" />
            <div className="neu h-20 animate-pulse" />
          </div>
        </div>
      }
    >
      <ProduitsContent />
    </Suspense>
  );
}

async function ProduitsContent() {
  const user = await getUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const cfg = await getAppConfig();

  const [routineRes, analysesRes] = await Promise.all([
    sb
      .schema("cosme_check")
      .from("routine_items")
      .select("id, added_at, analysis_id, analyses(id, name, product_label, brand, score, result_json, ean)")
      .order("added_at", { ascending: false })
      .limit(100),
    sb
      .schema("cosme_check")
      .from("analyses")
      .select("id, name, product_label, score, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const items = (routineRes.data ?? []) as unknown as {
    id: string;
    added_at: string;
    analysis_id: string;
    analyses: {
      id: string;
      name: string | null;
      product_label: string | null;
      brand: string | null;
      score: number | null;
      result_json: AnalyseResponse;
      ean: string | null;
    } | null;
  }[];

  const usable = items.filter((it) => it.analyses);

  // Résolution image en LOT (EAN = source de vérité), une seule requête catalog.
  const eans = Array.from(
    new Set(usable.map((it) => it.analyses!.ean).filter((e): e is string => Boolean(e))),
  );
  const imageByEan = new Map<string, string>();
  if (eans.length > 0) {
    const { data: catRows } = await sb
      .schema("cosme_check")
      .from("catalog")
      .select("ean, image_url")
      .in("ean", eans);
    for (const c of (catRows ?? []) as { ean: string; image_url: string | null }[]) {
      if (c.image_url) imageByEan.set(c.ean, c.image_url);
    }
  }

  // Analyses éligibles (pas déjà dans la routine) pour la modale « Choisir dans
  // mon historique ».
  const allAnalyses = (analysesRes.data ?? []) as EligibleAnalysis[];
  const routineAnalysisIds = new Set(usable.map((it) => it.analysis_id));
  const eligibleAnalyses = allAnalyses.filter((a) => !routineAnalysisIds.has(a.id));

  return (
    <div className="neu-page mx-auto max-w-3xl px-5 lg:px-8 pt-4 pb-8 lg:py-12">
      <header>
        <Link
          href="/routine"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#6B7280] hover:text-[#111]"
        >
          <span aria-hidden>‹</span> Retour à ma routine
        </Link>
        <h1 className="mt-3 text-2xl lg:text-3xl font-bold">Ma routine soin</h1>
        <div className="mt-3 -mx-5 h-px bg-[#c5ccd6] lg:mx-0" />
      </header>

      <div className="mt-6">
        <AddProductButton
          variant="success"
          eligibleAnalyses={eligibleAnalyses}
          className="w-full"
        />
      </div>

      {usable.length === 0 ? (
        <div className="mt-8 neu p-8 text-center">
          <p className="text-sm text-[#6B7280]">
            Ta routine est vide. Ajoute des produits pour suivre ton exposition cumulée.
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-4 space-y-3">
            {usable.map((it) => {
              const c = it.analyses!.result_json?.counts;
              const counts: BlobCounts | null = c
                ? { vert: c.vert, jaune: c.jaune, orange: c.orange, rouge: c.rouge }
                : null;
              return (
                <li key={it.id}>
                  <RoutineProductCard
                    routineItemId={it.id}
                    name={it.analyses!.product_label ?? it.analyses!.name ?? "Produit"}
                    brand={it.analyses!.brand}
                    counts={counts}
                    imageUrl={it.analyses!.ean ? imageByEan.get(it.analyses!.ean) ?? null : null}
                  />
                </li>
              );
            })}
          </ul>

          {cfg.flag_suggestions && (
            <Link
              href="/routine/suggestions"
              className="mt-6 neu-shadow flex items-center justify-center gap-2 rounded-full bg-[#F43F5E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#E11D48]"
            >
              <span aria-hidden>✨</span> Proposer de meilleures alternatives
            </Link>
          )}
        </>
      )}
    </div>
  );
}
