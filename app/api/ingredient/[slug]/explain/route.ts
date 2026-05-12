import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAnon, supabaseServer, supabaseService } from "@/lib/supabase";
import { explainIngredient } from "@/lib/ai/explain";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import type { ColorRating } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;

  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(ip, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de demandes. Patiente une minute." },
      { status: 429, headers: { "Retry-After": Math.ceil(rl.retryAfter / 1000).toString() } },
    );
  }

  // Look up the ingredient via the anon client. We need its inci_id and
  // metadata to feed the explanation. We deliberately do not call the
  // existing `cosmetwiki_get_ingredient` RPC because it returns a lot of
  // data we don't need; a direct select is cheaper.
  const sb = supabaseAnon();
  const { data, error } = await sb
    .schema("cosmetwiki")
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

  // If the user is signed in, gather personal-exposure context (cheap RPC-less query)
  let userExposure: { routineCount: number; historyCount: number } | undefined;
  let userId: string | null = null;
  try {
    const cookieStore = await cookies();
    const { data: { user } } = await supabaseServer(cookieStore).auth.getUser();
    if (user) {
      userId = user.id;
      const svc = supabaseService();
      // Count routine analyses that contain this ingredient in their JSON items
      // and history analyses that contain it.
      const [routineRes, historyRes] = await Promise.all([
        svc.rpc("cosmetwiki_count_ingredient_in_routine", {
          p_user: user.id,
          p_slug: slug,
        }),
        svc.rpc("cosmetwiki_count_ingredient_in_history", {
          p_user: user.id,
          p_slug: slug,
        }),
      ]);
      userExposure = {
        routineCount: Number(routineRes.data ?? 0),
        historyCount: Number(historyRes.data ?? 0),
      };
    }
  } catch {
    // ignore — context is best-effort
  }

  const explanation = await explainIngredient(
    {
      inciId: ing.inci_id,
      name: ing.name,
      primaryFunction: ing.functions?.[0]?.name ?? null,
      colorRating: ing.color_rating,
      tags: ing.tags,
      userExposure,
    },
    userId,
  );

  return NextResponse.json(explanation);
}
