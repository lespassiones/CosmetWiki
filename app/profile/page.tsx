import { redirect } from "next/navigation";
import { getProfile, getUser } from "@/lib/auth";
import { signOut } from "@/app/auth/actions";

export const metadata = { title: "Mon profil · Cosme Check" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/profile");
  const profile = await getProfile();

  const initials = (profile?.first_name ?? "U").slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl px-5 lg:px-8 py-8 lg:py-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-14 w-14 rounded-full bg-[#111111] text-white flex items-center justify-center text-xl font-semibold">
          {initials}
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">{profile?.first_name ?? "Utilisateur"}</h1>
          <p className="text-sm text-[#6B7280]">{user.email}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 mb-4">
        <h2 className="text-sm font-semibold mb-3">Mon abonnement</h2>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#111111] text-white px-3 py-1.5 text-[12px] font-medium">
          <span>✨</span>
          Accès complet · Gratuit pour le moment
        </div>
        <p className="text-[13px] text-[#6B7280] mt-3 leading-relaxed">
          Toutes les fonctionnalités sont disponibles gratuitement pendant la phase de lancement.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
        <h2 className="text-sm font-semibold mb-3">Compte</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-[#F0F0F0] py-2">
            <dt className="text-[#6B7280]">Prénom</dt>
            <dd className="font-medium">{profile?.first_name ?? "—"}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-[#6B7280]">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
        </dl>

        <form action={signOut} className="mt-5">
          <button
            type="submit"
            className="w-full sm:w-auto rounded-xl border border-[#E5E7EB] px-5 py-2.5 text-sm font-medium text-[#E11D48] hover:bg-rose-50 transition"
          >
            Se déconnecter
          </button>
        </form>
      </section>
    </div>
  );
}
