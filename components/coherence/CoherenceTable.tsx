"use client";

import { Fragment, useState } from "react";
import { GLASS_CARD } from "@/lib/ui/glass";
import { InfoBadge, Tooltip } from "../Tooltip";
import type { CoherencePromise } from "@/lib/coherence/types";
import type { AnalyseItem } from "@/lib/analyseTypes";
import type { ColorRating } from "@/lib/supabase";
import { VERDICT_TONE } from "./tone";

const MOBILE_PROMISES_PREVIEW = 2;

/**
 * The dense reference table. Desktop: real <table> with 3 columns. Mobile:
 * the same data restructured as a stack of cards (one per promise) since
 * a 3-column table is unreadable below ~600px.
 *
 * Each found active is shown with a coloured dot matching its safety rating
 * (vert/jaune/orange/rouge) - bridges the coherence verdict and the per-
 * ingredient analysis the user already saw on the parent page.
 *
 * The "Manque" column was deliberately removed: a missing active in a
 * formula is a *formulator's choice*, not a defect. Suggesting absent
 * ingredients can also contradict ourselves (e.g. flagging Dimethicone as
 * missing while marking it orange in the safety analysis).
 */
export function CoherenceTable({
  promises,
  items = [],
}: {
  promises: CoherencePromise[];
  items?: AnalyseItem[];
}) {
  // Inferred promises are surfaced in a dedicated card ("Promesses déduites
  // de la formule") rather than mixed into this main table - they come from
  // the bidirectional reinforcement layer, not from direct extraction.
  // Filter them out so the main table stays focused on what the description
  // explicitly claimed.
  const directPromises = promises.filter((p) => !p.inferred);

  if (directPromises.length === 0) {
    return (
      <article className={`${GLASS_CARD} p-6 text-center`}>
        <p className="text-[14px] text-[#6B7280]">
          Aucune promesse vérifiable n&apos;a été détectée dans la description.
        </p>
        <p className="text-[12px] text-[#9CA3AF] mt-1">
          La description ne contient peut-être que des mentions générales
          (composition, certification, sensorialité…).
        </p>
      </article>
    );
  }

  // Build a lookup so each found active can be tagged with its safety rating.
  // Indexed by both slug and a normalised name so we cover catalogue actives
  // (slug-based) and LLM-discovered open promises (name-based fallback).
  const colorMap = buildColorMap(items);

  // Mobile-only collapse state: the table is dense on small screens and the
  // ingredients per row are noise for most users — they care first about
  // *which* promises are kept. Desktop keeps the full table since horizontal
  // space is not a constraint there.
  const [showAllMobile, setShowAllMobile] = useState(false);
  const mobileHiddenCount = Math.max(0, directPromises.length - MOBILE_PROMISES_PREVIEW);
  const mobileVisible = showAllMobile
    ? directPromises
    : directPromises.slice(0, MOBILE_PROMISES_PREVIEW);

  // Counts for the contextual tooltip - picks an example per verdict tier.
  const verdictCounts = {
    tenue: directPromises.filter((p) => p.verdict === "tenue").length,
    partielle: directPromises.filter((p) => p.verdict === "partielle").length,
    marketing: directPromises.filter((p) => p.verdict === "marketing").length,
    non_demontree: directPromises.filter((p) => p.verdict === "non_demontree").length,
    contredite: directPromises.filter((p) => p.verdict === "contredite").length,
  };

  return (
    <article className={`${GLASS_CARD} p-5 lg:p-6`}>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[15px] lg:text-[17px] font-semibold">Tableau de cohérence</h2>
        <Tooltip
          placement="bottom"
          maxWidth={420}
          content={
            <>
              <b>Promesse</b> : ce que dit l&apos;emballage.<br />
              <b>Verdict</b> : niveau de soutien par la formule.<br />
              <b>Ingrédients trouvés</b> : actifs présents dans la formule pour cette promesse.
              Le point coloré indique leur niveau de sécurité (vert / jaune / orange / rouge).
              <br /><br />
              <b>Sur cette analyse</b> :{" "}
              {verdictCounts.tenue > 0 && <>{verdictCounts.tenue} tenue{verdictCounts.tenue > 1 ? "s" : ""}</>}
              {verdictCounts.partielle > 0 && <>{verdictCounts.tenue > 0 ? ", " : ""}{verdictCounts.partielle} partielle{verdictCounts.partielle > 1 ? "s" : ""}</>}
              {verdictCounts.marketing > 0 && <>, {verdictCounts.marketing} marketing</>}
              {verdictCounts.non_demontree > 0 && <>, {verdictCounts.non_demontree} non démontrée{verdictCounts.non_demontree > 1 ? "s" : ""}</>}
              {verdictCounts.contredite > 0 && <>, {verdictCounts.contredite} contredite{verdictCounts.contredite > 1 ? "s" : ""}</>}.
            </>
          }
        >
          <button type="button" aria-label="Comment lire ce tableau ?">
            <InfoBadge />
          </button>
        </Tooltip>
      </div>

      {/* DESKTOP TABLE - 3 columns (Manque dropped intentionally). */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-[13px] table-fixed">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[14%]" />
            <col className="w-[64%]" />
          </colgroup>
          <thead>
            <tr className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
              <th className="pb-3 pr-4">Promesse</th>
              <th className="pb-3 pr-4">Verdict</th>
              <th className="pb-3">Ingrédients trouvés</th>
            </tr>
          </thead>
          <tbody>
            {directPromises.map((p) => {
              const tone = VERDICT_TONE[p.verdict];
              return (
                <tr key={p.slug + p.excerpt} className="border-t border-black/[0.04]">
                  <td className="py-3 pr-4 align-top">
                    <div className="flex items-start gap-2">
                      {p.verdict !== "tenue" && (
                        <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone.bg}`} />
                      )}
                      <span
                        className={
                          p.verdict === "tenue"
                            ? "font-medium text-emerald-900 leading-snug bg-emerald-200/70 rounded-[3px] px-1 -mx-0.5 box-decoration-clone"
                            : "font-medium text-ink leading-snug"
                        }
                      >
                        {p.label}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone.bgSoft} ${tone.text} ring-1 ${tone.ringSoft}`}
                    >
                      {tone.label}
                    </span>
                  </td>
                  <td className="py-3 align-top text-ink-muted text-[12px]">
                    <FoundList promise={p} colorMap={colorMap} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS - stacked, collapsed by default */}
      <div className="lg:hidden">
        <ul className="space-y-2.5">
          {mobileVisible.map((p) => (
            <MobilePromiseCard
              key={p.slug + p.excerpt}
              promise={p}
              colorMap={colorMap}
            />
          ))}
        </ul>
        {(mobileHiddenCount > 0 || showAllMobile) && (
          <button
            type="button"
            onClick={() => setShowAllMobile((v) => !v)}
            className="mt-3 w-full rounded-xl bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 transition-colors"
            aria-expanded={showAllMobile}
          >
            {showAllMobile
              ? "Voir moins"
              : `Voir plus (${mobileHiddenCount} ${mobileHiddenCount > 1 ? "autres" : "autre"})`}
          </button>
        )}
      </div>
    </article>
  );
}

function MobilePromiseCard({
  promise,
  colorMap,
}: {
  promise: CoherencePromise;
  colorMap: Map<string, ColorRating | null>;
}) {
  const [showIngredients, setShowIngredients] = useState(false);
  const tone = VERDICT_TONE[promise.verdict];
  return (
    <li className="rounded-2xl bg-white p-3.5 ring-1 ring-black/[0.06]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          {promise.verdict !== "tenue" && (
            <span
              aria-hidden
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone.bg}`}
            />
          )}
          <span
            className={
              promise.verdict === "tenue"
                ? "font-semibold text-emerald-900 leading-tight bg-emerald-200/70 rounded-[3px] px-1 -mx-0.5 box-decoration-clone"
                : "font-semibold text-ink leading-tight"
            }
          >
            {promise.label}
          </span>
        </div>
        <span
          className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.bgSoft} ${tone.text} ring-1 ${tone.ringSoft}`}
        >
          {tone.label}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setShowIngredients((v) => !v)}
        className="mt-2 inline-flex items-center gap-1 text-[11px] text-ink-subtle hover:text-ink transition-colors"
        aria-expanded={showIngredients}
      >
        <span>
          {showIngredients ? "Masquer les ingrédients" : "Voir les ingrédients"}
        </span>
        <svg
          aria-hidden
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={`transition-transform ${showIngredients ? "rotate-180" : ""}`}
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
      </button>
      {showIngredients && (
        <div className="mt-2 text-[12px]">
          <span className="text-[#9CA3AF]">Trouvé : </span>
          <FoundList promise={promise} colorMap={colorMap} />
        </div>
      )}
    </li>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────

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
  // "Contredite" verdicts swap semantics: instead of listing actives that
  // SUPPORT the promise, we list ingredients that CONTRADICT it (the
  // product claims "sans sulfate" but here are the sulfates). Visually
  // marked with a red ⚠ so it's clearly different from a "tenue" row.
  if (promise.verdict === "contredite" && promise.contradictingActives && promise.contradictingActives.length > 0) {
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

  // "Tenue" absence promises (e.g. "sans paraben" → no paraben found): no
  // ingredient to list, but say so explicitly so the row doesn't look
  // empty/broken.
  if (promise.verdict === "tenue" && promise.foundActives.length === 0 && promise.cosmeticActives.length === 0) {
    return <span className="text-emerald-700">Aucun ingrédient de ce type détecté.</span>;
  }

  const entries = [
    ...promise.foundActives.map((f) => ({ name: f.name, slug: f.slug })),
    ...promise.cosmeticActives.map((c) => ({ name: c.name, slug: c.slug })),
  ];

  if (entries.length === 0) {
    return <span className="text-ink-subtle">-</span>;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-1">
      {entries.map((e, i) => (
        <Fragment key={`${e.slug ?? e.name}-${i}`}>
          {i > 0 && <span aria-hidden className="text-ink-subtle/60 mx-1">·</span>}
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className={`h-2 w-2 shrink-0 rounded-full ${dotColor(lookupColor(e, colorMap))}`}
            />
            <span>{e.name}</span>
          </span>
        </Fragment>
      ))}
    </span>
  );
}
