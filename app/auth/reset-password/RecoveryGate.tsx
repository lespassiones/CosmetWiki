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

  if (state === "expired") {
    return (
      <div className="space-y-4">
        <p className="text-center text-sm text-[#6B7280]">
          Ce lien a expiré ou n&apos;est plus valide. Demande un nouveau lien.
        </p>
        <a
          href="/auth/forgot-password"
          className="block w-full text-center rounded-xl bg-[#111111] text-white text-sm font-semibold py-3 hover:brightness-110 transition"
        >
          Demander un nouveau lien
        </a>
        <p className="text-center text-sm text-[#6B7280]">
          <a href="/auth/sign-in" className="text-[#F43F5E] font-medium hover:underline">
            Retour à la connexion
          </a>
        </p>
      </div>
    );
  }

  return <ResetPasswordForm />;
}
