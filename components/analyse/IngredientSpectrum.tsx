"use client";

import type { ColorRating } from "@/lib/supabase";
import { GLASS_CARD } from "@/lib/ui/glass";

const COLOR_MAP: Record<NonNullable<ColorRating>, string> = {
  Vert: "#10B981",
  Jaune: "#F59E0B",
  Orange: "#FB923C",
  Rouge: "#EF4444",
};

const EMPTY_COLOR = "#E5E7EB";

/**
 * Visual "spectrum" of the first 5 / first 10 ingredients of the formula.
 * Tap on a square scrolls to the matching ingredient row (the row must have
 * an id like `ingredient-row-{position}` — 1-indexed).
 */
export function IngredientSpectrum({
  top5,
  top10,
}: {
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

  return (
    <section
      aria-label="Spectre des premiers ingrédients"
      className={`${GLASS_CARD} p-5`}
    >
      <div className="mb-3">
        <h3 className="text-[15px] font-semibold">Spectre top 5</h3>
        <p className="text-[11px] text-[#6B7280] mt-0.5">
          Les 5 premiers ingrédients représentent environ 75 % de la formule.
        </p>
      </div>

      <ul className="flex items-end gap-2 mb-5">
        {top5.map((rating, i) => (
          <li key={i} className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => scrollToPosition(i + 1)}
              aria-label={`Position ${i + 1}${rating ? ` — ${rating}` : ""}`}
              className="h-8 w-8 rounded-md transition hover:scale-110"
              style={{ background: rating ? COLOR_MAP[rating] : EMPTY_COLOR }}
            />
            <span className="text-[10px] text-[#9CA3AF]">{i + 1}</span>
          </li>
        ))}
      </ul>

      <h3 className="text-[13px] font-semibold mb-2">Top 10</h3>
      <ul className="flex gap-1">
        {top10.map((rating, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => scrollToPosition(i + 1)}
              aria-label={`Position ${i + 1}${rating ? ` — ${rating}` : ""}`}
              className="h-4 w-4 rounded-sm transition hover:scale-125"
              style={{ background: rating ? COLOR_MAP[rating] : EMPTY_COLOR }}
            />
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-[#9CA3AF] mt-2">Touche un carré pour voir l&apos;ingrédient correspondant.</p>
    </section>
  );
}
