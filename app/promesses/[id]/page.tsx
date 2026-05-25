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
import { OutOfScopePromisesCard } from "@/components/coherence/OutOfScopePromisesCard";
import { Reveal } from "@/components/Reveal";
import { computeMetrics } from "@/lib/coherence/engine";
import type { CoherenceResult } from "@/lib/coherence/types";
import type { AnalyseResponse } from "@/lib/analyseTypes";

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
      // The parent analysis's result_json is needed to colour the active
      // ingredient dots in the coherence table (vert/jaune/orange/rouge from
      // the per-item safety rating). One JSONB column extra, same round-trip.
      "id, analysis_id, description, result_json, created_at, analyses(name, product_label, result_json)",
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
    analyses: {
      name: string | null;
      product_label: string | null;
      result_json: AnalyseResponse | null;
    } | null;
  };
  const parentItems = row.analyses?.result_json?.items ?? [];

  const productName
    = row.analyses?.product_label
    ?? row.analyses?.name
    ?? `Analyse du ${new Date(row.created_at).toLocaleDateString("fr-FR")}`;

  // Recompute metrics from the stored promises so changes to the metric
  // formulas (e.g. moving from "tenue-only" to "tenue+partielle") apply
  // retroactively to analyses already saved in the DB. Stored `metrics` are
  // ignored - they're a snapshot from compute time.
  const storedResult = row.result_json;
  const result: CoherenceResult = {
    ...storedResult,
    metrics: computeMetrics(storedResult.promises),
  };

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

      {/* Sections animated in cascade - top→bottom fade-up, with progressive
          delays. The donut and the per-promise bars also have their own
          inner animations (radial fill / width fill) that start once their
          card is visible (see VerdictGlobalCard / PromisesBarChart).        */}

      {/* Bento : verdict global + bar chart */}
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 lg:gap-5">
        <Reveal delayMs={100}>
          <VerdictGlobalCard metrics={result.metrics} />
        </Reveal>
        <Reveal delayMs={200}>
          <PromisesBarChart promises={result.promises} />
        </Reveal>
      </section>

      {/* Coherence table + conclusion */}
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)] gap-4 lg:gap-5 items-center">
        <Reveal delayMs={350}>
          <CoherenceTable promises={result.promises} items={parentItems} />
        </Reveal>
        <Reveal delayMs={450}>
          <ConclusionCard conclusion={result.conclusion} />
        </Reveal>
      </section>

      {/* Out-of-scope promises (claims that don't biologically apply to this
          product type, e.g. anti-âge on a parfum). Renders nothing when
          empty so legacy analyses without this field stay clean. */}
      {result.outOfScope && result.outOfScope.length > 0 ? (
        <Reveal delayMs={550}>
          <OutOfScopePromisesCard
            items={result.outOfScope}
            productType={result.productType}
          />
        </Reveal>
      ) : null}

      <Reveal delayMs={600}>
        <IngredientsPositionChart snapshot={result.positionSnapshot} />
      </Reveal>

      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4 lg:gap-5">
        <Reveal delayMs={750}>
          <DescriptionKeywordsCard
            promises={result.promises}
            unverifiable={result.unverifiable}
          />
        </Reveal>
        <Reveal delayMs={850}>
          <MarketingIndexCard metrics={result.metrics} />
        </Reveal>
      </section>
    </div>
  );
}
