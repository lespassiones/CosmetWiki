"use client";

import { useState, useTransition } from "react";

type Explanation = {
  text: string;
  personalLine: string | null;
  cached: boolean;
};

export function ExplainIngredient({ slug }: { slug: string }) {
  const [data, setData] = useState<Explanation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function load() {
    setError(null);
    startTransition(async () => {
      try {
        const r = await fetch(`/api/ingredient/${encodeURIComponent(slug)}/explain`, {
          method: "POST",
        });
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          setError(j.error ?? "Erreur");
          return;
        }
        const j = (await r.json()) as Explanation;
        setData(j);
      } catch {
        setError("Connexion indisponible.");
      }
    });
  }

  if (data) {
    const lines = data.text.split("\n").filter((l) => l.trim().length > 0);
    return (
      <section className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-5">
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
        {data.personalLine && (
          <div className="mt-4 rounded-xl bg-[#FFF1F2] px-3 py-2.5 text-[13px] text-[#9F1239]">
            <span aria-hidden className="mr-1.5">🧴</span>
            {data.personalLine}
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
        className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-medium hover:border-[#111111] transition disabled:opacity-60"
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
