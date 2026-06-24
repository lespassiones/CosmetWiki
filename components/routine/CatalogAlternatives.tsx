import Link from "next/link";
import { GLASS_CARD } from "@/lib/ui/glass";
import type { AtRiskProduct } from "@/lib/routine/atRisk";

/**
 * "Suggestions intelligentes" entry point on the routine page. The actual
 * suggestions live on their own page (/routine/suggestions) — rendered as a
 * normal top-anchored list — so the mobile bottom-nav can never cover them and
 * we sidestep the fixed-overlay containing-block traps. This is just the CTA.
 */
export function CatalogAlternatives({ products }: { products: AtRiskProduct[] }) {
  if (products.length === 0) return null;
  const n = products.length;

  return (
    <section className={`${GLASS_CARD} px-5 py-4`}>
      <h2 className="mb-1 flex items-center gap-2 text-[15px] font-semibold">
        <span aria-hidden>✨</span>
        Suggestions intelligentes
      </h2>
      <p className="mb-4 text-[12px] text-ink-muted">
        {n} produit{n > 1 ? "s" : ""} à optimiser. On cherche un remplaçant mieux noté dans la même
        catégorie, qui respecte tes restrictions.
      </p>

      <Link
        href="/routine/suggestions"
        className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-ink/80"
      >
        Voir mes suggestions
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </section>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
