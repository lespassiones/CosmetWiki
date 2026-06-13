import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentification requise" }, { status: 401 });

  const formData = await req.formData();
  const ean = (formData.get("ean") as string | null) || null;
  const brand = (formData.get("brand") as string | null) || null;
  const name = (formData.get("name") as string | null) || null;
  const category = (formData.get("category") as string | null) || null;
  const photo1 = formData.get("photo1") as File | null;
  const photo2 = formData.get("photo2") as File | null;

  if (!photo1) return NextResponse.json({ error: "Photo requise" }, { status: 400 });

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);

  async function uploadPhoto(file: File, idx: 1 | 2): Promise<string | null> {
    const bytes = await file.arrayBuffer();
    const path = `submissions/${user!.id}/${Date.now()}_${idx}.webp`;
    const { error } = await sb.storage
      .from("cosmetwiki-products")
      .upload(path, Buffer.from(bytes), { contentType: "image/webp", upsert: false });
    if (error) {
      console.error("[photo-submission] storage upload error:", error.message);
      return null;
    }
    return path;
  }

  const path1 = await uploadPhoto(photo1, 1);
  if (!path1) return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });

  const path2 = photo2 ? await uploadPhoto(photo2, 2) : null;

  const { error } = await sb
    .schema("cosme_check")
    .from("catalog_photo_submissions")
    .insert({
      user_id: user.id,
      ean: ean || null,
      brand: brand || null,
      name: name || null,
      category: category || null,
      photo_path_1: path1,
      photo_path_2: path2 ?? null,
      status: "pending",
    });

  if (error) {
    console.error("[photo-submission] insert error:", error.message);
    return NextResponse.json({ error: "Erreur lors de l'enregistrement" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
