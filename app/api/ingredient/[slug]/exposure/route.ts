/**
 * GET /api/ingredient/[slug]/exposure
 *
 * Returns the "personal line" callout for the current user on a given
 * ingredient page: how many products in their routine / history contain it.
 *
 * Kept SEPARATE from /explain so /explain can stay fully CDN-cached. This
 * endpoint is per-user (private, no-store) and returns `{ personalLine: null }`
 * for anonymous visitors — the UI just doesn't render the rose callout.
 *
 * Cheap: two count RPCs (head-only), fired in parallel. ~50 ms warm.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer, supabaseService } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type ExposureResponse = {
  personalLine: string | null;
};

function buildPersonalLine(routineCount: number, historyCount: number): string | null {
  if (routineCount >= 1) {
    const plural = routineCount > 1 ? "s" : "";
    return `Tu as cet ingrédient dans ${routineCount} produit${plural} de ta routine.`;
  }
  if (historyCount >= 3) {
    return `Tu as déjà rencontré cet ingrédient dans ${historyCount} de tes analyses passées.`;
  }
  return null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;

  const cookieStore = await cookies();
  const { data: { user } } = await supabaseServer(cookieStore).auth.getUser();

  // Anonymous visitor → no personal line. Returned fast with no-store so the
  // CDN doesn't accidentally cache a per-user response.
  if (!user) {
    return NextResponse.json(
      { personalLine: null } satisfies ExposureResponse,
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const svc = supabaseService();
    const [routineRes, historyRes] = await Promise.all([
      svc.rpc("cosme_check_count_ingredient_in_routine", { p_user: user.id, p_slug: slug }),
      svc.rpc("cosme_check_count_ingredient_in_history", { p_user: user.id, p_slug: slug }),
    ]);
    const routineCount = Number(routineRes.data ?? 0);
    const historyCount = Number(historyRes.data ?? 0);
    return NextResponse.json(
      { personalLine: buildPersonalLine(routineCount, historyCount) } satisfies ExposureResponse,
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    // Soft failure — UI just hides the callout, no error surfaced.
    return NextResponse.json(
      { personalLine: null } satisfies ExposureResponse,
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
