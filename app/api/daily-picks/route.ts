import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase";
import { pickTodaysItems, type DailyPickItem } from "@/lib/dailyPicks/select";

// Edge runtime : ~50ms cold start. Catalog read + deterministic slice — no
// Node-specific deps. Daily picks are also CDN-cached 1h via Cache-Control,
// so the function only runs once per hour per edge region in practice.
export const runtime = "edge";
// Force dynamic so the response always reflects "today" (otherwise Next would
// statically render once and serve the same picks until redeploy).
export const dynamic = "force-dynamic";

/**
 * GET /api/daily-picks
 *
 * Returns the 10 daily quizz/myth items for everyone today. No auth needed —
 * the catalog is public. We add a 1-hour CDN cache so we don't hit Supabase
 * on every page load (the 10 items only change at midnight UTC).
 */
export async function GET() {
  try {
    const sb = supabaseAnon();
    const { data, error } = await sb
      .schema("cosme_check")
      .from("daily_picks")
      .select("id, kind, order_index, question, options, correct_index, reveal, category")
      .order("order_index", { ascending: true });

    if (error || !data) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const catalog = data as DailyPickItem[];
    const items = pickTodaysItems(catalog);

    return NextResponse.json(
      { items },
      {
        status: 200,
        headers: {
          // 1h browser/CDN cache + revalidate every 5 min in the background.
          // Stays consistent within a day, picks up the next batch within
          // ~1h of the UTC day flip.
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
