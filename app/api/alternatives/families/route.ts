import { NextRequest, NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slugsParam = (url.searchParams.get("slugs") ?? "").trim();
  if (!slugsParam) return NextResponse.json({ names: [] });

  const slugs = slugsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (slugs.length === 0) return NextResponse.json({ names: [] });

  const { data, error } = await supabaseAnon().rpc(
    "cosme_check_get_family_ingredient_names",
    { p_family_slugs: slugs },
  );

  if (error) {
    console.error("[alternatives/families] RPC error:", error.message);
    return NextResponse.json({ names: [] });
  }

  const names = ((data ?? []) as Array<{ name: string }>).map((r) => r.name);

  return NextResponse.json(
    { names },
    // Families expand rarely — cache 1 h
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } },
  );
}
