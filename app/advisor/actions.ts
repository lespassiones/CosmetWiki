"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase";
import {
  HAIR_CONCERNS,
  SKIN_CONCERNS,
  SKIN_TYPES_BODY,
  SKIN_TYPES_FACE,
  type HairConcern,
  type SkinConcern,
  type SkinProfile,
  type SkinTypeBody,
  type SkinTypeFace,
} from "@/lib/skin/profile";

export type SkinProfileResult = { ok: true } | { ok: false; error: string };

export async function saveSkinProfile(form: FormData): Promise<SkinProfileResult> {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Non connecté." };

  // All fields are optional - the user can save a partial profile and
  // complete it later. Only the empty submission is harmless: the saved
  // object simply has no signal for downstream prompts to use.

  // Face skin type: preset OR free-text "Autre".
  const skinTypeFaceRaw = String(form.get("skin_type_face") ?? "");
  const otherSkinTypeFace = String(form.get("other_skin_type_face") ?? "").slice(0, 120).trim();
  const skinTypeFace: SkinTypeFace | undefined = SKIN_TYPES_FACE.includes(
    skinTypeFaceRaw as SkinTypeFace,
  )
    ? (skinTypeFaceRaw as SkinTypeFace)
    : undefined;

  // Body skin type: preset OR free-text "Autre".
  const skinTypeBodyRaw = String(form.get("skin_type_body") ?? "");
  const otherSkinTypeBody = String(form.get("other_skin_type_body") ?? "").slice(0, 120).trim();
  const skinTypeBody: SkinTypeBody | undefined = SKIN_TYPES_BODY.includes(
    skinTypeBodyRaw as SkinTypeBody,
  )
    ? (skinTypeBodyRaw as SkinTypeBody)
    : undefined;

  const concerns = form
    .getAll("concerns")
    .map(String)
    .filter((c): c is SkinConcern =>
      SKIN_CONCERNS.includes(c as (typeof SKIN_CONCERNS)[number]),
    );
  const otherConcerns = String(form.get("other_concerns") ?? "").slice(0, 300).trim();

  const hairConcerns = form
    .getAll("hair_concerns")
    .map(String)
    .filter((c): c is HairConcern => HAIR_CONCERNS.includes(c as HairConcern));
  const otherHair = String(form.get("other_hair") ?? "").slice(0, 200).trim();

  const allergiesFreeform = String(form.get("allergies") ?? "").slice(0, 500).trim();
  const otherNotes = String(form.get("other_notes") ?? "").slice(0, 500).trim();

  const profile: SkinProfile = {
    skinTypeFace,
    otherSkinTypeFace: otherSkinTypeFace || undefined,
    skinTypeBody,
    otherSkinTypeBody: otherSkinTypeBody || undefined,
    concerns: concerns.length > 0 ? concerns : undefined,
    hairConcerns: hairConcerns.length > 0 ? hairConcerns : undefined,
    allergiesFreeform: allergiesFreeform || undefined,
    otherConcerns: otherConcerns || undefined,
    otherHair: otherHair || undefined,
    otherNotes: otherNotes || undefined,
  };

  // Merge into existing preferences (don't clobber other future settings).
  // Note: this REPLACES the `skin` key entirely, which retires the legacy
  // `skinType` / `otherSkinType` fields from any pre-migration profile as
  // soon as the user re-saves.
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
