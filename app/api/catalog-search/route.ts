import { NextRequest, NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase";
import { colorCapScore } from "@/lib/essentiel/engine";
import { scoreLabel } from "@/lib/inciParser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = (url.searchParams.get("q") ?? "").trim().slice(0, 200);

  if (query.length < 2) {
    return NextResponse.json({ products: [] }, { status: 400 });
  }

  const { data, error } = await supabaseAnon().rpc("cosme_check_search_catalog", {
    p_query: query,
    p_limit: 500,
  });

  if (error || !data) {
    if (error) console.error("[catalog-search] RPC error:", error.message, error.details, error.hint);
    return NextResponse.json({ products: [] });
  }

  const products = (data as Record<string, unknown>[]).map((p) => {
    const capped = colorCapScore(
      (p.score as number) ?? 0,
      {
        orange: (p.count_orange as number) ?? 0,
        rouge: (p.count_rouge as number) ?? 0,
      },
    );
    const { label, tone } = scoreLabel(capped);
    return { ...p, score: capped, score_label: label, score_tone: tone };
  });

  return NextResponse.json(
    { products },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } },
  );
}
