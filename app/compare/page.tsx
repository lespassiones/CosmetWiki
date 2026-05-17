import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { compareAnalyses, type CompareSide } from "@/lib/routine/compare";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import { GLASS_CARD, GLASS_CARD_ROSE } from "@/lib/ui/glass";
import { IngredientBlob } from "@/components/blob/IngredientBlob";
import { CompareInsights } from "@/components/compare/CompareInsights";
import { shortenProductName } from "@/lib/text/shortenProductName";

type Flagged = { name: string; fn: string | null; color: "Orange" | "Rouge" };

function flaggedFor(side: CompareSide): Flagged[] {
  return side.result.items
    .filter((i) => i.colorRating === "Orange" || i.colorRating === "Rouge")
    .map((i) => ({
      name: i.name ?? i.input,
      fn: i.primaryFunction,
      color: i.colorRating as "Orange" | "Rouge",
    }));
}

function pctSansPenalite(side: CompareSide): number | null {
  return side.result.counts.matched > 0
    ? Math.round((side.result.counts.vert / side.result.counts.matched) * 100)
    : null;
}

export const metadata = { title: "Comparer · Cosme Check" };

type SearchParams = Promise<{ ids?: string }>;

export default async function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  const { ids } = await searchParams;
  const user = await getUser();
  if (!user) redirect(`/auth/sign-in?next=/compare?ids=${ids ?? ""}`);

  const list = (ids ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (list.length !== 2) notFound();

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data } = await sb
    .schema("cosme_check")
    .from("analyses")
    .select("id, name, product_label, score, result_json")
    .in("id", list);

  const rows = (data ?? []) as {
    id: string;
    name: string | null;
    product_label: string | null;
    score: number | null;
    result_json: AnalyseResponse;
  }[];
  if (rows.length !== 2) notFound();

  // Preserve URL order so the user sees A/B in the order they picked.
  const ordered = list.map((id) => rows.find((r) => r.id === id)!).filter(Boolean);
  const [a, b]: CompareSide[] = ordered.map((r) => ({
    id: r.id,
    name: r.product_label ?? r.name ?? "Analyse",
    score: r.score,
    result: r.result_json,
  })) as [CompareSide, CompareSide];

  // Routine context for the "bon à savoir" exposure insight only.
  const { data: routine } = await sb
    .schema("cosme_check")
    .from("routine_items")
    .select("analyses(id, result_json)");
  const routineSlugs = new Set<string>();
  for (const it of (routine ?? []) as unknown as { analyses: { id: string; result_json: AnalyseResponse } | null }[]) {
    if (!it.analyses) continue;
    if (it.analyses.id === a.id || it.analyses.id === b.id) continue;
    for (const ing of it.analyses.result_json.items) {
      if (ing.slug) routineSlugs.add(ing.slug);
    }
  }

  const diff = compareAnalyses(a, b, { routineIngredientSlugs: routineSlugs });

  // "Bon à savoir" — a couple of concrete, non-judgmental facts derived from
  // the data. We deliberately drop the "X is better than Y by N points" line.
  const bonASavoir: string[] = [];
  const aOverlap = Array.from(routineSlugs).filter((s) =>
    a.result.items.some((i) => i.slug === s),
  ).length;
  const bOverlap = Array.from(routineSlugs).filter((s) =>
    b.result.items.some((i) => i.slug === s),
  ).length;
  if (aOverlap >= 3) {
    bonASavoir.push(
      `${aOverlap} ingrédients de **${a.name}** se retrouvent déjà dans d'autres produits de ta routine — exposition cumulée à surveiller.`,
    );
  }
  if (bOverlap >= 3) {
    bonASavoir.push(
      `${bOverlap} ingrédients de **${b.name}** se retrouvent déjà dans d'autres produits de ta routine — exposition cumulée à surveiller.`,
    );
  }
  // Fragrance allergens are a concrete heads-up that doesn't pick a side.
  const allergensA = a.result.euFragranceAllergens?.total ?? 0;
  const allergensB = b.result.euFragranceAllergens?.total ?? 0;
  if (allergensA > 0 && allergensB === 0) {
    bonASavoir.push(
      `**${a.name}** contient ${allergensA} allergène${allergensA > 1 ? "s" : ""} de parfum déclaré${allergensA > 1 ? "s" : ""} (UE) — à éviter en cas de peau réactive.`,
    );
  } else if (allergensB > 0 && allergensA === 0) {
    bonASavoir.push(
      `**${b.name}** contient ${allergensB} allergène${allergensB > 1 ? "s" : ""} de parfum déclaré${allergensB > 1 ? "s" : ""} (UE) — à éviter en cas de peau réactive.`,
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 lg:px-8 py-6 lg:py-10">
      <Link href="/history" className="text-sm text-[#6B7280] hover:text-black inline-flex items-center gap-1 mb-3">
        ← Mon historique
      </Link>
      <h1 className="text-2xl lg:text-3xl font-bold mb-6">Comparer 2 produits</h1>

      {/* Hero — two blobs side by side, no big score number, no winner badge. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6">
        {[a, b].map((side) => {
          const pct = pctSansPenalite(side);
          return (
            <article key={side.id} className={`${GLASS_CARD} p-5 lg:p-6`}>
              <div className="text-[11px] uppercase tracking-wide text-ink-subtle mb-1">
                {side.result.counts.matched} ingrédients reconnus
              </div>
              <h2 className="text-[15px] font-semibold mb-3 line-clamp-2">{side.name}</h2>

              <IngredientBlob
                counts={{
                  vert: side.result.counts.vert,
                  jaune: side.result.counts.jaune,
                  orange: side.result.counts.orange,
                  rouge: side.result.counts.rouge,
                }}
                variant="md"
                showCenter
                showLegend
                subtitle={
                  pct !== null ? (
                    <p className="text-[13px] italic text-emerald-700">
                      <span className="font-semibold not-italic">{pct} %</span> sans pénalité
                    </p>
                  ) : null
                }
              />
            </article>
          );
        })}
      </div>

      {/* AI portraits + "what they share" + "how to choose". The short
          names match what we feed the LLM so highlight substring lookups
          land cleanly inside the generated copy. */}
      <CompareInsights
        aId={a.id}
        bId={b.id}
        nameA={a.name}
        nameB={b.name}
        shortNameA={shortenProductName(a.name)}
        shortNameB={shortenProductName(b.name)}
      />

      {/* À surveiller — appears for each product that has orange/red ingredients.
          Renders one warning card per product so the user can quickly see which
          side has irritants without scanning the full ingredient list. */}
      {(() => {
        const fA = flaggedFor(a);
        const fB = flaggedFor(b);
        if (fA.length === 0 && fB.length === 0) return null;
        return (
          <div className="space-y-3 mb-4">
            {fA.length > 0 && <AttentionCard name={a.name} items={fA} />}
            {fB.length > 0 && <AttentionCard name={b.name} items={fB} />}
          </div>
        );
      })()}

      {/* Bon à savoir — only when we actually have something concrete to say */}
      {bonASavoir.length > 0 && (
        <section className={`${GLASS_CARD} p-5`}>
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-subtle mb-3">
            Bon à savoir
          </h3>
          <ul className="space-y-2 text-[14px] leading-relaxed">
            {bonASavoir.map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" aria-hidden />
                <span>{renderBold(t)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Keep the deterministic diff in the DOM (commented out) so we
          can re-enable it during the rollout if the AI output is missing
          or judged insufficient. We don't render the old "Différences
          clés" list anymore — it duplicated what the portraits say. */}
      {diff.uniqueToA.length + diff.uniqueToB.length === 0 && (
        <p className="mt-4 text-[12px] text-ink-subtle text-center">
          Les deux compositions ne diffèrent pas sur les ingrédients pénalisants.
        </p>
      )}
    </div>
  );
}

function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>,
  );
}

function AttentionCard({ name, items }: { name: string; items: Flagged[] }) {
  const nbRouge = items.filter((i) => i.color === "Rouge").length;
  const nbOrange = items.filter((i) => i.color === "Orange").length;
  // Build the count phrasing — only mention the categories actually present.
  const parts: string[] = [];
  if (nbRouge > 0) parts.push(`${nbRouge} ingrédient${nbRouge > 1 ? "s" : ""} en rouge`);
  if (nbOrange > 0) parts.push(`${nbOrange} ingrédient${nbOrange > 1 ? "s" : ""} en orange`);
  const countLabel = parts.join(" et ");

  // Sort red first so the most-concerning items lead the list.
  const sorted = items
    .slice()
    .sort((x, y) => (x.color === y.color ? 0 : x.color === "Rouge" ? -1 : 1));
  const visible = sorted.slice(0, 8);
  const extra = sorted.length - visible.length;

  return (
    <article className={`${GLASS_CARD_ROSE} p-5`}>
      <div className="flex items-start gap-3 mb-3">
        <span aria-hidden className="text-xl shrink-0 leading-none mt-0.5">⚠️</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">
            À surveiller
          </p>
          <h3 className="text-[15px] font-semibold text-rose-900 truncate">{name}</h3>
          <p className="text-[13px] leading-relaxed text-rose-800 mt-2">
            Ce produit contient {countLabel}. Ces ingrédients peuvent dessécher, irriter ou
            sensibiliser la peau, surtout en usage répété ou sur peau réactive.
          </p>
        </div>
      </div>

      <ul className="space-y-1.5 mt-2">
        {visible.map((it, i) => (
          <li key={i} className="flex items-center gap-2 text-[13px]">
            <span
              aria-hidden
              className={`h-2 w-2 rounded-full shrink-0 ${
                it.color === "Rouge" ? "bg-rose-500" : "bg-orange-500"
              }`}
            />
            <span className="font-medium text-rose-900">{it.name}</span>
            {it.fn && <span className="text-[12px] text-rose-600 truncate">— {it.fn}</span>}
          </li>
        ))}
        {extra > 0 && (
          <li className="text-[12px] italic text-rose-600 pl-4">
            +{extra} autre{extra > 1 ? "s" : ""} ingrédient{extra > 1 ? "s" : ""} à surveiller
          </li>
        )}
      </ul>

      <p className="text-[12px] italic text-rose-700 mt-3">
        Surveille la réaction de ta peau et espace l&apos;usage si tu observes des signes
        d&apos;irritation. À éviter en cas de peau sensible ou de barrière cutanée fragilisée.
      </p>
    </article>
  );
}
