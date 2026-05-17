"use client";

export type PasswordChecks = {
  length: boolean;
  lower: boolean;
  upper: boolean;
  digit: boolean;
};

export function computePasswordChecks(password: string): PasswordChecks {
  return {
    length: password.length >= 8,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    digit: /[0-9]/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const c = computePasswordChecks(password);
  return c.length && c.lower && c.upper && c.digit;
}

export function PasswordRequirements({ password }: { password: string }) {
  const checks = computePasswordChecks(password);
  return (
    <ul className="-mt-2 space-y-1 rounded-xl bg-[#F9FAFB] px-3 py-2 text-[12px]">
      <Requirement ok={checks.length}>Au moins 8 caractères</Requirement>
      <Requirement ok={checks.lower}>Au moins une minuscule (a–z)</Requirement>
      <Requirement ok={checks.upper}>Au moins une majuscule (A–Z)</Requirement>
      <Requirement ok={checks.digit}>Au moins un chiffre (0–9)</Requirement>
    </ul>
  );
}

function Requirement({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li
      className={`flex items-center gap-2 transition-colors ${
        ok ? "text-emerald-600" : "text-[#9CA3AF]"
      }`}
      aria-live="polite"
    >
      <span aria-hidden className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
        {ok ? (
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path
              fillRule="evenodd"
              d="M16.704 5.296a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 111.414-1.414L8.5 12.086l6.793-6.79a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
        )}
      </span>
      <span>{children}</span>
    </li>
  );
}
