"use client";

import { useEffect, useState } from "react";
import { GLASS_CARD } from "@/lib/ui/glass";

type Insights = {
  portraitA: string;
  portraitB: string;
  common: string;
  howToChoose: string;
};

/**
 * Renders the AI-generated comparison narrative (two portraits, what they
 * share, how to choose). Fetched client-side so the rest of the page can
 * paint immediately — the heavy hero (blobs + deterministic info) is already
 * useful without these.
 *
 * Cached server-side per (a, b) pair, so subsequent visits are instant.
 */
export function CompareInsights({
  aId,
  bId,
  nameA,
  nameB,
}: {
  aId: string;
  bId: string;
  nameA: string;
  nameB: string;
}) {
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch(
          `/api/compare/insights?a=${encodeURIComponent(aId)}&b=${encodeURIComponent(bId)}`,
        );
        if (!r.ok) {
          if (!cancelled) setError("Comparaison narrative indisponible.");
          return;
        }
        const j = (await r.json()) as Insights;
        if (!cancelled) setData(j);
      } catch {
        if (!cancelled) setError("Comparaison narrative indisponible.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [aId, bId]);

  if (error) {
    return null; // soft-fail — the rest of the page still works.
  }

  if (!data) {
    return (
      <>
        <section className={`${GLASS_CARD} p-5 mb-4`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <PortraitSkeleton name={nameA} />
            <PortraitSkeleton name={nameB} />
          </div>
        </section>
        <section className={`${GLASS_CARD} p-5 mb-4`}>
          <div className="h-3 w-1/3 rounded bg-[#F3F4F6] animate-pulse mb-2" />
          <div className="h-3 w-5/6 rounded bg-[#F3F4F6] animate-pulse" />
        </section>
      </>
    );
  }

  return (
    <>
      {/* Portraits — one card per product, no winner badge. */}
      <section className="mb-4">
        <h2 className="text-[15px] font-semibold mb-3 px-1">Portrait des deux produits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <Portrait name={nameA} text={data.portraitA} />
          <Portrait name={nameB} text={data.portraitB} />
        </div>
      </section>

      {/* What they share */}
      <section className={`${GLASS_CARD} p-5 mb-4`}>
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-subtle mb-2">
          Ce qu&apos;ils ont en commun
        </h3>
        <p className="text-[14px] leading-relaxed text-ink">{renderBold(data.common)}</p>
      </section>

      {/* How to choose — no verdict, just guidance */}
      <section className={`${GLASS_CARD} p-5 mb-4 bg-gradient-to-br from-sky-50/80 to-white/70`}>
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-sky-700 mb-2">
          Comment choisir ?
        </h3>
        <p className="text-[14px] leading-relaxed text-ink">{renderBold(data.howToChoose)}</p>
      </section>
    </>
  );
}

function Portrait({ name, text }: { name: string; text: string }) {
  return (
    <article className={`${GLASS_CARD} p-5`}>
      <h3 className="text-[14px] font-semibold mb-2 truncate">{name}</h3>
      <p className="text-[13px] leading-relaxed text-ink">{renderBold(text)}</p>
    </article>
  );
}

function PortraitSkeleton({ name }: { name: string }) {
  return (
    <article className={`${GLASS_CARD} p-5`}>
      <h3 className="text-[14px] font-semibold mb-3 truncate">{name}</h3>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-[#F3F4F6] animate-pulse" />
        <div className="h-3 w-5/6 rounded bg-[#F3F4F6] animate-pulse" />
        <div className="h-3 w-2/3 rounded bg-[#F3F4F6] animate-pulse" />
      </div>
    </article>
  );
}

// Inline **bold** rendering — same convention as the synthesis text.
function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>,
  );
}
