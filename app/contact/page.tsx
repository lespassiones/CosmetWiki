import type { Metadata } from "next";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { BackgroundGlow } from "@/components/BackgroundGlow";
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
    <div className="relative isolate flex min-h-screen flex-col bg-bg">
      <BackgroundGlow />
      <PublicHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-28 sm:px-8 sm:pt-32">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <section>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[12px] font-semibold text-[#F43F5E] ring-1 ring-rose-100">
              <ChatIcon className="h-3.5 w-3.5" />
              Contact
            </span>

            <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              On t&apos;écoute
            </h1>

            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-muted">
              Une question, un souci, une idée ? On est là pour toi. Écris-nous
              et on te répondra rapidement.
            </p>

            <ul className="mt-8 space-y-3">
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
            </ul>
          </section>

          <section>
            <ContactForm />
          </section>
        </div>
      </main>

      <Footer />
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
    <li className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.04]">
      <span className="grid h-12 w-12 shrink-0 place-items-center text-[#F43F5E]">
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-sm">{value}</p>
      </div>
    </li>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2C6.48 2 2 6.04 2 11c0 2.5 1.13 4.74 2.93 6.32L4 22l4.84-1.5c.99.3 2.05.47 3.16.47 5.52 0 10-4.04 10-9s-4.48-9-10-9z" />
    </svg>
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
