import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentification requise" }, { status: 401 });

  const body = await req.json() as {
    product_ean?: string | null;
    product_name?: string | null;
    message?: string;
  };

  const message = body.message?.trim() ?? "";
  if (!message) return NextResponse.json({ error: "Message requis" }, { status: 400 });

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { error } = await sb
    .schema("cosme_check")
    .from("user_feedback")
    .insert({
      user_id: user.id,
      kind: "product_error",
      trigger_source: "analysis",
      product_ean: body.product_ean ?? null,
      product_name: body.product_name ?? null,
      message: message.slice(0, 2000),
    });

  if (error) {
    console.error("[feedback] insert error:", error.message);
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
