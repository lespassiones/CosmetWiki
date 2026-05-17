"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type CreditsState = { used: number; limit: number; remaining: number } | null;

/**
 * Gold-coin styled credits pill — fetches /api/credits on mount, on tab focus,
 * and whenever a `cosmecheck:credits-updated` event fires (dispatched by the
 * apiFetch wrapper after a credit-consuming call).
 *
 * Renders nothing if the user isn't signed in (401 from the endpoint).
 *
 * Layout: [🪙 1390] [+] — the "+" links to /offre for the Premium upsell.
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
  // Number tint dims to a rose tone when remaining < 10% so the user notices.
  const ratio = limit > 0 ? remaining / limit : 0;
  const numberTone = ratio < 0.1 ? "text-rose-200" : "text-amber-50";

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-zinc-800 to-black pl-1.5 pr-1 py-1 ring-1 ring-amber-400/30 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] ${className}`}
      title={`${used} crédits utilisés sur ${limit} aujourd'hui`}
      aria-label={`${remaining} crédits restants sur ${limit}`}
    >
      {/* Gold coin */}
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" aria-hidden>
        <defs>
          <radialGradient id="cw-coin-grad" cx="35%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="35%" stopColor="#fcd34d" />
            <stop offset="75%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
        </defs>
        <circle cx="12" cy="12" r="10" fill="url(#cw-coin-grad)" />
        <circle
          cx="12"
          cy="12"
          r="7.5"
          fill="none"
          stroke="#fde68a"
          strokeWidth="0.8"
          opacity="0.65"
        />
        <text
          x="12"
          y="15.5"
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="800"
          fill="#7c2d12"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          C
        </text>
      </svg>

      {/* Count */}
      <span
        className={`text-[12px] font-semibold tabular-nums leading-none ${numberTone}`}
      >
        {remaining}
      </span>

      {/* + button → upsell */}
      <Link
        href="/offre"
        aria-label="Obtenir plus de crédits"
        className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 font-bold text-[15px] leading-none ring-1 ring-amber-200/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] hover:brightness-110 active:scale-95 transition"
      >
        +
      </Link>
    </div>
  );
}
