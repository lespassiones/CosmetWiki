"use client";

/**
 * RecoveryGate — débloque le formulaire de réinitialisation quel que soit le
 * canal d'origine du lien de l'email :
 *
 *   - Web (flux PKCE) : /auth/callback a déjà posé la session en cookie →
 *     `hasServerSession` est vrai → on affiche le formulaire directement.
 *   - Mobile (flux implicite) : le lien renvoie ici avec les jetons dans le
 *     FRAGMENT d'URL (#access_token=…&type=recovery). Le serveur ne voit pas le
 *     fragment, donc on le lit côté client, on pose la session via le client
 *     navigateur (écrit les cookies), puis on affiche le formulaire. La server
 *     action `updatePassword` verra alors la session.
 *
 * Ainsi le reset mobile n'a plus besoin de deep link : le mail ouvre cette page
 * web, l'utilisateur change son mot de passe, puis revient se connecter dans l'app.
 */
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { DownloadAppButton } from "@/components/download/DownloadAppButton";

type State = "checking" | "ready" | "expired";

export function RecoveryGate({ hasServerSession }: { hasServerSession: boolean }) {
  const [state, setState] = useState<State>(hasServerSession ? "ready" : "checking");

  useEffect(() => {
    if (hasServerSession) return;

    const raw = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    const params = new URLSearchParams(raw);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (type !== "recovery" || !accessToken || !refreshToken) {
      setState("expired");
      return;
    }

    supabaseBrowser()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        // On retire les jetons de l'URL (ne pas les laisser traîner dans l'historique).
        window.history.replaceState(null, "", window.location.pathname);
        setState(error ? "expired" : "ready");
      })
      .catch(() => setState("expired"));
  }, [hasServerSession]);

  if (state === "checking") {
    return (
      <p className="text-center text-sm text-[#6B7280]" role="status">
        Vérification du lien…
      </p>
    );
  }

  // Lien expiré : on ne renvoie plus vers `/auth/forgot-password`, cette page a
  // été retirée avec la connexion web. La demande d'un nouveau lien se fait
  // dans l'application, écran de connexion, « Mot de passe oublié ».
  if (state === "expired") {
    return (
      <div className="space-y-4">
        <p className="text-center text-sm text-[#6B7280]">
          Ce lien a expiré ou n&apos;est plus valide. Ouvre l&apos;application
          Cosme Check, puis « Mot de passe oublié » sur l&apos;écran de
          connexion, pour recevoir un nouveau lien.
        </p>
        <DownloadAppButton
          campaign="reset_expire"
          modalTitle="Ouvre l'application Cosme Check"
          modalSubtitle="La demande d'un nouveau lien de réinitialisation se fait depuis l'écran de connexion de l'application."
          className="block w-full rounded-xl bg-[#111111] py-3 text-center text-sm font-semibold text-white transition hover:brightness-110"
        >
          Ouvrir l&apos;application
        </DownloadAppButton>
      </div>
    );
  }

  return <ResetPasswordForm />;
}
