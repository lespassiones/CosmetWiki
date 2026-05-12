"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BackgroundGlow } from "../BackgroundGlow";
import { ScanSheet } from "./ScanSheet";
import { CameraIcon, ClockIcon, HomeIcon, LayersIcon, SparklesIcon, UserIcon } from "./NavIcons";

const NAV_ITEMS = [
  { href: "/", label: "Accueil", icon: HomeIcon },
  { href: "/routine", label: "Routine", icon: LayersIcon },
  { href: "/history", label: "Historique", icon: ClockIcon },
  { href: "/advisor", label: "Skin advisor", icon: SparklesIcon },
  { href: "/profile", label: "Profil", icon: UserIcon },
] as const;

export function AppShell({
  children,
  hideOnPaths = [],
  signedIn,
  firstName,
}: {
  children: React.ReactNode;
  /** Path prefixes where the shell (bottom nav + sidebar) should be hidden. */
  hideOnPaths?: string[];
  signedIn: boolean;
  firstName?: string | null;
}) {
  const pathname = usePathname() ?? "/";
  const [scanOpen, setScanOpen] = useState(false);

  // Allow any client component anywhere in the tree (e.g. /routine's "Ajouter un
  // produit" button) to open the scan sheet by dispatching a custom DOM event.
  useEffect(() => {
    const handler = () => setScanOpen(true);
    window.addEventListener("cosmecheck:open-scan", handler);
    return () => window.removeEventListener("cosmecheck:open-scan", handler);
  }, []);

  const hidden = hideOnPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (hidden) return <>{children}</>;

  // Logged-out visitors get a chrome-less shell — the public home page renders
  // its own header / footer and gating happens via the search bar.
  if (!signedIn) return <>{children}</>;

  return (
    <div className="relative isolate min-h-svh bg-[#FAFAFA] overflow-x-hidden">
      {/* Pastel orbs behind everything — gives the glass surfaces something to
          refract and ties the signed-in pages to the public landing visual
          language. */}
      <BackgroundGlow />

      {/* Desktop sidebar */}
      <DesktopSidebar
        pathname={pathname}
        onScanClick={() => setScanOpen(true)}
        signedIn={signedIn}
        firstName={firstName}
      />

      {/* Page content */}
      <div className="lg:pl-60">
        <main className="pb-24 lg:pb-12">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav pathname={pathname} onScanClick={() => setScanOpen(true)} />

      {/* Mobile floating Skin Advisor button — sits above the bottom nav,
          hidden when already on /advisor to avoid redundancy. */}
      {!pathname.startsWith("/advisor") && (
        <Link
          href="/advisor"
          aria-label="Ouvrir Skin Advisor"
          className="lg:hidden fixed right-4 z-40 h-12 w-12 rounded-full bg-gradient-to-br from-[#1F2937] via-[#111111] to-[#0A0A0A] text-white flex items-center justify-center ring-1 ring-white/[0.08] shadow-[0_10px_24px_-8px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.18)] hover:brightness-110 active:scale-95 transition"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)" }}
        >
          <SparklesIcon className="h-5 w-5 text-[#FBBF24]" />
        </Link>
      )}

      <ScanSheet open={scanOpen} onClose={() => setScanOpen(false)} />
    </div>
  );
}

function MobileBottomNav({ pathname, onScanClick }: { pathname: string; onScanClick: () => void }) {
  // Pastel pill — floats above the safe area, with a layered liquid-glass
  // background (gradient + backdrop blur) and a subtle inner highlight.
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 px-3 pointer-events-none"
      aria-label="Navigation principale"
    >
      <div className="relative mx-auto max-w-md pointer-events-auto">
        {/* The glass pill itself — rose/pink tint to match the site palette */}
        <div className="relative flex items-end justify-between rounded-full bg-gradient-to-b from-[#FFE4E6]/85 to-[#FFD1DC]/75 backdrop-blur-2xl ring-1 ring-white/70 shadow-[0_10px_30px_-12px_rgba(244,63,94,0.25),inset_0_1px_0_rgba(255,255,255,0.75)] px-3 py-1.5">
          <NavBtnMobile href="/" label="Accueil" icon={HomeIcon} active={pathname === "/"} />
          <NavBtnMobile href="/routine" label="Routine" icon={LayersIcon} active={pathname.startsWith("/routine")} />
          <div className="w-14 h-14" aria-hidden />
          <NavBtnMobile href="/history" label="Historique" icon={ClockIcon} active={pathname.startsWith("/history")} />
          <NavBtnMobile href="/profile" label="Profil" icon={UserIcon} active={pathname.startsWith("/profile")} />
        </div>
        {/* Center FAB — rose gradient matching the "Installer l'app" CTA */}
        <button
          type="button"
          onClick={onScanClick}
          aria-label="Ouvrir le menu d'analyse"
          className="absolute left-1/2 -translate-x-1/2 -top-5 w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white flex items-center justify-center transition active:scale-95 hover:brightness-105 ring-4 ring-white/70 shadow-[0_8px_22px_-6px_rgba(244,63,94,0.55),inset_0_1px_0_rgba(255,255,255,0.55)]"
        >
          <CameraIcon className="h-6 w-6 drop-shadow-sm" />
        </button>
      </div>
    </nav>
  );
}

function NavBtnMobile({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: (p: { className?: string }) => React.JSX.Element;
  active: boolean;
}) {
  // Active item gets its own little frosted glass pill so it pops out of the bar.
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 w-14 text-[10px] font-medium transition ${
        active ? "text-[#F43F5E]" : "text-[#4B5563]"
      }`}
    >
      {active && (
        <span
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-full bg-[#F43F5E]"
        />
      )}
      <Icon className="h-5 w-5" />
      <span className={active ? "font-semibold" : ""}>{label}</span>
    </Link>
  );
}

function DesktopSidebar({
  pathname,
  onScanClick,
  signedIn,
  firstName,
}: {
  pathname: string;
  onScanClick: () => void;
  signedIn: boolean;
  firstName?: string | null;
}) {
  return (
    <aside
      className="hidden lg:flex fixed left-0 top-0 w-60 h-screen flex-col bg-white/60 backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-white/70 shadow-[8px_0_30px_-12px_rgba(15,23,42,0.10),inset_-1px_0_0_rgba(255,255,255,0.65)] p-5"
      aria-label="Navigation latérale"
    >
      <Link href="/" className="flex items-center gap-2 mb-8">
        <span aria-hidden className="w-5 h-5 inline-block">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#111111]">
            <path d="M9 2v6L3 18a3 3 0 0 0 3 4h12a3 3 0 0 0 3-4L15 8V2" />
            <path d="M9 2h6" />
          </svg>
        </span>
        <span className="text-[15px] font-bold tracking-tight">
          <span className="text-[#111111]">Cosme </span>
          <span className="text-[#F43F5E]">Check</span>
        </span>
      </Link>

      <button
        type="button"
        onClick={onScanClick}
        className="flex items-center gap-2 justify-center rounded-full bg-gradient-to-br from-[#1F2937] via-[#111111] to-[#0A0A0A] text-white py-3 text-sm font-semibold mb-6 ring-1 ring-white/[0.08] shadow-[0_14px_30px_-12px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-1px_0_rgba(0,0,0,0.30)] hover:brightness-110 transition"
      >
        <CameraIcon className="h-4 w-4" />
        Analyser un produit
      </button>

      <ul className="space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm transition ${
                  active
                    ? "bg-white/85 text-[#111111] font-semibold ring-1 ring-white/90 shadow-[0_4px_14px_-4px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.95)]"
                    : "text-[#6B7280] font-medium hover:text-[#111111] hover:bg-white/55"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto pt-6 border-t border-white/60">
        {signedIn ? (
          <div className="flex items-center gap-3 rounded-full bg-white/55 ring-1 ring-white/80 backdrop-blur-xl shadow-[0_8px_22px_-8px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.9)] px-2.5 py-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1F2937] to-[#0A0A0A] text-white flex items-center justify-center text-xs font-semibold ring-1 ring-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
              {(firstName ?? "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{firstName ?? "Utilisateur"}</div>
              <Link href="/profile" className="text-[11px] text-[#6B7280] hover:text-black">
                Mon compte
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/auth/sign-in"
              className="block text-center text-sm font-semibold rounded-full bg-white/65 ring-1 ring-white/80 backdrop-blur-xl shadow-[0_8px_22px_-8px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.9)] py-2 hover:bg-white/85 transition"
            >
              Se connecter
            </Link>
            <Link
              href="/auth/sign-up"
              className="block text-center text-sm font-medium text-[#F43F5E] hover:underline"
            >
              Créer un compte
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
