"use client";

import { useState, useTransition } from "react";
import { GLASS_CARD, GLASS_CARD_ROSE, GLASS_PILL } from "@/lib/ui/glass";

type Explanation = {
  text: string;
  cached: boolean;
  // Always null on this endpoint (CDN-cached, can't be per-user).
  personalLine?: string | null;
};

type Exposure = {
  personalLine: string | null;
};

export function ExplainIngredient({ slug }: { slug: string }) {
  const [data, setData] = useState<Explanation | null>(null);
  // Filled in parallel with `data`. Stays null for anonymous visitors or
  // for users with no matching routine/history entries.
  const [personalLine, setPersonalLine] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function load() {
    setError(null);
    startTransition(async () => {
      try {
        // Fire BOTH calls in parallel:
        //   - /explain is CDN-cached at Vercel Edge (fast, public).
        //   - /exposure is per-user, uncached, returns the personal callout.
        // The page shows the explanation as soon as it arrives; the rose
        // "🧴 Tu as cet ingrédient dans X produits…" callout pops in when
        // /exposure resolves (~50 ms after /explain in steady state).
        const [explainRes, exposureRes] = await Promise.all([
          fetch(`/api/ingredient/${encodeURIComponent(slug)}/explain`),
          fetch(`/api/ingredient/${encodeURIComponent(slug)}/exposure`).catch(() => null),
        ]);
        if (!explainRes.ok) {
          const j = (await explainRes.json().catch(() => ({}))) as { error?: string };
          setError(j.error ?? "Erreur");
          return;
        }
        const j = (await explainRes.json()) as Explanation;
        setData(j);

        if (exposureRes && exposureRes.ok) {
          try {
            const e = (await exposureRes.json()) as Exposure;
            setPersonalLine(e.personalLine);
          } catch {
            // ignore - keep personalLine null
          }
        }
      } catch {
        setError("Connexion indisponible.");
      }
    });
  }

  if (data) {
    const lines = data.text.split("\n").filter((l) => l.trim().length > 0);
    return (
      <section className={`${GLASS_CARD} mt-6 p-5`}>
        <div className="flex items-center gap-2 mb-3">
          <span aria-hidden className="text-base">✨</span>
          <h3 className="text-[14px] font-semibold">Expliqué simplement</h3>
          {data.cached && (
            <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">depuis cache</span>
          )}
        </div>
        <div className="space-y-2 text-[14px] leading-relaxed text-[#111111]">
          {lines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
        {personalLine && (
          <div className={`${GLASS_CARD_ROSE} mt-4 px-3 py-2.5 text-[13px] text-[#9F1239]`}>
            <span aria-hidden className="mr-1.5">🧴</span>
            {personalLine}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="mt-6">
      <button
        type="button"
        onClick={load}
        disabled={pending}
        className={`${GLASS_PILL} inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium disabled:opacity-60`}
      >
        <span aria-hidden>✨</span>
        {pending ? "Génération…" : "Expliquer simplement"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-[12px] text-[#E11D48]">{error}</p>
      )}
    </section>
  );
}
