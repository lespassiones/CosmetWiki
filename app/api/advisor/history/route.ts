import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/advisor/history
 * Returns the most recent advisor conversation and its messages for the
 * authenticated user. Returns { conversationId, messages } where messages
 * are ordered chronologically.
 */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);

  // Load the most recent conversation.
  const { data: conv } = await sb
    .schema("cosme_check")
    .from("advisor_conversations")
    .select("id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!conv) return NextResponse.json({ conversationId: null, messages: [] });

  const { data: msgs } = await sb
    .schema("cosme_check")
    .from("advisor_messages")
    .select("role, content, products, reco_criteria")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: true })
    .limit(40);

  return NextResponse.json({
    conversationId: conv.id,
    messages: (msgs ?? []) as {
      role: "user" | "assistant";
      content: string;
      products: unknown;
      reco_criteria: unknown;
    }[],
  });
}
