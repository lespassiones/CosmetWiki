import { GLASS_CARD } from "@/lib/ui/glass";
import { InfoBadge, Tooltip } from "../Tooltip";
import type { CoherencePromise } from "@/lib/coherence/types";
import { VERDICT_TONE } from "./tone";

/**
 * The dense reference table. Desktop: real <table> with 4 columns. Mobile:
 * the same data restructured as a stack of cards (one per promise) since
 * a 4-column table is unreadable below ~600px.
 */
export function CoherenceTable({ promises }: { promises: CoherencePromise[] }) {
  if (promises.length === 0) {
    return (
      <article className={`${GLASS_CARD} p-6 text-center`}>
        <p className="text-[14px] text-[#6B7280]">
          Aucune promesse vérifiable n&apos;a été détectée dans la description.
        </p>
        <p className="text-[12px] text-[#9CA3AF] mt-1">
          La description ne contient peut-être que des mentions générales
          (composition, certification, sensorialité…).
        </p>
      </article>
    );
  }

  // Counts for the contextual tooltip — picks an example per verdict tier.
  const verdictCounts = {
    tenue: promises.filter((p) => p.verdict === "tenue").length,
    partielle: promises.filter((p) => p.verdict === "partielle").length,
    marketing: promises.filter((p) => p.verdict === "marketing").length,
    non_demontree: promises.filter((p) => p.verdict === "non_demontree").length,
  };

  return (
    <article className={`${GLASS_CARD} p-5 lg:p-6`}>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[15px] lg:text-[17px] font-semibold">Tableau de cohérence</h2>
        <Tooltip
          placement="bottom"
          maxWidth={340}
          content={
            <>
              <b>Promesse</b> : ce que dit l&apos;emballage.<br />
              <b>Verdict</b> : niveau de soutien par la formule.<br />
              <b>Ingrédients trouvés</b> : actifs présents dans la formule pour cette promesse.<br />
              <b>Manque</b> : actifs typiquement utilisés pour cette promesse mais absents.
              <br /><br />
              <b>Sur cette analyse</b> :{" "}
              {verdictCounts.tenue > 0 && <>{verdictCounts.tenue} tenue{verdictCounts.tenue > 1 ? "s" : ""}</>}
              {verdictCounts.partielle > 0 && <>{verdictCounts.tenue > 0 ? ", " : ""}{verdictCounts.partielle} partielle{verdictCounts.partielle > 1 ? "s" : ""}</>}
              {verdictCounts.marketing > 0 && <>, {verdictCounts.marketing} marketing</>}
              {verdictCounts.non_demontree > 0 && <>, {verdictCounts.non_demontree} non démontrée{verdictCounts.non_demontree > 1 ? "s" : ""}</>}.
            </>
          }
        >
          <button type="button" aria-label="Comment lire ce tableau ?">
            <InfoBadge />
          </button>
        </Tooltip>
      </div>

      {/* DESKTOP TABLE — column widths tuned: promise & verdict stay tight,
          "found" is squeezed (the user said names don't really matter), and
          "missing" gets the most room (it's the actionable info). */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-[13px] table-fixed">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[12%]" />
            <col className="w-[22%]" />
            <col className="w-[48%]" />
          </colgroup>
          <thead>
            <tr className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
              <th className="pb-3 pr-4">Promesse</th>
              <th className="pb-3 pr-4">Verdict</th>
              <th className="pb-3 pr-4">Ingrédients trouvés</th>
              <th className="pb-3">Manque pour tenir cette promesse</th>
            </tr>
          </thead>
          <tbody>
            {promises.map((p) => {
              const tone = VERDICT_TONE[p.verdict];
              return (
                <tr key={p.slug + p.excerpt} className="border-t border-black/[0.04]">
                  <td className="py-3 pr-4 align-top">
                    <div className="flex items-start gap-2">
                      <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone.bg}`} />
                      <span className="font-medium text-ink leading-snug">{p.label}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone.bgSoft} ${tone.text} ring-1 ${tone.ringSoft}`}
                    >
                      {tone.label}
                    </span>
                  </td>
                  <td className="py-3 pr-4 align-top text-ink-muted text-[12px]">
                    <div className="line-clamp-3" title={renderFoundList(p)}>
                      {renderFoundList(p)}
                    </div>
                  </td>
                  <td className="py-3 align-top text-ink-muted text-[12px] leading-relaxed">
                    {p.missingActives.length === 0
                      ? "—"
                      : p.missingActives.join(", ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS — stacked */}
      <ul className="space-y-2.5 lg:hidden">
        {promises.map((p) => {
          const tone = VERDICT_TONE[p.verdict];
          return (
            <li
              key={p.slug + p.excerpt}
              className="rounded-2xl bg-white p-3.5 ring-1 ring-black/[0.06]"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-start gap-2 min-w-0">
                  <span
                    aria-hidden
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone.bg}`}
                  />
                  <span className="font-semibold text-ink leading-tight">{p.label}</span>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.bgSoft} ${tone.text} ring-1 ${tone.ringSoft}`}
                >
                  {tone.label}
                </span>
              </div>
              <dl className="text-[12px] space-y-1">
                <div>
                  <dt className="inline text-[#9CA3AF]">Trouvé : </dt>
                  <dd className="inline text-ink-muted">{renderFoundList(p)}</dd>
                </div>
                <div>
                  <dt className="inline text-[#9CA3AF]">Manque : </dt>
                  <dd className="inline text-ink-muted">
                    {p.missingActives.length === 0 ? "—" : p.missingActives.join(", ")}
                  </dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

function renderFoundList(p: CoherencePromise): string {
  const parts: string[] = [];
  for (const f of p.foundActives) {
    parts.push(`${f.name}${f.inTrace ? " (≤ 1 %)" : ""}`);
  }
  for (const c of p.cosmeticActives) {
    parts.push(`${c.name} (${c.note})`);
  }
  if (parts.length === 0) return "—";
  return parts.join(", ");
}
