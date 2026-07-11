"use client";

/**
 * Initialise PostHog côté navigateur : pageviews SPA (App Router), session
 * replay (activé côté projet), autocapture des clics, et IDENTITÉ (le
 * distinct_id devient le user id Supabase dès la connexion, pour recoller
 * navigation anonyme et événements serveur).
 *
 * Monté une fois dans app/layout.tsx. Ne rend rien.
 */

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
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
      persistence: "localStorage+cookie",
    });
    posthog.register({ platform: "web" });

    // Identité : recolle la session Supabase au profil PostHog.
    const sb = supabaseBrowser();
    void sb.auth.getUser().then(({ data }: { data: { user: { id: string; email?: string } | null } }) => {
      if (data.user) posthog.identify(data.user.id, { email: data.user.email });
    });
    const { data: sub } = sb.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === "SIGNED_IN" && session?.user) {
        posthog.identify(session.user.id, { email: session.user.email });
      } else if (event === "SIGNED_OUT") {
        posthog.reset();
      }
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
