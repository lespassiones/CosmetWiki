import type { Metadata } from "next";
import { PublicHeader } from "@/components/PublicHeader";
import { ContactForm } from "@/components/contact/ContactForm";
import { LEGAL } from "@/lib/legal";

const TITLE = "Contact";
const DESCRIPTION =
  "Une question, un souci, une idée ? Écris-nous, on lit chaque message et on répond rapidement.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `${TITLE} · Cosme Check`,
    description: DESCRIPTION,
    url: "/contact",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-white">
      <PublicHeader />

      {/* Hero — aucune vague ici, aucun overflow */}
      <section className="relative w-full bg-white pt-24 sm:pt-28">
        <div className="relative mx-auto flex max-w-6xl items-center justify-center px-5 pb-16 sm:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Nous contacter
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-muted">
              Une question, un souci, une idée ? On est là pour toi.{" "}
              Écris-nous et on te répondra rapidement.
            </p>
          </div>
        </div>
      </section>

      {/* Main vert — remonte de 56px pour chevaucher le hero, vague blanche au sommet */}
      <main className="relative -mt-14 w-full flex-1 overflow-hidden bg-[#C8EDD6] pb-16">
        {/* Grain en z-0 — sous la vague */}
        <div
          aria-hidden
          className="grain-overlay pointer-events-none absolute inset-0 z-0 opacity-[0.22] mix-blend-multiply"
        />
        {/* Vague blanche en z-10 — au-dessus du grain, reste pure blanche */}
        <div aria-hidden className="relative z-10 w-full overflow-hidden leading-none">
          <svg
            viewBox="0 0 1440 56"
            xmlns="http://www.w3.org/2000/svg"
            className="block w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0,36 C240,0 480,56 720,24 C960,0 1200,50 1440,28 L1440,0 L0,0 Z"
              fill="white"
            />
          </svg>
        </div>
        <div className="relative mx-auto max-w-6xl px-5 pt-4 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <section>
            <div className="space-y-3">
              <InfoCard
                icon={<MailIcon className="h-5 w-5" />}
                title="Email direct"
                value={
                  <a
                    href={`mailto:${LEGAL.contactEmail}`}
                    className="text-[#F43F5E] hover:underline"
                  >
                    {LEGAL.contactEmail}
                  </a>
                }
              />
              <InfoCard
                icon={<ClockIcon className="h-5 w-5" />}
                title="Délai de réponse"
                value={<span className="text-[#F43F5E]">48h</span>}
              />
              <InfoCard
                icon={<LockIcon className="h-5 w-5" />}
                title="Confidentialité"
                value={<span className="text-[#F43F5E]">on ne partage rien.</span>}
              />
            </div>
          </section>

          <section>
            <ContactForm />
          </section>
        </div>
        </div>
      </main>

    </div>
  );
}

function InfoCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.04]">
      <span className="grid h-12 w-12 shrink-0 place-items-center text-[#F43F5E]">
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
