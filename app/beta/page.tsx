import type { Metadata } from "next";
import { BetaSignupForm } from "@/components/beta/BetaSignupForm";

// Page volontairement NON indexée : elle n'est pas listée sur le site, on
// diffuse son lien manuellement (QR code pharmacie, réseaux sociaux, etc.).
export const metadata: Metadata = {
  title: "Deviens bêta testeur · Cosme Check",
  robots: { index: false, follow: false },
};

type Props = { searchParams?: Promise<{ src?: string }> };

export default async function BetaPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  // Canal de recrutement (?src=qr-pharmacie, ?src=insta…) → analytics d'entonnoir.
  const source = (params?.src ?? "").trim().slice(0, 60) || undefined;

  return (
    <main className="min-h-svh bg-[#FAFAF7] px-5 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">
          Cosme Check
        </p>
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[#111111]">
            Bienvenue, cher bêta testeur 👋
          </h1>
          <p className="mt-3 text-[15px] leading-6 text-[#6B7280]">
            Merci de vouloir rejoindre l&apos;équipe bêta de <strong className="text-[#111111]">Cosme Check</strong>.
            Tu es ici parce que tu veux tester l&apos;app en avant-première. Laisse-nous
            ton nom et ton email : on te préviendra <strong className="text-[#111111]">dès que la phase de
            test sera lancée</strong>, avec ton accès et le nécessaire pour tester.
          </p>
          <div className="mt-6">
            <BetaSignupForm source={source} />
          </div>
        </div>
      </div>
    </main>
  );
}
