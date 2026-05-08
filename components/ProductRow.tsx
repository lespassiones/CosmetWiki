"use client";

import type { ProductHit } from "@/lib/supabase";

export function ProductRow({
  product,
  ratingDot,
}: {
  product: ProductHit;
  ratingDot: string;
}) {
  return (
    <li>
      <a
        href={product.source_url ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-4 rounded-2xl bg-white/70 p-3 shadow-[0_2px_8px_rgba(15,23,42,0.03)] ring-1 ring-white/60 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/85 hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)]"
      >
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-50 via-white to-pink-50 ring-1 ring-black/[0.04]">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={`${product.brand} ${product.name}`}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-contain p-1.5"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <FlaskIcon className="h-6 w-6 text-ink-subtle" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-ink-muted">
            {product.brand}
          </p>
          <p className="line-clamp-2 text-sm font-semibold text-ink">
            {product.name}
          </p>
        </div>
        {product.score !== null ? (
          <span
            className={`shrink-0 text-sm font-bold tabular-nums ${scoreColor(Number(product.score))}`}
          >
            {Number(product.score).toFixed(1)}
            <span className="font-medium text-ink-subtle"> / 20</span>
          </span>
        ) : (
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${ratingDot}`}
            aria-hidden
          />
        )}
      </a>
    </li>
  );
}

function scoreColor(s: number): string {
  if (s >= 15) return "text-emerald-600";
  if (s >= 10) return "text-amber-600";
  if (s >= 5) return "text-orange-600";
  return "text-rose-600";
}

function FlaskIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9 3h6" />
      <path d="M10 3v6L4 20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1l-6-11V3" />
      <path d="M6 14h12" />
    </svg>
  );
}
