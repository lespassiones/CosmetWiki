import type { Metadata } from "next";
import { supabaseService } from "@/lib/supabase";
import { BetaFeedbackWizard } from "@/components/beta/BetaFeedbackWizard";

export const metadata: Metadata = {
  title: "Ton retour · Cosme Check",
  robots: { index: false, follow: false },
};

type Props = { searchParams?: Promise<{ token?: string }> };

export default async function BetaRetourPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  const token = (params?.token ?? "").trim();

  // Le token identifie le testeur (reçu dans l'email) → on n'a rien à retaper.
  let tester: { first_name: string | null } | null = null;
  if (token) {
    const sb = supabaseService();
    const { data } = await sb
      .schema("cosme_check")
      .from("beta_testers")
      .select("first_name")
      .eq("token", token)
      .maybeSingle();
    tester = (data as { first_name: string | null } | null) ?? null;
  }

  return (
    <main className="min-h-svh bg-[#FAFAF7] px-5 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">
          Cosme Check
        </p>
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          {!tester ? (
            <>
              <h1 className="text-[22px] font-bold leading-tight tracking-tight text-[#111111]">
                Lien invalide
              </h1>
              <p className="mt-3 text-[15px] leading-6 text-[#6B7280]">
                Ce lien de retour n&apos;est pas valide. Utilise le lien reçu dans
                ton email de bienvenue à la bêta.
              </p>
            </>
          ) : (
            <BetaFeedbackWizard token={token} firstName={tester.first_name} />
          )}
        </div>
      </div>
    </main>
  );
}
