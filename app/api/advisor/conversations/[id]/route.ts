import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/advisor/conversations/[id]
 * Returns the messages of a single conversation (chronological), products +
 * reco_criteria included so the carousel re-renders without a fresh API call.
 * RLS guarantees the conversation belongs to the caller.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);

  // Ownership check (RLS also enforces it, but this returns a clean 404).
  const { data: conv } = await sb
    .schema("cosme_check")
    .from("advisor_conversations")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!conv) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const { data: msgs } = await sb
    .schema("cosme_check")
    .from("advisor_messages")
    .select("role, content, products, reco_criteria")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(80);

  return NextResponse.json({
    conversationId: id,
    messages: (msgs ?? []) as {
      role: "user" | "assistant";
      content: string;
      products: unknown;
      reco_criteria: unknown;
    }[],
  });
}

/**
 * DELETE /api/advisor/conversations/[id]
 * Removes a conversation (messages cascade). RLS scopes it to the caller.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);

  const { error } = await sb
    .schema("cosme_check")
    .from("advisor_conversations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
