/**
 * GET /api/feedback/status
 *
 * Returns whether the signed-in user has already submitted a feedback +
 * how many coherence_analyses (promesses) they own. The client uses this
 * to decide if the FeedbackPrompt should arm itself when the user lands on
 * a `/promesses/[id]` result.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RpcResult =
  | { ok: true; submitted: boolean; promesseCount: number }
  | { ok: false; error: string };

export async function GET() {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: userData } = await sb.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const { data, error } = await sb.rpc("cosme_check_get_feedback_status");
  if (error || !data) {
    return NextResponse.json({ ok: false, error: "rpc_failed" }, { status: 500 });
  }
  return NextResponse.json(data as RpcResult, {
    headers: { "Cache-Control": "no-store" },
  });
}
