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
  // Consentements : marketing = opt-in optionnel (décoché par défaut, RGPD) ;
  // CGU = obligatoire (bloque la soumission tant qu'elle n'est pas cochée).
  const [acceptCgu, setAcceptCgu] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);

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

      {/* Consentements — marketing (optionnel) en haut, CGU (obligatoire) en bas */}
      <div className="space-y-2.5 pt-1">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="accept_marketing"
            checked={acceptMarketing}
            onChange={(e) => setAcceptMarketing(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D1D5DB] accent-[#111111]"
          />
          <span className="text-[12px] leading-4 text-[#6B7280]">
            J&apos;accepte de recevoir les actualités, offres et newsletters de
            Cosme Check par email.{" "}
            <span className="text-[#9CA3AF]">(optionnel)</span>
          </span>
        </label>

        <div className="flex items-start gap-3">
          <input
            id="accept_cgu"
            type="checkbox"
            name="accept_cgu"
            required
            checked={acceptCgu}
            onChange={(e) => setAcceptCgu(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D1D5DB] accent-[#111111]"
          />
          <label htmlFor="accept_cgu" className="cursor-pointer text-[12px] leading-4 text-[#6B7280]">
            J&apos;accepte les{" "}
            <a
              href="/cgu"
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-[#111111] underline underline-offset-2"
            >
              conditions d&apos;utilisation
            </a>{" "}
            et la{" "}
            <a
              href="/confidentialite"
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-[#111111] underline underline-offset-2"
            >
              politique de confidentialité
            </a>
            .
          </label>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-[#E11D48] bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !acceptCgu}
        className="w-full rounded-xl bg-[#111111] text-white text-sm font-semibold py-3 hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Création…" : "Créer mon compte"}
      </button>
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

