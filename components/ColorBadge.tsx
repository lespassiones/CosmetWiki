import type { ColorRating } from "@/lib/supabase";
import { RATING_CLASS, RATING_DOT, RATING_LABEL } from "@/lib/colors";

export function ColorBadge({
  rating,
  size = "md",
  showLabel = true,
}: {
  rating: ColorRating;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const sizeCls =
    size === "sm"
      ? "text-[10px] px-2 py-0.5"
      : size === "lg"
        ? "text-sm px-3 py-1.5"
        : "text-xs px-2.5 py-1";
  const dotSize =
    size === "sm" ? "h-1.5 w-1.5" : size === "lg" ? "h-2.5 w-2.5" : "h-2 w-2";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide ${RATING_CLASS[rating]} ${sizeCls}`}
    >
      <span
        className={`inline-block rounded-full ${RATING_DOT[rating]} ${dotSize}`}
        aria-hidden
      />
      {showLabel ? (
        <span>
          <span className="hidden sm:inline">{rating} · </span>
          {RATING_LABEL[rating]}
        </span>
      ) : (
        <span>{rating}</span>
      )}
    </span>
  );
}
