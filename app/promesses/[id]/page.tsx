import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { VerdictGlobalCard } from "@/components/coherence/VerdictGlobalCard";
import { PromisesBarChart } from "@/components/coherence/PromisesBarChart";
import { CoherenceTable } from "@/components/coherence/CoherenceTable";
import { ConclusionCard } from "@/components/coherence/ConclusionCard";
import { IngredientsPositionChart } from "@/components/coherence/IngredientsPositionChart";
import { DescriptionKeywordsCard } from "@/components/coherence/DescriptionKeywordsCard";
import { MarketingIndexCard } from "@/components/coherence/MarketingIndexCard";
import type { CoherenceResult } from "@/lib/coherence/types";

export const metadata = { title: "Promesses vs Formule · Cosme Check" };

export default async function PromesseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect(`/auth/sign-in?next=/promesses/${id}`);

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data, error } = await sb
    .schema("cosme_check")
    .from("coherence_analyses")
    .select(
      "id, analysis_id, description, result_json, created_at, analyses(name, product_label)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

  const row = data as unknown as {
    id: string;
    analysis_id: string;
    description: string;
    result_json: CoherenceResult;
    created_at: string;
    analyses: { name: string | null; product_label: string | null } | null;
  };

  const productName
    = row.analyses?.product_label
    ?? row.analyses?.name
    ?? `Analyse du ${new Date(row.created_at).toLocaleDateString("fr-FR")}`;

  const result = row.result_json;

  return (
    <div className="mx-auto max-w-[90rem] px-5 lg:px-10 xl:px-14 py-6 lg:py-10 space-y-4 lg:space-y-5">
      {/* Breadcrumb + title */}
      <nav className="text-[12px] text-[#6B7280] flex flex-wrap items-center gap-1">
        <Link href="/" className="hover:text-ink">
          Accueil
        </Link>
        <span aria-hidden>›</span>
        <Link href="/promesses" className="hover:text-ink">
          Promesses
        </Link>
        <span aria-hidden>›</span>
        <Link href={`/history/${row.analysis_id}`} className="hover:text-ink truncate max-w-[180px]">
          {productName}
        </Link>
        <span aria-hidden>›</span>
        <span className="text-ink-subtle">Cohérence</span>
      </nav>

      <header>
        <h1 className="text-2xl lg:text-3xl font-bold leading-tight">
          Promesses du produit vs Formule réelle
        </h1>
        <p className="mt-2 text-[13px] text-[#6B7280]">
          On compare ce qui est promis sur l&apos;emballage avec ce qui est vraiment dans la liste INCI de
          {" "}
          <span className="font-medium text-ink">{productName}</span>.
        </p>
      </header>

      {/* Bento grid : verdict global (left) + promises bar chart (right) on desktop */}
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 lg:gap-5">
        <VerdictGlobalCard metrics={result.metrics} />
        <PromisesBarChart promises={result.promises} />
      </section>

      {/* Coherence table (wide) + conclusion (narrow, right) — like the mock.
          items-stretch + h-full inside ConclusionCard makes the conclusion
          card match the table's height; the conclusion text scales up + is
          vertically centred so the card never looks empty. */}
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)] gap-4 lg:gap-5 items-stretch">
        <CoherenceTable promises={result.promises} />
        <ConclusionCard conclusion={result.conclusion} />
      </section>

      {/* Position chart */}
      <IngredientsPositionChart snapshot={result.positionSnapshot} />

      {/* Description keywords + marketing index */}
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4 lg:gap-5">
        <DescriptionKeywordsCard
          promises={result.promises}
          unverifiable={result.unverifiable}
        />
        <MarketingIndexCard metrics={result.metrics} />
      </section>
    </div>
  );
}
