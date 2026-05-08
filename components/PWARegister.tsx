"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Register in both dev and prod : Chrome's installability check needs an
    // active service worker, and developers need to be able to verify the
    // install flow with `npm run dev`. The SW itself is network-first for
    // navigations so HMR keeps working.
    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.info(
              "[PWA] service worker registered (scope:",
              reg.scope,
              "). To test install, open DevTools → Application → Manifest.",
            );
          }
        })
        .catch(() => {
          /* SW registration failures are non-blocking. */
        });
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
