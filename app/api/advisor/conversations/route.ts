import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/advisor/conversations
 * Lists the authenticated user's advisor conversations (most recent first).
 * Returns { conversations: [{ id, title, updated_at }] }.
 */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);

  const { data } = await sb
    .schema("cosme_check")
    .from("advisor_conversations")
    .select("id, title, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    conversations: (data ?? []) as { id: string; title: string | null; updated_at: string }[],
  });
}
