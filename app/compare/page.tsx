import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { compareAnalyses, type CompareSide } from "@/lib/routine/compare";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import { GLASS_CARD, GLASS_CARD_ROSE } from "@/lib/ui/glass";
import { CompareInsights } from "@/components/compare/CompareInsights";
import { ExposureBar, ExposureCountsRow } from "@/components/compare/ExposureBar";
import { shortenProductName } from "@/lib/text/shortenProductName";
import { loadIngredientFamilies } from "@/lib/restrictions/families";

type Flagged = {
  name: string;
  fn: string | null;
  color: "Orange" | "Rouge";
  tags: string[];
};

function flaggedFor(side: CompareSide): Flagged[] {
  return side.result.items
    .filter((i) => i.colorRating === "Orange" || i.colorRating === "Rouge")
    .map((i) => ({
      name: i.name ?? i.input,
      fn: i.primaryFunction,
      color: i.colorRating as "Orange" | "Rouge",
      tags: i.tags ?? [],
    }));
}

type FamilyGroup = {
  label: string;
  color: "Orange" | "Rouge";
  items: Flagged[];
};

/**
 * Group flagged ingredients by ingredient family (tag from
 * cosme_check.ingredient_families). Items without a known family tag fall
 * back to their primary function, or "Autres" when even that's missing.
 * Returns groups sorted with reds first, then by descending item count.
 */
function groupByFamily(
  items: Flagged[],
  familyLabelByTag: Map<string, string>,
): FamilyGroup[] {
  const groups = new Map<string, FamilyGroup>();
  for (const item of items) {
    let label: string | null = null;
    if (item.tags && item.tags.length > 0) {
      for (const tag of item.tags) {
        const famLabel = familyLabelByTag.get(tag);
        if (famLabel) {
          label = famLabel;
          break;
        }
      }
    }
    const finalLabel = label ?? item.fn ?? "Autres";
    const existing = groups.get(finalLabel) ?? {
      label: finalLabel,
      color: "Orange" as "Orange" | "Rouge",
      items: [],
    };
    existing.items.push(item);
    if (item.color === "Rouge") existing.color = "Rouge";
    groups.set(finalLabel, existing);
  }
  return Array.from(groups.values()).sort((a, b) => {
    if (a.color !== b.color) return a.color === "Rouge" ? -1 : 1;
    return b.items.length - a.items.length;
  });
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
  const [analysesRes, families, routineRes] = await Promise.all([
    sb
      .schema("cosme_check")
      .from("analyses")
      .select("id, name, product_label, score, result_json")
      .in("id", list),
    loadIngredientFamilies(),
    sb
      .schema("cosme_check")
      .from("routine_items")
      .select("analyses(id, result_json)")
      .limit(30),
  ]);

  const rows = (analysesRes.data ?? []) as {
    id: string;
    name: string | null;
    product_label: string | null;
    score: number | null;
    result_json: AnalyseResponse;
  }[];
  if (rows.length !== 2) notFound();

  // Tag → label lookup, used to group flagged ingredients into families.
  const familyLabelByTag = new Map<string, string>();
  for (const f of families) {
    if (f.tagSlug) familyLabelByTag.set(f.tagSlug, f.name);
  }

  // Preserve URL order so the user sees A/B in the order they picked.
  const ordered = list.map((id) => rows.find((r) => r.id === id)!).filter(Boolean);
  const [a, b]: CompareSide[] = ordered.map((r) => ({
    id: r.id,
    name: r.product_label ?? r.name ?? "Analyse",
    score: r.score,
    result: r.result_json,
  })) as [CompareSide, CompareSide];

  // Routine context for the "bon à savoir" exposure insight only.
  const { data: routine } = routineRes;
  const routineSlugs = new Set<string>();
  for (const it of (routine ?? []) as unknown as { analyses: { id: string; result_json: AnalyseResponse } | null }[]) {
    if (!it.analyses) continue;
    if (it.analyses.id === a.id || it.analyses.id === b.id) continue;
    for (const ing of it.analyses.result_json.items) {
      if (ing.slug) routineSlugs.add(ing.slug);
    }
  }

  const diff = compareAnalyses(a, b, { routineIngredientSlugs: routineSlugs });

  // "Bon à savoir" - a couple of concrete, non-judgmental facts derived from
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
      `${aOverlap} ingrédients de **${a.name}** se retrouvent déjà dans d'autres produits de ta routine - exposition cumulée à surveiller.`,
    );
  }
  if (bOverlap >= 3) {
    bonASavoir.push(
      `${bOverlap} ingrédients de **${b.name}** se retrouvent déjà dans d'autres produits de ta routine - exposition cumulée à surveiller.`,
    );
  }
  // Fragrance allergens are a concrete heads-up that doesn't pick a side.
  const allergensA = a.result.euFragranceAllergens?.total ?? 0;
  const allergensB = b.result.euFragranceAllergens?.total ?? 0;
  if (allergensA > 0 && allergensB === 0) {
    bonASavoir.push(
      `**${a.name}** contient ${allergensA} allergène${allergensA > 1 ? "s" : ""} de parfum déclaré${allergensA > 1 ? "s" : ""} (UE) - à éviter en cas de peau réactive.`,
    );
  } else if (allergensB > 0 && allergensA === 0) {
    bonASavoir.push(
      `**${b.name}** contient ${allergensB} allergène${allergensB > 1 ? "s" : ""} de parfum déclaré${allergensB > 1 ? "s" : ""} (UE) - à éviter en cas de peau réactive.`,
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 lg:px-8 py-6 lg:py-10">
      <Link href="/history" className="text-sm text-[#6B7280] hover:text-black inline-flex items-center gap-1 mb-3">
        ← Mon historique
      </Link>
      <h1 className="text-2xl lg:text-3xl font-bold mb-6">Comparer 2 produits</h1>

      {/* Hero - stacked exposure bars. Mobile: stacked vertically, one card
          per product. Desktop: side by side. The bar replaces the heavy
          half-donut so the two products read instantly. */}
      <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 mb-6">
        {[a, b].map((side) => (
          <article key={side.id} className={`${GLASS_CARD} p-4 lg:p-5`}>
            <div className="mb-2">
              <h2 className="text-[14px] lg:text-[15px] font-semibold text-ink line-clamp-2">
                {side.name}
              </h2>
            </div>

            <ExposureBar
              counts={{
                vert: side.result.counts.vert,
                jaune: side.result.counts.jaune,
                orange: side.result.counts.orange,
                rouge: side.result.counts.rouge,
              }}
            />

            <div className="mt-2.5 flex items-center justify-between gap-3">
              <span className="text-[12px] text-ink-subtle">
                {side.result.counts.matched} ingrédients reconnus
              </span>
              <ExposureCountsRow
                counts={{
                  vert: side.result.counts.vert,
                  jaune: side.result.counts.jaune,
                  orange: side.result.counts.orange,
                  rouge: side.result.counts.rouge,
                }}
              />
            </div>
          </article>
        ))}
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

      {/* À surveiller - one card per product, grouped by ingredient family
          so the user sees "the formula is loaded in silicones" instead of
          scanning 10 individual INCI names. */}
      {(() => {
        const fA = flaggedFor(a);
        const fB = flaggedFor(b);
        if (fA.length === 0 && fB.length === 0) return null;
        return (
          <div className="space-y-3 mb-4">
            {fA.length > 0 && (
              <AttentionCard
                name={a.name}
                groups={groupByFamily(fA, familyLabelByTag)}
              />
            )}
            {fB.length > 0 && (
              <AttentionCard
                name={b.name}
                groups={groupByFamily(fB, familyLabelByTag)}
              />
            )}
          </div>
        );
      })()}

      {/* Bon à savoir - only when we actually have something concrete to say */}
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

function AttentionCard({ name, groups }: { name: string; groups: FamilyGroup[] }) {
  return (
    <article className={`${GLASS_CARD_ROSE} p-4`}>
      <header className="flex items-start gap-2.5 mb-3">
        <WarnIcon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">
            À surveiller
          </p>
          <h3 className="text-[14px] font-semibold text-rose-900 truncate">{name}</h3>
        </div>
      </header>

      <ul className="space-y-1.5">
        {groups.map((g) => (
          <li key={g.label} className="text-[13px] leading-snug">
            <span
              aria-hidden
              className={`inline-block h-2 w-2 rounded-full mr-2 align-middle ${
                g.color === "Rouge" ? "bg-rose-500" : "bg-orange-500"
              }`}
            />
            <span className="font-semibold text-rose-900">{g.label}</span>
            <span className="text-rose-700/80"> ({g.items.length})</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function WarnIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  );
}
