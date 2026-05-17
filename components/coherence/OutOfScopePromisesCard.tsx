/**
 * "Promesses hors-sujet" card.
 *
 * Displays marketing claims that the product description makes but that have
 * no biological meaning given the detected product type (e.g. "production de
 * collagène" on a hair product — hair has no collagen-producing cells).
 *
 * Visually deliberate: amber-ish neutral, not red — we don't accuse the
 * brand of fraud, we explain why the claim is biologically irrelevant on
 * THIS type of product. Aligned with the "we decode, we don't judge"
 * positioning.
 *
 * Renders nothing when there are no out-of-scope items, so it can be
 * dropped into a layout unconditionally.
 */
import {
  PRODUCT_TYPE_LABELS,
  type OutOfScopePromise,
  type ProductType,
} from "@/lib/coherence/types";

export function OutOfScopePromisesCard({
  items,
  productType,
}: {
  items: OutOfScopePromise[] | undefined;
  productType: ProductType | undefined;
}) {
  if (!items || items.length === 0) return null;

  const typeLabel = productType ? PRODUCT_TYPE_LABELS[productType] : null;

  return (
    <article className="rounded-2xl bg-amber-50/60 ring-1 ring-amber-100 p-5 lg:p-6">
      <header className="flex items-start gap-3 mb-4">
        <span
          aria-hidden
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white ring-1 ring-amber-200 text-amber-600"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12" y2="16" />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-semibold text-ink">
            Promesses hors-sujet
            <span className="ml-2 text-[11px] font-medium text-amber-700 align-middle">
              ({items.length})
            </span>
          </h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
            {typeLabel
              ? `La description fait des promesses qui n'ont pas de sens biologique pour un produit de type "${typeLabel}". On les liste ici, hors du verdict global — la formule ne peut pas être jugée sur des effets qui ne s'appliquent pas à ce type de produit.`
              : "La description fait des promesses qui n'ont pas de sens biologique pour ce type de produit. On les liste ici, hors du verdict global."}
          </p>
        </div>
      </header>

      <ul className="space-y-3">
        {items.map((o, i) => (
          <li
            key={`${o.excerpt}-${i}`}
            className="rounded-xl bg-white ring-1 ring-amber-100 p-3.5"
          >
            <div className="flex flex-wrap items-baseline gap-2 mb-1.5">
              {o.claimed_effect ? (
                <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 text-[11px] font-medium px-2 py-0.5">
                  {o.claimed_effect}
                </span>
              ) : null}
              <span className="text-[12.5px] text-ink italic">
                « {o.excerpt} »
              </span>
            </div>
            <p className="text-[12.5px] leading-relaxed text-ink-muted">
              {o.reason}
            </p>
          </li>
        ))}
      </ul>
    </article>
  );
}
