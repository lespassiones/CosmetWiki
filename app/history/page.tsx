import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { HistoryList } from "@/components/history/HistoryList";
import type { ProductCategory } from "@/lib/categoryLabel";

export const metadata = { title: "Mon historique · Cosme Check" };
export const dynamic = "force-dynamic";

type AnalysisRow = {
  id: string;
  name: string | null;
  product_label: string | null;
  score: number | null;
  created_at: string;
  favori: boolean | null;
  /** URL image produit résolue via EAN (source de vérité), null si hors catalogue. */
  imageUrl: string | null;
  counts: { vert: number; jaune: number; orange: number; rouge: number } | null;
  /** Id of the most recent coherence_analysis attached to this analyse, if
   *  any. When non-null, the "Analyser la promesse" entry point becomes
   *  "Voir l'analyse de la promesse" and routes straight to /promesses/{id}
   *  instead of relaunching the whole identification + fetch flow. */
  latestCoherenceId: string | null;
  /** Lowercased ingredient tokens (name + raw input) used by the search bar
   *  on the client to match analyses by ingredient. Kept short - duplicates
   *  removed, empty values filtered out. */
  ingredientTokens: string[];
  category: ProductCategory | null;
  productType: string | null;
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
  favori?: boolean | null;
  ean?: string | null;
  category?: ProductCategory | null;
  result_json:
    | {
        counts?: { vert?: number; jaune?: number; orange?: number; rouge?: number };
        items?: RawItem[];
        category?: ProductCategory | null;
        productType?: string | null;
      }
    | null;
};

type CoherenceRow = { id: string; analysis_id: string; created_at: string };

export default async function HistoryPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/history");

  return (
    <div className="neu-page mx-auto max-w-4xl px-5 lg:px-8 py-8 lg:py-12">
      <h1 className="text-2xl lg:text-3xl font-bold mb-2">Mon historique</h1>
      <Suspense fallback={<HistorySkeleton />}>
        <HistoryContent />
      </Suspense>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-3 mt-6" aria-busy aria-label="Chargement de l'historique">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="neu h-16 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

async function HistoryContent() {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  // Two parallel queries - analyses (last 50) + every coherence row for this
  // user. RLS already restricts both to the signed-in user, no extra filter
  // needed. Pulling coherence in full lets us build the analysis → latest
  // coherence Map in memory without a per-row round-trip.
  const [analysesResult, coherencesResult] = await Promise.all([
    sb
      .schema("cosme_check")
      .from("analyses")
      .select("id, name, product_label, score, created_at, result_json, category, favori, ean")
      .order("created_at", { ascending: false })
      .limit(50),
    sb
      .schema("cosme_check")
      .from("coherence_analyses")
      .select("id, analysis_id, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
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

  // Résolution image en LOT (EAN = source de vérité) : une seule requête catalog
  // pour tous les EAN de la page, au lieu de 50 appels côté client.
  const eans = Array.from(
    new Set(raw.map((r) => r.ean).filter((e): e is string => Boolean(e))),
  );
  const imageByEan = new Map<string, string>();
  if (eans.length > 0) {
    const { data: catRows } = await sb
      .schema("cosme_check")
      .from("catalog")
      .select("ean, image_url")
      .in("ean", eans);
    for (const c of (catRows ?? []) as { ean: string; image_url: string | null }[]) {
      if (c.image_url) imageByEan.set(c.ean, c.image_url);
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
      favori: r.favori ?? null,
      created_at: r.created_at,
      imageUrl: r.ean ? imageByEan.get(r.ean) ?? null : null,
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
      category: r.result_json?.category ?? r.category ?? null,
      productType: r.result_json?.productType ?? null,
    };
  });

  if (analyses.length === 0) {
    return (
      <div className="neu p-8 text-center mt-6">
        <p className="text-sm text-[#6B7280] mb-4">
          Vérifie si un produit te correspond vraiment. Tes analyses apparaîtront ici.
        </p>
        <Link
          href="/"
          className="neu-btn-primary inline-block rounded-full px-5 py-2.5 text-sm"
        >
          Analyser un produit
        </Link>
      </div>
    );
  }

  return <HistoryList rows={analyses} />;
}
