import { NextResponse, type NextRequest } from "next/server";
import {
  detectProductType,
  exploreOpenPromise,
  extractPromisesFromDescription,
  generateConclusion,
  inferPromisesFromOrphans,
  type FormulaItemForLlm,
} from "@/lib/ai/coherence";
import {
  buildCoherenceResult,
  buildInferredPromise,
  dedupProposals,
  isExcerptInDescription,
  pickOrphansForInference,
  resolveAbsencePromise,
  resolveOpenPromise,
  resolvePromise,
} from "@/lib/coherence/engine";
import { findCategoryBySlug, isAbsenceCategory } from "@/lib/coherence/claims";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import type { CoherencePromise, ProductType } from "@/lib/coherence/types";
import { apiGate } from "@/lib/apiGate";
import { idempotencyKey, idempotencyLookup, idempotencyStore } from "@/lib/idempotency";
import { logError } from "@/lib/log";
import { loadProfileForPrompt } from "@/lib/skin/promptFormat";
import { loadRestrictionsForPrompt } from "@/lib/restrictions/promptFormat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  analysis_id?: string;
  description?: string;
};

/**
 * POST /api/coherence
 * Body: { analysis_id, description }
 *
 * Pipeline:
 *   1. Auth + look up the parent analysis (must belong to the user).
 *   2. LLM extracts promises + unverifiable claims from the description
 *      (constrained JSON schema).
 *   3. Engine resolves each promise mechanically against the parent items.
 *   4. LLM writes a one-sentence conclusion based on the verdicts.
 *   5. Persist the full result in cosme_check.coherence_analyses.
 *
 * Returns: { id, result }
 */
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const analysisId = (body.analysis_id ?? "").trim();
  const description = (body.description ?? "").trim();
  if (!analysisId) {
    return NextResponse.json({ error: "analysis_id manquant." }, { status: 400 });
  }
  if (description.length < 30) {
    return NextResponse.json(
      { error: "Description trop courte (au moins 30 caractères)." },
      { status: 400 },
    );
  }
  if (description.length > 6000) {
    return NextResponse.json(
      { error: "Description trop longue (max 6000 caractères)." },
      { status: 400 },
    );
  }

  // Auth + IP rate-limit (no credit yet - idempotency lookup first to avoid
  // double-billing duplicate clicks).
  const gate = await apiGate(req, { feature: "coherence", costCredits: 0 });
  if (!gate.ok) return gate.response;
  const { user, supabase: sb } = gate;

  const idemKey = idempotencyKey(user.id, "coherence", { analysisId, description });
  const cached = await idempotencyLookup(idemKey);
  if (cached) return cached;

  // Now consume 1 credit. On exhaustion → 429.
  const charge = await gate.consumeCredit("coherence");
  if (!charge.ok) return charge.response;

  try {
  // Look up the parent analysis. RLS already restricts to the user's own
  // rows; we add an explicit user_id check as belt-and-braces.
  // We also pull `product_type` (string hint from OCR / identification) and
  // `brand` so we can give the type detector richer context.
  const { data: analysisRow, error: analysisErr } = await sb
    .schema("cosme_check")
    .from("analyses")
    .select("id, user_id, name, product_label, product_type, brand, result_json")
    .eq("id", analysisId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (analysisErr || !analysisRow) {
    return NextResponse.json(
      { error: "Analyse INCI introuvable ou inaccessible." },
      { status: 404 },
    );
  }

  const parent = analysisRow.result_json as AnalyseResponse;
  if (!parent || !Array.isArray(parent.items) || parent.items.length === 0) {
    return NextResponse.json(
      { error: "L'analyse INCI source est invalide ou vide." },
      { status: 400 },
    );
  }

  const productLabel
    = (analysisRow.product_label as string | null)
    ?? (analysisRow.name as string | null)
    ?? null;

  // ─── Step 0: detect product type (silent LLM call). ─────────────────────
  // The hint comes from the OCR'd front photo + the brand name. The detector
  // returns one of 8 enums (+ "autre"). The full description is the strongest
  // signal so we pass it as the primary input; the hint disambiguates when
  // the description is short or generic.
  const typeHint = [
    analysisRow.product_type as string | null,
    productLabel,
    analysisRow.brand as string | null,
  ]
    .filter((s): s is string => Boolean(s && s.trim()))
    .join(" - ");
  const productType: ProductType = await detectProductType(
    description,
    typeHint || null,
    user.id,
  );

  // ─── Step 1: extract promises from the description (LLM, JSON schema strict) ─
  const extraction = await extractPromisesFromDescription(
    description,
    productType,
    user.id,
  );
  // Mechanical safety net: collapse any duplicate proposals the LLM may have
  // emitted despite the prompt rule (cf. dedupProposals docstring).
  const dedupedProposals = dedupProposals(extraction.proposals);

  // ─── Step 2: split proposals between catalogue (effect), catalogue
  // (absence), and open ───────────────────────────────────────────────────
  // - catalogue effect: slug ∈ CLAIM_CATEGORIES without forbiddenTag → engine
  //   matches catalogue actives against parent.items.
  // - catalogue absence: slug ∈ CLAIM_CATEGORIES with forbiddenTag → engine
  //   scans parent.items[].tags for the forbidden tag (no LLM step needed).
  // - open: slug = "autre" or unknown → per-promise LLM exploration that
  //   picks active candidates *from the actual formula*.
  const cataloguePromises: CoherencePromise[] = [];
  const openProposals: typeof extraction.proposals = [];
  for (const p of dedupedProposals) {
    const cat = findCategoryBySlug(p.category_slug);
    if (cat && isAbsenceCategory(cat)) {
      cataloguePromises.push(resolveAbsencePromise(p, cat, parent.items));
    } else if (cat) {
      cataloguePromises.push(resolvePromise(p, parent.items));
    } else {
      openProposals.push(p);
    }
  }

  // ─── Step 3: open promises - explore the formula via LLM in parallel ─────
  // The LLM only sees items with a slug (those we can match back) and is
  // constrained to cite slugs from the list it receives. resolveOpenPromise
  // re-validates every cited slug against the items as defence-in-depth.
  const itemsForLlm: FormulaItemForLlm[] = parent.items
    .filter((it): it is typeof it & { slug: string; name: string } =>
      Boolean(it.slug) && Boolean(it.name),
    )
    .map((it) => ({
      slug: it.slug,
      name: it.name,
      primaryFunction: it.primaryFunction,
    }));

  const openPromises: CoherencePromise[] = await Promise.all(
    openProposals.map(async (p) => {
      const exploration = await exploreOpenPromise(
        p.label,
        p.excerpt,
        itemsForLlm,
        user.id,
      );
      return resolveOpenPromise(p, parent.items, exploration.matches, exploration.missing);
    }),
  );

  const directPromises = [...cataloguePromises, ...openPromises];

  // ─── Step 3-bis: bidirectional reinforcement (formula → description) ─────
  // For each ingredient in the formula that NO direct promise cited, ask the
  // LLM whether the description mentions its documented effect. If yes (and
  // we can verify the cited excerpt is verbatim in the description), promote
  // it to an "inferred" promise. This catches promises the extraction step
  // missed because the LLM filed them as sensory/marketing-general instead
  // of as analysable promises (e.g. "rend les mains douces" → "douceur" not
  // in the catalogue, sometimes dropped into unverifiable).
  //
  // Best-effort: any failure (timeout, LLM unavailable, schema error) is
  // swallowed - the analysis still returns the directPromises set.
  let inferredPromises: CoherencePromise[] = [];
  try {
    const matchedSlugs = new Set<string>(
      directPromises
        .flatMap((p) => [
          ...p.foundActives.map((a) => a.slug),
          ...p.cosmeticActives.map((a) => a.slug),
        ])
        .filter((s): s is string => Boolean(s)),
    );
    const orphans = pickOrphansForInference(parent.items, matchedSlugs);

    if (orphans.length > 0) {
      const alreadyCoveredLabels = directPromises.map((p) => p.label);
      const proposals = await inferPromisesFromOrphans(
        description,
        orphans,
        alreadyCoveredLabels,
        user.id,
      );

      // Anti-hallucination guards (defence in depth on top of the prompt
      // rules): (a) the support_excerpt MUST appear verbatim in the
      // description, (b) the active_slug MUST resolve to a real formula
      // item AND match one of the orphans we submitted (so the LLM can't
      // re-claim an already-matched ingredient or invent a new one).
      const orphanSlugSet = new Set(orphans.map((o) => o.slug));
      const seenInferredSlugs = new Set<string>();
      for (const p of proposals) {
        if (!orphanSlugSet.has(p.active_slug)) continue;
        if (seenInferredSlugs.has(p.active_slug)) continue; // dedup
        if (!isExcerptInDescription(p.support_excerpt, description)) continue;
        const built = buildInferredPromise(p, parent.items);
        if (built) {
          inferredPromises.push(built);
          seenInferredSlugs.add(p.active_slug);
        }
      }
    }
  } catch (err) {
    // Inference is purely additive - if it fails, fall back to the direct
    // promises and continue. Logged at warn so we can monitor success rate.
    logError("coherence.infer_orphans", err, { userId: user.id });
    inferredPromises = [];
  }

  const promises = [...directPromises, ...inferredPromises];

  // ─── Step 4: build the full structured result (engine, deterministic) ────
  // ─── Step 5: write the conclusion sentence (LLM, only sees the verdicts)
  // Load skin profile so the conclusion can flag verdicts that specifically
  // matter for this user (sensible peau, allergies, etc.). Best-effort: a
  // missing profile just yields a generic conclusion.
  const [profileBlock, restrictionsBlock] = await Promise.all([
    loadProfileForPrompt(user.id),
    loadRestrictionsForPrompt(user.id),
  ]);
  const conclusion = await generateConclusion(
    promises,
    productLabel,
    user.id,
    profileBlock,
    restrictionsBlock,
  );
  const result = buildCoherenceResult({
    description,
    promises,
    unverifiable: extraction.unverifiable,
    outOfScope: extraction.outOfScope,
    productType,
    parent,
    conclusion,
  });

  // Step 4: persist
  const { data: saved, error: saveErr } = await sb
    .schema("cosme_check")
    .from("coherence_analyses")
    .insert({
      user_id: user.id,
      analysis_id: analysisId,
      description,
      result_json: result,
    })
    .select("id")
    .single();

  if (saveErr || !saved) {
    return NextResponse.json(
      { error: "Échec de sauvegarde de l'analyse de cohérence." },
      { status: 500 },
    );
  }

    const response = NextResponse.json({ id: saved.id, result });
    await idempotencyStore(idemKey, response);
    return response;
  } catch (err) {
    logError("coherence", err, { userId: user.id });
    return NextResponse.json(
      { error: "Erreur lors de l'analyse de cohérence." },
      { status: 500 },
    );
  }
}
