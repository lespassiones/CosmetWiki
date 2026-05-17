"use client";

import { useEffect, useState, useCallback } from "react";

type CreditsState = { used: number; limit: number; remaining: number } | null;

/**
 * Tiny chip showing "Crédits : 87/100" — fetches /api/credits on mount, on
 * tab focus, and whenever a `cosmecheck:credits-updated` event fires (dispatched
 * by API call sites after a 200 or after a 429 with credits payload).
 *
 * Renders nothing if the user isn't signed in (401 from the endpoint).
 */
export function CreditsPill({ className = "" }: { className?: string }) {
  const [credits, setCredits] = useState<CreditsState>(null);
  const [hidden, setHidden] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/credits", { cache: "no-store" });
      if (r.status === 401) {
        setHidden(true);
        return;
      }
      if (!r.ok) return;
      const data = await r.json();
      if (data && data.ok && typeof data.remaining === "number") {
        setCredits({ used: data.used, limit: data.limit, remaining: data.remaining });
      }
    } catch {
      // ignore — pill stays in last known state
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    const onUpdate = () => void refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("cosmecheck:credits-updated", onUpdate as EventListener);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("cosmecheck:credits-updated", onUpdate as EventListener);
    };
  }, [refresh]);

  if (hidden || !credits) return null;

  const { used, limit, remaining } = credits;
  const ratio = limit > 0 ? remaining / limit : 0;
  // Color tiers — green > 30%, amber 10-30%, red < 10%
  const tone =
    ratio > 0.3
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
      : ratio > 0.1
        ? "bg-amber-50 text-amber-700 ring-amber-200/60"
        : "bg-rose-50 text-rose-700 ring-rose-200/60";

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${tone} ${className}`}
      title={`${used} crédits utilisés sur ${limit} aujourd'hui`}
      aria-label={`${remaining} crédits restants sur ${limit}`}
    >
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3 w-3 opacity-80"
      >
        <path d="M10 2a1 1 0 011 1v1.07A6.002 6.002 0 0116 10c0 .55-.075 1.083-.215 1.59l.927.539a1 1 0 11-1.004 1.728l-.93-.541A6.002 6.002 0 0111 15.93V17a1 1 0 11-2 0v-1.07A6.002 6.002 0 014 10c0-.55.075-1.083.215-1.59l-.927-.539a1 1 0 111.004-1.728l.93.541A6.002 6.002 0 019 4.07V3a1 1 0 011-1zm0 4a4 4 0 100 8 4 4 0 000-8z" />
      </svg>
      <span className="tabular-nums">
        {remaining}<span className="opacity-60">/{limit}</span>
      </span>
    </div>
  );
}
