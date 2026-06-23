import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnon } from "@/lib/supabase";
import { apiGate } from "@/lib/apiGate";
import { getProfile } from "@/lib/auth";
import { readSkinProfile } from "@/lib/skin/profile";
import { readUserRestrictions } from "@/lib/restrictions/types";
import { resolveExclusion, type ExcludeSpec } from "@/lib/advisor/excludeMap";
import { buildExclusionSet, isExcluded } from "@/lib/alternatives/filter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 25;

/** Qualité : badge entre feuille (13) et cœur (17) — on ne propose que du sûr. */
const ADVISOR_MIN_SCORE = 15;
const FETCH_LIMIT = 24;
const DISPLAY_LIMIT = 10;

/** Produit recommandé, forme catalogue renvoyée au client. */
export type AdvisorProduct = {
  ean: string;
  name: string | null;
  brand: string | null;
  image_url: string | null;
  score: number | null;
  score_label: string | null;
  score_tone: string | null;
  ingredients_text: string | null;
};

type RecoRpcRow = {
  ean: string;
  brand: string | null;
  name: string | null;
  image_url: string | null;
  score: number | null;
  score_label: string | null;
  score_tone: string | null;
  ingredients_text: string | null;
};

function mapRows(data: unknown): AdvisorProduct[] {
  const rows = (data as RecoRpcRow[] | null) ?? [];
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => ({
    ean: String(r.ean ?? ""),
    name: r.name ?? null,
    brand: r.brand ?? null,
    image_url: r.image_url ?? null,
    score: r.score ?? null,
    score_label: r.score_label ?? null,
    score_tone: r.score_tone ?? null,
    ingredients_text: r.ingredients_text ?? null,
  }));
}

/**
 * POST /api/advisor/recommendations
 * Body: { ingredients: string[], form: string | null, exclude?: string[] }
 *
 * À partir des critères du bloc RECO émis par l'advisor :
 *   1. RPC `cosme_check_recommend_products` : produits du bon TYPE (`form`),
 *      classés par pertinence ingrédients puis score, badge >= 15. Restrictions
 *      du PROFIL **et** contraintes ad-hoc du message appliquées CÔTÉ SERVEUR.
 *   2. Allergies en texte libre : filtrées ici (sous-chaîne).
 *   3. RELÂCHEMENT : si plus aucun produit ne coche TOUTES les contraintes
 *      ad-hoc, on identifie laquelle bloque et on propose le meilleur compromis.
 *      On ne relâche JAMAIS les restrictions du profil.
 *
 * N'IMPUTE PAS de crédit : le message advisor a déjà été débité par /chat.
 */
export async function POST(req: NextRequest) {
  let body: { ingredients?: unknown; form?: unknown; exclude?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const ingredients = Array.isArray(body.ingredients)
    ? (body.ingredients as unknown[])
        .filter((x): x is string => typeof x === "string" && x.trim().length >= 2)
        .map((x) => x.trim())
        .slice(0, 4)
    : [];
  if (ingredients.length === 0) {
    return NextResponse.json({ products: [], rawCount: 0, emptyReason: "none", relaxation: null });
  }
  const form = typeof body.form === "string" && body.form.trim() ? body.form.trim() : null;
  const excludeKeywords = Array.isArray(body.exclude)
    ? (body.exclude as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 8)
    : [];

  // Auth + IP rate-limit, sans débit (le crédit a été pris par /chat).
  const gate = await apiGate(req, { feature: "advisor", costCredits: 0 });
  if (!gate.ok) return gate.response;

  const profile = await getProfile();
  const restrictions = readUserRestrictions(profile?.preferences ?? null);
  const skin = readSkinProfile(profile?.preferences ?? null);

  const profileFamilies = restrictions.families;
  const profileIngredients = restrictions.ingredients.map((i) => i.name).filter(Boolean);

  // Contraintes ad-hoc reconnues (les inconnues/sensorielles sont ignorées ici,
  // l'advisor les décline dans son texte).
  const adhoc: { spec: ExcludeSpec }[] = [];
  for (const kw of excludeKeywords) {
    const spec = resolveExclusion(kw);
    if (spec) adhoc.push({ spec });
  }

  // Filtre freeform (allergies texte libre) : non géré par la RPC.
  const freeformEx = buildExclusionSet([], skin.allergiesFreeform);
  const applyFreeform = (products: AdvisorProduct[]) =>
    freeformEx.exact.size === 0 && freeformEx.substrings.length === 0
      ? products
      : products.filter((p) => !isExcluded(p.ingredients_text, freeformEx));

  const sb = supabaseAnon();

  // Appel RPC avec un sous-ensemble de contraintes ad-hoc actives.
  const query = async (activeAdhoc: { spec: ExcludeSpec }[]): Promise<AdvisorProduct[]> => {
    const families = [...new Set([...profileFamilies, ...activeAdhoc.flatMap((a) => a.spec.families)])];
    const ings = [...new Set([...profileIngredients, ...activeAdhoc.flatMap((a) => a.spec.ingredients)])];
    const { data, error } = await sb.rpc("cosme_check_recommend_products", {
      p_terms: ingredients,
      p_form: form,
      p_min_score: ADVISOR_MIN_SCORE,
      p_limit: FETCH_LIMIT,
      p_exclude_families: families,
      p_exclude_ingredients: ings,
    });
    if (error || !data) return [];
    return applyFreeform(mapRows(data));
  };

  // Sonde sans aucune exclusion : distingue « bloqué par restrictions » de « rien trouvé ».
  const probeRawCount = async (): Promise<number> => {
    const { data } = await sb.rpc("cosme_check_recommend_products", {
      p_terms: ingredients,
      p_form: form,
      p_min_score: ADVISOR_MIN_SCORE,
      p_limit: 1,
      p_exclude_families: [],
      p_exclude_ingredients: [],
    });
    return Array.isArray(data) ? (data as unknown[]).length : 0;
  };

  // 1) Set STRICT : toutes les contraintes (profil + ad-hoc).
  const strict = await query(adhoc);
  if (strict.length > 0 || adhoc.length === 0) {
    const rawCount = strict.length > 0 ? strict.length : await probeRawCount();
    return NextResponse.json({
      products: strict.slice(0, DISPLAY_LIMIT),
      rawCount,
      emptyReason: strict.length > 0 ? null : rawCount > 0 ? "restrictions" : "none",
      relaxation: null,
    });
  }

  // 2) STRICT vide AVEC contraintes ad-hoc -> RELÂCHEMENT : on cherche quelle
  //    contrainte lâcher pour retrouver des produits (jamais le profil).
  const drops = await Promise.all(
    adhoc.map(async (dropped) => {
      const kept = adhoc.filter((a) => a !== dropped);
      const products = await query(kept);
      return { dropped, kept, products };
    }),
  );
  let best =
    drops.filter((d) => d.products.length > 0).sort((a, b) => b.products.length - a.products.length)[0] ?? null;

  // Si lâcher UNE contrainte ne suffit pas, on lâche TOUTES les ad-hoc (profil conservé).
  if (!best) {
    const onlyProfile = await query([]);
    if (onlyProfile.length > 0) {
      best = { dropped: null as never, kept: [], products: onlyProfile };
    }
  }

  if (!best) {
    const rawCount = await probeRawCount();
    return NextResponse.json({
      products: [],
      rawCount,
      emptyReason: rawCount > 0 ? "restrictions" : "none",
      relaxation: null,
    });
  }

  const droppedLabels = best.dropped
    ? [best.dropped.spec.label]
    : adhoc.map((a) => a.spec.label); // cas « toutes lâchées »
  const keptLabels = best.dropped ? best.kept.map((a) => a.spec.label) : [];

  return NextResponse.json({
    products: [],
    rawCount: 0,
    emptyReason: null,
    relaxation: {
      keptLabels: [...new Set(keptLabels)],
      droppedLabels: [...new Set(droppedLabels)],
      products: best.products.slice(0, DISPLAY_LIMIT),
    },
  });
}
