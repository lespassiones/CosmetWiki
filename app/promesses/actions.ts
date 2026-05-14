"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";

export async function deleteCoherenceAnalysis(id: string): Promise<void> {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  await sb
    .schema("cosme_check")
    .from("coherence_analyses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/promesses");
  redirect("/promesses");
}
