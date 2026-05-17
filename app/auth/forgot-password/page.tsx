import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Mot de passe oublié · Cosme Check" };

export default async function ForgotPasswordPage() {
  const user = await getUser();
  if (user) redirect("/");

  return (
    <main className="min-h-svh flex items-center justify-center px-5 py-10 bg-[#FAFAFA]">
      <section className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-8 shadow-[0_8px_24px_-12px_rgba(17,17,17,0.08)]">
        <div className="text-center mb-6">
          <h1 className="text-[22px] sm:text-[26px] leading-[30px] sm:leading-[34px] font-bold tracking-tight">
            Mot de passe oublié&nbsp;?
          </h1>
          <p className="mt-3 text-sm text-[#6B7280]">
            Entre l&apos;email associé à ton compte. Nous t&apos;enverrons un lien pour choisir un nouveau mot de passe.
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="mt-6 text-center text-sm text-[#6B7280]">
          <Link href="/auth/sign-in" className="text-[#F43F5E] font-medium hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </section>
    </main>
  );
}
