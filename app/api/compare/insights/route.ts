import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { generateCompareInsights } from "@/lib/ai/compare";
import type { AnalyseResponse } from "@/lib/analyseTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/compare/insights?a=<id>&b=<id>
 *
 * Returns the AI-generated portraits + "how to choose" for the pair.
 * Auth required; both analyses must belong to the current user.
 */
export async function GET(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Auth required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const aId = url.searchParams.get("a");
  const bId = url.searchParams.get("b");
  if (!aId || !bId || aId === bId) {
    return NextResponse.json({ error: "Invalid ids" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data } = await sb
    .schema("cosme_check")
    .from("analyses")
    .select("id, name, product_label, result_json")
    .in("id", [aId, bId]);

  const rows = (data ?? []) as {
    id: string;
    name: string | null;
    product_label: string | null;
    result_json: AnalyseResponse;
  }[];
  if (rows.length !== 2) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const a = rows.find((r) => r.id === aId);
  const b = rows.find((r) => r.id === bId);
  if (!a || !b) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const insights = await generateCompareInsights(
    { name: a.product_label ?? a.name ?? "Produit A", result: a.result_json },
    { name: b.product_label ?? b.name ?? "Produit B", result: b.result_json },
    { userId: user.id },
  );

  if (!insights) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  return NextResponse.json(insights, {
    status: 200,
    headers: {
      // The insight is keyed on the pair fingerprint and stored in ai_cache,
      // so subsequent requests are instant. We also let the browser hold it
      // for an hour to avoid a re-roundtrip on quick back-navigation.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
