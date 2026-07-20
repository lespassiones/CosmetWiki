import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile, getUser } from "@/lib/auth";
import { signOut } from "@/app/auth/actions";
import { GLASS_CARD } from "@/lib/ui/glass";
import { readSkinProfile, isProfileStarted } from "@/lib/skin/profile";
import { SubscriptionManager } from "@/components/profile/SubscriptionManager";
import { DeleteAccountButton } from "@/components/profile/DeleteAccountButton";

export const metadata = { title: "Mon profil · Cosme Check" };

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/profile");
  const profile = await getProfile();

  const initials = (profile?.first_name ?? "U").slice(0, 1).toUpperCase();
  const skin = readSkinProfile(profile?.preferences ?? null);
  const skinFilled = isProfileStarted(skin);

  // Subscription data (from extended user_profiles columns)
  const extProfile = profile as (typeof profile & {
    tier?: string;
    subscription_status?: string;
    stripe_customer_id?: string;
    current_period_end?: string;
    trial_end?: string;
  }) | null;

  return (
    <div className="mx-auto max-w-3xl px-5 lg:px-8 py-8 lg:py-12 space-y-4">
      {/* Avatar + nom */}
      <div className="flex items-center gap-4 mb-2">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#1F2937] to-[#0A0A0A] text-white flex items-center justify-center text-xl font-semibold ring-1 ring-white/[0.08] shadow-[0_10px_24px_-10px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.18)]">
          {initials}
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">{profile?.first_name ?? "Utilisateur"}</h1>
          <p className="text-sm text-[#6B7280]">{user.email}</p>
        </div>
      </div>

      {/* Abonnement */}
      <SubscriptionManager
        tier={extProfile?.tier ?? "free"}
        subscriptionStatus={extProfile?.subscription_status ?? null}
        currentPeriodEnd={extProfile?.current_period_end ?? null}
        trialEnd={extProfile?.trial_end ?? null}
        hasStripeCustomer={Boolean(extProfile?.stripe_customer_id)}
      />

      {/* Crédits & fonctionnalités — détail du coût de chaque fonctionnalité */}
      <Link href="/profile/credits" className={`${GLASS_CARD} p-5 flex items-center justify-between gap-4 hover:brightness-[0.97] transition block`}>
        <div className="flex items-center gap-3">
          <TagIcon className="h-6 w-6 text-rose-500 shrink-0" />
          <div>
            <p className="text-[15px] font-semibold text-ink leading-tight">Crédits &amp; fonctionnalités</p>
            <p className="text-[12px] text-[#6B7280] mt-0.5">Ce que coûte chaque fonctionnalité</p>
          </div>
        </div>
        <ChevronRightIcon className="h-4 w-4 text-[#9CA3AF] shrink-0" />
      </Link>

      {/* Profil beauté — compact, lien vers /profile/beauty */}
      <Link href="/profile/beauty" className={`${GLASS_CARD} p-5 flex items-center justify-between gap-4 hover:brightness-[0.97] transition block`}>
        <div className="flex items-center gap-3">
          <FaceIcon className="h-6 w-6 text-rose-500 shrink-0" />
          <div>
            <p className="text-[15px] font-semibold text-ink leading-tight">Profil beauté</p>
            <p className="text-[12px] text-[#6B7280] mt-0.5">
              {skinFilled ? "Peau, cheveux, sensibilités" : "À compléter pour personnaliser tes analyses"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold text-[#F43F5E] ring-1 ring-rose-200 bg-rose-50">
            <PencilIcon className="h-3.5 w-3.5" />
            {skinFilled ? "Modifier" : "Compléter"}
          </span>
          <ChevronRightIcon className="h-4 w-4 text-[#9CA3AF]" />
        </div>
      </Link>

      {/* Compte */}
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
              <span className="text-[11px] uppercase tracking-wide text-[#6B7280] font-medium">Prénom</span>
              <span className="text-[14px] font-semibold text-ink truncate">{profile?.first_name ?? "-"}</span>
            </div>
          </li>
          <li className="flex items-center gap-3 py-3">
            <MailIcon className="h-5 w-5 text-[#6B7280] shrink-0" />
            <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
              <span className="text-[11px] uppercase tracking-wide text-[#6B7280] font-medium shrink-0">Email</span>
              <span className="text-[14px] font-medium text-ink truncate">{user.email}</span>
            </div>
          </li>
        </ul>
        <form action={signOut} className="mt-5">
          <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-50 ring-1 ring-rose-100 px-5 py-3 text-sm font-semibold text-[#E11D48] hover:bg-rose-100/80 transition">
            <LogoutIcon className="h-4 w-4" />
            Se déconnecter
          </button>
        </form>
      </section>

      {/* Informations légales */}
      <section className={`${GLASS_CARD} overflow-hidden`}>
        <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-semibold px-5 pt-4 pb-2">
          Informations légales
        </p>
        <ul className="divide-y divide-black/[0.05]">
          {[
            { href: "/cgu", label: "Conditions d'utilisation", icon: <DocIcon /> },
            { href: "/confidentialite", label: "Politique de confidentialité", icon: <LockIcon /> },
            { href: "/mentions-legales", label: "Mentions légales", icon: <BuildingIcon /> },
          ].map(({ href, label, icon }) => (
            <li key={href}>
              <Link href={href} className="flex items-center gap-3 px-5 py-3.5 hover:bg-black/[0.02] transition">
                <span className="text-[#6B7280] h-5 w-5 shrink-0">{icon}</span>
                <span className="flex-1 text-[14px] text-ink">{label}</span>
                <ChevronRightIcon className="h-4 w-4 text-[#9CA3AF]" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Avertissement médical */}
      <div className="flex items-start gap-2 px-1 pb-2">
        <InfoIcon className="h-4 w-4 text-[#9CA3AF] mt-0.5 shrink-0" />
        <p className="text-[11px] text-[#9CA3AF] leading-relaxed italic">
          Cosme Check est un outil pédagogique. Les analyses ne constituent pas un avis médical.
          En cas de doute, consulte un professionnel de santé.
        </p>
      </div>

      {/* Suppression de compte (RGPD - droit à l'effacement) */}
      <DeleteAccountButton />
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function UserIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}
function UserCircleIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></svg>;
}
function MailIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" /><polyline points="3 7 12 13 21 7" /></svg>;
}
function LogoutIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
}
function FaceIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><circle cx="12" cy="12" r="9" /><path d="M8.5 14c.9 1.1 2.1 1.7 3.5 1.7s2.6-.6 3.5-1.7" /><circle cx="9" cy="10" r="0.6" fill="currentColor" /><circle cx="15" cy="10" r="0.6" fill="currentColor" /></svg>;
}
function PencilIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>;
}
function ChevronRightIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><path d="M9 18l6-6-6-6" /></svg>;
}
function TagIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>;
}
function DocIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></svg>;
}
function LockIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
}
function BuildingIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden><rect x="2" y="7" width="20" height="15" rx="1" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="8" y1="12" x2="8" y2="16" /><line x1="16" y1="12" x2="16" y2="16" /></svg>;
}
function InfoIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><circle cx="12" cy="8" r="0.6" fill="currentColor" /></svg>;
}
