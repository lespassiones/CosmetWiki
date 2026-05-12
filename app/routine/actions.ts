"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase";

export type RoutineActionResult = { ok: true } | { ok: false; error: string };

const VALID_FREQ = new Set(["daily", "weekly", "monthly"]);

export async function addToRoutine(analysisId: string): Promise<RoutineActionResult> {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Non connecté." };

  const { error } = await sb
    .schema("cosme_check")
    .from("routine_items")
    .upsert(
      { user_id: user.id, analysis_id: analysisId, frequency: "daily" },
      { onConflict: "user_id,analysis_id" },
    );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/routine");
  revalidatePath("/history");
  return { ok: true };
}

export async function setRoutineFrequency(
  routineItemId: string,
  frequency: string,
): Promise<RoutineActionResult> {
  if (!VALID_FREQ.has(frequency)) return { ok: false, error: "Fréquence invalide." };

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Non connecté." };

  const { error } = await sb
    .schema("cosme_check")
    .from("routine_items")
    .update({ frequency })
    .eq("id", routineItemId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/routine");
  return { ok: true };
}

export async function removeFromRoutine(routineItemId: string): Promise<RoutineActionResult> {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Non connecté." };

  const { error } = await sb
    .schema("cosme_check")
    .from("routine_items")
    .delete()
    .eq("id", routineItemId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/routine");
  return { ok: true };
}
