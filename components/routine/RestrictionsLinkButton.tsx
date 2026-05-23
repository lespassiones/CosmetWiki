import Link from "next/link";

/**
 * Secondary CTA next to "Ajouter un produit" on the routine page. Navigates
 * to the dedicated restrictions settings page. Shares the deep violet/indigo
 * gradient of the Beauty Advisor card on the home dashboard so the two
 * persistence-aware shortcuts read as a family.
 */
export function RestrictionsLinkButton({
  count,
  className = "",
}: {
  count: number;
  className?: string;
}) {
  return (
    <Link
      href="/profile/restrictions"
      // Same fluid sizing as AddProductButton so the two CTAs stay visually
      // matched as the screen narrows. Icon + badge are `shrink-0` so only
      // the label gives up width (and only after dropping to text-xs).
      className={`neu-shadow-blue inline-flex items-center justify-center gap-2 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-br from-[#6C3FD8] via-[#4F46E5] to-[#7C3AED] hover:brightness-110 transition ${className}`}
    >
      <ShieldIcon className="h-4 w-4 text-white shrink-0" />
      <span className="min-w-0 truncate">Mes restrictions</span>
      {count > 0 ? (
        <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-white/20 px-1.5 text-[11px] font-semibold text-white ring-1 ring-white/25">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
    </svg>
  );
}
