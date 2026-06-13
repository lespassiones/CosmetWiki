import { NextRequest, NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = (url.searchParams.get("category") ?? "").trim();
  if (!category) return NextResponse.json({ avg_score: null, product_count: 0 });

  const { data, error } = await supabaseAnon()
    .rpc("cosme_check_category_score_stats", { p_category: category });

  if (error || !data) {
    return NextResponse.json({ avg_score: null, product_count: 0 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json(
    { avg_score: row?.avg_score ?? null, product_count: row?.product_count ?? 0 },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
