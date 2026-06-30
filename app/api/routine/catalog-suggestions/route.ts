import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnon } from "@/lib/supabase";
import { apiGate } from "@/lib/apiGate";
import { getProfile } from "@/lib/auth";
import { readUserRestrictions, type UserRestrictions } from "@/lib/restrictions/types";
import { readSkinProfile, skinContextSummary } from "@/lib/skin/profile";
import {
  pickBestAlternative,
  type CatalogAlternative,
  type ScoredAlternative,
} from "@/lib/routine/suggestions";
import { validateSuggestions, type ValidateItem } from "@/lib/ai/validateSuggestions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 25;

/**
 * One at-risk product the routine page wants alternatives for.
 * `cappedScore` is the colour-capped score (the value the app actually displays);
 * it — NOT the raw score — is the eligibility baseline, exactly like mobile
 * (buildSuggestions: `cappedOf(a) > own + 0.5` with `own = cappedScore`).
 */
type ReqItem = {
  name: string;
  ean: string | null;
  category: string | null;
  score: number;
  cappedScore: number;
};

type Suggestion = {
  product: string;
  category: string | null;
  alternative: ScoredAlternative | null;
};

const EXACT_LIMIT = 30;

/**
 * Batch EAN -> catalog.category in a SINGLE query (cosme_check.catalog is publicly
 * readable for active rows). This is the only category that exact-matches the
 * alternatives RPC — the stored `category_precise` uses a divergent vocabulary
 * (e.g. "shampoing" vs the catalog's "shampooing"). One round-trip for all
 * products instead of one per product.
 */
async function categoriesByEan(
  sb: ReturnType<typeof supabaseAnon>,
  eans: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (eans.length === 0) return out;
  try {
    const { data } = await sb
      .schema("cosme_check")
      .from("catalog")
      .select("ean, category")
      .in("ean", eans);
    for (const r of (data as { ean: string; category: string | null }[] | null) ?? []) {
      if (r.category && r.category.trim()) out.set(String(r.ean), r.category.trim());
    }
  } catch {
    /* ignore — falls back to precise/classifier per product */
  }
  return out;
}

/**
 * Classify a product to a REAL catalog category path from its NAME, via the
 * kNN-vote classifier RPC (`cosme_check_classify_product_category`). Unlike the
 * stored `category_precise` — whose vocabulary diverges from the catalog (e.g.
 * "shampoing" vs the catalog's "shampooing") and therefore exact-matches no
 * alternatives — this always returns a path the alternatives RPC can match.
 * This is the path the mobile app trusts (it never reuses category_precise).
 */
async function classifyByName(
  sb: ReturnType<typeof supabaseAnon>,
  name: string,
): Promise<string | null> {
  const q = name.trim();
  if (q.length < 3) return null;
  try {
    const { data, error } = await sb.rpc("cosme_check_classify_product_category", {
      p_query: q,
    });
    if (!error && Array.isArray(data) && data.length > 0) {
      const cat = (data[0] as { category?: string }).category?.trim();
      if (cat) return cat;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Resolve a product's precise catalog category (handoff §2.2 step 1), in order:
 *   1. EAN -> catalog.category (real taxonomy, the reliable path — mirrors mobile);
 *   2. the precise category passed by the client (analysis category_precise);
 *   3. classify by the product NAME via the kNN-vote classifier.
 * NB: even the EAN path can land on an over-broad / mislabelled catalog category
 * (e.g. a self-tanner filed alongside temporary tattoos), so the LLM guardrail
 * below still runs on every pair — that's what keeps the suggestions logical.
 * When the resolved category yields ZERO green alternative, the caller retries
 * via `classifyByName` (handoff §2.2 re-route) — that's how the web reaches the
 * same coverage as mobile instead of silently dropping the product.
 */
async function resolveCategory(
  ean: string | null,
  precise: string | null,
  name: string,
  catByEan: Map<string, string>,
  sb: ReturnType<typeof supabaseAnon>,
): Promise<string | null> {
  const fromEan = ean && ean.trim() ? catByEan.get(ean.trim()) ?? null : null;
  if (fromEan) return fromEan;
  if (precise && precise.trim()) return precise.trim();
  return classifyByName(sb, name);
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
          const score = typeof o.score === "number" ? o.score : 0;
          return {
            name: name.slice(0, 200),
            ean: typeof o.ean === "string" && o.ean.trim() ? o.ean.trim().slice(0, 40) : null,
            category: typeof o.category === "string" && o.category.trim() ? o.category.trim() : null,
            score,
            // Older clients may not send the capped score → fall back to raw.
            cappedScore: typeof o.cappedScore === "number" ? o.cappedScore : score,
          } satisfies ReqItem;
        })
        .filter((x): x is ReqItem => x !== null)
        .slice(0, 8)
    : [];

  if (items.length === 0) return NextResponse.json({ suggestions: [] });

  // Auth + IP rate-limit, but DO NOT charge yet — we only debit if a suggestion
  // survives the guardrail (handoff §2.2 step 5).
  const gate = await apiGate(req, { feature: "routine_suggest", costCredits: 0 });
  if (!gate.ok) return gate.response;
  const { user } = gate;

  const sb = supabaseAnon();

  // Profile + the batched EAN->category lookup run concurrently (independent).
  const eans = Array.from(new Set(items.map((i) => i.ean).filter((e): e is string => Boolean(e))));
  const [profile, catByEan] = await Promise.all([getProfile(), categoriesByEan(sb, eans)]);
  const restrictions: UserRestrictions = readUserRestrictions(profile?.preferences ?? null);
  // Skin context for the AI guardrail: lets it also reject alternatives that are
  // logical-but-inappropriate for the user's skin (mirror mobile, which sends
  // skinContext to validate-suggestions). Null when the profile carries no signal.
  const skinContext = skinContextSummary(readSkinProfile(profile?.preferences ?? null));

  type Draft = Suggestion & { resolvedCategory: string | null };

  // ── Stage 1+2+3: per product, resolve category -> alternatives -> best ──
  const drafts = await Promise.all(
    items.map(async (item): Promise<Draft> => {
      let category = await resolveCategory(item.ean, item.category, item.name, catByEan, sb);
      // Baseline = CAPPED score (mirror mobile): a dangerous product's raw score
      // is far above its capped score, so using raw would inflate the threshold
      // and reject almost every alternative — that's why only one survived.
      let best = category
        ? pickBestAlternative(item.cappedScore, await fetchAlternatives(sb, category), restrictions)
        : null;
      // Re-route on EMPTY (handoff §2.2): a divergent stored `category_precise`
      // ("shampoing" vs catalog "shampooing") or an over-broad / mislabelled
      // catalog row yields 0 green alternative. Reclassify by NAME — the real
      // catalog taxonomy the mobile app trusts — and retry once. This is the gap
      // that made the web surface 2 suggestions where mobile surfaces 5.
      if (!best) {
        const byName = await classifyByName(sb, item.name);
        if (byName && byName !== category) {
          const reBest = pickBestAlternative(
            item.cappedScore,
            await fetchAlternatives(sb, byName),
            restrictions,
          );
          if (reBest) {
            category = byName;
            best = reBest;
          }
        }
      }
      return { product: item.name, category: best ? category : null, alternative: best, resolvedCategory: category };
    }),
  );

  // ── Stage 4: AI guardrail on EVERY (product, alternative) pair ──
  // Required for logic: an exact catalog category can be over-broad/mislabelled
  // (e.g. self-tanner grouped with temporary tattoos), so without this check
  // absurd pairs slip through. One batched LLM call; the whole result is cached
  // client-side, so this cost is paid once per routine change, not per visit.
  const withAlt = drafts
    .map((d, i) => ({ d, i, cappedScore: items[i].cappedScore }))
    .filter((x) => x.d.alternative !== null);

  if (withAlt.length > 0) {
    const pairs: ValidateItem[] = withAlt.map((x) => ({
      product: x.d.product,
      alternative: x.d.alternative!.name ?? x.d.alternative!.ean,
    }));
    const verdicts = await validateSuggestions(pairs, user.id, skinContext);

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
        const reCategory = await classifyByName(sb, reType);
        if (!reCategory || reCategory === draft.resolvedCategory) {
          draft.alternative = null;
          return;
        }
        const reAlts = await fetchAlternatives(sb, reCategory);
        const reBest = pickBestAlternative(x.cappedScore, reAlts, restrictions);
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
