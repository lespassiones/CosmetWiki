import Link from "next/link";
import { decodeHtml } from "@/lib/decodeHtml";
import type { BlobCounts } from "@/components/blob/IngredientBlob";

/**
 * RoutineProductCard — carte produit ÉPURÉE de la liste « Ma routine soin »
 * (page /routine/produits). Twin web de components/routine/RoutineProductCard
 * (mobile) : photo produit à gauche + nom + marque, donut de proportions
 * couleur à droite. Toute la carte est un lien vers la sous-page de réglages
 * du produit (/routine/item/[id]). Aucune note chiffrée (règle éditoriale).
 */
export function RoutineProductCard({
  routineItemId,
  name,
  brand,
  counts,
  imageUrl,
}: {
  routineItemId: string;
  name: string;
  brand: string | null;
  counts: BlobCounts | null;
  imageUrl: string | null;
}) {
  const displayName = decodeHtml(name);
  return (
    <Link
      href={`/routine/item/${routineItemId}`}
      aria-label={`Ouvrir ${displayName}`}
      className="neu neu-hover flex items-stretch gap-4 p-3.5 transition"
    >
      <ProductThumb url={imageUrl} className="-my-1 w-14 min-h-[56px]" />
      <div className="min-w-0 flex-1 self-center">
        <div className="font-semibold text-[#111111] line-clamp-2 leading-snug">{displayName}</div>
        {brand ? (
          <div className="mt-0.5 text-[12px] text-[#6B7280] truncate">{decodeHtml(brand)}</div>
        ) : null}
      </div>
      <ProportionRing counts={counts} size={48} stroke={8} className="self-center" />
    </Link>
  );
}

const RING_ORDER = ["vert", "jaune", "orange", "rouge"] as const;
const RING_COLORS: Record<(typeof RING_ORDER)[number], string> = {
  vert: "#10B981",
  jaune: "#FBBF24",
  orange: "#FB923C",
  rouge: "#F43F5E",
};

/** Anneau plein (donut) : proportion des ingrédients par couleur. */
export function ProportionRing({
  counts,
  size = 48,
  stroke = 8,
  className,
}: {
  counts: BlobCounts | null;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const c = counts ?? { vert: 0, jaune: 0, orange: 0, rouge: 0 };
  const total = c.vert + c.jaune + c.orange + c.rouge;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  let acc = 0;
  const segments = RING_ORDER.flatMap((k) => {
    const v = c[k];
    if (total <= 0 || v <= 0) return [];
    const frac = v / total;
    const seg = { k, frac, offset: acc };
    acc += frac;
    return [seg];
  });
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`shrink-0 ${className ?? ""}`}
      aria-hidden
    >
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
        {segments.map((s) => (
          <circle
            key={s.k}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={RING_COLORS[s.k]}
            strokeWidth={stroke}
            strokeDasharray={`${s.frac * circ} ${circ - s.frac * circ}`}
            strokeDashoffset={-s.offset * circ}
          />
        ))}
      </g>
    </svg>
  );
}

/** Vignette produit : largeur fixe, hauteur étirée sur toute la carte. */
export function ProductThumb({ url, className }: { url: string | null | undefined; className?: string }) {
  return (
    <div
      className={`relative shrink-0 self-stretch overflow-hidden rounded-xl bg-gray-100 ${className ?? ""}`}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center text-gray-300">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </span>
      )}
    </div>
  );
}
