"use client";

/**
 * Initialise PostHog côté navigateur en mode SUIVI COMPLET (web uniquement) :
 *   - session replay (enregistrement des sessions, live),
 *   - autocapture des clics + heatmaps,
 *   - identité nominative (identify) des utilisateurs connectés,
 *   - persistance localStorage + cookie.
 *
 * Les champs de saisie sont MASQUÉS dans les enregistrements
 * (session_recording.maskAllInputs) : on voit la navigation et les clics, mais
 * pas le contenu tapé (protège les données de peau/allergies). On voit aussi
 * bien les visiteurs ANONYMES que connectés (person_profiles: 'always').
 *
 * ⚠️ RGPD : le session replay + les heatmaps ne sont PAS exemptés de
 * consentement (CNIL). Pour être conforme, ce composant doit être déclenché
 * APRÈS acceptation d'un bandeau cookies (à ajouter). En l'état, il capture dès
 * le chargement — décision produit assumée, à mettre derrière un consentement.
 *
 * Monté une fois dans app/layout.tsx. Ne rend rien.
 */

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { supabaseBrowser } from "@/lib/supabase";

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
      // Suivi complet.
      persistence: "localStorage+cookie",
      autocapture: true,
      capture_heatmaps: true,
      disable_session_recording: false,
      session_recording: {
        // Masque le CONTENU des champs de saisie dans les enregistrements
        // (données de peau/allergies) — la navigation reste visible.
        maskAllInputs: true,
      },
      // Capture aussi les visiteurs anonymes (pas seulement les connectés).
      person_profiles: "always",
    });
    posthog.register({ platform: "web" });

    // Identité : relie la session à l'utilisateur connecté (et met à jour au
    // login / logout) pour retrouver « qui » dans les enregistrements.
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data }) => {
      if (data.user) posthog.identify(data.user.id, { email: data.user.email });
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) posthog.identify(session.user.id, { email: session.user.email });
      else posthog.reset();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Pageview à chaque navigation.
  useEffect(() => {
    if (!KEY || !initialized) return;
    const url = window.origin + pathname + (searchParams?.size ? `?${searchParams}` : "");
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}
