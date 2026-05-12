"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanSheet } from "./ScanSheet";
import { CameraIcon, ClockIcon, HomeIcon, LayersIcon, UserIcon } from "./NavIcons";

const NAV_ITEMS = [
  { href: "/", label: "Accueil", icon: HomeIcon },
  { href: "/routine", label: "Routine", icon: LayersIcon },
  { href: "/history", label: "Historique", icon: ClockIcon },
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

  const hidden = hideOnPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (hidden) return <>{children}</>;

  return (
    <div className="min-h-svh bg-[#FAFAFA]">
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
        {/* The glass pill itself */}
        <div className="relative flex items-end justify-between rounded-full bg-gradient-to-b from-[#EAF6F1]/85 to-[#D6EFE4]/75 backdrop-blur-2xl ring-1 ring-white/60 shadow-[0_10px_30px_-12px_rgba(15,72,55,0.25),inset_0_1px_0_rgba(255,255,255,0.65)] px-3 py-1.5">
          <NavBtnMobile href="/" label="Accueil" icon={HomeIcon} active={pathname === "/"} />
          <NavBtnMobile href="/routine" label="Routine" icon={LayersIcon} active={pathname.startsWith("/routine")} />
          <div className="w-14 h-14" aria-hidden />
          <NavBtnMobile href="/history" label="Historique" icon={ClockIcon} active={pathname.startsWith("/history")} />
          <NavBtnMobile href="/profile" label="Profil" icon={UserIcon} active={pathname.startsWith("/profile")} />
        </div>
        {/* Center FAB — pastel mint with a frosted ring and inner highlight */}
        <button
          type="button"
          onClick={onScanClick}
          aria-label="Ouvrir le menu d'analyse"
          className="absolute left-1/2 -translate-x-1/2 -top-5 w-14 h-14 rounded-full bg-gradient-to-br from-[#5FBFA0] to-[#2FA37A] text-white flex items-center justify-center transition active:scale-95 hover:brightness-105 ring-4 ring-white/70 shadow-[0_8px_22px_-6px_rgba(47,163,122,0.55),inset_0_1px_0_rgba(255,255,255,0.55)]"
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
        active ? "text-[#1F8A6A]" : "text-[#4B5563]"
      }`}
    >
      {active && (
        <span
          aria-hidden
          className="absolute inset-x-1 inset-y-0.5 -z-10 rounded-full bg-white/65 backdrop-blur-md ring-1 ring-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
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
      className="hidden lg:flex fixed left-0 top-0 w-60 h-screen flex-col bg-white border-r border-[#E5E7EB] p-5"
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
          <span className="text-[#111111]">Cosmet</span>
          <span className="text-[#F43F5E]">Wiki</span>
        </span>
      </Link>

      <button
        type="button"
        onClick={onScanClick}
        className="flex items-center gap-2 justify-center bg-[#111111] hover:brightness-110 text-white rounded-xl py-3 text-sm font-semibold mb-6"
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition"
                style={{
                  color: active ? "#111111" : "#6B7280",
                  background: active ? "#F0F0F0" : "transparent",
                  fontWeight: active ? 600 : 500,
                }}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto pt-6 border-t border-[#E5E7EB]">
        {signedIn ? (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#111111] text-white flex items-center justify-center text-xs font-semibold">
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
              className="block text-center text-sm font-medium border border-[#E5E7EB] rounded-xl py-2 hover:border-[#111111] transition"
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
