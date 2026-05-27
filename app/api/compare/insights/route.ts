import { NextResponse, type NextRequest } from "next/server";
import { generateCompareInsights } from "@/lib/ai/compare";
import { shortenProductName } from "@/lib/text/shortenProductName";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import { apiGate } from "@/lib/apiGate";
import { logError } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 25;

/**
 * GET /api/compare/insights?a=<id>&b=<id>
 *
 * Returns the AI-generated portraits + "how to choose" for the pair.
 * Auth required; both analyses must belong to the current user.
 */
export async function GET(req: NextRequest) {
  const gate = await apiGate(req, { feature: "compare.insights" });
  if (!gate.ok) return gate.response;
  const { user, supabase: sb } = gate;

  const url = new URL(req.url);
  const aId = url.searchParams.get("a");
  const bId = url.searchParams.get("b");
  if (!aId || !bId || aId === bId) {
    return NextResponse.json({ error: "Invalid ids" }, { status: 400 });
  }

  try {
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

  // Use the SHORT name in the prompt so the LLM-generated narrative reads
  // naturally ("L'Oréal Curl Expression pourrait te convenir" instead of
  // a 60-character mouthful). The frontend uses the same short name in
  // titles and as the highlight key, so substrings match without effort.
  const rawA = a.product_label ?? a.name ?? "Produit A";
  const rawB = b.product_label ?? b.name ?? "Produit B";
  const shortA = shortenProductName(rawA);
  const shortB = shortenProductName(rawB);

  const insights = await generateCompareInsights(
    { name: shortA, result: a.result_json },
    { name: shortB, result: b.result_json },
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
  } catch (err) {
    logError("compare.insights", err, { userId: user.id });
    return NextResponse.json({ error: "Erreur lors de la comparaison." }, { status: 500 });
  }
}
