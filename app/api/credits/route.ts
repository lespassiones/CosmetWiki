/**
 * GET /api/credits
 *
 * Returns the current user's daily credit state, used by the header pill.
 * Auth required. No credit consumed, no rate-limit beyond a generous one.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GetCreditsResult =
  | { ok: true; used: number; limit: number; remaining: number }
  | { ok: false; error: string };

export async function GET() {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: userData } = await sb.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const { data, error } = await sb.rpc("cosme_check_get_credits");
  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: "rpc_failed" },
      { status: 500 },
    );
  }
  return NextResponse.json(data as GetCreditsResult, {
    headers: { "Cache-Control": "no-store" },
  });
}
