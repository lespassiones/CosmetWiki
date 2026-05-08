"use client";

import { useEffect, useState } from "react";

// Chrome's standard installability event. The browser fires it once the
// PWA criteria are met (manifest + service worker + 192/512 icons +
// HTTPS). We capture it so the user can trigger the prompt from a button
// instead of waiting for Chrome's address-bar icon.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPWAButton({ className = "" }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Hide the button if the app is already running standalone (already installed).
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari heuristic — `navigator.standalone` exists only on iOS.
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !deferred) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await deferred.prompt();
          await deferred.userChoice;
        } finally {
          setDeferred(null);
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-rose-400 to-pink-400 px-3 py-1.5 text-[13px] font-semibold text-white shadow-[0_4px_14px_-4px_rgba(251,113,133,0.55),inset_0_1px_0_0_rgba(255,255,255,0.30)] transition-all hover:from-rose-500 hover:to-pink-500 ${className}`}
      aria-label="Installer l'application"
    >
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
      Installer l&apos;app
    </button>
  );
}
