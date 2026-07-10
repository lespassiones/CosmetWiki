import type { Metadata } from "next";
import Image from "next/image";
import { BetaIntakeWizard } from "@/components/beta/BetaIntakeWizard";

// Page volontairement NON indexée : elle n'est pas listée sur le site, on
// diffuse son lien manuellement (QR code pharmacie, réseaux sociaux, etc.).
export const metadata: Metadata = {
  title: "Deviens bêta testeur · Cosme Check",
  robots: { index: false, follow: false },
};

type Props = { searchParams?: Promise<{ src?: string }> };

export default async function BetaPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  // Canal de recrutement (?src=qr-pharmacie, ?src=insta...) pour l'analytics.
  const source = (params?.src ?? "").trim().slice(0, 60) || undefined;

  return (
    <main className="min-h-svh bg-white lg:grid lg:grid-cols-2">
      {/* Colonne gauche : branding epure (logo + accroche + apercu app). */}
      <section className="relative flex flex-col justify-center overflow-hidden bg-[#FAFAF7] px-6 pt-14 sm:px-10 lg:px-16 lg:py-16">
        <div className="mx-auto w-full max-w-[440px] lg:mx-0">
          <Image
            src="/image/logo-cc-dots.png"
            alt="Cosme Check"
            width={116}
            height={33}
            priority
            className="mb-9 h-[28px] w-auto"
          />
          <h1 className="text-[34px] font-bold leading-[1.04] tracking-tight text-[#111111] sm:text-[44px]">
            Deviens
            <br />
            bêta testeur.
          </h1>
          <p className="mt-5 max-w-[27rem] text-[16px] leading-relaxed text-[#6B7280]">
            Teste Cosme Check en avant-première et aide-nous à le rendre meilleur.
            En échange de tes réponses, tu reçois{" "}
            <strong className="font-semibold text-[#111111]">50 crédits offerts</strong>{" "}
            pour tester gratuitement.
          </p>
        </div>

        {/* Aperçu de l'app (image de la landing). Compact sur mobile, grand et
            ancré en bas sur desktop. */}
        <div
          className="relative mx-auto mt-9 w-full max-w-[190px] lg:mt-6 lg:max-w-[380px] lg:self-center"
          style={{ aspectRatio: "1024 / 1280" }}
        >
          <Image
            src="/image/landing2/newhero.webp"
            alt="Aperçu de l'application Cosme Check"
            fill
            sizes="(min-width:1024px) 380px, 190px"
            className="object-contain object-bottom"
          />
        </div>
      </section>

      {/* Colonne droite : le formulaire d'inscription (2 étapes). */}
      <section className="flex items-center justify-center bg-white px-5 py-14 sm:px-10">
        <div className="w-full max-w-md">
          <BetaIntakeWizard source={source} />
        </div>
      </section>
    </main>
  );
}
