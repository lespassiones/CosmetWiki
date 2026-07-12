import { getUser } from "@/lib/auth";
import { RecoveryGate } from "./RecoveryGate";

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
            Choisis un nouveau mot de passe sécurisé pour ton compte.
          </p>
        </div>

        <RecoveryGate hasServerSession={!!user} />
      </section>
    </main>
  );
}
