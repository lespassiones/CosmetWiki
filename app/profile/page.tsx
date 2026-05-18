import { redirect } from "next/navigation";
import { getProfile, getUser } from "@/lib/auth";
import { signOut } from "@/app/auth/actions";
import { GLASS_CARD, GLASS_PILL_DARK } from "@/lib/ui/glass";
import { SkinProfileCard } from "@/components/profile/SkinProfileCard";
import { readSkinProfile } from "@/lib/skin/profile";

export const metadata = { title: "Mon profil · Cosme Check" };

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/profile");
  const profile = await getProfile();

  const initials = (profile?.first_name ?? "U").slice(0, 1).toUpperCase();
  const skin = readSkinProfile(profile?.preferences ?? null);

  return (
    <div className="mx-auto max-w-3xl px-5 lg:px-8 py-8 lg:py-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#1F2937] to-[#0A0A0A] text-white flex items-center justify-center text-xl font-semibold ring-1 ring-white/[0.08] shadow-[0_10px_24px_-10px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.18)]">
          {initials}
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">{profile?.first_name ?? "Utilisateur"}</h1>
          <p className="text-sm text-[#6B7280]">{user.email}</p>
        </div>
      </div>

      <section className={`${GLASS_CARD} p-5 mb-4`}>
        <h2 className="text-sm font-semibold mb-3">Mon abonnement</h2>
        <div className={`inline-flex items-center gap-2 ${GLASS_PILL_DARK} px-3 py-1.5 text-[12px] font-medium`}>
          <span>✨</span>
          Accès complet · Gratuit pour le moment
        </div>
        <p className="text-[13px] text-[#6B7280] mt-3 leading-relaxed">
          Toutes les fonctionnalités sont disponibles gratuitement pendant la phase de lancement.
        </p>
      </section>

      <div className="mb-4">
        <SkinProfileCard initial={skin} />
      </div>

      <section className={`${GLASS_CARD} p-5`}>
        <header className="flex items-start gap-3 mb-4">
          <UserIcon className="h-6 w-6 text-violet-500 mt-0.5 shrink-0" />
          <div>
            <h2 className="text-[15px] font-semibold text-ink leading-tight">Compte</h2>
            <p className="text-[12px] text-[#6B7280] mt-0.5">Vos informations personnelles</p>
          </div>
        </header>

        <ul className="divide-y divide-black/[0.06]">
          <li className="flex items-center gap-3 py-3">
            <UserCircleIcon className="h-5 w-5 text-[#6B7280] shrink-0" />
            <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
              <span className="text-[11px] uppercase tracking-wide text-[#6B7280] font-medium">
                Prénom
              </span>
              <span className="text-[14px] font-semibold text-ink truncate">
                {profile?.first_name ?? "-"}
              </span>
            </div>
          </li>
          <li className="flex items-center gap-3 py-3">
            <MailIcon className="h-5 w-5 text-[#6B7280] shrink-0" />
            <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
              <span className="text-[11px] uppercase tracking-wide text-[#6B7280] font-medium shrink-0">
                Email
              </span>
              <span className="text-[14px] font-medium text-ink truncate">
                {user.email}
              </span>
            </div>
          </li>
        </ul>

        <form action={signOut} className="mt-5">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-50 ring-1 ring-rose-100 px-5 py-3 text-sm font-semibold text-[#E11D48] hover:bg-rose-100/80 transition"
          >
            <LogoutIcon className="h-4 w-4" />
            Se déconnecter
          </button>
        </form>
      </section>
    </div>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function UserCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
