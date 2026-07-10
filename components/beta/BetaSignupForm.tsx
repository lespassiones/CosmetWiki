"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinBeta } from "@/app/beta/actions";

export function BetaSignupForm({ source }: { source?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [consent, setConsent] = useState(false);

  return (
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const r = await joinBeta(fd);
          if (!r.ok) {
            setError(r.error);
            return;
          }
          router.push("/beta/merci");
        });
      }}
      className="space-y-4"
    >
      {/* Honeypot anti-bot : caché aux humains, rempli par les bots. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      {/* Canal de recrutement (transmis par l'URL ?src=…). */}
      {source ? <input type="hidden" name="source" value={source} /> : null}

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[#6B7280]">Prénom</span>
          <input
            name="first_name"
            type="text"
            autoComplete="given-name"
            className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[#6B7280]">Nom</span>
          <input
            name="last_name"
            type="text"
            autoComplete="family-name"
            className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-[#6B7280]">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
        />
      </label>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name="consent"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D1D5DB] accent-[#111111]"
        />
        <span className="text-[12px] leading-4 text-[#6B7280]">
          J&apos;accepte que mon adresse email soit utilisée pour être contacté
          afin de tester l&apos;application Cosme Check (accès, retours et
          relances), conformément à la{" "}
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
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-[#E11D48]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !consent}
        className="w-full rounded-xl bg-[#111111] py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Envoi…" : "Rejoindre la bêta"}
      </button>
    </form>
  );
}
