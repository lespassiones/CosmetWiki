"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function renameAnalysis(id: string, newName: string): Promise<ActionResult> {
  const trimmed = newName.trim().slice(0, 200);
  if (trimmed.length < 1) return { ok: false, error: "Nom requis." };

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Non connecté." };

  const { error } = await sb
    .schema("cosme_check")
    .from("analyses")
    .update({ name: trimmed })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/history");
  revalidatePath(`/history/${id}`);
  return { ok: true };
}

export async function deleteAnalysis(id: string): Promise<void> {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  await sb
    .schema("cosme_check")
    .from("analyses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/history");
  redirect("/history");
}
