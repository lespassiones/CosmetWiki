import Link from "next/link";
import { Logo } from "@/components/Logo";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { MobileMenu } from "@/components/MobileMenu";
import { LEGAL } from "@/lib/legal";

export function LegalLayout({
  title,
  current,
  children,
}: {
  title: string;
  current: "confidentialite" | "cgu" | "mentions-legales";
  children: React.ReactNode;
}) {
  const tabs: { href: string; label: string; key: typeof current }[] = [
    { href: "/confidentialite", label: "Confidentialité", key: "confidentialite" },
    { href: "/cgu", label: "CGU", key: "cgu" },
    { href: "/mentions-legales", label: "Mentions légales", key: "mentions-legales" },
  ];

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-bg">
      <BackgroundGlow />

      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6">
        <Logo size="md" />
        <nav className="hidden items-center gap-1 text-sm text-ink-muted sm:flex">
          <Link
            href="/comment-ca-marche"
            className="rounded-full px-3 py-1.5 transition-colors hover:text-ink"
          >
            Comment ça marche
          </Link>
        </nav>
        <MobileMenu />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-2 text-sm text-ink-subtle">
          Dernière mise à jour : {LEGAL.lastUpdated}
        </p>

        <nav className="mt-6 flex flex-wrap gap-2 text-sm">
          {tabs.map((t) => {
            const active = t.key === current;
            return (
              <Link
                key={t.key}
                href={t.href}
                className={
                  active
                    ? "rounded-full bg-ink px-3.5 py-1.5 text-white"
                    : "rounded-full border border-black/[0.08] bg-white/60 px-3.5 py-1.5 text-ink-muted hover:text-ink"
                }
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <article className="mt-8 space-y-6 text-[15px] leading-relaxed text-ink-muted [&_h2]:pt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:pt-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink [&_a]:text-rose-700 [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_strong]:text-ink">
          {children}
        </article>
      </main>

    </div>
  );
}
