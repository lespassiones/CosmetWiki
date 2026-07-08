import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { compareAnalyses, type CompareSide } from "@/lib/routine/compare";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import { CompareView, type CompareGroup, type CompareHero } from "@/components/compare/CompareView";
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
      .select("id, name, product_label, score, ean, result_json")
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
    ean: string | null;
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

  const heroFor = (side: CompareSide, ean: string | null): CompareHero => ({
    id: side.id,
    name: side.name,
    score: side.score,
    ean,
    counts: {
      vert: side.result.counts.vert,
      jaune: side.result.counts.jaune,
      orange: side.result.counts.orange,
      rouge: side.result.counts.rouge,
      matched: side.result.counts.matched,
    },
  });

  // Family grouping stays server-side (needs the families table); we hand the
  // client only the slim { label, color, count } it renders.
  const toGroups = (flags: Flagged[]): CompareGroup[] =>
    groupByFamily(flags, familyLabelByTag).map((g) => ({
      label: g.label,
      color: g.color,
      count: g.items.length,
    }));

  return (
    <div className="mx-auto max-w-5xl px-5 lg:px-8 py-6 lg:py-10">
      <Link href="/history" className="text-sm text-[#6B7280] hover:text-black inline-flex items-center gap-1 mb-3">
        ← Mon historique
      </Link>
      <h1 className="text-2xl lg:text-3xl font-bold mb-6">Comparer 2 produits</h1>

      <CompareView
        a={heroFor(a, ordered[0]?.ean ?? null)}
        b={heroFor(b, ordered[1]?.ean ?? null)}
        shortNameA={shortenProductName(a.name)}
        shortNameB={shortenProductName(b.name)}
        groupsA={toGroups(flaggedFor(a))}
        groupsB={toGroups(flaggedFor(b))}
        bonASavoir={bonASavoir}
        sameComposition={diff.uniqueToA.length + diff.uniqueToB.length === 0}
      />
    </div>
  );
}
