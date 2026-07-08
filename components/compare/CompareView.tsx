"use client";

/**
 * CompareView — client shell of the compare page. Owns the SINGLE AI insights
 * fetch (via CompareInsights) so the recommended product (green badge) and the
 * "Voir l'analyse complète" toggle stay in sync with the hero. The server page
 * computes everything deterministic (counts, flagged families, bon à savoir)
 * and passes it here as slim serializable props.
 *
 * Layout:
 *   - Hero: one card per product, exposure bar + counts on the left, product
 *     image on the right, green ✓ badge on the recommended product.
 *   - "Comment choisir ?" (always) + button. Full breakdown (portraits, common,
 *     à surveiller, bon à savoir) is revealed by the button, OR shown directly
 *     when the AI is unavailable so the page keeps its value.
 */

import { useEffect, useState } from "react";
import { GLASS_CARD, GLASS_CARD_ROSE } from "@/lib/ui/glass";
import { ExposureBar, ExposureCountsRow } from "@/components/compare/ExposureBar";
import { CompareInsights, type CompareInsightsStatus } from "@/components/compare/CompareInsights";
import { resolveAndCacheProductImage } from "@/lib/storage/productImageCache";

export type CompareGroup = { label: string; color: "Orange" | "Rouge"; count: number };

export type CompareHero = {
  id: string;
  name: string;
  score: number | null;
  ean: string | null;
  counts: { vert: number; jaune: number; orange: number; rouge: number; matched: number };
};

export function CompareView({
  a,
  b,
  shortNameA,
  shortNameB,
  groupsA,
  groupsB,
  bonASavoir,
  sameComposition,
}: {
  a: CompareHero;
  b: CompareHero;
  shortNameA: string;
  shortNameB: string;
  groupsA: CompareGroup[];
  groupsB: CompareGroup[];
  bonASavoir: string[];
  sameComposition: boolean;
}) {
  const [images, setImages] = useState<Record<string, string>>({});
  const [insights, setInsights] = useState<{ status: CompareInsightsStatus; winner?: "A" | "B" }>({
    status: "loading",
  });
  const [showFull, setShowFull] = useState(false);

  // Resolve product images client-side (EAN = source of truth), non-blocking.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      for (const side of [a, b]) {
        const url = await resolveAndCacheProductImage(side.id, side.ean, null, side.name);
        if (!cancelled && url) setImages((prev) => ({ ...prev, [side.id]: url }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [a, b]);

  // Recommended product (green badge): AI "comment choisir" when available,
  // else the higher score (badge stays visible even without AI). No badge when
  // scores are equal/absent and there's no AI verdict.
  let winnerId: string | null = null;
  if (insights.winner === "A") winnerId = a.id;
  else if (insights.winner === "B") winnerId = b.id;
  else {
    const sa = a.score ?? -1;
    const sb = b.score ?? -1;
    if (sa !== sb) winnerId = sa > sb ? a.id : b.id;
  }

  return (
    <>
      {/* Hero - one card per product, image on the right, ✓ badge on the pick. */}
      <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 mb-6">
        {[a, b].map((side) => {
          const isWinner = winnerId === side.id;
          const img = images[side.id];
          return (
            <article key={side.id} className={`${GLASS_CARD} p-4 lg:p-5 relative`}>
              {isWinner && (
                <span
                  className="absolute top-3 right-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-green-600 text-white shadow-md ring-2 ring-white"
                  aria-label="Produit conseillé"
                >
                  <CheckIcon className="h-4 w-4" />
                </span>
              )}
              <div className="flex items-stretch gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="mb-2 text-[14px] lg:text-[15px] font-semibold text-ink line-clamp-2">
                    {side.name}
                  </h2>
                  <ExposureBar counts={side.counts} />
                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <span className="text-[12px] text-ink-subtle">
                      {side.counts.matched} ingrédients reconnus
                    </span>
                    <ExposureCountsRow counts={side.counts} />
                  </div>
                </div>
                {img ? (
                  // Largeur fixe, hauteur étirée sur toute la carte (plus haute
                  // sans élargir la zone). object-cover pour remplir sans déformer.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt=""
                    loading="lazy"
                    className="w-16 min-h-16 shrink-0 self-stretch rounded-xl bg-white object-cover"
                  />
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {/* "Comment choisir" (always) + portraits/common (gated by showFull). */}
      <CompareInsights
        aId={a.id}
        bId={b.id}
        nameA={a.name}
        nameB={b.name}
        shortNameA={shortNameA}
        shortNameB={shortNameB}
        showFull={showFull}
        onResult={setInsights}
      />

      {/* "Voir l'analyse complète" - only when the AI answered. */}
      {insights.status === "ready" && !showFull && (
        <button
          type="button"
          onClick={() => setShowFull(true)}
          className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-green-600 py-3.5 text-[15px] font-semibold text-white transition hover:bg-green-700"
        >
          Voir l&apos;analyse complète
          <ChevronIcon className="h-4 w-4" dir="down" />
        </button>
      )}

      {/* Detail: revealed by the button, OR shown directly when the AI is
          unavailable so the rest of the page keeps its value. */}
      {(showFull || insights.status === "error") && (
        <>
          {(groupsA.length > 0 || groupsB.length > 0) && (
            <div className="space-y-3 mb-4">
              {groupsA.length > 0 && <AttentionCard name={a.name} groups={groupsA} />}
              {groupsB.length > 0 && <AttentionCard name={b.name} groups={groupsB} />}
            </div>
          )}

          {bonASavoir.length > 0 && (
            <section className={`${GLASS_CARD} p-5`}>
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-subtle mb-3">
                Bon à savoir
              </h3>
              <ul className="space-y-2 text-[14px] leading-relaxed">
                {bonASavoir.map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" aria-hidden />
                    <span>{renderBold(t)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {sameComposition && (
            <p className="mt-4 text-[12px] text-ink-subtle text-center">
              Les deux compositions ne diffèrent pas sur les ingrédients pénalisants.
            </p>
          )}
        </>
      )}

      {/* Collapse */}
      {insights.status === "ready" && showFull && (
        <button
          type="button"
          onClick={() => setShowFull(false)}
          className="mt-2 mb-4 flex w-full items-center justify-center gap-1.5 py-3 text-[14px] font-semibold text-ink-subtle"
        >
          Voir moins
          <ChevronIcon className="h-4 w-4" dir="up" />
        </button>
      )}
    </>
  );
}

function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function AttentionCard({ name, groups }: { name: string; groups: CompareGroup[] }) {
  return (
    <article className={`${GLASS_CARD_ROSE} p-4`}>
      <header className="flex items-start gap-2.5 mb-3">
        <WarnIcon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">
            À surveiller
          </p>
          <h3 className="text-[14px] font-semibold text-rose-900 truncate">{name}</h3>
        </div>
      </header>

      <ul className="space-y-1.5">
        {groups.map((g) => (
          <li key={g.label} className="text-[13px] leading-snug">
            <span
              aria-hidden
              className={`inline-block h-2 w-2 rounded-full mr-2 align-middle ${
                g.color === "Rouge" ? "bg-rose-500" : "bg-orange-500"
              }`}
            />
            <span className="font-semibold text-rose-900">{g.label}</span>
            <span className="text-rose-700/80"> ({g.count})</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ChevronIcon({ className, dir }: { className?: string; dir: "up" | "down" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {dir === "down" ? <path d="m6 9 6 6 6-6" /> : <path d="m18 15-6-6-6 6" />}
    </svg>
  );
}

function WarnIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  );
}
