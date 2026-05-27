/**
 * POST /api/synthesis
 *
 * Generates (or returns the already-generated) AI synthesis for a saved
 * analysis. Split out of /api/analyser so the initial scan response is fast
 * (a few hundred ms — DB lookup + colour bucketing only) and the slow LLM
 * call is deferred until the user explicitly asks for the full analysis by
 * clicking "Voir l'analyse complète".
 *
 * Body: { analysisId: string }
 * Returns: { synthesis: string | null }
 *
 * Auth required. Only the owner of the analysis can request its synthesis.
 * The result is persisted back into `analyses.result_json.synthesis` so
 * subsequent visits to the same analysis are instant (no further LLM call).
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { logError } from "@/lib/log";
import { safeError } from "@/lib/safeError";
import { generateSynthesis } from "@/lib/ai/synthesis";
import { stripAbsencesParagraph } from "@/lib/ai/sanitize";
import { loadProfileForPrompt } from "@/lib/skin/promptFormat";
import { loadRestrictionsContext } from "@/lib/restrictions/promptFormat";
import { checkRestrictions } from "@/lib/restrictions/check";
import type { AnalyseItem, AnalyseResponse } from "@/lib/analyseTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 25;

type Body = { analysisId?: string };

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const analysisId = (body.analysisId ?? "").trim();
  if (!analysisId) {
    return NextResponse.json({ error: "analysisId manquant." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: userData } = await sb.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: row, error: rowError } = await sb
    .schema("cosme_check")
    .from("analyses")
    .select("id, user_id, product_label, score, result_json")
    .eq("id", analysisId)
    .single();

  if (rowError || !row) {
    return NextResponse.json({ error: "Analyse introuvable." }, { status: 404 });
  }
  if (row.user_id !== user.id) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const resultJson = row.result_json as AnalyseResponse | null;
  if (!resultJson || !Array.isArray(resultJson.items)) {
    return NextResponse.json({ error: "Analyse invalide." }, { status: 400 });
  }

  // Short-circuit if the synthesis is already cached on this row. We still
  // run it through stripAbsencesParagraph() so analyses produced BEFORE the
  // prompt change (which used to emit a "Sans X, sans Y..." bullet) display
  // without that now-redundant block. No DB write — just a read-time clean.
  if (resultJson.synthesis) {
    return NextResponse.json({
      synthesis: stripAbsencesParagraph(resultJson.synthesis),
    });
  }

  try {
    const [profileBlock, restrictionsCtx] = await Promise.all([
      loadProfileForPrompt(user.id),
      loadRestrictionsContext(user.id),
    ]);

    const items = resultJson.items as AnalyseItem[];
    // Re-run restriction matching exactly the same way /api/analyser does, so
    // the LLM gets `restriction_reason` on each item and can call out matches
    // inline instead of cross-referencing a separate block.
    const checkItems = items.map((it) => ({
      position: it.position,
      input: it.input,
      slug: it.slug,
      name: it.name,
      tags: it.tags ?? null,
    }));
    const matches = checkRestrictions(
      checkItems,
      restrictionsCtx.restrictions,
      restrictionsCtx.families,
    );
    const reasonByPosition = new Map<number, string>();
    for (const m of matches) {
      if (!reasonByPosition.has(m.position)) {
        reasonByPosition.set(m.position, m.label);
      }
    }

    const enriched = items.map((it) => ({
      input_raw: it.input,
      name: it.name,
      color_rating: it.colorRating,
      primary_function: it.primaryFunction,
      tags: it.tags,
      position_idx: it.position - 1,
      threshold_label: it.thresholdLabel,
      restriction_reason: reasonByPosition.get(it.position) ?? null,
    }));

    // generateSynthesis expects counts keyed by capitalised ColorRating
    // ("Vert", "Jaune", "Orange", "Rouge"). The persisted result_json uses
    // lowercase keys ("vert", "jaune", ...) for the UI — without this
    // remap the synthesis ends up reading 0 for every colour and writes
    // the nonsensical "Sur les 0 ingrédients identifiés…" sentence.
    const countsForLlm: Record<string, number> = {
      Vert: resultJson.counts.vert ?? 0,
      Jaune: resultJson.counts.jaune ?? 0,
      Orange: resultJson.counts.orange ?? 0,
      Rouge: resultJson.counts.rouge ?? 0,
    };

    const rawSynthesis = await generateSynthesis({
      enriched,
      counts: countsForLlm,
      score: Number(row.score ?? 0),
      scoreLabel: (resultJson as unknown as { scoreLabel?: string }).scoreLabel ?? "",
      observations: resultJson.observations ?? [],
      productLabel: row.product_label ?? null,
      userId: user.id,
      profileBlock,
      restrictionsBlock: restrictionsCtx.block,
    });

    // Belt + braces: even though the prompt now forbids the absences bullet,
    // some LLM outputs may still sneak it in. Strip it before persisting so
    // the saved synthesis is clean from day one.
    const synthesis = rawSynthesis ? stripAbsencesParagraph(rawSynthesis) : null;

    // Persist the freshly-generated synthesis back into the row so the next
    // visit is instant (no further LLM round-trip). Best-effort: if the
    // update fails we still return the synthesis so the UI shows it.
    if (synthesis) {
      const updatedJson = { ...resultJson, synthesis };
      const { error: updateError } = await sb
        .schema("cosme_check")
        .from("analyses")
        .update({ result_json: updatedJson })
        .eq("id", analysisId);
      if (updateError) {
        logError("synthesis.persist", updateError, { userId: user.id, analysisId });
      }
    }

    return NextResponse.json({ synthesis });
  } catch (err) {
    return safeError(err, {
      route: "synthesis.generate",
      publicMessage: "Impossible de générer la synthèse pour le moment.",
      userId: user.id,
    });
  }
}
