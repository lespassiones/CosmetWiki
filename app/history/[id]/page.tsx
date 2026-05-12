import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { AnalyseResultPanel } from "@/components/AnalyseResultPanel";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import { HistoryItemActions } from "@/components/history/HistoryItemActions";
import { AddToRoutineButton } from "@/components/routine/AddToRoutineButton";

export const metadata = { title: "Analyse · CosmetWiki" };
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
  const { data, error } = await sb
    .schema("cosmetwiki")
    .from("analyses")
    .select("id, name, product_label, score, input_text, result_json, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

  // Is this analysis already pinned to the user's routine?
  const { data: routineRow } = await sb
    .schema("cosmetwiki")
    .from("routine_items")
    .select("id")
    .eq("analysis_id", id)
    .maybeSingle();
  const inRoutine = Boolean(routineRow);

  const displayName =
    data.product_label
    ?? data.name
    ?? `Analyse du ${new Date(data.created_at).toLocaleDateString("fr-FR")}`;
  const result = data.result_json as AnalyseResponse;

  return (
    <div className="mx-auto max-w-6xl px-5 lg:px-8 py-6 lg:py-10">
      <div className="flex items-center justify-between mb-2">
        <Link href="/history" className="text-sm text-[#6B7280] hover:text-black">
          ← Mon historique
        </Link>
        <div className="flex items-center gap-2">
          <AddToRoutineButton analysisId={data.id} alreadyInRoutine={inRoutine} />
          <HistoryItemActions
            id={data.id}
            currentName={data.name ?? displayName}
          />
        </div>
      </div>

      <h1 className="text-2xl lg:text-3xl font-bold mb-1">{displayName}</h1>
      <p className="text-xs text-[#6B7280] mb-6">
        Analysé le {new Date(data.created_at).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      <AnalyseResultPanel
        result={result}
        originalText={data.input_text ?? ""}
      />
    </div>
  );
}
