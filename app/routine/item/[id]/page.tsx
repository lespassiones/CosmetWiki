import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { decodeHtml } from "@/lib/decodeHtml";
import type { Frequency } from "@/lib/routine/engine";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import type { BlobCounts } from "@/components/blob/IngredientBlob";
import { ProductThumb, ProportionRing } from "@/components/routine/RoutineProductCard";
import { RoutineItemSettings } from "@/components/routine/RoutineItemSettings";

export const metadata = { title: "Réglages du produit · Cosme Check" };
export const dynamic = "force-dynamic";

export default async function RoutineItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect(`/auth/sign-in?next=/routine/item/${id}`);

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);

  const { data } = await sb
    .schema("cosme_check")
    .from("routine_items")
    .select("id, frequency, analysis_id, analyses(id, name, product_label, brand, result_json, ean)")
    .eq("id", id)
    .maybeSingle();

  const item = data as unknown as {
    id: string;
    frequency: Frequency;
    analysis_id: string;
    analyses: {
      id: string;
      name: string | null;
      product_label: string | null;
      brand: string | null;
      result_json: AnalyseResponse;
      ean: string | null;
    } | null;
  } | null;

  if (!item || !item.analyses) notFound();

  const analysis = item.analyses;
  const name = decodeHtml(analysis.product_label ?? analysis.name ?? "Produit");

  // Image produit par EAN (source de vérité).
  let imageUrl: string | null = null;
  if (analysis.ean) {
    const { data: catRows } = await sb
      .schema("cosme_check")
      .from("catalog")
      .select("image_url")
      .eq("ean", analysis.ean)
      .maybeSingle();
    imageUrl = (catRows as { image_url: string | null } | null)?.image_url ?? null;
  }

  const c = analysis.result_json?.counts;
  const counts: BlobCounts | null = c
    ? { vert: c.vert, jaune: c.jaune, orange: c.orange, rouge: c.rouge }
    : null;

  return (
    <div className="neu-page mx-auto max-w-2xl px-5 lg:px-8 pt-4 pb-8 lg:py-12">
      <header>
        <Link
          href="/routine/produits"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#6B7280] hover:text-[#111]"
        >
          <span aria-hidden>‹</span> Retour
        </Link>
        <h1 className="mt-3 text-2xl lg:text-3xl font-bold">Réglages du produit</h1>
        <div className="mt-3 -mx-5 h-px bg-[#c5ccd6] lg:mx-0" />
      </header>

      {/* Hero produit : photo + nom + marque + donut. */}
      <div className="mt-6 neu flex items-center gap-4 p-4">
        <ProductThumb url={imageUrl} className="-my-1 w-16 min-h-[64px]" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[#111111] line-clamp-2 leading-snug">{name}</div>
          {analysis.brand ? (
            <div className="mt-0.5 text-[12px] text-[#6B7280] truncate">{decodeHtml(analysis.brand)}</div>
          ) : null}
        </div>
        <ProportionRing counts={counts} size={44} stroke={7} />
      </div>

      <RoutineItemSettings
        routineItemId={item.id}
        analysisId={item.analysis_id}
        frequency={item.frequency}
      />
    </div>
  );
}
