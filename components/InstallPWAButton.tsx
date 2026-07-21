"use client";

import { useEffect, useState } from "react";

// Chrome's standard installability event. Fires once the PWA criteria are met
// (manifest + service worker + 192/512 icons + HTTPS) AND the user hasn't
// already installed/dismissed too recently.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// The event is captured BEFORE hydration by the inline script emitted by
// components/PWAInstallCapture.tsx (rendered in app/layout.tsx). Chrome fires
// `beforeinstallprompt` during initial page load, well before this client
// component mounts — so attaching the listener in a useEffect here would miss
// it and we'd always fall back to the manual instructions. We just read the
// global the capture script maintains.
declare global {
  interface Window {
    __cwInstallPrompt?: BeforeInstallPromptEvent | null;
    __cwInstalled?: boolean;
  }
}

const INSTALL_CHANGE_EVENT = "cw:install-change";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function usePWAInstall() {
  const [canPromptNative, setCanPromptNative] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const sync = () => {
      setCanPromptNative(Boolean(window.__cwInstallPrompt));
      setInstalled(isStandalone() || window.__cwInstalled === true);
    };
    sync();
    window.addEventListener(INSTALL_CHANGE_EVENT, sync);
    return () => window.removeEventListener(INSTALL_CHANGE_EVENT, sync);
  }, []);

  const promptNative = async (): Promise<boolean> => {
    const evt = typeof window !== "undefined" ? window.__cwInstallPrompt : null;
    if (!evt) return false;
    try {
      await evt.prompt();
      await evt.userChoice;
      window.__cwInstallPrompt = null;
      window.dispatchEvent(new Event(INSTALL_CHANGE_EVENT));
      return true;
    } catch {
      // Event was already used or browser blocked it - fall back to manual
      // instructions.
      window.__cwInstallPrompt = null;
      window.dispatchEvent(new Event(INSTALL_CHANGE_EVENT));
      return false;
    }
  };

  return { installed, canPromptNative, promptNative };
}

type Platform = "ios" | "android-chrome" | "desktop-chromium" | "firefox" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Firefox/i.test(ua)) return "firefox";
  if (/Android/i.test(ua)) return "android-chrome";
  if (/Chrome|Edg|OPR/i.test(ua)) return "desktop-chromium";
  return "other";
}

export function InstallPWAButton({ className = "" }: { className?: string }) {
  const { installed, promptNative } = usePWAInstall();
  const [showHelp, setShowHelp] = useState(false);

  if (installed) return null;

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          const ok = await promptNative();
          if (!ok) setShowHelp(true);
        }}
        className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-rose-400 to-pink-400 px-3 py-1.5 text-[13px] font-semibold text-white shadow-[0_4px_14px_-4px_rgba(251,113,133,0.55),inset_0_1px_0_0_rgba(255,255,255,0.30)] transition-all hover:from-rose-500 hover:to-pink-500 ${className}`}
        aria-label="Installer l'application"
      >
        <DownloadIcon />
        Installer l&apos;app
      </button>
      {showHelp ? (
        <InstallInstructionsDialog onClose={() => setShowHelp(false)} />
      ) : null}
    </>
  );
}

/**
 * Bouton d'installation PLEINE LARGEUR (bannière du dashboard, au-dessus de
 * « Astuce du jour »). Même logique que InstallPWAButton mais rendu comme un
 * bloc large aligné sur la largeur des cartes.
 *
 * Visibilité : uniquement tant que l'app N'EST PAS installée (mode standalone).
 * Dès qu'elle tourne en PWA (Android/desktop après install, ou iOS ouvert depuis
 * l'écran d'accueil), `installed` passe à true et la bannière disparaît.
 *
 * Le gate `mounted` évite un flash de la bannière au chargement pour les
 * utilisateurs qui ont DÉJÀ installé (l'état standalone n'est connu que côté
 * client) : rien n'est rendu au SSR, puis la bannière apparaît si besoin.
 */
export function InstallPWABanner({ className = "" }: { className?: string }) {
  const { installed, promptNative } = usePWAInstall();
  const [showHelp, setShowHelp] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || installed) return null;

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          const ok = await promptNative();
          if (!ok) setShowHelp(true);
        }}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-rose-400 to-pink-400 px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(251,113,133,0.55),inset_0_1px_0_0_rgba(255,255,255,0.30)] transition-all hover:from-rose-500 hover:to-pink-500 active:scale-[0.99] ${className}`}
        aria-label="Installer l'application sur ton écran d'accueil"
      >
        <DownloadIcon />
        Installer l&apos;app
      </button>
      {showHelp ? (
        <InstallInstructionsDialog onClose={() => setShowHelp(false)} />
      ) : null}
    </>
  );
}

export function InstallPWAMenuItem({
  onActivate,
}: {
  /** Optional callback fired before the install flow runs (e.g. close the menu). */
  onActivate?: () => void;
}) {
  const { installed, promptNative } = usePWAInstall();
  const [showHelp, setShowHelp] = useState(false);

  if (installed) return null;

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          onActivate?.();
          const ok = await promptNative();
          if (!ok) setShowHelp(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-rose-400 to-pink-400 px-3 py-1.5 text-[13px] font-semibold text-white shadow-[0_4px_14px_-4px_rgba(251,113,133,0.55),inset_0_1px_0_0_rgba(255,255,255,0.30)] transition-all hover:from-rose-500 hover:to-pink-500"
        aria-label="Installer l'application"
      >
        <DownloadIcon />
        Installer l&apos;app
      </button>
      {showHelp ? (
        <InstallInstructionsDialog onClose={() => setShowHelp(false)} />
      ) : null}
    </>
  );
}

function InstallInstructionsDialog({ onClose }: { onClose: () => void }) {
  const platform = detectPlatform();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-help-title"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_24px_48px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.04]">
        <div className="flex items-start justify-between">
          <h2 id="install-help-title" className="text-lg font-semibold text-ink">
            Installer Cosme Check
          </h2>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-ink-muted hover:bg-black/[0.04] hover:text-ink"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="mt-4 text-[14px] leading-relaxed text-ink-muted">
          <PlatformInstructions platform={platform} />
        </div>
      </div>
    </div>
  );
}

function PlatformInstructions({ platform }: { platform: Platform }) {
  if (platform === "ios") {
    return (
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          Appuie sur l&apos;icône <strong>Partager</strong> (carré avec une
          flèche vers le haut) en bas de Safari.
        </li>
        <li>
          Fais défiler et choisis <strong>« Sur l&apos;écran d&apos;accueil »</strong>.
        </li>
        <li>
          Confirme avec <strong>Ajouter</strong>. Cosme Check apparaît comme une
          app sur ton écran d&apos;accueil.
        </li>
      </ol>
    );
  }
  if (platform === "android-chrome") {
    return (
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          Ouvre le menu <strong>⋮</strong> en haut à droite de Chrome.
        </li>
        <li>
          Touche <strong>« Installer l&apos;application »</strong> (ou
          <em> Ajouter à l&apos;écran d&apos;accueil</em>).
        </li>
        <li>Confirme. L&apos;app s&apos;ouvre ensuite en plein écran.</li>
        <li className="text-ink-subtle">
          Si tu ne vois pas l&apos;option, l&apos;app est peut-être déjà
          installée, ou tu l&apos;as refusée récemment - réessaie dans quelques
          jours ou désinstalle-la d&apos;abord.
        </li>
      </ol>
    );
  }
  if (platform === "desktop-chromium") {
    return (
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          Clique sur l&apos;icône <strong>Installer</strong> (un écran avec une
          flèche) à droite de la barre d&apos;adresse.
        </li>
        <li>
          Sinon, ouvre le menu <strong>⋮</strong> → <strong>Installer Cosme Check…</strong>
        </li>
        <li>Valide la fenêtre. L&apos;app se lance comme un logiciel à part.</li>
      </ol>
    );
  }
  if (platform === "firefox") {
    return (
      <p>
        Firefox ne propose pas l&apos;installation de PWA sur cette plateforme.
        Tu peux ajouter le site à tes favoris ou ouvrir Cosme Check dans Chrome /
        Edge / Safari pour l&apos;installer.
      </p>
    );
  }
  return (
    <p>
      Ton navigateur ne propose pas d&apos;installation automatique. Sur mobile,
      cherche <em>« Ajouter à l&apos;écran d&apos;accueil »</em> dans le menu du
      navigateur. Sur desktop, ouvre le site dans Chrome ou Edge.
    </p>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
      <path d="M5 21h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
