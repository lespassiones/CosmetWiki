import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { CoherenceWizard, type AnalysisOption } from "@/components/coherence/CoherenceWizard";
import type { AnalyseResponse } from "@/lib/analyseTypes";

export const metadata = { title: "Nouvelle analyse de cohérence · Cosme Check" };

type AnalysisRow = {
  id: string;
  name: string | null;
  product_label: string | null;
  score: number | null;
  created_at: string;
  result_json: AnalyseResponse | null;
};

type SP = {
  analysisId?: string;
  description?: string;
};

export default async function NouvellePromessePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/promesses/nouvelle");

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data, error } = await sb
    .schema("cosme_check")
    .from("analyses")
    .select("id, name, product_label, score, created_at, result_json")
    .order("created_at", { ascending: false })
    .limit(50);

  const raw = (error ? [] : (data ?? [])) as AnalysisRow[];

  // Build a lighter projection to send to the client - we only need what the
  // wizard's confirmation step displays (top 3 ingredients + counts), not the
  // full INCI payload.
  const options: AnalysisOption[] = raw
    .filter((r) => r.result_json !== null)
    .map((r) => {
      const result = r.result_json as AnalyseResponse;
      const top3 = (result.items ?? [])
        .slice()
        .sort((a, b) => a.position - b.position)
        .slice(0, 3)
        .map((it) => it.name ?? it.input);
      return {
        id: r.id,
        title:
          r.product_label
          ?? r.name
          ?? `Analyse du ${new Date(r.created_at).toLocaleDateString("fr-FR")}`,
        score: r.score,
        createdAt: r.created_at,
        totalIngredients: result.counts?.total ?? 0,
        matchedIngredients: result.counts?.matched ?? 0,
        counts: {
          vert: result.counts?.vert ?? 0,
          jaune: result.counts?.jaune ?? 0,
          orange: result.counts?.orange ?? 0,
          rouge: result.counts?.rouge ?? 0,
        },
        top3,
      };
    });

  // Pre-fill flow: PromesseFlowModal (and the future history "Analyser la
  // promesse" buttons) route here with the analyse id + description already
  // chosen. We pass them as initial state to the wizard so it skips straight
  // to the confirmation step instead of asking the user to retype everything.
  const sp = await searchParams;
  const initialAnalysisId =
    sp.analysisId && options.some((o) => o.id === sp.analysisId) ? sp.analysisId : null;
  const initialDescription = sp.description ? sp.description.slice(0, 6000) : null;

  return (
    <div className="mx-auto max-w-3xl px-5 lg:px-8 py-8 lg:py-12">
      <Link
        href="/promesses"
        className="text-sm text-[#6B7280] hover:text-black inline-flex items-center gap-1 mb-3"
      >
        ← Promesses
      </Link>
      <h1 className="text-2xl lg:text-3xl font-bold mb-2">Nouvelle analyse de cohérence</h1>

      <div className="mt-3 -mx-5 h-[2px] bg-black/30 lg:mx-0 lg:mt-4 lg:h-px lg:bg-black/[0.08]" />

      <p className="mt-3 text-[13px] text-[#6B7280]">
        On compare ce qui est promis sur l&apos;emballage avec ce qui est vraiment dans la liste INCI.
      </p>

      <div className="mt-6">
        <CoherenceWizard
          options={options}
          initialAnalysisId={initialAnalysisId}
          initialDescription={initialDescription}
        />
      </div>
    </div>
  );
}
