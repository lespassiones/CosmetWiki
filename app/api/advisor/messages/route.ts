import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  conversationId?: string | null;
  messages: {
    role: "user" | "assistant";
    content: string;
    /** Optional product cards attached to an assistant message. */
    products?: unknown;
    /** Optional structured reco criteria attached to a message. */
    reco_criteria?: unknown;
  }[];
};

/**
 * POST /api/advisor/messages
 * Creates a conversation if conversationId is null, then appends the given
 * messages. Returns the (possibly new) conversationId.
 */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const incoming = (body.messages ?? []).filter(
    (m) =>
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim().length > 0,
  );
  if (incoming.length === 0) return NextResponse.json({ error: "Aucun message" }, { status: 400 });

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);

  let conversationId = body.conversationId ?? null;

  if (!conversationId) {
    const { data: conv, error: convErr } = await sb
      .schema("cosme_check")
      .from("advisor_conversations")
      .insert({ user_id: user.id })
      .select("id")
      .single();
    if (convErr || !conv) {
      return NextResponse.json({ error: "Impossible de créer la conversation" }, { status: 500 });
    }
    conversationId = conv.id as string;
  } else {
    // Touch updated_at so the conversation stays "most recent".
    await sb
      .schema("cosme_check")
      .from("advisor_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .eq("user_id", user.id);
  }

  // user_id is NOT NULL on advisor_messages (and required by RLS-safe writes),
  // so it MUST be set on every row — without it the insert fails and no
  // message is ever persisted (history then always comes back empty).
  const rows = incoming.map((m) => ({
    conversation_id: conversationId as string,
    user_id: user.id,
    role: m.role,
    content: m.content.slice(0, 4000),
    products: m.products ?? null,
    reco_criteria: m.reco_criteria ?? null,
  }));

  const { error: insErr } = await sb
    .schema("cosme_check")
    .from("advisor_messages")
    .insert(rows);
  if (insErr) {
    return NextResponse.json(
      { error: "Impossible d'enregistrer les messages" },
      { status: 500 },
    );
  }

  return NextResponse.json({ conversationId });
}
