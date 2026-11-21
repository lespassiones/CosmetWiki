import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { BadgeLookup } from "@/components/brands/BadgeLookup";

const TITLE = "Badge et note d'un produit";
const DESCRIPTION =
  "Retrouvez la note Cosme Check d'un produit à partir de son code-barres et téléchargez le badge à afficher.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/marques/badge" },
  openGraph: { title: `${TITLE} · Cosme Check`, description: DESCRIPTION, url: "/marques/badge", type: "website" },
};

export default function BadgePage() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-white">
      <PublicHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-20 pt-28 sm:px-8 sm:pt-32">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#F43F5E]">Espace marques</p>
        <h1 className="mt-3 text-[30px] font-bold tracking-tight text-ink sm:text-[38px]">Votre badge</h1>
        <p className="mt-3 text-[15px] text-ink-muted">
          Entrez le code-barres d&apos;un produit référencé pour voir sa note et récupérer son badge.
        </p>
        <div className="mt-8">
          <BadgeLookup />
        </div>
        <p className="mt-10 text-[13px] leading-relaxed text-ink-subtle">
          Le badge reflète la note au jour du référencement. Si la formule change, la note peut changer : ce lien
          affiche toujours la note à jour. Produit pas encore référencé ?{" "}
          <Link href="/marques" className="text-[#E11D48] underline">
            Proposez-le
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
