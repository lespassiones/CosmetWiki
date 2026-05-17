import { GLASS_CARD } from "@/lib/ui/glass";
import { InfoBadge, Tooltip } from "../Tooltip";
import type { CoherencePromise, UnverifiableClaim } from "@/lib/coherence/types";
import { VERDICT_TONE } from "./tone";

/**
 * Two columns of pills:
 *   - "Promesses analysées" : promises the LLM extracted from the description.
 *     Colour-coded by the engine's verdict so the user sees at a glance
 *     which were tenue / partielle / marketing / non démontrée.
 *   - "Promesses non analysées" : description fragments that aren't actionable
 *     (composition / certification / sensoriel / marketing général).
 *
 * Renamed from "Vérifié dans la formule" → "Promesses analysées" because the
 * old wording read as "tenue par la formule", which is wrong: a promise can
 * be analysed AND not tenue. The verdict colour now carries that info.
 */
export function DescriptionKeywordsCard({
  promises,
  unverifiable,
}: {
  promises: CoherencePromise[];
  unverifiable: UnverifiableClaim[];
}) {
  if (promises.length === 0 && unverifiable.length === 0) return null;

  return (
    <article className={`${GLASS_CARD} p-5 lg:p-6`}>
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-[15px] lg:text-[17px] font-semibold">
          Ce qu&apos;on a lu sur l&apos;emballage
        </h2>
        <Tooltip
          placement="bottom"
          maxWidth={420}
          content={
            <>
              À <b>gauche</b> : les promesses extraites de la description, colorées
              par leur verdict (vert = tenue, jaune = partielle, orange = marketing,
              rose = non démontrée, rouge foncé = contredite par la formule).
              <br /><br />
              À <b>droite</b> : les phrases qu&apos;on n&apos;a pas pu vérifier
              côté formule (ex : « 96 % naturel » = composition, « odeur sucrée »
              = sensoriel). Pas un défaut, juste pas analysable côté formule.
              <br /><br />
              <b>Ici</b> : {promises.length} promesse{promises.length > 1 ? "s" : ""} analysée{promises.length > 1 ? "s" : ""},{" "}
              {unverifiable.length} non analysée{unverifiable.length > 1 ? "s" : ""}.
            </>
          }
        >
          <button type="button" aria-label="Que veulent dire ces deux colonnes ?">
            <InfoBadge />
          </button>
        </Tooltip>
      </div>
      <p className="text-[12px] text-[#6B7280] mb-4">
        Les promesses extraites de la description (avec leur verdict) et les
        mentions qui n&apos;ont pas pu être analysées côté formule.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle mb-2">
            Promesses analysées
          </div>
          {promises.length === 0 ? (
            <p className="text-[12px] text-[#9CA3AF]">Aucune promesse analysable détectée.</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {promises.map((p) => {
                const tone = VERDICT_TONE[p.verdict];
                return (
                  <li
                    key={p.slug + p.excerpt}
                    title={`${p.label} — ${tone.label}`}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${tone.bgSoft} ${tone.text} ring-1 ${tone.ringSoft}`}
                  >
                    <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${tone.bg}`} />
                    {p.label.toLowerCase()}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] mb-2">
            Promesses non analysées
          </div>
          {unverifiable.length === 0 ? (
            <p className="text-[12px] text-[#9CA3AF]">
              Toutes les mentions sont rattachées à une promesse analysée.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {unverifiable.map((u, i) => (
                <li
                  key={i}
                  className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[12px] font-medium text-[#4B5563] ring-1 ring-[#E5E7EB]"
                  title={u.reason}
                >
                  {u.excerpt.length > 36 ? `${u.excerpt.slice(0, 36)}…` : u.excerpt}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </article>
  );
}
