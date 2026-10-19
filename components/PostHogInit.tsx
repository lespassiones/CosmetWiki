"use client";

/**
 * Initialise PostHog côté navigateur, en deux modes selon le consentement.
 *
 * **Sans consentement (aujourd'hui, tout le monde : le site n'a pas de
 * bandeau)** : mesure d'audience sans cookie (`cookieless_mode: 'always'`).
 * Rien n'est écrit dans le navigateur, pas de session replay, pas de carte de
 * chaleur, pas de profil, pas d'identité. C'est ce que promet la politique de
 * confidentialité (section 9), et c'est ce qui fait tourner la mesure des
 * articles du blog (`lib/mesure.ts`) sans rien demander au visiteur.
 *
 * **Avec consentement** (`enregistrerConsentementMesure('accepte')`, à
 * brancher sur un futur bandeau) : le suivi complet d'avant le 19/10/2026,
 * session replay avec saisies MASQUÉES, autocapture, cartes de chaleur,
 * persistance localStorage + cookie, identité de l'utilisateur connecté.
 *
 * ⚠️ RGPD : le replay et les cartes de chaleur ne sont PAS exemptés de
 * consentement (CNIL). Jusqu'au 19/10/2026 ils tournaient dès le chargement,
 * en contradiction avec la politique publiée ; ils attendent désormais le
 * consentement.
 *
 * Monté une fois dans app/layout.tsx. Ne rend rien.
 */

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { supabaseBrowser } from "@/lib/supabase";
import { consentementMesure } from "@/lib/mesure";

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

    const complet = consentementMesure() === "accepte";

    const commun = {
      api_host: HOST,
      ui_host: "https://eu.posthog.com",
      // Pageview manuel (App Router ne recharge pas la page en navigation SPA).
      capture_pageview: false,
      // La sortie de page porte la profondeur de défilement maximale : c'est
      // elle qui dit au robot du blog où les lecteurs s'arrêtent.
      capture_pageleave: true,
      autocapture: true,
    } as const;

    posthog.init(
      KEY,
      complet
        ? {
            ...commun,
            // Suivi complet, consenti.
            persistence: "localStorage+cookie",
            capture_heatmaps: true,
            disable_session_recording: false,
            session_recording: {
              // Masque le CONTENU des champs de saisie dans les enregistrements
              // (données de peau/allergies), la navigation reste visible.
              maskAllInputs: true,
            },
            person_profiles: "always",
          }
        : {
            ...commun,
            // Sans consentement : aucun stockage dans le navigateur. Le projet
            // PostHog doit avoir le « Cookieless server hash mode » actif.
            cookieless_mode: "always",
            capture_heatmaps: false,
            disable_session_recording: true,
            person_profiles: "identified_only",
          },
    );
    posthog.register({ platform: "web" });

    // L'identité n'est envoyée qu'avec le consentement : sans lui, aucune
    // visite n'est reliée à une personne.
    if (!complet) return;

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
