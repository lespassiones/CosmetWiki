import { NextRequest, NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase";
import { blacklistIp, checkRateLimit, getClientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(ip, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes." },
      { status: 429, headers: { "Retry-After": Math.ceil(rl.retryAfter / 1000).toString() } },
    );
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const hp = url.searchParams.get("hp");

  if (hp && hp.length > 0) {
    blacklistIp(ip);
    return NextResponse.json({ hits: [] });
  }

  if (!q || q.length < 1 || q.length > 80) {
    return NextResponse.json({ hits: [] });
  }

  const sb = supabaseAnon();
  const { data, error } = await sb.rpc("cosme_check_search", {
    q,
    result_limit: 10,
  });

  if (error) {
    return NextResponse.json({ hits: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { hits: data ?? [] },
    {
      headers: {
        "Cache-Control": "private, max-age=10",
        "X-RateLimit-Remaining": rl.remaining.toString(),
      },
    },
  );
}
