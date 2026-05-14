import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { AnalyseResultPanel } from "@/components/AnalyseResultPanel";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import { HistoryItemActions } from "@/components/history/HistoryItemActions";
import { AddToRoutineButton } from "@/components/routine/AddToRoutineButton";

export const metadata = { title: "Analyse · Cosme Check" };
export const dynamic = "force-dynamic";

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect(`/auth/sign-in?next=/history/${id}`);

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  // Run the two queries in parallel — analyses + routine_items don't depend
  // on each other, so we don't need to wait for the first to finish before
  // firing the second. Saves ~80-150ms per page load (one full Supabase RTT).
  const [analysisResult, routineResult] = await Promise.all([
    sb
      .schema("cosme_check")
      .from("analyses")
      .select("id, name, product_label, score, input_text, result_json, created_at")
      .eq("id", id)
      .maybeSingle(),
    sb
      .schema("cosme_check")
      .from("routine_items")
      .select("id")
      .eq("analysis_id", id)
      .maybeSingle(),
  ]);

  const { data, error } = analysisResult;
  if (error || !data) notFound();

  const inRoutine = Boolean(routineResult.data);

  const displayName =
    data.product_label
    ?? data.name
    ?? `Analyse du ${new Date(data.created_at).toLocaleDateString("fr-FR")}`;
  const result = data.result_json as AnalyseResponse;
  const analysedAt = new Date(data.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="w-full px-3 lg:px-6 pt-4 pb-16">
      {/* Action buttons floating above the title bar — rename / delete /
          add-to-routine. The title + breadcrumb live inside the panel below. */}
      <div className="flex items-center justify-end gap-2 mb-2">
        <AddToRoutineButton analysisId={data.id} alreadyInRoutine={inRoutine} />
        <HistoryItemActions id={data.id} currentName={data.name ?? displayName} />
      </div>

      <AnalyseResultPanel
        result={result}
        originalText={data.input_text ?? ""}
        productLabel={displayName}
        breadcrumb={[
          { label: "Accueil", href: "/" },
          { label: "Mon historique", href: "/history" },
          { label: displayName },
        ]}
      />

      <p className="mt-3 text-[11px] text-ink-subtle">Analysé le {analysedAt}</p>
    </div>
  );
}
