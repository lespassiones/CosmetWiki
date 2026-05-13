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
};

type RawRow = {
  id: string;
  name: string | null;
  product_label: string | null;
  score: number | null;
  created_at: string;
  result_json: { counts?: { vert?: number; jaune?: number; orange?: number; rouge?: number } } | null;
};

export default async function HistoryPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/history");

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data, error } = await sb
    .schema("cosme_check")
    .from("analyses")
    .select("id, name, product_label, score, created_at, result_json")
    .order("created_at", { ascending: false })
    .limit(50);

  const raw = (error ? [] : (data ?? [])) as RawRow[];
  const analyses: AnalysisRow[] = raw.map((r) => ({
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
  }));

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
