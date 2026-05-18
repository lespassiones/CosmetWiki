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

  // skin_type can be either a preset value OR the literal string "autre" when
  // the user picked the free-text option. The custom label lives in
  // other_skin_type.
  const skinTypeRaw = String(form.get("skin_type") ?? "");
  const otherSkinType = String(form.get("other_skin_type") ?? "").slice(0, 120).trim();
  const skinType: SkinType | undefined = SKIN_TYPES.includes(skinTypeRaw as SkinType)
    ? (skinTypeRaw as SkinType)
    : undefined;
  if (!skinType && !otherSkinType) {
    return { ok: false, error: "Type de peau requis." };
  }

  const concerns = form
    .getAll("concerns")
    .map(String)
    .filter((c): c is SkinConcern =>
      SKIN_CONCERNS.includes(c as (typeof SKIN_CONCERNS)[number]),
    );
  const otherConcerns = String(form.get("other_concerns") ?? "").slice(0, 300).trim();
  if (concerns.length === 0 && !otherConcerns) {
    return { ok: false, error: "Choisis au moins une préoccupation (ou décris-la dans 'Autre')." };
  }

  // Hair section is optional - empty is fine.
  const hairConcerns = form
    .getAll("hair_concerns")
    .map(String)
    .filter((c): c is HairConcern => HAIR_CONCERNS.includes(c as HairConcern));
  const otherHair = String(form.get("other_hair") ?? "").slice(0, 200).trim();

  const allergiesFreeform = String(form.get("allergies") ?? "").slice(0, 500).trim();
  const otherNotes = String(form.get("other_notes") ?? "").slice(0, 500).trim();

  const profile: SkinProfile = {
    skinType,
    concerns: concerns.length > 0 ? concerns : undefined,
    hairConcerns: hairConcerns.length > 0 ? hairConcerns : undefined,
    allergiesFreeform: allergiesFreeform || undefined,
    otherSkinType: otherSkinType || undefined,
    otherConcerns: otherConcerns || undefined,
    otherHair: otherHair || undefined,
    otherNotes: otherNotes || undefined,
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
