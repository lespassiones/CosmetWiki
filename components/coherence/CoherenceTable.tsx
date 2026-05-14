import { GLASS_CARD } from "@/lib/ui/glass";
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

  return (
    <article className={`${GLASS_CARD} p-5 lg:p-6`}>
      <h2 className="text-[15px] lg:text-[17px] font-semibold mb-4">Tableau de cohérence</h2>

      {/* DESKTOP TABLE */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-[13px]">
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
                      <span className="font-medium text-ink">{p.label}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone.bgSoft} ${tone.text} ring-1 ${tone.ringSoft}`}
                    >
                      {tone.label}
                    </span>
                  </td>
                  <td className="py-3 pr-4 align-top text-ink-muted">
                    {renderFoundList(p)}
                  </td>
                  <td className="py-3 align-top text-ink-muted">
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
