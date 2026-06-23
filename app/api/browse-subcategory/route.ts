import { NextRequest, NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase";
import { colorCapScore } from "@/lib/essentiel/engine";
import { scoreLabel } from "@/lib/inciParser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sub = (url.searchParams.get("sub") ?? "").trim();
  const limit = Math.min(48, Math.max(1, Number(url.searchParams.get("limit") ?? "24") || 24));
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? "0") || 0);

  if (!sub) {
    return NextResponse.json({ error: "Missing sub parameter" }, { status: 400 });
  }

  const { data, error } = await supabaseAnon().rpc(
    "cosme_check_browse_subcategory",
    { p_subcategory: sub, p_limit: limit, p_offset: offset },
  );

  if (error) {
    return NextResponse.json({ products: [] });
  }

  // Apply the SAME color cap as catalog-search so a product never shows up
  // green in the browse list and orange/red once opened (analysis view). The
  // RPC now returns count_orange/count_rouge for this exact purpose (§5).
  const products = ((data as Record<string, unknown>[]) ?? []).map((p) => {
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
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
