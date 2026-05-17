"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/app/auth/actions";
import { PasswordRequirements, isPasswordValid } from "./PasswordRequirements";

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showPwd, setShowPwd] = useState(false);
  const [password, setPassword] = useState("");
  const [pwdFocus, setPwdFocus] = useState(false);
  const [success, setSuccess] = useState(false);
  const showChecklist = pwdFocus || password.length > 0;
  const canSubmit = isPasswordValid(password) && !pending;

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800">
          Ton mot de passe a bien été mis à jour. Tu peux maintenant te reconnecter.
        </div>
        <button
          type="button"
          onClick={() => router.push("/auth/sign-in")}
          className="w-full rounded-xl bg-[#111111] text-white text-sm font-semibold py-3 hover:brightness-110 transition"
        >
          Aller à la connexion
        </button>
      </div>
    );
  }

  return (
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const r = await updatePassword(fd);
          if (!r.ok) {
            setError(r.error);
            return;
          }
          setSuccess(true);
        });
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="text-xs font-medium text-[#6B7280] mb-1.5 block">Nouveau mot de passe</span>
        <div className="relative">
          <input
            name="password"
            type={showPwd ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPwdFocus(true)}
            onBlur={() => setPwdFocus(false)}
            className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
          />
          <button
            type="button"
            aria-label={showPwd ? "Masquer" : "Afficher"}
            onClick={() => setShowPwd((s) => !s)}
            className="absolute inset-y-0 right-2 my-auto h-fit text-xs text-[#6B7280] hover:text-black px-2 py-1"
          >
            {showPwd ? "Masquer" : "Afficher"}
          </button>
        </div>
      </label>

      {showChecklist && <PasswordRequirements password={password} />}

      {error && (
        <p role="alert" className="text-sm text-[#E11D48] bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-xl bg-[#111111] text-white text-sm font-semibold py-3 hover:brightness-110 transition disabled:opacity-50"
      >
        {pending ? "Mise à jour…" : "Mettre à jour le mot de passe"}
      </button>
    </form>
  );
}
