"use client";

import { useState, useTransition } from "react";
import type { RoutineMetrics, RoutineProduct } from "@/lib/routine/engine";

type Suggestion = {
  text: string;
  impact?: { from: number; to: number; delta: number; productName?: string | null };
};

function renderBold(text: string) {
  // Replace markdown **bold** with <strong> while keeping it safe (text-only).
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>,
  );
}

export function RoutineSuggestions({
  metrics,
  products,
}: {
  metrics: RoutineMetrics;
  products: RoutineProduct[];
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Avoid the unused warning - these props are reserved for future client-side
  // recomputation (e.g. live preview when toggling products).
  void metrics; void products;

  function load() {
    setError(null);
    startTransition(async () => {
      try {
        const r = await fetch("/api/routine/suggest", { method: "POST" });
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          setError(j.error ?? "Erreur");
          return;
        }
        const j = (await r.json()) as { suggestions: Suggestion[]; cached: boolean };
        setSuggestions(j.suggestions);
      } catch {
        setError("Connexion indisponible.");
      }
    });
  }

  if (suggestions === null) {
    return (
      <section className="neu p-5 mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-[15px] font-semibold flex items-center gap-2">
              <span aria-hidden>💡</span>
              Conseils pour ta routine
            </h2>
            <p className="text-[12px] text-[#374151] mt-1">
              Idées concrètes pour réduire ton exposition cumulée, basées sur ta routine actuelle.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={pending}
            className="neu-shadow inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#1F2937] via-[#111111] to-[#0A0A0A] text-white text-sm font-semibold px-4 py-2.5 hover:brightness-110 transition disabled:opacity-50"
          >
            {pending ? "Génération…" : "Générer"}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-[12px] text-[#E11D48]">{error}</p>
        )}
      </section>
    );
  }

  return (
    <section className="neu p-5 mb-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-[15px] font-semibold flex items-center gap-2">
          <span aria-hidden>💡</span>
          Conseils pour ta routine
        </h2>
        <button
          type="button"
          onClick={load}
          disabled={pending}
          className="text-[11px] text-[#6B7280] hover:text-black"
          aria-label="Régénérer"
        >
          {pending ? "…" : "Régénérer"}
        </button>
      </div>
      {suggestions.length === 0 ? (
        <p className="text-[13px] text-[#6B7280]">
          Aucune suggestion : ta routine semble déjà optimisée.
        </p>
      ) : (
        <ul className="space-y-3">
          {suggestions.map((s, i) => (
            <li key={i} className="rounded-xl bg-[#FAFAFA] p-3">
              <p className="text-[14px] leading-relaxed text-[#111111]">{renderBold(s.text)}</p>
              {s.impact && (
                <div className="mt-2 inline-flex items-center gap-2 text-[12px] rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                  Note routine : <span className="font-bold">{s.impact.from}</span>
                  {" → "}
                  <span className="font-bold">{s.impact.to}</span>
                  {" "}({s.impact.delta > 0 ? "+" : ""}{s.impact.delta})
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
