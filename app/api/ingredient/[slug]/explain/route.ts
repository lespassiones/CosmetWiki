import { NextRequest, NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase";
import { explainIngredient } from "@/lib/ai/explain";
import type { ColorRating } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 25;
// `force-dynamic` is intentionally NOT set: we want Next/Vercel to honour the
// public `s-maxage` Cache-Control below and cache by URL at the Edge CDN.

/**
 * GET /api/ingredient/[slug]/explain
 *
 * Migrated from POST → GET (and from per-user → fully public) so Vercel Edge
 * can cache the response. At scale, the same 100-200 popular ingredients
 * generate ~80 % of the SEO traffic on /i/[slug] pages; caching for 24 h
 * collapses thousands of Lambda invocations down to a handful per region.
 *
 * Trade-off: the "Tu as cet ingrédient dans X produits de ta routine" personal
 * callout is no longer computed here. If we want it back, we'll add a
 * separate uncached /api/ingredient/[slug]/exposure endpoint that the client
 * can fetch in parallel and merge into the UI.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;

  const sb = supabaseAnon();
  const { data, error } = await sb
    .schema("cosme_check")
    .from("ingredients")
    .select("inci_id, name, color_rating, functions, tags")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json({ error: "Ingrédient introuvable." }, { status: 404 });
  }

  const ing = data as {
    inci_id: number;
    name: string;
    color_rating: ColorRating | null;
    functions: { name?: string }[] | null;
    tags: string[] | null;
  };

  const explanation = await explainIngredient({
    inciId: ing.inci_id,
    name: ing.name,
    primaryFunction: ing.functions?.[0]?.name ?? null,
    colorRating: ing.color_rating,
    tags: ing.tags,
    // No userExposure → personalLine will be null in the response.
  });

  return NextResponse.json(explanation, {
    headers: {
      // 24 h on the Edge CDN, 7 d stale-while-revalidate. Once one user
      // triggers this per region per day, every subsequent visitor gets it
      // for free. Browser-side we let Next revalidate naturally.
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
