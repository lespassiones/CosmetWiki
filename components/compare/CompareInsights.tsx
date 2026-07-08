"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { GLASS_CARD } from "@/lib/ui/glass";

type Insights = {
  portraitA: string;
  portraitB: string;
  common: string;
  howToChoose: string;
  /** Recommended product (green badge). Absent from pre-v5 cache → score fallback. */
  winner?: "A" | "B";
};

/** Status reported to the parent: drives the green badge (winner) + the
 *  "Voir l'analyse complète" button and the deterministic blocks. */
export type CompareInsightsStatus = "loading" | "ready" | "error";

/**
 * Renders the AI-generated comparison narrative (two portraits, what they
 * share, how to choose). Fetched client-side so the rest of the page can
 * paint immediately - the heavy hero (blobs + deterministic info) is already
 * useful without these.
 *
 * Cached server-side per (a, b) pair, so subsequent visits are instant.
 */
export function CompareInsights({
  aId,
  bId,
  nameA,
  nameB,
  shortNameA,
  shortNameB,
  showFull = false,
  onResult,
}: {
  aId: string;
  bId: string;
  /** Full names - used only in the loading skeleton + a11y. */
  nameA: string;
  nameB: string;
  /** Compact names - used as card titles AND as the substring we highlight
   *  inside the narrative. Must match exactly what was sent to the LLM
   *  (api/compare/insights computes the same value with shortenProductName). */
  shortNameA: string;
  shortNameB: string;
  /** When false, only "Comment choisir ?" shows; portraits + common are hidden
   *  until the parent's "Voir l'analyse complète" reveals them. */
  showFull?: boolean;
  /** Reports status + recommended product to the parent (badge + button). */
  onResult?: (r: { status: CompareInsightsStatus; winner?: "A" | "B" }) => void;
}) {
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Report status upward (winner badge + button/blocks visibility).
  useEffect(() => {
    const status: CompareInsightsStatus = error ? "error" : data ? "ready" : "loading";
    onResult?.({ status, winner: data?.winner });
    // onResult is a stable parent setter; excluded from deps to avoid a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error]);

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

  // Defensive post-processing: rewrite any leftover "produit A" / lone "A"
  // (the prompt forbids them, this catches slips) AND replace the long raw
  // name with the short one in case the LLM kept it.
  const cleaned = useMemo<Insights | null>(() => {
    if (!data) return null;
    const fix = (s: string) => {
      let t = rewriteAB(s, shortNameA, shortNameB);
      // If the prompt slipped and used the full long name anywhere, swap it
      // for the short one too, so the highlight substring still lines up.
      if (nameA && nameA !== shortNameA) t = t.split(nameA).join(shortNameA);
      if (nameB && nameB !== shortNameB) t = t.split(nameB).join(shortNameB);
      return t;
    };
    return {
      portraitA: fix(data.portraitA),
      portraitB: fix(data.portraitB),
      common: fix(data.common),
      howToChoose: fix(data.howToChoose),
    };
  }, [data, nameA, nameB, shortNameA, shortNameB]);

  if (error) {
    return null; // soft-fail - the rest of the page still works.
  }

  if (!cleaned) {
    return (
      <section className={`${GLASS_CARD} p-5 mb-4 bg-gradient-to-br from-sky-50/80 to-white/70`}>
        <div className="h-3 w-1/3 rounded bg-[#F3F4F6] animate-pulse mb-2" />
        <div className="h-3 w-5/6 rounded bg-[#F3F4F6] animate-pulse" />
      </section>
    );
  }

  return (
    <>
      {/* How to choose - the verdict first, always visible. */}
      <section className={`${GLASS_CARD} p-5 mb-4 bg-gradient-to-br from-sky-50/80 to-white/70`}>
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-sky-700 mb-2">
          Comment choisir ?
        </h3>
        <p className="text-[14px] leading-relaxed text-ink">
          {renderWithProductHighlights(cleaned.howToChoose, shortNameA, shortNameB)}
        </p>
      </section>

      {/* Detail (portraits + common) - revealed via the parent's
          "Voir l'analyse complète" button. */}
      {showFull && (
        <>
          <section className="mb-4">
            <h2 className="text-[15px] font-semibold mb-3 px-1">Portrait des deux produits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <Portrait
                shortName={shortNameA}
                text={cleaned.portraitA}
                tone="A"
                otherShortName={shortNameB}
              />
              <Portrait
                shortName={shortNameB}
                text={cleaned.portraitB}
                tone="B"
                otherShortName={shortNameA}
              />
            </div>
          </section>

          {/* What they share */}
          <section className={`${GLASS_CARD} p-5 mb-4`}>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-subtle mb-2">
              Ce qu&apos;ils ont en commun
            </h3>
            <p className="text-[14px] leading-relaxed text-ink">
              {renderWithProductHighlights(cleaned.common, shortNameA, shortNameB)}
            </p>
          </section>
        </>
      )}
    </>
  );
}

function Portrait({
  shortName,
  text,
  tone,
  otherShortName,
}: {
  shortName: string;
  text: string;
  tone: "A" | "B";
  /** Needed so an A-portrait that happens to mention B's name still gets
   *  highlighted with the right tone (and vice versa). */
  otherShortName: string;
}) {
  const titleClass =
    tone === "A"
      ? "text-blue-700 underline underline-offset-4 decoration-blue-300"
      : "text-fuchsia-700 underline underline-offset-4 decoration-fuchsia-300";
  return (
    <article className={`${GLASS_CARD} p-5`}>
      <h3 className={`text-[14px] font-semibold mb-2 truncate ${titleClass}`}>
        {shortName}
      </h3>
      <p className="text-[13px] leading-relaxed text-ink">
        {renderWithProductHighlights(text, shortName, otherShortName, tone)}
      </p>
    </article>
  );
}

// ─── Rendering ────────────────────────────────────────────────────────────
//
// We DON'T colour-highlight ingredients here anymore - the user wanted the
// emphasis on product names instead. INCI tokens (still emitted by the LLM
// as `**Name**`) stay rendered in plain bold so the eye lands on the product
// references first.

/**
 * Walks `text` and wraps every occurrence of `shortNameA` / `shortNameB`
 * (case-insensitive, longest first to avoid B swallowing A when one name
 * is a substring of the other) with a colour-tinted highlight pill.
 *
 * Also renders `**bold**` markers as plain `<strong>` for the rare INCI
 * mentions the LLM may slip into the copy.
 *
 * The `forceTone` parameter biases the colour of the *first* mention in a
 * portrait - useful so the A-portrait's own name pops in blue even if the
 * regex would otherwise paint it neutral.
 */
function renderWithProductHighlights(
  text: string,
  shortNameA: string,
  shortNameB: string,
  forceTone?: "A" | "B",
): React.ReactNode {
  if (!text) return null;
  // We want a single pass that handles both bold markers and name highlights.
  // Strategy: first split on bold, then for each non-bold chunk run the
  // name-highlight pass.
  const boldChunks = text.split(/(\*\*[^*]+\*\*)/g);
  return boldChunks.map((chunk, i) => {
    if (chunk.startsWith("**") && chunk.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-ink">
          {chunk.slice(2, -2)}
        </strong>
      );
    }
    return (
      <Fragment key={i}>
        {highlightNames(chunk, shortNameA, shortNameB, forceTone)}
      </Fragment>
    );
  });
}

function highlightNames(
  chunk: string,
  shortNameA: string,
  shortNameB: string,
  forceTone?: "A" | "B",
): React.ReactNode {
  // Build a list of (start, end, tone) ranges for each occurrence, longest
  // first so B doesn't eat into A when A's name is a substring of B's.
  type Range = { start: number; end: number; tone: "A" | "B" };
  const ranges: Range[] = [];
  const targets: { name: string; tone: "A" | "B" }[] = [];
  if (shortNameA) targets.push({ name: shortNameA, tone: "A" });
  if (shortNameB) targets.push({ name: shortNameB, tone: "B" });
  // Longest-first to win when one is a substring of the other.
  targets.sort((x, y) => y.name.length - x.name.length);

  for (const { name, tone } of targets) {
    if (!name) continue;
    const lcChunk = chunk.toLowerCase();
    const lcName = name.toLowerCase();
    let from = 0;
    while (true) {
      const idx = lcChunk.indexOf(lcName, from);
      if (idx === -1) break;
      // Skip if this range overlaps a previously-matched one (longer match wins).
      const collides = ranges.some(
        (r) => !(idx + lcName.length <= r.start || idx >= r.end),
      );
      if (!collides) ranges.push({ start: idx, end: idx + lcName.length, tone });
      from = idx + lcName.length;
    }
  }

  if (ranges.length === 0) return chunk;

  ranges.sort((x, y) => x.start - y.start);

  const out: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach((r, i) => {
    if (r.start > cursor) out.push(chunk.slice(cursor, r.start));
    const useTone = i === 0 && forceTone ? forceTone : r.tone;
    out.push(
      <NameHighlight key={`${r.start}-${i}`} tone={useTone}>
        {chunk.slice(r.start, r.end)}
      </NameHighlight>,
    );
    cursor = r.end;
  });
  if (cursor < chunk.length) out.push(chunk.slice(cursor));
  return out;
}

function NameHighlight({
  tone,
  children,
}: {
  tone: "A" | "B";
  children: React.ReactNode;
}) {
  // Distinct hues from the safety palette (vert/jaune/orange/rouge) so the
  // user doesn't confuse a product-name highlight with an ingredient rating.
  // A = blue, B = fuchsia.
  const cls =
    tone === "A"
      ? "rounded bg-blue-100/80 px-1 -mx-0.5 text-blue-800 font-semibold"
      : "rounded bg-fuchsia-100/80 px-1 -mx-0.5 text-fuchsia-800 font-semibold";
  return <span className={cls}>{children}</span>;
}

// ─── Defensive A/B rewrite ────────────────────────────────────────────────
//
// The prompt strictly forbids "produit A", "A pourrait...", etc. but LLMs
// occasionally slip - this turns any remaining occurrence into the actual
// product name. Patterns are word-bounded so we don't mangle real words.

function rewriteAB(text: string, nameA: string, nameB: string): string {
  if (!text) return text;
  let out = text;

  // 1. Explicit "produit A" / "Produit A" / "le produit A" → nameA. Same for B.
  out = out.replace(/\b(?:le |la )?produit\s+a\b/gi, nameA);
  out = out.replace(/\b(?:le |la )?produit\s+b\b/gi, nameB);

  // 2. Quoted variants (some prompts produce "A" / 'A' as a label).
  out = out.replace(/["«]\s*A\s*["»]/g, nameA);
  out = out.replace(/["«]\s*B\s*["»]/g, nameB);

  // 3. Lone "A " / "B " followed by a verb that's clearly used as a product
  //    label. Word-bounded so "A propos de" doesn't match.
  const verbTail = "(?=\\s+(?:pourrait|peut|est|convient|correspond|conviendra|s'adresse|reste|sera|propose|offre|conviendrait|cible|vise))";
  out = out.replace(new RegExp(`\\bA\\b${verbTail}`, "g"), nameA);
  out = out.replace(new RegExp(`\\bB\\b${verbTail}`, "g"), nameB);

  return out;
}
