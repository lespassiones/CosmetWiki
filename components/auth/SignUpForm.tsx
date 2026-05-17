"use client";

import { useState, useTransition } from "react";
import { signUp } from "@/app/auth/actions";
import { AuthDivider, GoogleAuthButton } from "./GoogleAuthButton";
import { PasswordRequirements } from "./PasswordRequirements";

export function SignUpForm({ next = "/" }: { next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showPwd, setShowPwd] = useState(false);
  const [password, setPassword] = useState("");
  const [pwdFocus, setPwdFocus] = useState(false);
  const showChecklist = pwdFocus || password.length > 0;

  return (
    <div>
      <GoogleAuthButton next={next} label="S'inscrire avec Google" />
      <AuthDivider />
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const r = await signUp(fd);
          if (!r.ok) setError(r.error);
        });
      }}
      className="space-y-4"
    >
      <input type="hidden" name="next" value={next} />
      <Field name="first_name" label="Prénom" type="text" autoComplete="given-name" required />
      <Field name="email" label="Email" type="email" autoComplete="email" required />
      <Field
        name="password"
        label="Mot de passe"
        type={showPwd ? "text" : "password"}
        autoComplete="new-password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onFocus={() => setPwdFocus(true)}
        onBlur={() => setPwdFocus(false)}
        right={
          <button
            type="button"
            aria-label={showPwd ? "Masquer" : "Afficher"}
            onClick={() => setShowPwd((s) => !s)}
            className="text-xs text-[#6B7280] hover:text-black px-2 py-1"
          >
            {showPwd ? "Masquer" : "Afficher"}
          </button>
        }
      />

      {showChecklist && <PasswordRequirements password={password} />}

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
        {pending ? "Création…" : "Créer mon compte"}
      </button>

      <p className="text-[11px] leading-4 text-[#9CA3AF] text-center">
        En continuant tu acceptes nos CGU et notre politique de confidentialité.
      </p>
    </form>
    </div>
  );
}

function Field({
  name,
  label,
  type,
  required,
  minLength,
  autoComplete,
  right,
  value,
  onChange,
  onFocus,
  onBlur,
}: {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  right?: React.ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[#6B7280] mb-1.5 block">{label}</span>
      <div className="relative">
        <input
          name={name}
          type={type}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
        />
        {right && <div className="absolute inset-y-0 right-2 flex items-center">{right}</div>}
      </div>
    </label>
  );
}

