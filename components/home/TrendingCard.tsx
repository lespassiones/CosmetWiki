import Link from "next/link";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { GLASS_CARD } from "@/lib/ui/glass";

type TrendingItem = {
  slug: string;
  name: string;
  color_rating: "Vert" | "Jaune" | "Orange" | "Rouge" | null;
  translation_fr: string | null;
  primary_function: string | null;
};

// Same palette as IngredientSpectrum - aligned with the rest of the app's
// rating colours (amber-400 for Jaune, rose-500 for Rouge) so the same
// ingredient looks identical here, in the spectrum, and in the result panel.
const RATING_COLOR: Record<NonNullable<TrendingItem["color_rating"]>, string> = {
  Vert: "#10B981",
  Jaune: "#FBBF24",
  Orange: "#FB923C",
  Rouge: "#F43F5E",
};

/**
 * Async server component - wrapped in <Suspense> by the home page so the rest
 * of the dashboard can render while the trending RPC (the slowest query on the
 * dashboard) is still in flight.
 */
export async function TrendingCard() {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data } = await sb.rpc("cosme_check_trending_ingredients", {
    p_days: 7,
    p_limit: 5,
  });
  const items = (data ?? []) as TrendingItem[];

  return (
    <div className={`${GLASS_CARD} p-5`}>
      <h2 className="text-[15px] font-semibold mb-3">Ingrédients tendance cette semaine</h2>
      {items.length === 0 ? (
        <p className="text-sm text-[#6B7280]">Pas encore de tendance - reviens bientôt.</p>
      ) : (
        <ul className="divide-y divide-[#F0F0F0]">
          {items.map((it) => (
            <li key={it.slug}>
              <Link
                href={`/i/${it.slug}`}
                className="flex items-center gap-3 py-2.5 hover:bg-[#FAFAFA] -mx-2 px-2 rounded-lg transition"
              >
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: it.color_rating ? RATING_COLOR[it.color_rating] : "#E5E7EB" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{it.name}</div>
                  {it.translation_fr && (
                    <div className="text-[11px] text-[#6B7280] truncate">{it.translation_fr}</div>
                  )}
                </div>
                {it.primary_function ? (
                  <div className="hidden sm:block min-w-0 max-w-[40%] text-right">
                    <div className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">Fonction</div>
                    <div className="text-[12px] text-[#4B5563] truncate">{it.primary_function}</div>
                  </div>
                ) : null}
                <span aria-hidden className="text-[#9CA3AF]">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TrendingCardSkeleton() {
  return (
    <div className={`${GLASS_CARD} p-5`} aria-busy="true" aria-live="polite">
      <h2 className="text-[15px] font-semibold mb-3">Ingrédients tendance cette semaine</h2>
      <ul className="divide-y divide-[#F0F0F0]">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 py-2.5 -mx-2 px-2">
            <span aria-hidden className="h-2 w-2 rounded-full bg-[#E5E7EB] shrink-0" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3 w-2/3 rounded bg-[#EEF0F2] animate-pulse" />
              <div className="h-2.5 w-1/3 rounded bg-[#F3F4F6] animate-pulse" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
