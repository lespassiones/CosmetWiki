import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import type { AnalyseResponse } from "@/lib/analyseTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/analyses/ensure — persiste un produit DÉJÀ analysé (on a son
 * result_json à l'écran) comme une VRAIE ligne `analyses` de l'utilisateur,
 * SANS re-analyser ni débiter de crédit.
 *
 * Pourquoi : un produit ouvert en vue catalogue (lecture seule) n'a pas de ligne
 * `analyses` possédée par l'utilisateur → la carte de compatibilité (qui exige
 * une analyse à soi) échoue en « indisponible ». On enregistre d'abord (dédup via
 * cosme_check_upsert_analysis, donc pas de doublon d'historique), PUIS le client
 * calcule la compat sur l'id retourné. Idempotent : re-cliquer « Réessayer »
 * renvoie la même ligne.
 */
export async function POST(req: NextRequest) {
  let body: {
    result?: AnalyseResponse;
    productLabel?: string | null;
    brand?: string | null;
    productType?: string | null;
    inputText?: string | null;
    ean?: string | null;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const result = body.result;
  if (!result || !Array.isArray(result.items) || result.items.length === 0) {
    return NextResponse.json({ error: "Analyse invalide." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const name = (body.productLabel || "Analyse").slice(0, 200);
  const { data: id, error } = await sb.rpc("cosme_check_upsert_analysis", {
    p_name: name,
    p_product_label: body.productLabel?.slice(0, 200) ?? null,
    p_brand: body.brand?.slice(0, 120) ?? null,
    p_product_type: body.productType?.slice(0, 120) ?? null,
    p_category: result.category ?? null,
    p_input_text: body.inputText ?? "",
    p_result_json: result,
    p_score: Number((result.score ?? 0).toFixed(2)),
    p_ean: body.ean?.slice(0, 32) ?? null,
  });

  if (error || !id) {
    return NextResponse.json({ error: "Échec de l'enregistrement." }, { status: 500 });
  }
  return NextResponse.json({ analysisId: id as string });
}
