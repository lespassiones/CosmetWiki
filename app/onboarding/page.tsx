import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { isProfileComplete, readOnboardingShown, readSkinProfile } from "@/lib/skin/profile";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const metadata = { title: "Bienvenue · Cosme Check" };

// Onboarding is a one-shot post-signup flow. If the user lands here without a
// session (rare — middleware would normally catch this), we send them to
// sign-in. If they've already been through the wizard, we just bounce them to
// `next` so manually visiting /onboarding later doesn't loop.

type Props = {
  searchParams?: Promise<{ next?: string }>;
};

function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default async function OnboardingPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  const next = safeNext(params?.next);

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?next=${encodeURIComponent("/onboarding")}`);
  }

  // Preload existing profile so a returning user re-opening the wizard from
  // its URL sees their previous answers (rather than empty fields). For a
  // fresh signup the profile is empty and the form starts blank.
  const { data: row } = await sb
    .schema("cosme_check")
    .from("user_profiles")
    .select("preferences")
    .eq("id", user.id)
    .maybeSingle();

  const prefs = (row?.preferences ?? null) as Record<string, unknown> | null;
  const initial = readSkinProfile(prefs);

  // Hard safety: if a user lands here by URL after already being onboarded,
  // OR is an existing user whose profile is already filled, send them back
  // to `next` without showing the wizard. The redirect helpers in the auth
  // actions normally catch this, but the page must self-defend too — a
  // bookmark to /onboarding shouldn't keep haunting the user.
  if (readOnboardingShown(prefs) || isProfileComplete(initial)) {
    redirect(next);
  }

  return (
    <main className="min-h-svh bg-[#FAFAFA] py-8 px-5 sm:py-12">
      <div className="mx-auto w-full max-w-xl">
        <OnboardingWizard initial={initial} finalNext={next} />
      </div>
    </main>
  );
}
