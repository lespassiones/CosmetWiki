/**
 * "Promesses déduites de la formule" card.
 *
 * Surfaces the bidirectional reinforcement layer: promises that the direct
 * extraction step missed (often filed as sensory / marketing-general), but
 * that we recovered by scanning unmatched formula ingredients against the
 * description. The LLM proposed each entry; the engine then mechanically
 * verified that (a) the cited excerpt is verbatim in the description, and
 * (b) the active slug exists in the formula. So every entry here is
 * "tenue" by construction.
 *
 * Visually distinct from the main coherence table: a soft emerald
 * background, a small icon, and the source ingredient + verbatim excerpt
 * shown together so users see *why* we inferred each one.
 *
 * Renders nothing when there are no inferred promises, so it can be dropped
 * into the layout unconditionally.
 */
import type { CoherencePromise } from "@/lib/coherence/types";

export function InferredPromisesCard({
  promises,
}: {
  promises: CoherencePromise[];
}) {
  const inferred = promises.filter((p) => p.inferred);
  if (inferred.length === 0) return null;

  return (
    <article className="rounded-2xl bg-emerald-50/60 ring-1 ring-emerald-100 p-5 lg:p-6">
      <header className="flex items-start gap-3 mb-4">
        <span
          aria-hidden
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white ring-1 ring-emerald-200 text-emerald-600"
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
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-semibold text-ink">
            Promesses déduites de la formule
            <span className="ml-2 text-[11px] font-medium text-emerald-700 align-middle">
              ({inferred.length})
            </span>
          </h2>
          <p className="text-[12px] text-[#6B7280] mt-0.5 leading-relaxed">
            Des ingrédients de la formule soutiennent ces effets, et la
            description en parle. On les a ajoutés pour renforcer l&apos;analyse.
          </p>
        </div>
      </header>

      <ul className="space-y-2.5">
        {inferred.map((p) => {
          const source = p.foundActives[0];
          return (
            <li
              key={p.slug}
              className="rounded-xl bg-white ring-1 ring-emerald-100 p-3 lg:p-3.5"
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="font-semibold text-[13px] lg:text-[14px] text-emerald-900 leading-tight">
                  {p.label}
                </div>
                <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-semibold ring-1 ring-emerald-200">
                  Déduite
                </span>
              </div>
              {source && (
                <div className="text-[12px] text-emerald-800/90 mb-1">
                  <span className="text-emerald-600/80">Soutien&nbsp;: </span>
                  <span className="font-medium">{source.name}</span>
                  <span className="text-[11px] text-emerald-600/80 ml-1">
                    pos.&nbsp;{source.position}
                  </span>
                </div>
              )}
              {p.excerpt && (
                <div className="text-[12px] text-[#6B7280] italic leading-snug border-l-2 border-emerald-200 pl-2 mt-1">
                  «&nbsp;{p.excerpt}&nbsp;»
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
