import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { BrandWizard } from "@/components/brands/BrandWizard";

const TITLE = "Espace marques : référencez vos produits";
const DESCRIPTION =
  "Marques de cosmétiques : référencez gratuitement vos produits sur Cosme Check. Envoyez la composition, nous vérifions, le produit est noté et vous recevez votre badge à afficher.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/marques" },
  openGraph: {
    title: `${TITLE} · Cosme Check`,
    description: DESCRIPTION,
    url: "/marques",
    type: "website",
  },
};

const STEPS = [
  { title: "Vous ajoutez vos produits", text: "Dupliquez-les pour aller plus vite." },
  { title: "Nous vérifions", text: "Composition, photos et page officielle." },
  { title: "Vous recevez la note", text: "Par e-mail, avec votre badge à afficher." },
];

export default function MarquesPage() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-white">
      <PublicHeader />

      <section className="relative w-full bg-white pt-28 sm:pt-32">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#F43F5E]">Espace marques</p>
            <h1 className="mt-3 text-[34px] font-bold leading-[1.1] tracking-tight text-ink sm:text-[44px]">
              Référencez vos produits sur Cosme Check
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink-muted">
              Gratuit. Vous envoyez la composition, nous vérifions, et vous recevez la note avec un badge à afficher.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#marques-formulaire"
                className="rounded-full bg-[#F43F5E] px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(244,63,94,0.45)] transition hover:bg-[#E11D48]"
              >
                Référencer un produit
              </a>
              <Link
                href="/marques/badge"
                className="rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-ink ring-1 ring-black/[0.1] transition hover:bg-black/[0.03]"
              >
                Récupérer mon badge
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[440px]">
            <div aria-hidden className="absolute -inset-6 -z-10 rounded-[40px] bg-[#FFF1F2] blur-2xl" />
            <Image
              src="/badges/cosme-check-5-etoiles.png"
              alt="Exemple de badge : noté 5 étoiles sur 5 sur Cosme Check"
              width={880}
              height={312}
              priority
              className="h-auto w-full rotate-[-2deg] drop-shadow-[0_18px_30px_rgba(17,17,17,0.10)]"
            />
            <Image
              src="/badges/cosme-check-4-etoiles.png"
              alt=""
              width={880}
              height={312}
              className="ml-auto mt-[-18px] h-auto w-[78%] rotate-[3deg] drop-shadow-[0_14px_24px_rgba(17,17,17,0.08)]"
            />
          </div>
        </div>
      </section>

      <section className="w-full bg-[#FAFAFA] py-14">
        <ol className="mx-auto grid max-w-6xl gap-4 px-5 sm:px-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-black/[0.05]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F43F5E] text-[16px] font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="text-[16px] font-bold text-ink">{step.title}</p>
                <p className="text-[14px] text-ink-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mx-auto mt-6 max-w-6xl px-5 text-center text-[13.5px] text-ink-subtle sm:px-8">
          La note dépend uniquement de la composition, avec le même calcul pour tous les produits. Aucune marque ne peut
          payer pour la changer.
        </p>
      </section>

      <main id="marques-formulaire" className="w-full scroll-mt-24 bg-white py-16">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <h2 className="text-[26px] font-bold tracking-tight text-ink sm:text-[30px]">Référencer un produit</h2>
          <p className="mt-2 text-[15px] text-ink-muted">Vos infos une seule fois, puis tous vos produits.</p>
          <div className="mt-8">
            <BrandWizard />
          </div>
        </div>
      </main>
    </div>
  );
}
