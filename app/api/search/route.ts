import { NextRequest, NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase";

// Edge runtime : ~50ms cold start vs ~800ms Node. Autocomplete must feel
// instant, so the boring "hit Postgres RPC and return JSON" path lives here.
// No IP rate-limit (lib/ratelimit's setInterval().unref() isn't Edge-safe);
// the route only reads from a cached Postgres index, so abuse cost is low.
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const hp = url.searchParams.get("hp");

  if (hp && hp.length > 0) {
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
    return NextResponse.json({ hits: [] }, { status: 500 });
  }

  return NextResponse.json(
    { hits: data ?? [] },
    {
      headers: {
        // s-maxage = Vercel Edge CDN caches by URL (incl. ?q=…) for 60 s.
        // Popular autocomplete queries ("glycerin", "niacinamide"…) collapse
        // into ONE Postgres roundtrip per minute per region instead of
        // hitting the RPC on every keystroke. stale-while-revalidate keeps
        // serving the cached payload up to 5 min while a fresh one is fetched.
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
