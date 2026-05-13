"use client";

import type { AnalyseItem } from "@/lib/analyseTypes";
import type { ColorRating } from "@/lib/supabase";
import { GLASS_CARD } from "@/lib/ui/glass";
import { InfoBadge, Tooltip } from "../Tooltip";

// Aligned with the rest of the app's rating palette (Tailwind dot/badge
// classes used in CountsStrip, RoutineProductRow, search results, etc.):
//   Vert   → emerald-500  (#10B981)
//   Jaune  → amber-400    (#FBBF24)  ← was #F59E0B (amber-500), too orange
//   Orange → orange-400   (#FB923C)
//   Rouge  → rose-500     (#F43F5E)  ← was #EF4444 (red-500), drifted from theme
// Without this fix a Jaune ingredient at the top of the spectrum read as
// "Orange" because amber-500 is visually closer to the Orange swatch.
const COLOR_MAP: Record<NonNullable<ColorRating>, string> = {
  Vert: "#10B981",
  Jaune: "#FBBF24",
  Orange: "#FB923C",
  Rouge: "#F43F5E",
};

const RATING_LABEL: Record<NonNullable<ColorRating>, string> = {
  Vert: "Sans risque connu",
  Jaune: "Pénalité légère",
  Orange: "Pénalité moyenne",
  Rouge: "Pénalité forte",
};

const EMPTY_COLOR = "#E5E7EB";

/**
 * Visual "spectrum" of the first 5 / first 10 ingredients of the formula.
 *
 * Each square is interactive:
 *  - hover (desktop) / tap (mobile) shows a tooltip with the ingredient name
 *    and its color rating
 *  - clicking scrolls the matching row into view (ids `ingredient-row-{N}`)
 *
 * Section titles carry an (i) tooltip explaining why the spectrum matters.
 * A warning chip is shown when any of the first 5 isn't green — those are the
 * ~75% of the formula, so a non-vert there is worth flagging.
 */
export function IngredientSpectrum({
  items,
  top5,
  top10,
}: {
  items: AnalyseItem[];
  top5: (ColorRating | null)[];
  top10: (ColorRating | null)[];
}) {
  function scrollToPosition(position: number) {
    if (typeof window === "undefined") return;
    const el = document.getElementById(`ingredient-row-${position}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-[#F43F5E]");
    window.setTimeout(() => el.classList.remove("ring-2", "ring-[#F43F5E]"), 1500);
  }

  function ingredientAt(position: number): AnalyseItem | undefined {
    return items.find((it) => it.position === position);
  }

  const nonGreenInTop5 = top5.filter((r) => r && r !== "Vert").length;

  return (
    <section
      aria-label="Spectre des premiers ingrédients"
      className={`${GLASS_CARD} p-5`}
    >
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-[15px] font-semibold">Spectre top 5</h3>
        <Tooltip
          content={
            <>
              Les 5 premiers ingrédients représentent la majeure partie de la formule
              (souvent <b>75 à 99 %</b>). Un ingrédient non vert dans ce top 5 a bien
              plus d&apos;impact qu&apos;un même ingrédient placé plus loin dans la
              liste INCI.
            </>
          }
        >
          <button type="button" aria-label="À quoi sert le spectre top 5 ?">
            <InfoBadge />
          </button>
        </Tooltip>
      </div>

      <ul className="flex items-end gap-2 mb-2">
        {top5.map((rating, i) => {
          const position = i + 1;
          const it = ingredientAt(position);
          const name = it?.name ?? it?.input ?? "—";
          return (
            <li key={i} className="flex flex-col items-center gap-1">
              <Tooltip
                placement="top"
                content={
                  <>
                    <div className="font-semibold leading-tight">{name}</div>
                    <div className="mt-0.5 text-white/70">
                      Position {position}
                      {rating ? ` · ${rating} — ${RATING_LABEL[rating]}` : " · non reconnu"}
                    </div>
                  </>
                }
              >
                <button
                  type="button"
                  onClick={() => scrollToPosition(position)}
                  aria-label={`${name} — position ${position}${rating ? ` — ${rating}` : ""}`}
                  className="h-9 w-9 rounded-md transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                  style={{ background: rating ? COLOR_MAP[rating] : EMPTY_COLOR }}
                />
              </Tooltip>
              <span className="text-[10px] text-[#9CA3AF]">{position}</span>
            </li>
          );
        })}
      </ul>

      {nonGreenInTop5 > 0 ? (
        <p className="mb-4 rounded-xl bg-rose-50/70 ring-1 ring-rose-100 px-3 py-2 text-[11px] leading-snug text-rose-700">
          <span className="font-semibold">Attention : </span>
          {nonGreenInTop5} ingrédient{nonGreenInTop5 > 1 ? "s" : ""} non-vert
          {nonGreenInTop5 > 1 ? "s" : ""} dans le top 5 — c&apos;est l&apos;essentiel de la formule.
        </p>
      ) : (
        <p className="mb-4 text-[11px] text-[#9CA3AF]">
          Top 5 entièrement vert — la majorité de la formule est sans risque connu.
        </p>
      )}

      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-[13px] font-semibold">Spectre top 10</h3>
        <Tooltip
          content={
            <>
              Une vue élargie sur les 10 premiers ingrédients. Plus le rang est
              bas (1, 2, 3…), plus l&apos;ingrédient est concentré dans le
              produit.
            </>
          }
        >
          <button type="button" aria-label="À quoi sert le spectre top 10 ?">
            <InfoBadge />
          </button>
        </Tooltip>
      </div>

      <ul className="flex gap-1">
        {top10.map((rating, i) => {
          const position = i + 1;
          const it = ingredientAt(position);
          const name = it?.name ?? it?.input ?? "—";
          return (
            <li key={i}>
              <Tooltip
                placement="top"
                content={
                  <>
                    <div className="font-semibold leading-tight">{name}</div>
                    <div className="mt-0.5 text-white/70">
                      Position {position}
                      {rating ? ` · ${rating}` : " · non reconnu"}
                    </div>
                  </>
                }
              >
                <button
                  type="button"
                  onClick={() => scrollToPosition(position)}
                  aria-label={`${name} — position ${position}${rating ? ` — ${rating}` : ""}`}
                  className="h-5 w-5 rounded-sm transition hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                  style={{ background: rating ? COLOR_MAP[rating] : EMPTY_COLOR }}
                />
              </Tooltip>
            </li>
          );
        })}
      </ul>
      <p className="text-[10px] text-[#9CA3AF] mt-2">
        Touche un carré pour aller à l&apos;ingrédient correspondant.
      </p>
    </section>
  );
}
