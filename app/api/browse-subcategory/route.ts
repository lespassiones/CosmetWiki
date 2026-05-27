import { NextRequest, NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase";

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

  return NextResponse.json(
    { products: data ?? [] },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
