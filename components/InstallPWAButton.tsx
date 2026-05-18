"use client";

import { useEffect, useState } from "react";

// Chrome's standard installability event. Fires once the PWA criteria are met
// (manifest + service worker + 192/512 icons + HTTPS) AND the user hasn't
// already installed/dismissed too recently. Captured globally so both the
// header button and the burger-menu entry share the same prompt instance -
// otherwise the second one would call prompt() on a used event and throw.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let cachedPrompt: BeforeInstallPromptEvent | null = null;
let promptListenersAttached = false;
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((fn) => fn());
}

function ensureListeners() {
  if (promptListenersAttached || typeof window === "undefined") return;
  promptListenersAttached = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    cachedPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    cachedPrompt = null;
    notify();
  });
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function usePWAInstall() {
  const [, force] = useState(0);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    ensureListeners();
    setStandalone(isStandalone());
    const sub = () => force((n) => n + 1);
    subscribers.add(sub);
    const onInstalled = () => setStandalone(true);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      subscribers.delete(sub);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptNative = async (): Promise<boolean> => {
    if (!cachedPrompt) return false;
    try {
      await cachedPrompt.prompt();
      await cachedPrompt.userChoice;
      cachedPrompt = null;
      notify();
      return true;
    } catch {
      // Event was already used or browser blocked it - fall back to manual
      // instructions.
      cachedPrompt = null;
      notify();
      return false;
    }
  };

  return {
    installed: standalone,
    canPromptNative: cachedPrompt !== null,
    promptNative,
  };
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
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0"
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
