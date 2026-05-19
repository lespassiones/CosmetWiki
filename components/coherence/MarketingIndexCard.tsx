import { InfoBadge, Tooltip } from "../Tooltip";
import type { CoherenceResult } from "@/lib/coherence/types";

/**
 * "Indice marketing" card - % of promises NOT supported by the formula:
 * verdicts `marketing` (cosmetic-only actives), `non_demontree` (no
 * documented active at all) AND `contredite` (the formula actively
 * contradicts an "absence" claim - e.g. "sans sulfate" but a sulfate is
 * listed). This must match what `computeMetrics` puts in
 * `metrics.marketingIndex` (cf. lib/coherence/engine.ts), otherwise the
 * big "17 %" headline diverges from the sub-count text below it.
 *
 * The body explicitly nuances the metric: it shows the breakdown across all
 * verdicts so the user understands why "0/2 tenues" can coexist with
 * "indice marketing 50 %" (the missing 50 % are partial verdicts - actives
 * present but in trace ≤ 1 %).
 */
export function MarketingIndexCard({
  metrics,
}: {
  metrics: CoherenceResult["metrics"];
}) {
  const idx = metrics.marketingIndex;
  // Same formula as engine.computeMetrics → guarantees the headline % and
  // the sub-count never disagree.
  const unsupportedCount
    = metrics.marketingCount
    + metrics.nonDemontreeCount
    + metrics.contrediteCount;
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
                <b>Indice marketing</b> = % de promesses <b>non soutenues</b> par la
                formule. On y compte les verdicts <b>marketing</b> (effet visuel/
                sensoriel uniquement), <b>non démontrée</b> (aucun actif documenté)
                et <b>contredite</b> (la formule contient l&apos;ingrédient que
                la promesse dit absent).
                <br /><br />
                C&apos;est <b>différent du verdict global</b> (qui ne compte que les
                promesses <b>totalement tenues</b>). Les promesses{" "}
                <b>partielles</b> (actifs présents mais en trace ≤ 1 %) ne sont
                comptées ni dans l&apos;un ni dans l&apos;autre - elles ont des
                actifs, juste sous-dosés.
                <br /><br />
                <b>Ici</b> : {unsupportedCount} promesse{unsupportedCount > 1 ? "s" : ""}{" "}
                non soutenue{unsupportedCount > 1 ? "s" : ""} sur {total} = {idx} %.
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
          {unsupportedCount} promesse{unsupportedCount > 1 ? "s" : ""} sur {total} non soutenue{unsupportedCount > 1 ? "s" : ""} par la formule
        </div>
      </div>
      <div className="min-w-[16rem] flex-1 space-y-3">
        <div className="text-[13px] leading-relaxed text-rose-900/85">
          {total === 0 ? (
            <>
              La description ne contient aucune promesse d&apos;effet vérifiable -
              uniquement des mentions générales (composition, certification, sensorialité).
            </>
          ) : unsupportedCount === 0 ? (
            <>
              Toutes les promesses détectées ont au moins un actif documenté
              dans la formule pour les soutenir. C&apos;est cohérent.
            </>
          ) : (
            <>
              <span className="font-semibold">
                {unsupportedCount} promesse{unsupportedCount > 1 ? "s" : ""}
              </span>{" "}
              sur {total} n&apos;{unsupportedCount > 1 ? "ont " : "a "}pas
              d&apos;ingrédient clair dans la formule pour {unsupportedCount > 1 ? "les" : "la"} soutenir.
              Cela ne veut pas forcément dire que c&apos;est faux&nbsp;:
              <ul className="mt-2 space-y-1 list-none">
                {(metrics.marketingCount > 0 || metrics.nonDemontreeCount > 0) && (
                  <>
                    <li className="flex gap-2">
                      <span aria-hidden className="text-orange-500 shrink-0">•</span>
                      <span>
                        <b>Soit des promesses purement marketing</b>, sans support
                        biologique réel.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span aria-hidden className="text-rose-500 shrink-0">•</span>
                      <span>
                        <b>Soit des promesses qui découlent indirectement</b> d&apos;autres
                        promesses (par exemple, un effet &laquo;&nbsp;éclat&nbsp;&raquo;
                        qui vient d&apos;une bonne hydratation).
                      </span>
                    </li>
                  </>
                )}
                {metrics.contrediteCount > 0 && (
                  <li className="flex gap-2">
                    <span aria-hidden className="text-rose-700 shrink-0">•</span>
                    <span>
                      <b>Soit des promesses contredites</b> par la formule&nbsp;:
                      un ingrédient que la promesse dit absent est en fait dans la
                      liste (ex&nbsp;: &laquo;&nbsp;sans sulfate&nbsp;&raquo; alors
                      qu&apos;un sulfate y figure).
                    </span>
                  </li>
                )}
              </ul>
            </>
          )}
        </div>

        {/* Breakdown across all verdicts so the gap between marketing index
            and verdict global is explicit. */}
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
            {metrics.contrediteCount > 0 && (
              <li className="inline-flex items-center gap-1.5 text-rose-800">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-rose-700" />
                {metrics.contrediteCount} contredite{metrics.contrediteCount > 1 ? "s" : ""}
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
}
