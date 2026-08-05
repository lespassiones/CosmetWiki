import { NextRequest, NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase";
import { colorCapScore } from "@/lib/essentiel/engine";
import { scoreLabel } from "@/lib/inciParser";
import { resolveAlternativesQuery } from "@/lib/alternatives/categoryResolve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type AlternativeRow = {
  ean: string;
  brand: string;
  name: string;
  image_url: string | null;
  score: number;
  score_label: string;
  score_tone: string;
  count_total: number;
  ingredients_text: string;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  // `ean` n'est plus utilisé pour pivoter la requête (l'ancien
  // `cosme_check_get_alternatives(p_ean)` retombait sur la catégorie propre —
  // souvent un bucket poubelle — du produit, d'où les recos hors-sujet). Il
  // reste accepté seulement pour la variété de la clé de requête côté client.
  const category = (url.searchParams.get("category") ?? "").trim();
  const productType = (url.searchParams.get("productType") ?? "").trim();
  const productName = (url.searchParams.get("productName") ?? "").trim();

  // Résolution ROBUSTE : slug catalogue spécifique → match EXACT ; sinon
  // product_type → préfixe ; sinon nom → préfixe ; sinon ABSTENTION. On ne
  // pivote JAMAIS sur un bucket poubelle (« gel », « sunscreen », null…).
  const query = resolveAlternativesQuery({
    catalogCategory: category || null,
    productType: productType || null,
    productName: productName || null,
  });
  if (!query) {
    // Aucun signal fiable → rien plutôt qu'une reco hors-sujet.
    return NextResponse.json({ alternatives: [] });
  }

  const limit = Math.min(
    40,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "40", 10) || 40),
  );
  const offset = Math.max(
    0,
    parseInt(url.searchParams.get("offset") ?? "0", 10) || 0,
  );

  // Slug spécifique → match EXACT (niveau feuille) ; préfixe fonctionnel →
  // LIKE `l1/l2/%`. Les deux RPC renvoient la même forme AlternativeRow.
  const { data, error } =
    query.kind === "exact"
      ? await supabaseAnon().rpc("cosme_check_alternatives_by_category_exact", {
          p_category: query.value,
          p_limit: limit,
          p_offset: offset,
        })
      : await supabaseAnon().rpc("cosme_check_alternatives_by_category_prefix", {
          p_prefix: query.value,
          p_limit: limit,
          p_offset: offset,
        });

  if (error) {
    console.error("[alternatives] RPC error:", error.message);
    return NextResponse.json({ alternatives: [] });
  }

  const rows = (data ?? []) as AlternativeRow[];

  // Batch-fetch orange/rouge counts to apply display-only color safety cap
  const eans = rows.map((r) => r.ean);
  const countsByEan = new Map<string, { orange: number; rouge: number }>();
  if (eans.length > 0) {
    const { data: analyses } = await supabaseAnon()
      .schema("cosme_check")
      .from("product_analyses")
      .select("ean, result_json")
      .in("ean", eans);
    for (const row of analyses ?? []) {
      const counts = (row.result_json as { counts?: { orange?: number; rouge?: number } } | null)?.counts;
      countsByEan.set(row.ean as string, {
        orange: counts?.orange ?? 0,
        rouge: counts?.rouge ?? 0,
      });
    }
  }

  const enriched = rows.map((alt) => {
    const counts = countsByEan.get(alt.ean) ?? { orange: 0, rouge: 0 };
    const capped = colorCapScore(alt.score, counts);
    const { label, tone } = scoreLabel(capped);
    return { ...alt, score: capped, score_label: label, score_tone: tone };
  });
  enriched.sort((a, b) => b.score - a.score);

  return NextResponse.json(
    { alternatives: enriched },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
