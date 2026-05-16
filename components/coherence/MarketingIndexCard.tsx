import { InfoBadge, Tooltip } from "../Tooltip";
import type { CoherenceResult } from "@/lib/coherence/types";

/**
 * "Indice marketing" card — % of promises with NO documented active behind
 * them (verdicts: marketing OR non_demontree). High value = the description
 * over-promises relative to the formula.
 *
 * The body explicitly nuances the metric: it shows the breakdown across the
 * 4 verdicts so the user understands why "0/2 tenues" can coexist with
 * "indice marketing 50 %" (the missing 50 % are partial verdicts — actives
 * present but in trace ≤ 1 %).
 */
export function MarketingIndexCard({
  metrics,
}: {
  metrics: CoherenceResult["metrics"];
}) {
  const idx = metrics.marketingIndex;
  const noActiveCount = metrics.marketingCount + metrics.nonDemontreeCount;
  const total = metrics.totalPromises;

  return (
    <article className="rounded-2xl bg-rose-50/70 ring-1 ring-rose-100 p-5 lg:p-6 flex flex-wrap items-start gap-x-6 gap-y-3">
      <div className="flex-[0_0_180px]">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
            Indice marketing
          </div>
          <Tooltip
            placement="bottom"
            maxWidth={420}
            content={
              <>
                <b>Indice marketing</b> = % de promesses sans <b>aucun</b> ingrédient
                documenté (verdict <b>marketing</b> ou <b>non démontrée</b>).
                <br /><br />
                C&apos;est <b>différent du verdict global</b> (qui ne compte que les
                promesses <b>totalement tenues</b>). La différence : les promesses{" "}
                <b>partielles</b> (actifs présents mais en trace ≤ 1 %) ne sont
                comptées ni dans l&apos;un ni dans l&apos;autre — elles ont des
                actifs, juste sous-dosés.
                <br /><br />
                <b>Ici</b> : {metrics.marketingCount + metrics.nonDemontreeCount}{" "}
                promesse{metrics.marketingCount + metrics.nonDemontreeCount > 1 ? "s" : ""}{" "}
                sans actif sur {metrics.totalPromises} = {idx} % marketing pur.
              </>
            }
          >
            <button type="button" aria-label="Comment l'indice marketing est-il calculé ?">
              <InfoBadge />
            </button>
          </Tooltip>
        </div>
        <div className="text-[44px] lg:text-[56px] font-bold leading-none tabular-nums text-rose-700">
          {idx} %
        </div>
        <div className="text-[11px] text-rose-700/80 mt-1">
          {noActiveCount} promesse{noActiveCount > 1 ? "s" : ""} sur {total} sans actif documenté
        </div>
      </div>
      <div className="min-w-[16rem] flex-1 space-y-3">
        <div className="text-[13px] leading-relaxed text-rose-900/85">
          {total === 0 ? (
            <>
              La description ne contient aucune promesse d&apos;effet vérifiable —
              uniquement des mentions générales (composition, certification, sensorialité).
            </>
          ) : noActiveCount === 0 ? (
            <>
              Toutes les promesses détectées ont au moins un actif documenté
              dans la formule pour les soutenir. C&apos;est cohérent.
            </>
          ) : (
            <>
              <span className="font-semibold">
                {noActiveCount} promesse{noActiveCount > 1 ? "s" : ""}
              </span>{" "}
              sur {total} n&apos;{noActiveCount > 1 ? "ont " : "a "}aucun ingrédient
              documenté dans la formule pour {noActiveCount > 1 ? "les" : "la"} soutenir.
              Ce sont :
              <ul className="mt-2 space-y-1 list-none">
                <li className="flex gap-2">
                  <span aria-hidden className="text-rose-700/70 shrink-0">•</span>
                  <span>
                    soit des promesses purement marketing, sans support biologique réel ;
                  </span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className="text-rose-700/70 shrink-0">•</span>
                  <span>
                    soit des promesses qui découlent indirectement des autres promesses.
                  </span>
                </li>
              </ul>
            </>
          )}
        </div>

        {/* Breakdown of the 4 verdicts so the gap between marketing index and
            verdict global is explicit. */}
        {total > 0 && (
          <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px]">
            {metrics.tenueCount > 0 && (
              <li className="inline-flex items-center gap-1.5 text-emerald-700">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {metrics.tenueCount} tenue{metrics.tenueCount > 1 ? "s" : ""}
              </li>
            )}
            {metrics.partielleCount > 0 && (
              <li className="inline-flex items-center gap-1.5 text-amber-700">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {metrics.partielleCount} partielle{metrics.partielleCount > 1 ? "s" : ""}
              </li>
            )}
            {metrics.marketingCount > 0 && (
              <li className="inline-flex items-center gap-1.5 text-orange-700">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                {metrics.marketingCount} marketing
              </li>
            )}
            {metrics.nonDemontreeCount > 0 && (
              <li className="inline-flex items-center gap-1.5 text-rose-700">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                {metrics.nonDemontreeCount} non démontrée{metrics.nonDemontreeCount > 1 ? "s" : ""}
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
}
