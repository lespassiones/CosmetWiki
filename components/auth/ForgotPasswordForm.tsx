"use client";

import { useState, useTransition } from "react";
import { requestPasswordReset } from "@/app/auth/actions";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (sentTo) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800">
          Si un compte existe pour <strong>{sentTo}</strong>, un email avec un lien de réinitialisation vient d&apos;être envoyé. Vérifie aussi tes spams.
        </div>
        <p className="text-xs text-[#6B7280] text-center">
          Le lien est valable 1 heure.
        </p>
      </div>
    );
  }

  return (
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const email = String(fd.get("email") ?? "").trim().toLowerCase();
          const r = await requestPasswordReset(fd);
          if (!r.ok) {
            setError(r.error);
            return;
          }
          setSentTo(email);
        });
      }}
      className="space-y-4"
    >
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
        {pending ? "Envoi…" : "Envoyer le lien"}
      </button>
    </form>
  );
}
