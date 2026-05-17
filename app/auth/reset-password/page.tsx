import Link from "next/link";
import { getUser } from "@/lib/auth";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Nouveau mot de passe · Cosme Check" };

// Force dynamic rendering so we always read the freshest auth cookie
// set by the /auth/callback exchange. Otherwise Next might serve a
// cached "no user" shell.
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const user = await getUser();

  return (
    <main className="min-h-svh flex items-center justify-center px-5 py-10 bg-[#FAFAFA]">
      <section className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-8 shadow-[0_8px_24px_-12px_rgba(17,17,17,0.08)]">
        <div className="text-center mb-6">
          <h1 className="text-[22px] sm:text-[26px] leading-[30px] sm:leading-[34px] font-bold tracking-tight">
            Nouveau mot de passe
          </h1>
          <p className="mt-3 text-sm text-[#6B7280]">
            {user
              ? "Choisis un nouveau mot de passe sécurisé pour ton compte."
              : "Ce lien a expiré ou n'est plus valide. Demande un nouveau lien."}
          </p>
        </div>

        {user ? (
          <ResetPasswordForm />
        ) : (
          <div className="space-y-4">
            <Link
              href="/auth/forgot-password"
              className="block w-full text-center rounded-xl bg-[#111111] text-white text-sm font-semibold py-3 hover:brightness-110 transition"
            >
              Demander un nouveau lien
            </Link>
            <p className="text-center text-sm text-[#6B7280]">
              <Link href="/auth/sign-in" className="text-[#F43F5E] font-medium hover:underline">
                Retour à la connexion
              </Link>
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
