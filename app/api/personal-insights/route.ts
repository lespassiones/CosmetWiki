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
import { supabaseServer, supabaseService } from "@/lib/supabase";
import { logError } from "@/lib/log";
import { loadProfileForPrompt, loadSkinProfile } from "@/lib/skin/promptFormat";
import { loadRestrictionsContext } from "@/lib/restrictions/promptFormat";
import { checkRestrictions } from "@/lib/restrictions/check";
import { loadIngredientFamilies } from "@/lib/restrictions/families";
import {
  generatePersonalBlocks,
  profileSignature,
  type Compatibility,
  type PersonalBlocks,
} from "@/lib/ai/personalInsights";
import { detectForcedAgainst, relevanceVerdict } from "@/lib/ai/compatRelevance";
import type { AnalyseItem, AnalyseResponse } from "@/lib/analyseTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 25;

type Body = { analysisId?: string; compat?: boolean };

type StoredResultJson = AnalyseResponse & {
  catalogCategory?: string | null;
  productType?: string | null;
  personalBlocks?: PersonalBlocks | null;
  personalBlocksKey?: string | null;
  compatibility?: Compatibility | null;
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

  // Profil + restrictions (+ profil brut pour le gating) → signature
  const [rawProfileBlock, restrictionsCtx, skin] = await Promise.all([
    loadProfileForPrompt(user.id),
    loadRestrictionsContext(user.id),
    loadSkinProfile(user.id),
  ]);
  // Récap IA « sensibilités probables » (worker profile-restriction-inference) :
  // injecté dans le bloc profil comme INDICES pour les contre-indications (-5),
  // JAMAIS un malus restriction (-8). Inclus AVANT la signature → self-heal.
  let profileBlock = rawProfileBlock;
  // Slugs de FAMILLE des sensibilités déduites → SCORING : détectés dans le
  // produit → -8 (comme une restriction cochée), dédoublonnés vs les cochées.
  const inferredFamilySlugs: string[] = [];
  if (rawProfileBlock) {
    const { data: inferredRow } = await supabaseService()
      .schema("cosme_check")
      .from("profile_restriction_inference")
      .select("items")
      .eq("user_id", user.id)
      .maybeSingle();
    const inferredItems = Array.isArray(inferredRow?.items)
      ? (inferredRow?.items as { label?: string; reason?: string; slug?: string | null }[]).filter(
          (i) => typeof i?.label === "string" && i.label.trim(),
        )
      : [];
    if (inferredItems.length > 0) {
      const line = inferredItems
        .slice(0, 8)
        .map((i) => (i.reason ? `${i.label} (${i.reason})` : (i.label as string)))
        .join(" ; ");
      profileBlock = `${rawProfileBlock}\n- Sensibilités probables (déduites automatiquement du profil, NON confirmées par l'utilisateur) : ${line}`;
      for (const it of inferredItems) {
        const s = (it.slug ?? "").trim();
        if (s && !inferredFamilySlugs.includes(s)) inferredFamilySlugs.push(s);
      }
    }
  }
  const sig = profileSignature(profileBlock, restrictionsCtx.block);
  // `||` (pas `??`) : une chaîne VIDE doit retomber sur le champ suivant.
  const category = row.product_type || resultJson.catalogCategory || (row.category as string | null) || null;

  // Court-circuit GRATUIT : déjà généré pour ce profil ET version courante.
  if (resultJson.personalBlocks && resultJson.personalBlocksKey === sig) {
    return NextResponse.json({
      blocks: resultJson.personalBlocks,
      compatibility: resultJson.compatibility ?? null,
    });
  }

  // Pré-check pertinence AVANT tout crédit / IA — activé seulement si le client
  // le demande (compat:true) → rétro-compatibilité. Produit lié à un axe du
  // profil non renseigné → on renvoie compléter la section, sans débit.
  const wantCompat = body.compat === true;
  const verdict = relevanceVerdict(category, skin);
  if (wantCompat && verdict.kind === "profile_incomplete") {
    return NextResponse.json({ profileIncomplete: true, missingSection: verdict.missingSection });
  }

  // CRÉDIT — GATE (LECTURE SEULE) : on refuse AVANT tout appel IA si 0 crédit,
  // mais on ne DÉBITE qu'APRÈS une génération réussie (plus bas). Ainsi un échec
  // IA (timeout / 500 / 503) ne coûte JAMAIS de crédit et « Réessayer » reste
  // gratuit tant que la génération échoue. Si des blocs existent déjà mais que la
  // clé est PÉRIMÉE (nouvelle version de prompt / profil modifié), c'est une
  // RÉGÉNÉRATION d'un contenu DÉJÀ PAYÉ → ni gate ni débit.
  const alreadyHasBlocks = Boolean(resultJson.personalBlocks);
  if (!alreadyHasBlocks) {
    const { data: creditData } = await sb.rpc("cosme_check_get_credits");
    const credits = (creditData ?? { ok: false }) as {
      ok: boolean;
      used?: number;
      limit?: number;
      remaining?: number;
    };
    if (!credits.ok || (credits.remaining ?? 0) < 1) {
      return NextResponse.json(
        {
          error: "Crédits épuisés.",
          credits: { used: credits.used ?? 0, limit: credits.limit ?? 100, remaining: 0 },
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
  // Familles DÉDUITES du profil présentes dans le produit (mêmes -8 que les
  // restrictions cochées). loadRestrictionsContext ne charge le catalogue de
  // familles que si l'utilisateur a des restrictions cochées → on le charge ici
  // si besoin (cas « aucune restriction cochée mais sensibilités déduites »).
  let familyCatalogue = restrictionsCtx.families;
  if (inferredFamilySlugs.length > 0 && familyCatalogue.length === 0) {
    familyCatalogue = await loadIngredientFamilies();
  }
  const inferredMatches = inferredFamilySlugs.length > 0
    ? checkRestrictions(checkItems, { families: inferredFamilySlugs, ingredients: [] }, familyCatalogue)
    : [];
  const reasonByPosition = new Map<number, string>();
  for (const m of matches) if (!reasonByPosition.has(m.position)) reasonByPosition.set(m.position, m.label);

  const enriched = items.map((it) => ({
    input_raw: it.input,
    name: it.name,
    color_rating: it.colorRating,
    primary_function: it.primaryFunction,
    tags: it.tags,
    position_idx: it.position - 1,
    restriction_reason: reasonByPosition.get(it.position) ?? null,
  }));

  try {
    const result = await generatePersonalBlocks({
      enriched,
      counts: {
        Vert: resultJson.counts.vert ?? 0,
        Jaune: resultJson.counts.jaune ?? 0,
        Orange: resultJson.counts.orange ?? 0,
        Rouge: resultJson.counts.rouge ?? 0,
      },
      score: Number(row.score ?? 0),
      scoreLabel: (resultJson as unknown as { scoreLabel?: string }).scoreLabel ?? "",
      scoreTone: (resultJson as unknown as { scoreTone?: string | null }).scoreTone ?? null,
      productLabel: row.product_label ?? null,
      category,
      userId: user.id,
      profileBlock,
      restrictionsBlock: restrictionsCtx.block,
      restrictionMatches: matches.map((m) => ({
        inciName: m.inciName,
        label: m.label,
        position: m.position,
        kind: m.kind,
        slug: m.slug,
      })),
      inferredRestrictionMatches: inferredMatches.map((m) => ({
        inciName: m.inciName,
        label: m.label,
        position: m.position,
        kind: m.kind,
        slug: m.slug,
      })),
      // product_only = produit HORS PROFIL (axe "none" : dentifrice, déo…) OU
      // profil/axe non renseigné (v29, demande user 16 juil 2026) : le score
      // suit la QUALITÉ de la formule, mais l'IA liste quand même les bons
      // actifs (utiles de manière globale) et les points à surveiller —
      // affichés à 0 point dans le détail du calcul. Seul verdict "personal"
      // (axe peau/cheveux rattaché ET renseigné) donne des bonus/malus réels.
      productOnly: verdict.kind !== "personal",
      // Filets déterministes : alcool asséchant, allergènes parfum, comédogènes,
      // sulfates, allergie déclarée. Uniquement en mode personal : ces filets
      // croisent le profil PEAU/CHEVEUX, hors sujet pour un produit hors profil.
      forcedAgainst: verdict.kind === "personal" ? detectForcedAgainst(items, skin) : [],
    });

    if (!result) {
      return NextResponse.json({ error: "Génération indisponible pour le moment." }, { status: 503 });
    }
    const { blocks, compatibility } = result;

    // DÉBIT APRÈS SUCCÈS : seule la PREMIÈRE génération réussie coûte 1 crédit.
    // (Une régénération d'un contenu déjà payé — alreadyHasBlocks — ne débite
    // jamais.) Placé ici, aucun échec IA (null/exception) ne peut débiter.
    if (!alreadyHasBlocks) {
      const { data: creditData } = await sb.rpc("cosme_check_consume_credit", {
        p_feature: "personal_insights",
      });
      const consume = (creditData ?? { ok: false }) as { ok: boolean; used?: number; limit?: number };
      if (!consume.ok) {
        // Course rare : le crédit disponible au gate a été épuisé ailleurs entre
        // le gate et ici. On ne persiste RIEN et on renvoie 429 (régénérable une
        // fois les crédits rechargés) — aucun crédit n'a été débité.
        return NextResponse.json(
          {
            error: "Crédits épuisés.",
            credits: { used: consume.used ?? 0, limit: consume.limit ?? 100, remaining: 0 },
          },
          { status: 429, headers: { "Retry-After": "86400" } },
        );
      }
    }

    const updatedJson = { ...resultJson, personalBlocks: blocks, personalBlocksKey: sig, compatibility };
    const { error: updateError } = await sb
      .schema("cosme_check")
      .from("analyses")
      .update({ result_json: updatedJson })
      .eq("id", analysisId);
    if (updateError) logError("personal-insights.persist", updateError, { userId: user.id, analysisId });

    return NextResponse.json({ blocks, compatibility });
  } catch (err) {
    logError("personal-insights.generate", err, { userId: user.id, analysisId });
    return NextResponse.json({ error: "Génération indisponible pour le moment." }, { status: 500 });
  }
}
