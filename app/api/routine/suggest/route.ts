import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { computeRoutineMetrics, type Frequency, type RoutineProduct } from "@/lib/routine/engine";
import { generateRoutineSuggestions } from "@/lib/ai/routineSuggest";
import { loadProfileForPrompt } from "@/lib/skin/promptFormat";
import { loadRestrictionsForPrompt } from "@/lib/restrictions/promptFormat";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import type { AnalyseResponse } from "@/lib/analyseTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 25;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(ip, 12, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de demandes. Patiente une minute." },
      { status: 429, headers: { "Retry-After": Math.ceil(rl.retryAfter / 1000).toString() } },
    );
  }

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  // Fan out: routine items + profile block + restrictions block in parallel
  // so the user doesn't wait three serial round-trips. Profile/restrictions
  // resolve to null when unset; the LLM falls back to the generic prompt.
  const [routineRes, profileBlock, restrictionsBlock] = await Promise.all([
    sb
      .schema("cosme_check")
      .from("routine_items")
      .select("frequency, analyses(id, name, product_label, score, result_json)"),
    loadProfileForPrompt(user.id),
    loadRestrictionsForPrompt(user.id),
  ]);

  const items = (routineRes.data ?? []) as unknown as {
    frequency: Frequency;
    analyses: {
      id: string;
      name: string | null;
      product_label: string | null;
      score: number | null;
      result_json: AnalyseResponse;
    } | null;
  }[];

  const products: RoutineProduct[] = items
    .filter((it) => it.analyses)
    .map((it) => ({
      id: it.analyses!.id,
      name: it.analyses!.product_label ?? it.analyses!.name ?? "Analyse",
      frequency: it.frequency,
      score: it.analyses!.score,
      result: it.analyses!.result_json,
    }));

  const metrics = computeRoutineMetrics(products);
  const result = await generateRoutineSuggestions(
    metrics,
    products,
    user.id,
    profileBlock,
    restrictionsBlock,
  );
  return NextResponse.json(result);
}
