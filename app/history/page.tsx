import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { HistoryList } from "@/components/history/HistoryList";

export const metadata = { title: "Mon historique · Cosme Check" };
export const dynamic = "force-dynamic";

type AnalysisRow = {
  id: string;
  name: string | null;
  product_label: string | null;
  score: number | null;
  created_at: string;
};

export default async function HistoryPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/history");

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data, error } = await sb
    .schema("cosme_check")
    .from("analyses")
    .select("id, name, product_label, score, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const analyses = (error ? [] : (data ?? [])) as AnalysisRow[];

  return (
    <div className="mx-auto max-w-4xl px-5 lg:px-8 py-8 lg:py-12">
      <h1 className="text-2xl lg:text-3xl font-bold mb-2">Mon historique</h1>

      {analyses.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center mt-6">
          <p className="text-sm text-[#6B7280] mb-4">
            Lance ta première analyse depuis la page d&apos;accueil.
          </p>
          <Link
            href="/"
            className="inline-block bg-[#111111] text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition"
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
