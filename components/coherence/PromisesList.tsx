"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { GLASS_CARD } from "@/lib/ui/glass";
import type { CoherencePromise } from "@/lib/coherence/types";
import type { AnalyseItem } from "@/lib/analyseTypes";
import type { ColorRating } from "@/lib/supabase";
import { VERDICT_TONE } from "./tone";

/**
 * PromisesList — single "Promesses" block (refonte épurée, twin du mockup).
 *
 * Merges the former "Détail par promesse" (per-promise bar) and "Tableau de
 * cohérence" (found ingredients) into ONE list:
 *   - Collapsed row: label + verdict badge + thin coloured progress bar.
 *   - On click: expands the coverage %, the promise excerpt and the found
 *     ingredients (safety dot), contradicting actives, or a short message.
 *
 * Inferred promises are excluded (they get their own card). The bars fill
 * 0 → target on mount (ease-out cubic), honouring prefers-reduced-motion.
 * PRESENTATION ONLY — data is untouched.
 */
export function PromisesList({
  promises,
  items = [],
}: {
  promises: CoherencePromise[];
  items?: AnalyseItem[];
}) {
  const directPromises = promises.filter((p) => !p.inferred);

  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const reduce
      = typeof window !== "undefined"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setProgress(1);
      return;
    }
    const DURATION = 1200;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (directPromises.length === 0) {
    return (
      <article className={`${GLASS_CARD} p-6`}>
        <h2 className="text-[15px] lg:text-[17px] font-semibold mb-1">Promesses</h2>
        <p className="text-[13px] text-[#6B7280]">
          Aucune promesse vérifiable détectée dans la description (mentions générales :
          composition, certification, sensorialité…).
        </p>
      </article>
    );
  }

  const colorMap = buildColorMap(items);

  return (
    <article className={`${GLASS_CARD} p-5 lg:p-7`}>
      <h2 className="text-[15px] lg:text-[17px] font-semibold mb-2">Promesses</h2>
      <ul>
        {directPromises.map((p, i) => (
          <PromiseRow
            key={p.slug + p.excerpt}
            promise={p}
            colorMap={colorMap}
            progress={progress}
            first={i === 0}
          />
        ))}
      </ul>
    </article>
  );
}

function PromiseRow({
  promise,
  colorMap,
  progress,
  first,
}: {
  promise: CoherencePromise;
  colorMap: Map<string, ColorRating | null>;
  progress: number;
  first: boolean;
}) {
  const [open, setOpen] = useState(false);
  const tone = VERDICT_TONE[promise.verdict];
  const target = Math.max(4, promise.score);
  const animatedWidth = Math.max(progress > 0 ? 4 : 0, target * progress);

  return (
    <li className={first ? "" : "border-t border-black/[0.06]"}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full py-4 text-left"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-ink text-[15px] leading-snug">{promise.label}</span>
          <span className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${tone.bgSoft} ${tone.text} ring-1 ${tone.ringSoft}`}
            >
              {tone.badge}
            </span>
            <svg
              aria-hidden
              width="14"
              height="14"
              viewBox="0 0 10 10"
              className={`text-[#9CA3AF] transition-transform ${open ? "rotate-180" : ""}`}
            >
              <path
                d="M1.5 3.5 L5 7 L8.5 3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        <div className="mt-3 h-1 w-full rounded-full bg-[#F3F4F6] overflow-hidden">
          <div className={`h-full rounded-full ${tone.bg}`} style={{ width: `${animatedWidth}%` }} />
        </div>
      </button>

      {open && (
        <div className="pb-4 space-y-2">
          <p className="text-[13px] text-[#6B7280]">
            Couverture par la formule :{" "}
            <span className={`font-semibold ${tone.text}`}>{promise.score} %</span>
          </p>
          {promise.excerpt && (
            <p className="text-[13px] italic text-[#6B7280] leading-snug">« {promise.excerpt} »</p>
          )}
          <div className="text-[12px]">
            <FoundList promise={promise} colorMap={colorMap} />
          </div>
        </div>
      )}
    </li>
  );
}

// ─── Helpers (mirror CoherenceTable) ───────────────────────────────────────

function dotColor(rating: ColorRating | null): string {
  switch (rating) {
    case "Vert": return "bg-emerald-500";
    case "Jaune": return "bg-amber-400";
    case "Orange": return "bg-orange-500";
    case "Rouge": return "bg-rose-500";
    default: return "bg-slate-300";
  }
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function buildColorMap(items: AnalyseItem[]): Map<string, ColorRating | null> {
  const map = new Map<string, ColorRating | null>();
  for (const it of items) {
    if (it.slug) map.set(`s:${it.slug}`, it.colorRating);
    if (it.name) map.set(`n:${normalize(it.name)}`, it.colorRating);
    if (it.input) map.set(`n:${normalize(it.input)}`, it.colorRating);
  }
  return map;
}

function lookupColor(
  active: { name: string; slug: string | null },
  map: Map<string, ColorRating | null>,
): ColorRating | null {
  if (active.slug) {
    const r = map.get(`s:${active.slug}`);
    if (r !== undefined) return r;
  }
  const n = normalize(active.name);
  if (n) {
    const r = map.get(`n:${n}`);
    if (r !== undefined) return r;
  }
  return null;
}

function FoundList({
  promise,
  colorMap,
}: {
  promise: CoherencePromise;
  colorMap: Map<string, ColorRating | null>;
}) {
  if (
    promise.verdict === "contredite"
    && promise.contradictingActives
    && promise.contradictingActives.length > 0
  ) {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-1 text-red-700">
        <span aria-hidden className="mr-1">⚠</span>
        {promise.contradictingActives.map((c, i) => (
          <Fragment key={`${c.slug ?? c.name}-${i}`}>
            {i > 0 && <span aria-hidden className="text-red-300 mx-1">·</span>}
            <span className="inline-flex items-center gap-1">
              <span className="font-medium">{c.name}</span>
              <span className="text-[11px] text-red-500/80">pos. {c.position}</span>
            </span>
          </Fragment>
        ))}
      </span>
    );
  }

  if (
    promise.verdict === "tenue"
    && promise.foundActives.length === 0
    && promise.cosmeticActives.length === 0
  ) {
    return <span className="text-emerald-700">Aucun ingrédient de ce type détecté.</span>;
  }

  const entries = [
    ...promise.foundActives.map((f) => ({ name: f.name, slug: f.slug })),
    ...promise.cosmeticActives.map((c) => ({ name: c.name, slug: c.slug })),
  ];

  if (entries.length === 0) {
    return <span className="text-ink-subtle">Aucun ingrédient identifié pour cette promesse.</span>;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
      {entries.map((e, i) => (
        <span
          key={`${e.slug ?? e.name}-${i}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-black/[0.04]"
        >
          <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${dotColor(lookupColor(e, colorMap))}`} />
          <span className="text-ink">{e.name}</span>
        </span>
      ))}
    </span>
  );
}
