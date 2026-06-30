import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { AnalyseResultPanelClient } from "@/components/AnalyseResultPanelClient";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import { HistoryItemActions } from "@/components/history/HistoryItemActions";
import { enrichAnalyseWithDbColors } from "@/lib/analysisEnrichment";

export const metadata = { title: "Analyse · Cosme Check" };
export const dynamic = "force-dynamic";

export default async function HistoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ promesse?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getUser();
  if (!user) redirect(`/auth/sign-in?next=/history/${id}`);

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  // Three parallel queries - analyses + routine + most-recent coherence -
  // none depend on each other. Pulling the coherence id lets the
  // "Analyser la promesse" CTA short-circuit to the existing result instead
  // of relaunching the whole identification + fetch flow when the user has
  // already run one.
  const [analysisResult, routineResult, coherenceResult] = await Promise.all([
    sb
      .schema("cosme_check")
      .from("analyses")
      .select(
        "id, name, product_label, brand, product_type, product_description, score, input_text, result_json, category, created_at, ean",
      )
      .eq("id", id)
      .maybeSingle(),
    sb
      .schema("cosme_check")
      .from("routine_items")
      .select("id")
      .eq("analysis_id", id)
      .maybeSingle(),
    sb
      .schema("cosme_check")
      .from("coherence_analyses")
      .select("id")
      .eq("analysis_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const { data, error } = analysisResult;
  if (error || !data) notFound();

  const inRoutine = Boolean(routineResult.data);
  const existingCoherenceId = (coherenceResult.data as { id?: string } | null)?.id ?? null;

  // If the user arrived from the history "Analyser la promesse" CTA with
  // ?promesse=auto but a coherence already exists, send them straight to
  // the existing result rather than re-running the modal.
  if (sp.promesse === "auto" && existingCoherenceId) {
    redirect(`/promesses/${existingCoherenceId}`);
  }

  const displayName =
    data.product_label
    ?? data.name
    ?? `Analyse du ${new Date(data.created_at).toLocaleDateString("fr-FR")}`;
  const rawResult = data.result_json as AnalyseResponse;
  // Backfill category from the dedicated DB column when result_json missed it
  // (e.g. LLM timed out during the 1.5 s race and the async patch only updated
  // the column, not result_json). Both fields carry the same value once stable.
  const dbCategory = (data as { category?: string | null }).category ?? null;
  if (!rawResult.category && dbCategory) {
    rawResult.category = dbCategory as import("@/lib/ai/categorize").ProductCategory;
  }

  // Lazily backfill `dbColorRating` on items saved before the field existed:
  // looks up the matched slug's colour in `ingredients` so the list stays
  // consistent with the ingredient detail pages. Persists the patched
  // result_json fire-and-forget so the next visit is instant.
  const { enriched: result, changed: enriched } = await enrichAnalyseWithDbColors(rawResult, sb);
  if (enriched) {
    void sb
      .schema("cosme_check")
      .from("analyses")
      .update({ result_json: result })
      .eq("id", id);
  }

  const analysedAt = new Date(data.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="w-full px-3 lg:px-6 pt-4 pb-16">
      {/* Top bar - back-to-history pill on the left, action buttons on the
          right. The product name is rendered as the H1 inside the panel below,
          so the breadcrumb (which used to repeat that name as its last item)
          is hidden via `breadcrumb={null}`. */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <Link
          href="/history"
          aria-label="Retour à l'historique"
          className="inline-flex items-center gap-1.5 rounded-full bg-white/85 hover:bg-white text-[#111111] ring-1 ring-black/[0.08] hover:ring-black/20 backdrop-blur-md px-3 py-1.5 text-[12px] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
          Retour
        </Link>
        <div className="flex items-center gap-2">
          <HistoryItemActions id={data.id} currentName={data.name ?? displayName} />
        </div>
      </div>

      <AnalyseResultPanelClient
        result={result}
        originalText={data.input_text ?? ""}
        productLabel={displayName}
        analysisId={data.id}
        brand={data.brand ?? null}
        productType={data.product_type ?? null}
        ean={(data as { ean?: string | null }).ean ?? null}
        existingCoherenceId={existingCoherenceId}
        autoOpenPromesse={sp.promesse === "auto"}
        alreadyInRoutine={inRoutine}
        breadcrumb={null}
      />

      <p className="mt-3 text-[11px] text-ink-subtle">Analysé le {analysedAt}</p>
    </div>
  );
}
