import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import {
  exploreOpenPromise,
  extractPromisesFromDescription,
  generateConclusion,
  type FormulaItemForLlm,
} from "@/lib/ai/coherence";
import {
  buildCoherenceResult,
  resolveOpenPromise,
  resolvePromise,
} from "@/lib/coherence/engine";
import { findCategoryBySlug } from "@/lib/coherence/claims";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import type { CoherencePromise } from "@/lib/coherence/types";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

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
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(ip, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop d'analyses récentes. Réessaye dans une minute." },
      {
        status: 429,
        headers: { "Retry-After": Math.ceil(rl.retryAfter / 1000).toString() },
      },
    );
  }

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

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  // Look up the parent analysis. RLS already restricts to the user's own
  // rows; we add an explicit user_id check as belt-and-braces.
  const { data: analysisRow, error: analysisErr } = await sb
    .schema("cosme_check")
    .from("analyses")
    .select("id, user_id, name, product_label, result_json")
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

  // ─── Step 1: extract promises from the description (LLM, JSON schema strict) ─
  const extraction = await extractPromisesFromDescription(description, user.id);

  // ─── Step 2: split proposals between catalogue and open ───────────────────
  // - catalogue: slug ∈ CLAIM_CATEGORIES → resolved by the engine using the
  //   static claim → actives mapping.
  // - open: slug = "autre" or unknown → resolved via a per-promise LLM
  //   exploration that picks active candidates *from the actual formula*.
  const cataloguePromises: CoherencePromise[] = [];
  const openProposals: typeof extraction.proposals = [];
  for (const p of extraction.proposals) {
    if (findCategoryBySlug(p.category_slug)) {
      cataloguePromises.push(resolvePromise(p, parent.items));
    } else {
      openProposals.push(p);
    }
  }

  // ─── Step 3: open promises — explore the formula via LLM in parallel ─────
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

  const promises = [...cataloguePromises, ...openPromises];

  // ─── Step 4: build the full structured result (engine, deterministic) ────
  // ─── Step 5: write the conclusion sentence (LLM, only sees the verdicts)
  const conclusion = await generateConclusion(promises, productLabel, user.id);
  const result = buildCoherenceResult({
    description,
    promises,
    unverifiable: extraction.unverifiable,
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

  return NextResponse.json({ id: saved.id, result });
}
