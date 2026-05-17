"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase";
import {
  HAIR_CONCERNS,
  SKIN_CONCERNS,
  SKIN_TYPES,
  type HairConcern,
  type SkinConcern,
  type SkinProfile,
  type SkinType,
} from "@/lib/skin/profile";

export type SkinProfileResult = { ok: true } | { ok: false; error: string };

export async function saveSkinProfile(form: FormData): Promise<SkinProfileResult> {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Non connecté." };

  const skinType = String(form.get("skin_type") ?? "");
  if (!SKIN_TYPES.includes(skinType as SkinType)) {
    return { ok: false, error: "Type de peau requis." };
  }

  const concerns = form
    .getAll("concerns")
    .map(String)
    .filter((c): c is SkinConcern =>
      SKIN_CONCERNS.includes(c as (typeof SKIN_CONCERNS)[number]),
    );
  if (concerns.length === 0) {
    return { ok: false, error: "Choisis au moins une préoccupation." };
  }

  // Hair section is optional — empty is fine.
  const hairConcerns = form
    .getAll("hair_concerns")
    .map(String)
    .filter((c): c is HairConcern => HAIR_CONCERNS.includes(c as HairConcern));

  const allergiesFreeform = String(form.get("allergies") ?? "").slice(0, 500).trim();

  const profile: SkinProfile = {
    skinType: skinType as SkinType,
    concerns,
    hairConcerns: hairConcerns.length > 0 ? hairConcerns : undefined,
    allergiesFreeform: allergiesFreeform || undefined,
  };

  // Merge into existing preferences (don't clobber other future settings).
  const { data: existing } = await sb
    .schema("cosme_check")
    .from("user_profiles")
    .select("preferences")
    .eq("id", user.id)
    .maybeSingle();

  const merged = {
    ...((existing?.preferences ?? {}) as Record<string, unknown>),
    skin: profile,
  };

  const { error } = await sb
    .schema("cosme_check")
    .from("user_profiles")
    .update({ preferences: merged, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/advisor");
  revalidatePath("/profile");
  return { ok: true };
}
