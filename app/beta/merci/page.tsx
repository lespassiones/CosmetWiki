import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Merci · Cosme Check",
  robots: { index: false, follow: false },
};

export default function BetaMerciPage() {
  return (
    <main className="min-h-svh bg-[#FAFAF7] px-5 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">
          Cosme Check
        </p>
        <div className="rounded-3xl bg-white p-6 text-center shadow-sm sm:p-8">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[#111111]">
            Merci ! 🎉
          </h1>
          <p className="mt-3 text-[15px] leading-6 text-[#6B7280]">
            On a bien reçu tes réponses. Tu viens de recevoir un email pour tester
            Cosme Check. À très vite !
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-[#111111] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
