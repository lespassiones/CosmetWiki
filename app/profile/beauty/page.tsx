import { redirect } from "next/navigation";
import { getProfile, getUser } from "@/lib/auth";
import { readSkinProfile } from "@/lib/skin/profile";
import { BeautyProfileForm } from "@/components/profile/BeautyProfileForm";
import Link from "next/link";

export const metadata = { title: "Profil beauté · Cosme Check" };

export default async function BeautyProfilePage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/profile/beauty");
  const profile = await getProfile();
  const skin = readSkinProfile(profile?.preferences ?? null);

  return (
    <div className="mx-auto max-w-2xl px-5 lg:px-8 py-8 lg:py-12">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#6B7280] hover:bg-black/[0.05] transition"
          aria-label="Retour au profil"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Profil beauté</h1>
          <p className="text-[13px] text-[#6B7280]">Peau, cheveux, sensibilités</p>
        </div>
      </div>

      <BeautyProfileForm
        initial={skin}
        onSaved={undefined}
        onCancel={undefined}
        submitLabel="Enregistrer"
        showCancel={false}
        redirectAfterSave="/profile"
      />
    </div>
  );
}
