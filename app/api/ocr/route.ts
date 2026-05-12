import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ocrFromImageBase64 } from "@/lib/ai/ocr";
import { supabaseServer } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 6 * 1024 * 1024;     // 6 MB after base64 decode
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(ip, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de scans récents. Réessaye dans une minute." },
      { status: 429, headers: { "Retry-After": Math.ceil(rl.retryAfter / 1000).toString() } },
    );
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image manquante." }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "Format d'image non supporté." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image trop volumineuse (max 6 Mo)." }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const base64 = buf.toString("base64");

  const cookieStore = await cookies();
  const { data: { user } } = await supabaseServer(cookieStore).auth.getUser();

  const result = await ocrFromImageBase64(base64, file.type, user?.id ?? null);
  return NextResponse.json(result);
}
