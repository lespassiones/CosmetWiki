import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { HistoryList } from "@/components/history/HistoryList";
import { GLASS_CARD, GLASS_PILL_DARK } from "@/lib/ui/glass";

export const metadata = { title: "Mon historique · Cosme Check" };
export const dynamic = "force-dynamic";

type AnalysisRow = {
  id: string;
  name: string | null;
  product_label: string | null;
  score: number | null;
  created_at: string;
  counts: { vert: number; jaune: number; orange: number; rouge: number } | null;
  /** Id of the most recent coherence_analysis attached to this analyse, if
   *  any. When non-null, the "Analyser la promesse" entry point becomes
   *  "Voir l'analyse de la promesse" and routes straight to /promesses/{id}
   *  instead of relaunching the whole identification + fetch flow. */
  latestCoherenceId: string | null;
  /** Lowercased ingredient tokens (name + raw input) used by the search bar
   *  on the client to match analyses by ingredient. Kept short — duplicates
   *  removed, empty values filtered out. */
  ingredientTokens: string[];
};

type RawItem = {
  input?: string | null;
  name?: string | null;
};

type RawRow = {
  id: string;
  name: string | null;
  product_label: string | null;
  score: number | null;
  created_at: string;
  result_json:
    | {
        counts?: { vert?: number; jaune?: number; orange?: number; rouge?: number };
        items?: RawItem[];
      }
    | null;
};

type CoherenceRow = { id: string; analysis_id: string; created_at: string };

export default async function HistoryPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/history");

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  // Two parallel queries — analyses (last 50) + every coherence row for this
  // user. RLS already restricts both to the signed-in user, no extra filter
  // needed. Pulling coherence in full lets us build the analysis → latest
  // coherence Map in memory without a per-row round-trip.
  const [analysesResult, coherencesResult] = await Promise.all([
    sb
      .schema("cosme_check")
      .from("analyses")
      .select("id, name, product_label, score, created_at, result_json")
      .order("created_at", { ascending: false })
      .limit(50),
    sb
      .schema("cosme_check")
      .from("coherence_analyses")
      .select("id, analysis_id, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const raw = (analysesResult.error ? [] : (analysesResult.data ?? [])) as RawRow[];
  const coherenceRows = (coherencesResult.error ? [] : (coherencesResult.data ?? [])) as CoherenceRow[];

  // First occurrence wins because we ordered by created_at DESC.
  const latestCoherenceByAnalysis = new Map<string, string>();
  for (const c of coherenceRows) {
    if (!latestCoherenceByAnalysis.has(c.analysis_id)) {
      latestCoherenceByAnalysis.set(c.analysis_id, c.id);
    }
  }

  const analyses: AnalysisRow[] = raw.map((r) => {
    const items = r.result_json?.items ?? [];
    const tokenSet = new Set<string>();
    for (const it of items) {
      const n = (it?.name ?? "").trim().toLowerCase();
      const i = (it?.input ?? "").trim().toLowerCase();
      if (n) tokenSet.add(n);
      if (i && i !== n) tokenSet.add(i);
    }
    return {
      id: r.id,
      name: r.name,
      product_label: r.product_label,
      score: r.score,
      created_at: r.created_at,
      counts: r.result_json?.counts
        ? {
            vert: r.result_json.counts.vert ?? 0,
            jaune: r.result_json.counts.jaune ?? 0,
            orange: r.result_json.counts.orange ?? 0,
            rouge: r.result_json.counts.rouge ?? 0,
          }
        : null,
      latestCoherenceId: latestCoherenceByAnalysis.get(r.id) ?? null,
      ingredientTokens: Array.from(tokenSet),
    };
  });

  return (
    <div className="mx-auto max-w-4xl px-5 lg:px-8 py-8 lg:py-12">
      <h1 className="text-2xl lg:text-3xl font-bold mb-2">Mon historique</h1>

      {analyses.length === 0 ? (
        <div className={`${GLASS_CARD} p-8 text-center mt-6`}>
          <p className="text-sm text-[#6B7280] mb-4">
            Lance ta première analyse depuis la page d&apos;accueil.
          </p>
          <Link
            href="/"
            className={`${GLASS_PILL_DARK} inline-block px-5 py-2.5 text-sm font-semibold`}
          >
            Analyser un produit
          </Link>
        </div>
      ) : (
        <HistoryList rows={analyses} />
      )}
    </div>
  );
}
