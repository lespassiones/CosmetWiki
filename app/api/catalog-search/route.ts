import { NextRequest, NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase";
import { colorCapScore } from "@/lib/essentiel/engine";
import { scoreLabel } from "@/lib/inciParser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = (url.searchParams.get("q") ?? "").trim().slice(0, 200);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);
  const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10), 0);

  console.log(`[catalog-search] GET q="${query}" limit=${limit} offset=${offset}`);

  if (query.length < 2) {
    console.log(`[catalog-search] Query too short (${query.length} chars)`);
    return NextResponse.json({ products: [] }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAnon().rpc("cosme_check_search_catalog", {
      p_query: query,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error("[catalog-search] RPC error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json({ products: [] });
    }

    if (!data) {
      console.warn("[catalog-search] RPC returned null data");
      return NextResponse.json({ products: [] });
    }

    console.log(`[catalog-search] RPC returned ${Array.isArray(data) ? data.length : 0} results`);

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
  } catch (err) {
    console.error("[catalog-search] Exception:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ products: [] });
  }
}
