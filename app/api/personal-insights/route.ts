/**
 * POST /api/personal-insights — 3 encarts PERSONNALISÉS (objectifs / peau / à
 * surveiller) pour une analyse sauvegardée, selon le profil de l'utilisateur.
 * Port web de l'Edge Function mobile `personal-insights`.
 *
 * Pipeline : auth (cookies) → profil+restrictions → signature de profil →
 * court-circuit GRATUIT si déjà généré pour ce profil → CRÉDIT D'ABORD
 * (1 crédit, 429 si épuisé, AUCUN appel IA) → génération → persistance.
 *
 * Body: { analysisId } · Returns: { blocks } · Crédit : 1 à la génération.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { logError } from "@/lib/log";
import { loadProfileForPrompt } from "@/lib/skin/promptFormat";
import { loadRestrictionsContext } from "@/lib/restrictions/promptFormat";
import { checkRestrictions } from "@/lib/restrictions/check";
import {
  generatePersonalBlocks,
  profileSignature,
  type PersonalBlocks,
} from "@/lib/ai/personalInsights";
import type { AnalyseItem, AnalyseResponse } from "@/lib/analyseTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 25;

type Body = { analysisId?: string };

type StoredResultJson = AnalyseResponse & {
  catalogCategory?: string | null;
  productType?: string | null;
  personalBlocks?: PersonalBlocks | null;
  personalBlocksKey?: string | null;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const analysisId = (body.analysisId ?? "").trim();
  if (!analysisId) return NextResponse.json({ error: "analysisId manquant." }, { status: 400 });

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: userData } = await sb.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { data: row, error: rowError } = await sb
    .schema("cosme_check")
    .from("analyses")
    .select("id, user_id, product_label, product_type, category, score, result_json")
    .eq("id", analysisId)
    .single();
  if (rowError || !row) return NextResponse.json({ error: "Analyse introuvable." }, { status: 404 });
  if (row.user_id !== user.id) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const resultJson = row.result_json as StoredResultJson | null;
  if (!resultJson || !Array.isArray(resultJson.items)) {
    return NextResponse.json({ error: "Analyse invalide." }, { status: 400 });
  }

  // Profil + restrictions → signature
  const [profileBlock, restrictionsCtx] = await Promise.all([
    loadProfileForPrompt(user.id),
    loadRestrictionsContext(user.id),
  ]);
  const sig = profileSignature(profileBlock, restrictionsCtx.block);

  // Court-circuit GRATUIT : déjà généré pour ce profil ET version courante.
  if (resultJson.personalBlocks && resultJson.personalBlocksKey === sig) {
    return NextResponse.json({ blocks: resultJson.personalBlocks });
  }

  // CRÉDIT : seule la PREMIÈRE génération coûte 1 crédit. Si des blocs existent
  // déjà mais que la clé est PÉRIMÉE (nouvelle version de prompt / profil
  // modifié), c'est une RÉGÉNÉRATION d'un contenu DÉJÀ PAYÉ → jamais re-débité.
  const alreadyHasBlocks = Boolean(resultJson.personalBlocks);
  if (!alreadyHasBlocks) {
    const { data: creditData } = await sb.rpc("cosme_check_consume_credit", {
      p_feature: "personal_insights",
    });
    const consume = (creditData ?? { ok: false }) as { ok: boolean; used?: number; limit?: number };
    if (!consume.ok) {
      return NextResponse.json(
        {
          error: "Crédits épuisés.",
          credits: { used: consume.used ?? 0, limit: consume.limit ?? 100, remaining: 0 },
        },
        { status: 429, headers: { "Retry-After": "86400" } },
      );
    }
  }

  // Matching restrictions item-level
  const items = resultJson.items as AnalyseItem[];
  const checkItems = items.map((it) => ({
    position: it.position,
    input: it.input,
    slug: it.slug,
    name: it.name,
    tags: it.tags ?? null,
  }));
  const matches = checkRestrictions(checkItems, restrictionsCtx.restrictions, restrictionsCtx.families);
  const reasonByPosition = new Map<number, string>();
  for (const m of matches) if (!reasonByPosition.has(m.position)) reasonByPosition.set(m.position, m.label);

  const enriched = items.map((it) => ({
    input_raw: it.input,
    name: it.name,
    color_rating: it.colorRating,
    primary_function: it.primaryFunction,
    tags: it.tags,
    restriction_reason: reasonByPosition.get(it.position) ?? null,
  }));

  try {
    const blocks = await generatePersonalBlocks({
      enriched,
      counts: {
        Vert: resultJson.counts.vert ?? 0,
        Jaune: resultJson.counts.jaune ?? 0,
        Orange: resultJson.counts.orange ?? 0,
        Rouge: resultJson.counts.rouge ?? 0,
      },
      score: Number(row.score ?? 0),
      scoreLabel: (resultJson as unknown as { scoreLabel?: string }).scoreLabel ?? "",
      productLabel: row.product_label ?? null,
      category: row.product_type ?? resultJson.catalogCategory ?? (row.category as string | null) ?? null,
      userId: user.id,
      profileBlock,
      restrictionsBlock: restrictionsCtx.block,
      restrictionMatches: matches.map((m) => ({ inciName: m.inciName, label: m.label })),
    });

    if (!blocks) {
      return NextResponse.json({ error: "Génération indisponible pour le moment." }, { status: 503 });
    }

    const updatedJson = { ...resultJson, personalBlocks: blocks, personalBlocksKey: sig };
    const { error: updateError } = await sb
      .schema("cosme_check")
      .from("analyses")
      .update({ result_json: updatedJson })
      .eq("id", analysisId);
    if (updateError) logError("personal-insights.persist", updateError, { userId: user.id, analysisId });

    return NextResponse.json({ blocks });
  } catch (err) {
    logError("personal-insights.generate", err, { userId: user.id, analysisId });
    return NextResponse.json({ error: "Génération indisponible pour le moment." }, { status: 500 });
  }
}
