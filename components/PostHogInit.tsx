"use client";

/**
 * Initialise PostHog côté navigateur en mode MESURE D'AUDIENCE ANONYME
 * (exempté de consentement CNIL, zéro bannière) :
 *   - PAS de session replay,
 *   - PAS d'autocapture des clics,
 *   - PAS d'identité nominative (aucun email/nom envoyé, pas d'identify),
 *   - persistance en localStorage uniquement (aucun cookie de pistage).
 *
 * On conserve la capture d'événements ANONYMES (pageviews, events produit)
 * sous base légale « intérêt légitime ».
 *
 * Monté une fois dans app/layout.tsx. Ne rend rien.
 */

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

let initialized = false;

export function PostHogInit() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Init unique.
  useEffect(() => {
    if (initialized || !KEY) return;
    initialized = true;
    posthog.init(KEY, {
      api_host: HOST,
      // Pageview manuel (App Router ne recharge pas la page en navigation SPA).
      capture_pageview: false,
      capture_pageleave: true,
      // Mesure d'audience anonyme : pas de cookie, pas de replay, pas
      // d'autocapture → exempté de consentement (CNIL).
      persistence: "localStorage",
      disable_session_recording: true,
      autocapture: false,
    });
    posthog.register({ platform: "web" });
    // NB : aucun posthog.identify(). Le distinct_id reste anonyme côté
    // navigateur. Les événements produit (signup, scan…) partent du serveur
    // avec l'ID technique Supabase (lib/posthogServer.ts), sans email/nom.
  }, []);

  // Pageview à chaque navigation.
  useEffect(() => {
    if (!KEY || !initialized) return;
    const url = window.origin + pathname + (searchParams?.size ? `?${searchParams}` : "");
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}
