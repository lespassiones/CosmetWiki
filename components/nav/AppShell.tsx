"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BackgroundGlow } from "../BackgroundGlow";
import { CreditsPill } from "../CreditsPill";
import { ScanSheet } from "./ScanSheet";
import { MobileBurgerMenu } from "./MobileBurgerMenu";
import { PremiumCard } from "./PremiumCard";
import { SidebarProfileMenu } from "./SidebarProfileMenu";
import { CameraIcon, ClockIcon, DiamondIcon, HomeIcon, LayersIcon, PromisesIcon, SparklesIcon, UserIcon } from "./NavIcons";

// Lazy-load : les modales ne se montrent qu'en réponse à un event (crédits
// épuisés ou prompt feedback). Inutile d'embarquer leur JS dans le bundle
// initial qui charge sur chaque page authentifiée.
const CreditsExhaustedModal = dynamic(
  () => import("../CreditsExhaustedModal").then((m) => m.CreditsExhaustedModal),
  { ssr: false },
);
const FeedbackPromptModal = dynamic(
  () => import("../FeedbackPromptModal").then((m) => m.FeedbackPromptModal),
  { ssr: false },
);

const NAV_ITEMS = [
  { href: "/", label: "Accueil", icon: HomeIcon },
  { href: "/routine", label: "Routine", icon: LayersIcon },
  { href: "/promesses", label: "Promesses", icon: PromisesIcon },
  { href: "/advisor", label: "Beauty Advisor", icon: SparklesIcon },
  { href: "/history", label: "Historique", icon: ClockIcon },
  { href: "/offre", label: "Offre", icon: DiamondIcon },
  { href: "/profile", label: "Profil", icon: UserIcon },
] as const;

export function AppShell({
  children,
  hideOnPaths = [],
  signedIn,
  firstName,
  initialCredits = null,
  tier = "free",
}: {
  children: React.ReactNode;
  hideOnPaths?: string[];
  signedIn: boolean;
  firstName?: string | null;
  initialCredits?: { used: number; limit: number; remaining: number } | null;
  tier?: "free" | "premium";
}) {
  const pathname = usePathname() ?? "/";
  const [scanOpen, setScanOpen] = useState(false);
  // Pre-populated from SSR so the scan guard works on first render without
  // waiting for a client-side fetch. Refreshed on focus and credit events.
  const [credits, setCredits] = useState(initialCredits);

  useEffect(() => {
    if (!signedIn) return;
    let aborted = false;
    const refresh = async () => {
      try {
        const r = await fetch("/api/credits");
        if (!r.ok) return;
        const data = await r.json();
        if (!aborted && data?.ok && typeof data.remaining === "number") {
          setCredits({ used: data.used, limit: data.limit, remaining: data.remaining });
        }
      } catch {
        /* ignore - guard falls back to opening the sheet */
      }
    };
    // No initial refresh() — initialCredits from SSR is already fresh.
    // Re-fetch only when the user refocuses or a credit-consuming call fires.
    const onUpdate = () => void refresh();
    window.addEventListener("focus", onUpdate);
    window.addEventListener("cosmecheck:credits-updated", onUpdate as EventListener);
    return () => {
      aborted = true;
      window.removeEventListener("focus", onUpdate);
      window.removeEventListener("cosmecheck:credits-updated", onUpdate as EventListener);
    };
  }, [signedIn]);

  // Guarded scan trigger: if the user has 0 credits left, short-circuit the
  // ScanSheet and open the credits-exhausted modal instead - clicking the
  // "Décode" FAB shouldn't even let them paint an analyse they can't run.
  const handleScanClick = useCallback(() => {
    if (credits && credits.remaining <= 0) {
      window.dispatchEvent(
        new CustomEvent("cosmecheck:credits-exhausted", {
          detail: { used: credits.used, limit: credits.limit, isPremium: tier === "premium" },
        }),
      );
      return;
    }
    setScanOpen(true);
  }, [credits]);

  // Allow any client component anywhere in the tree (e.g. /routine's "Ajouter un
  // produit" button) to open the scan sheet by dispatching a custom DOM event.
  // We route it through the same credits guard.
  useEffect(() => {
    const handler = () => handleScanClick();
    window.addEventListener("cosmecheck:open-scan", handler);
    return () => window.removeEventListener("cosmecheck:open-scan", handler);
  }, [handleScanClick]);

  const hidden = hideOnPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (hidden) return <>{children}</>;

  // Logged-out visitors get a chrome-less shell - the public home page renders
  // its own header / footer and gating happens via the search bar.
  if (!signedIn) return <>{children}</>;

  return (
    <div className="relative isolate min-h-svh overflow-x-hidden">
      {/* Pastel orbs behind everything - gives the glass surfaces something to
          refract and ties the signed-in pages to the public landing visual
          language. */}
      <BackgroundGlow />

      {/* Desktop sidebar */}
      <DesktopSidebar
        pathname={pathname}
        onScanClick={handleScanClick}
        signedIn={signedIn}
        firstName={firstName}
        initialCredits={initialCredits}
        tier={tier}
      />

      {/* Page content */}
      <div className="lg:pl-60">
        <main className="pb-24 lg:pb-12">{children}</main>
      </div>

      {/* Mobile bottom nav — masquée pendant le scan et sur /offre (plein écran immersif). */}
      {!scanOpen && !pathname.startsWith("/offre") && <MobileBottomNav pathname={pathname} onScanClick={handleScanClick} />}

      {/* Mobile burger menu (top-right) - opens a drawer mirroring the
          desktop sidebar so the user can reach pages that don't fit in the
          5-slot bottom nav (Profil, Skin advisor). */}
      <MobileBurgerMenu pathname={pathname} items={NAV_ITEMS} tier={tier} />

      {/* Mobile floating Skin Advisor button - sits above the bottom nav,
          hidden when already on /advisor ou /offre to avoid redundancy. */}
      {!pathname.startsWith("/advisor") && !pathname.startsWith("/offre") && !scanOpen && (
        <Link
          href="/advisor"
          aria-label="Ouvrir Beauty Advisor"
          className="lg:hidden fixed right-4 z-[75] h-12 w-12 rounded-full bg-white text-rose-500 flex items-center justify-center ring-1 ring-black/[0.06] shadow-[0_8px_20px_-8px_rgba(15,23,42,0.25)] hover:brightness-105 active:scale-95 transition"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </Link>
      )}

      <ScanSheet open={scanOpen} onClose={() => setScanOpen(false)} />
      <CreditsExhaustedModal />
      <FeedbackPromptModal signedIn={signedIn} />
    </div>
  );
}

function MobileBottomNav({ pathname, onScanClick }: { pathname: string; onScanClick: () => void }) {
  // Pastel pill - floats above the safe area, with a layered liquid-glass
  // background (gradient + backdrop blur) and a subtle inner highlight.
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-[80] pb-[max(env(safe-area-inset-bottom),12px)] pt-2 px-3 pointer-events-none"
      aria-label="Navigation principale"
    >
      <div className="relative mx-auto max-w-md pointer-events-auto">
        {/* The glass pill itself - rose/pink tint to match the site palette */}
        <div className="relative flex items-end justify-between rounded-full bg-gradient-to-b from-[#FFE4E6]/85 to-[#FFD1DC]/75 backdrop-blur-2xl ring-1 ring-white/70 shadow-[0_10px_30px_-12px_rgba(244,63,94,0.25),inset_0_1px_0_rgba(255,255,255,0.75)] px-3 py-1.5">
          <NavBtnMobile href="/" label="Accueil" icon={HomeIcon} active={pathname === "/"} />
          <NavBtnMobile href="/routine" label="Routine" icon={LayersIcon} active={pathname.startsWith("/routine")} />
          <div className="w-16 h-16" aria-hidden />
          <NavBtnMobile href="/history" label="Historique" icon={ClockIcon} active={pathname.startsWith("/history")} />
          <NavBtnMobile href="/promesses" label="Promesses" icon={PromisesIcon} active={pathname.startsWith("/promesses")} />
        </div>
        {/* Center FAB - rose gradient matching the "Installer l'app" CTA.
            Sized at 64px (15% bigger than the original 56px) so the
            "Analyse-moi" label has more breathing room. */}
        <button
          type="button"
          onClick={onScanClick}
          aria-label="Ouvrir le menu d'analyse"
          className="absolute left-1/2 -translate-x-1/2 -top-6 w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white flex flex-col items-center justify-center gap-0.5 transition active:scale-95 hover:brightness-105 ring-4 ring-white/70 shadow-[0_8px_22px_-6px_rgba(244,63,94,0.55),inset_0_1px_0_rgba(255,255,255,0.55)]"
        >
          <CameraIcon className="h-5 w-5 drop-shadow-sm" />
          <span className="text-[10px] font-semibold leading-none tracking-tight drop-shadow-sm">
            Décode
          </span>
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
      <span
        aria-hidden
        className="flex items-center justify-center h-8 w-8 rounded-full transition"
        style={
          active
            ? {
                background: "#FFD1DC",
                boxShadow:
                  "3px 3px 6px #E8A8B4, -3px -3px 6px #FFF0F3",
              }
            : undefined
        }
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className={active ? "font-semibold" : ""}>{label}</span>
    </Link>
  );
}

function DesktopSidebar({
  pathname,
  onScanClick,
  signedIn,
  firstName,
  initialCredits,
  tier = "free",
}: {
  pathname: string;
  onScanClick: () => void;
  signedIn: boolean;
  firstName?: string | null;
  initialCredits?: { used: number; limit: number; remaining: number } | null;
  tier?: "free" | "premium";
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

      {/* Bas de sidebar — Premium, crédits et profil regroupés et collés tout
          en bas via un UNIQUE mt-auto. Deux mt-auto séparés répartissaient
          l'espace libre entre eux, ce qui faisait « flotter » la carte crédits
          au milieu. */}
      <div className="mt-auto flex flex-col gap-3 pt-6">
        {/* Premium upsell — masqué sur /offre (inutile de pitcher quelqu'un qui
            regarde déjà l'offre) ET pour les abonnés premium (déjà convertis :
            leur montrer « Passez Premium » n'a aucun sens). */}
        {signedIn && tier !== "premium" && !pathname.startsWith("/offre") && <PremiumCard />}

        {/* Crédits restants — juste au-dessus du profil, tout en bas. */}
        {signedIn && (
          <div className="flex items-center justify-between rounded-2xl bg-white/70 ring-1 ring-black/[0.04] px-3.5 py-2.5">
            <span className="text-[12px] font-medium text-[#6B7280]">
              Vos crédits restants
            </span>
            <CreditsPill />
          </div>
        )}

        {/* Profil / déconnexion — ancré en bas de la sidebar. */}
        <div className="border-t border-white/60 pt-3">
          {signedIn ? (
            <SidebarProfileMenu firstName={firstName} />
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
      </div>
    </aside>
  );
}
