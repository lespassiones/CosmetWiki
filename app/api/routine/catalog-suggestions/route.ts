import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnon } from "@/lib/supabase";
import { apiGate } from "@/lib/apiGate";
import { getProfile } from "@/lib/auth";
import { readUserRestrictions, type UserRestrictions } from "@/lib/restrictions/types";
import {
  pickBestAlternative,
  type CatalogAlternative,
  type ScoredAlternative,
} from "@/lib/routine/suggestions";
import { validateSuggestions, type ValidateItem } from "@/lib/ai/validateSuggestions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 25;

/** One at-risk product the routine page wants alternatives for. */
type ReqItem = { name: string; category: string | null; score: number };

type Suggestion = {
  product: string;
  category: string | null;
  alternative: ScoredAlternative | null;
};

const EXACT_LIMIT = 30;

/**
 * Resolve a product's precise catalog category (handoff §2.2 step 1).
 * Prefer the category already resolved by the analysis (EAN -> catalog.category);
 * otherwise classify by the product NAME via the kNN-vote classifier.
 */
async function resolveCategory(
  sb: ReturnType<typeof supabaseAnon>,
  precise: string | null,
  name: string,
): Promise<string | null> {
  if (precise && precise.trim()) return precise.trim();
  try {
    const { data, error } = await sb.rpc("cosme_check_classify_product_category", {
      p_query: name,
    });
    if (error || !Array.isArray(data) || data.length === 0) return null;
    const top = data[0] as { category?: string };
    return top.category?.trim() || null;
  } catch {
    return null;
  }
}

/** Fetch exact-category alternatives for a category path (handoff §2.2 step 2). */
async function fetchAlternatives(
  sb: ReturnType<typeof supabaseAnon>,
  category: string,
): Promise<CatalogAlternative[]> {
  try {
    const { data, error } = await sb.rpc("cosme_check_alternatives_by_category_exact", {
      p_category: category,
      p_limit: EXACT_LIMIT,
      p_offset: 0,
    });
    if (error || !Array.isArray(data)) return [];
    return (data as Record<string, unknown>[]).map((row) => ({
      ean: String(row.ean ?? ""),
      brand: (row.brand as string | null) ?? null,
      name: (row.name as string | null) ?? null,
      category: (row.category as string | null) ?? null,
      image_url: (row.image_url as string | null) ?? null,
      score: (row.score as number) ?? 0,
      ingredients_text: (row.ingredients_text as string | null) ?? null,
      count_orange: (row.count_orange as number) ?? 0,
      count_rouge: (row.count_rouge as number) ?? 0,
    }));
  } catch {
    return [];
  }
}

/**
 * POST /api/routine/catalog-suggestions
 * Body: { items: [{ name, category, score }] }  (at-risk products, score < 13)
 * Returns: { suggestions: [{ product, category, alternative | null }] }
 *
 * Pipeline (handoff §2): resolve precise category -> exact-match alternatives ->
 * filter by capped score + restrictions (best per product) -> AI guardrail with
 * re-route -> debit 1 'routine_suggest' credit only if a suggestion survives.
 */
export async function POST(req: NextRequest) {
  let body: { items?: unknown };
  try {
    body = (await req.json()) as { items?: unknown };
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const items: ReqItem[] = Array.isArray(body.items)
    ? (body.items as unknown[])
        .map((it) => {
          const o = (it ?? {}) as Record<string, unknown>;
          const name = typeof o.name === "string" ? o.name.trim() : "";
          if (!name) return null;
          return {
            name: name.slice(0, 200),
            category: typeof o.category === "string" && o.category.trim() ? o.category.trim() : null,
            score: typeof o.score === "number" ? o.score : 0,
          } satisfies ReqItem;
        })
        .filter((x): x is ReqItem => x !== null)
        .slice(0, 5)
    : [];

  if (items.length === 0) return NextResponse.json({ suggestions: [] });

  // Auth + IP rate-limit, but DO NOT charge yet — we only debit if a suggestion
  // survives the guardrail (handoff §2.2 step 5).
  const gate = await apiGate(req, { feature: "routine_suggest", costCredits: 0 });
  if (!gate.ok) return gate.response;
  const { user } = gate;

  const profile = await getProfile();
  const restrictions: UserRestrictions = readUserRestrictions(profile?.preferences ?? null);

  const sb = supabaseAnon();

  // ── Stage 1+2+3: per product, resolve category -> alternatives -> best ──
  const drafts = await Promise.all(
    items.map(async (item): Promise<Suggestion & { resolvedCategory: string | null }> => {
      const category = await resolveCategory(sb, item.category, item.name);
      if (!category) {
        return { product: item.name, category: null, alternative: null, resolvedCategory: null };
      }
      const alts = await fetchAlternatives(sb, category);
      const best = pickBestAlternative(item.score, alts, restrictions);
      return { product: item.name, category, alternative: best, resolvedCategory: category };
    }),
  );

  // ── Stage 4: AI guardrail on the (product, alternative) pairs ──
  const withAlt = drafts
    .map((d, i) => ({ d, i, score: items[i].score }))
    .filter((x) => x.d.alternative !== null);

  if (withAlt.length > 0) {
    const pairs: ValidateItem[] = withAlt.map((x) => ({
      product: x.d.product,
      alternative: x.d.alternative!.name ?? x.d.alternative!.ean,
    }));
    const verdicts = await validateSuggestions(pairs, user.id);

    await Promise.all(
      withAlt.map(async (x, k) => {
        const verdict = verdicts[k] ?? { logical: true, product_type: "" };
        if (verdict.logical) return; // keep as is

        // Illogical pair: re-route via the AI-resolved real product type.
        const draft = drafts[x.i];
        const reType = verdict.product_type?.trim();
        if (!reType) {
          draft.alternative = null; // no better path -> drop
          return;
        }
        const reCategory = await resolveCategory(sb, null, reType);
        if (!reCategory || reCategory === draft.resolvedCategory) {
          draft.alternative = null;
          return;
        }
        const reAlts = await fetchAlternatives(sb, reCategory);
        const reBest = pickBestAlternative(x.score, reAlts, restrictions);
        draft.alternative = reBest; // may be null -> dropped
        draft.category = reCategory;
      }),
    );
  }

  const suggestions: Suggestion[] = drafts.map((d) => ({
    product: d.product,
    category: d.category,
    alternative: d.alternative,
  }));

  const hasSuggestions = suggestions.some((s) => s.alternative !== null);

  // ── Stage 5: debit one credit only if at least one suggestion survived ──
  if (hasSuggestions) {
    const charge = await gate.consumeCredit("routine_suggest");
    if (!charge.ok) return charge.response;
  }

  return NextResponse.json({ suggestions });
}
