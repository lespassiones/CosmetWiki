import Link from "next/link";

/**
 * Secondary CTA next to "Ajouter un produit" on the routine page. Navigates
 * to the dedicated restrictions settings page. Shares the deep violet/indigo
 * gradient of the Beauty Advisor card on the home dashboard so the two
 * persistence-aware shortcuts read as a family.
 */
export function RestrictionsLinkButton({ count }: { count: number }) {
  return (
    <Link
      href="/profile/restrictions"
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15 shadow-[0_14px_30px_-12px_rgba(79,70,229,0.50),inset_0_1px_0_rgba(255,255,255,0.18)] hover:brightness-110 transition"
      style={{ background: "linear-gradient(135deg, #6C3FD8 0%, #4F46E5 55%, #7C3AED 100%)" }}
    >
      <ShieldIcon className="h-4 w-4 text-white" />
      Mes restrictions
      {count > 0 ? (
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-white/20 px-1.5 text-[11px] font-semibold text-white ring-1 ring-white/25">
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
