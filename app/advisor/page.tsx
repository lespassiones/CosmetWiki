import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getProfile, getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { isProfileComplete, readSkinProfile, SKIN_CONCERN_LABEL, SKIN_TYPE_LABEL } from "@/lib/skin/profile";
import { AdvisorOnboarding } from "@/components/advisor/AdvisorOnboarding";
import { AdvisorChat } from "@/components/advisor/AdvisorChat";
import { GLASS_CARD, GLASS_CARD_ROSE } from "@/lib/ui/glass";

export const metadata = { title: "Skin advisor · Cosme Check" };
export const dynamic = "force-dynamic";

export default async function AdvisorPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/advisor");

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: row } = await sb
    .schema("cosme_check")
    .from("user_profiles")
    .select("preferences")
    .eq("id", user.id)
    .maybeSingle();

  const profile = await getProfile();
  const skin = readSkinProfile((row?.preferences ?? null) as Record<string, unknown> | null);
  const complete = isProfileComplete(skin);

  return (
    <div className="mx-auto max-w-3xl px-5 lg:px-8 py-6 lg:py-10">
      <h1 className="text-2xl lg:text-3xl font-bold mb-2 flex items-center gap-2">
        <span aria-hidden>✨</span> Skin advisor
      </h1>
      <p className="text-sm text-[#6B7280] mb-6">
        Un assistant factuel qui s&apos;appuie sur ton profil et ta routine. Aucun conseil médical, aucune marque
        recommandée.
      </p>

      {!complete ? (
        <section className={`${GLASS_CARD} p-5 lg:p-7`}>
          <h2 className="text-lg font-semibold mb-1">Crée ton profil en 3 questions</h2>
          <p className="text-sm text-[#6B7280] mb-6">
            On utilise ces réponses pour adapter les conseils à ta peau. Tu peux les modifier à tout moment.
          </p>
          <AdvisorOnboarding initial={skin} />
        </section>
      ) : (
        <>
          <section className={`${GLASS_CARD_ROSE} p-4 mb-4 text-[13px] text-[#9F1239] flex items-start gap-3`}>
            <span aria-hidden className="text-base">🧬</span>
            <div className="flex-1 leading-relaxed">
              <strong className="font-semibold">{SKIN_TYPE_LABEL[skin.skinType!]}</strong>
              {skin.concerns && skin.concerns.length > 0 && (
                <> · {skin.concerns.map((c) => SKIN_CONCERN_LABEL[c]).join(", ")}</>
              )}
              {skin.allergiesFreeform && <> · sans : {skin.allergiesFreeform}</>}
            </div>
            <details className="text-[12px]">
              <summary className="cursor-pointer text-[#F43F5E] hover:underline">Modifier</summary>
              <div className="mt-4">
                <AdvisorOnboarding initial={skin} />
              </div>
            </details>
          </section>

          <AdvisorChat firstName={profile?.first_name ?? "toi"} />
        </>
      )}
    </div>
  );
}
