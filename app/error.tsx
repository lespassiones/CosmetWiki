"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Per-segment error boundary. Triggered when a server/client component throws
 * inside the app/ tree. Stays inside the existing AppShell so the user can
 * navigate back via the bottom nav.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to Vercel Runtime Logs at least - getting it into our error_log
    // table from the client side requires a separate API hop, which the
    // global-error.tsx variant handles.
    console.error("[app/error] caught:", error.message, error.digest);
  }, [error]);

  return (
    <main className="min-h-svh flex items-center justify-center px-5 py-10 bg-[#FAFAFA]">
      <section className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-8 shadow-[0_8px_24px_-12px_rgba(17,17,17,0.08)] text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 ring-1 ring-rose-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6 text-rose-500">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="text-[22px] font-bold tracking-tight">
          Quelque chose a coincé
        </h1>
        <p className="mt-3 text-sm text-[#6B7280]">
          On a rencontré une erreur inattendue. Tu peux réessayer, ou revenir à l&apos;accueil.
        </p>

        {error.digest && (
          <p className="mt-3 text-[11px] font-mono text-[#9CA3AF]">
            Réf : {error.digest}
          </p>
        )}

        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-xl bg-[#111111] text-white text-sm font-semibold py-3 hover:brightness-110 transition"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="block w-full rounded-xl bg-white py-3 text-center text-sm font-medium text-[#6B7280] hover:text-[#111111] transition"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </section>
    </main>
  );
}
