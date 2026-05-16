"use client";

import { useState, useTransition } from "react";
import { signIn } from "@/app/auth/actions";
import { AuthDivider, GoogleAuthButton } from "./GoogleAuthButton";

export function SignInForm({ next = "/" }: { next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div>
      <GoogleAuthButton next={next} label="Se connecter avec Google" />
      <AuthDivider />
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const r = await signIn(fd);
          if (!r.ok) setError(r.error);
        });
      }}
      className="space-y-4"
    >
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="text-xs font-medium text-[#6B7280] mb-1.5 block">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-[#6B7280] mb-1.5 block">Mot de passe</span>
        <div className="relative">
          <input
            name="password"
            type={showPwd ? "text" : "password"}
            required
            autoComplete="current-password"
            className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            aria-label={showPwd ? "Masquer" : "Afficher"}
            className="absolute inset-y-0 right-2 my-auto h-fit text-xs text-[#6B7280] hover:text-black px-2 py-1"
          >
            {showPwd ? "Masquer" : "Afficher"}
          </button>
        </div>
      </label>

      {error && (
        <p role="alert" className="text-sm text-[#E11D48] bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[#111111] text-white text-sm font-semibold py-3 hover:brightness-110 transition disabled:opacity-50"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
    </div>
  );
}
