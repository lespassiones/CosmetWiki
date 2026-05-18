/**
 * POST /api/feedback
 *
 * Submits a user feedback (rating 1-5 + optional comment). Auth required.
 * Idempotent per (user_id, trigger_source) — if the user has already submitted
 * for this trigger, we return `{ ok: true, alreadySubmitted: true }` instead
 * of 409 so the popup can quietly disarm itself.
 */
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  rating?: number;
  comment?: string | null;
  triggerSource?: "first_promesse" | "fifth_promesse";
};

type RpcResult =
  | { ok: true; id?: string; already_submitted?: boolean }
  | { ok: false; error: string };

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Note invalide (1 à 5)." }, { status: 400 });
  }
  const trigger = body.triggerSource;
  if (trigger !== "first_promesse" && trigger !== "fifth_promesse") {
    return NextResponse.json({ error: "Trigger invalide." }, { status: 400 });
  }
  const comment = (body.comment ?? "").toString().slice(0, 1000);

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: userData } = await sb.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const { data, error } = await sb.rpc("cosme_check_submit_feedback", {
    p_rating: rating,
    p_message: comment,
    p_trigger_source: trigger,
  });
  if (error) {
    return NextResponse.json({ error: "Échec de l'enregistrement." }, { status: 500 });
  }
  const result = (data ?? { ok: false, error: "no_response" }) as RpcResult;
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    alreadySubmitted: Boolean("already_submitted" in result && result.already_submitted),
  });
}
