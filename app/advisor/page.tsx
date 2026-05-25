import { redirect } from "next/navigation";
import { getProfile, getUser } from "@/lib/auth";
import {
  isProfileStarted,
  readSkinProfile,
  SKIN_CONCERN_LABEL,
  SKIN_TYPE_BODY_LABEL,
  SKIN_TYPE_FACE_LABEL,
} from "@/lib/skin/profile";
import { BeautyProfileForm } from "@/components/profile/BeautyProfileForm";
import { AdvisorChat } from "@/components/advisor/AdvisorChat";
import { GLASS_CARD, GLASS_CARD_ROSE } from "@/lib/ui/glass";

export const metadata = { title: "Beauty Advisor · Cosme Check" };

export default async function AdvisorPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/advisor");

  const profile = await getProfile();
  const skin = readSkinProfile((profile?.preferences ?? null) as Record<string, unknown> | null);
  // Show chat as soon as any signal is filled; the strict "complete" check
  // is only relevant for the onboarding redirect.
  const complete = isProfileStarted(skin);

  return (
    <div className="mx-auto max-w-3xl px-5 lg:px-8 py-6 lg:py-10">
      <h1 className="text-2xl lg:text-3xl font-bold mb-2 flex items-center gap-2">
        <span aria-hidden>✨</span> Beauty Advisor
      </h1>
      <p className="text-[12px] text-[#6B7280] mb-6 truncate">
        Un assistant factuel qui s&apos;appuie sur ton profil et ta routine.
      </p>

      {!complete ? (
        <section className={`${GLASS_CARD} p-5 lg:p-7`}>
          <h2 className="text-lg font-semibold mb-1">Complète ton profil beauté</h2>
          <p className="text-sm text-[#6B7280] mb-6">
            Type de peau, préoccupations, cheveux, allergies — on utilise ces
            informations pour adapter les conseils. Tu peux modifier à tout moment.
          </p>
          <BeautyProfileForm initial={skin} showCancel={false} />
        </section>
      ) : (
        <>
          <section className={`${GLASS_CARD_ROSE} p-4 mb-4 text-[12px] text-[#9F1239]`}>
            <details>
              <summary className="list-none [&::-webkit-details-marker]:hidden marker:hidden flex items-center gap-2 cursor-pointer overflow-hidden">
                <span aria-hidden className="text-sm shrink-0">🧬</span>
                <div className="flex-1 min-w-0 truncate">
                  {(() => {
                    const face = skin.skinTypeFace
                      ? SKIN_TYPE_FACE_LABEL[skin.skinTypeFace]
                      : skin.otherSkinTypeFace;
                    const body = skin.skinTypeBody
                      ? SKIN_TYPE_BODY_LABEL[skin.skinTypeBody]
                      : skin.otherSkinTypeBody;
                    const parts = [
                      face && `visage : ${face}`,
                      body && `corps : ${body}`,
                    ].filter(Boolean);
                    return parts.length > 0 ? (
                      <strong className="font-semibold">{parts.join(" · ")}</strong>
                    ) : null;
                  })()}
                  {skin.concerns && skin.concerns.length > 0 && (
                    <> · {skin.concerns.map((c) => SKIN_CONCERN_LABEL[c]).join(", ")}</>
                  )}
                  {skin.allergiesFreeform && <> · sans : {skin.allergiesFreeform}</>}
                </div>
                <span className="text-[#F43F5E] hover:underline shrink-0 text-[12px]">Modifier</span>
              </summary>
              <div className="mt-4">
                <BeautyProfileForm initial={skin} showCancel={false} />
              </div>
            </details>
          </section>

          <AdvisorChat firstName={profile?.first_name ?? "toi"} />
        </>
      )}
    </div>
  );
}
