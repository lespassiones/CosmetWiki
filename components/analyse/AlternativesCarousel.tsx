"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRestrictions } from "@/components/restrictions/RestrictionsProvider";
import { buildExclusionSet, isExcluded } from "@/lib/alternatives/filter";
import { orderByTierShuffled } from "@/lib/alternatives/tierShuffle";
import type { UserRestrictions } from "@/lib/restrictions/types";
import type { AlternativeRow } from "@/app/api/alternatives/route";
import { scoreColor } from "@/lib/essentiel/engine";

// ─── sessionStorage keys (mirror ScanSheet / ProductBrowsePage) ──────────────
const PENDING_INCI_KEY = "cw:pendingInci";
const PENDING_SOURCE_KEY = "cw:pendingProductSource";

// ─── Pagination constants ─────────────────────────────────────────────────────
const RAW_PAGE = 40;
const RAW_SAFETY_LIMIT = 240;
const CAROUSEL_TARGET = 10;
/** Vivier accumulé avant mélange (variété par analyse dans chaque tier). */
const POOL_TARGET = 32;

// ─── Family names cache (module-level, 1 h TTL) ───────────────────────────────
const FAMILY_CACHE_TTL = 3_600_000;
const familyNamesCache = new Map<string, { names: string[]; ts: number }>();

async function getFamilyNames(familySlugs: string[]): Promise<string[]> {
  if (familySlugs.length === 0) return [];
  const key = [...familySlugs].sort().join(",");
  const hit = familyNamesCache.get(key);
  if (hit && Date.now() - hit.ts < FAMILY_CACHE_TTL) return hit.names;
  try {
    const res = await fetch(
      `/api/alternatives/families?slugs=${encodeURIComponent(key)}`,
    );
    if (!res.ok) return [];
    const { names } = (await res.json()) as { names: string[] };
    familyNamesCache.set(key, { names, ts: Date.now() });
    return names;
  } catch {
    return [];
  }
}

// ─── Score tone → colour mapping ──────────────────────────────────────────────
const TONE: Record<string, { text: string; dot: string }> = {
  green:  { text: "text-emerald-700", dot: "bg-emerald-500" },
  amber:  { text: "text-amber-700",   dot: "bg-amber-500"   },
  orange: { text: "text-orange-600",  dot: "bg-orange-500"  },
  rose:   { text: "text-rose-600",    dot: "bg-rose-500"    },
};

// ─── Fetch + filter hook ──────────────────────────────────────────────────────
function useAlternatives(
  ean: string | null,
  category: string | null,
  restrictions: UserRestrictions,
  allergiesFreeform: string | undefined,
  seed: string | null,
) {
  const [alternatives, setAlternatives] = useState<AlternativeRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Clé de recherche : EAN prioritaire, sinon catégorie exacte (produit sans
    // EAN). Sans EAN ni catégorie, rien à faire.
    const queryParam = ean
      ? `ean=${encodeURIComponent(ean)}`
      : category
        ? `category=${encodeURIComponent(category)}`
        : null;
    if (!queryParam) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setAlternatives([]);
      try {
        // 1. Expand families → INCI names (cached 1 h)
        const familyNames = await getFamilyNames(restrictions.families);

        // 2. Build exclusion set
        const exactNames = [
          ...restrictions.ingredients.map((i) => i.name),
          ...familyNames,
        ];
        const excl = buildExclusionSet(exactNames, allergiesFreeform);

        // 3. Paginate raw results, filter client-side, stop at target
        const results: AlternativeRow[] = [];
        let offset = 0;

        // On accumule un VIVIER (POOL_TARGET) quand on mélange (graine), pour
        // que le tirage dans chaque tier ait de la variété ; sinon juste la cible.
        const fillTarget = seed ? POOL_TARGET : CAROUSEL_TARGET;
        while (results.length < fillTarget && offset < RAW_SAFETY_LIMIT) {
          const res = await fetch(
            `/api/alternatives?${queryParam}&limit=${RAW_PAGE}&offset=${offset}`,
          );
          if (!res.ok || cancelled) break;
          const { alternatives: batch } = (await res.json()) as {
            alternatives: AlternativeRow[];
          };
          if (!batch || batch.length === 0) break;

          for (const candidate of batch) {
            if (!isExcluded(candidate.ingredients_text, excl)) {
              results.push(candidate);
              if (results.length >= fillTarget) break;
            }
          }
          offset += RAW_PAGE;
          if (batch.length < RAW_PAGE) break; // last page
        }

        // Mélange « aléatoire contrôlé » DANS chaque tier de pastille si une
        // graine (ID d'analyse) est fournie ; sinon ordre par score.
        const ordered = seed
          ? orderByTierShuffled(results, seed, (r) => r.score)
          : results;
        if (!cancelled) setAlternatives(ordered.slice(0, CAROUSEL_TARGET));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [ean, category, restrictions, allergiesFreeform, seed]);

  return { alternatives, loading };
}

// ─── Individual alternative card ─────────────────────────────────────────────
function AlternativeCard({
  alt,
  onSelect,
}: {
  alt: AlternativeRow;
  onSelect: (a: AlternativeRow) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  // Couleur dérivée du SCORE (source unique) — jamais du score_tone stocké.
  const tone = TONE[scoreColor(alt.score) ?? "rose"] ?? TONE.rose;
  const showImage = alt.image_url && !imgFailed;

  return (
    <button
      type="button"
      onClick={() => onSelect(alt)}
      className="shrink-0 w-[132px] flex flex-col rounded-2xl bg-white/75 ring-1 ring-white/80 backdrop-blur-sm shadow-sm p-2.5 text-left transition-all hover:bg-white hover:shadow-md hover:ring-rose-200 active:scale-[0.97]"
    >
      {/* Image */}
      <div className="h-[76px] w-full rounded-xl overflow-hidden bg-gradient-to-br from-rose-50 to-pink-50 mb-2 flex items-center justify-center">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={alt.image_url!}
            alt=""
            className="h-full w-full object-contain"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <ProductPlaceholderIcon />
        )}
      </div>

      {/* Brand */}
      {alt.brand ? (
        <p className="text-[9px] font-semibold uppercase tracking-wider text-pink-500/80 truncate w-full mb-0.5">
          {alt.brand}
        </p>
      ) : null}

      {/* Name */}
      <p className="text-[11.5px] font-medium text-ink leading-snug line-clamp-2 flex-1 mb-1.5">
        {alt.name}
      </p>

      {/* Score badge */}
      <div className={`flex items-center gap-1 text-[10.5px] font-semibold ${tone.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${tone.dot}`} aria-hidden />
        <span className="truncate">{alt.score_label}</span>
      </div>
    </button>
  );
}

// ─── Loading shimmer ──────────────────────────────────────────────────────────
function AlternativesShimmer() {
  return (
    <div className="mt-4">
      <div className="h-5 w-44 rounded-lg bg-black/5 mb-3 animate-pulse" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-[132px] h-[172px] rounded-2xl bg-black/[0.05] animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AlternativesCarousel({
  ean,
  category = null,
  brand,
  productName,
  seed = null,
}: {
  ean: string | null;
  /** Catégorie catalogue exacte — repli quand le produit n'a pas d'EAN. */
  category?: string | null;
  brand: string | null;
  productName: string | null;
  /** Graine du mélange (ID d'analyse) → alternatives mélangées par tier. */
  seed?: string | null;
}) {
  const router = useRouter();
  const { restrictions, allergiesFreeform } = useRestrictions();
  const { alternatives, loading } = useAlternatives(ean, category, restrictions, allergiesFreeform, seed);
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleSelect(alt: AlternativeRow) {
    try {
      sessionStorage.setItem(PENDING_INCI_KEY, alt.ingredients_text);
      sessionStorage.setItem(
        PENDING_SOURCE_KEY,
        JSON.stringify({
          source: "catalog",
          sourceUrl: null,
          brand: alt.brand ?? null,
          productName: alt.name,
          ean: alt.ean,
        }),
      );
    } catch {
      /* ignore storage errors */
    }
    router.push(
      `/analyse?inci=${encodeURIComponent(alt.ingredients_text.slice(0, 6000))}`,
    );
  }

  // Nothing to show — hide the section entirely. On affiche dès qu'on a un EAN
  // OU une catégorie catalogue (produit sans EAN), comme le mobile.
  if (!ean && !category) return null;
  if (loading) return <AlternativesShimmer />;
  if (alternatives.length === 0) {
    return (
      <div className="mt-4 rounded-2xl bg-white/50 ring-1 ring-black/[0.06] px-4 py-3">
        <p className="text-[13px] text-ink-muted">
          Aucune alternative sans tes restrictions dans cette catégorie pour le moment.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Alternatives recommandées" className="mt-4">
      <h2 className="text-[15px] font-semibold text-ink mb-3 px-0.5">
        Alternatives recommandées
      </h2>

      {/* Horizontal scroll — no scrollbar on touch/mobile */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {alternatives.map((alt) => (
          <AlternativeCard key={alt.ean} alt={alt} onSelect={handleSelect} />
        ))}
      </div>
    </section>
  );
}

function ProductPlaceholderIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8 text-rose-300"
    >
      <path d="M9 2h6v3a2 2 0 0 0 .6 1.4L17 7.8A4 4 0 0 1 18 10.6V19a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-8.4a4 4 0 0 1 1-2.8l1.4-1.4A2 2 0 0 0 9 5z" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}
