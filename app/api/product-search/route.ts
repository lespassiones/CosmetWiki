import { NextRequest, NextResponse } from "next/server";
import { searchProductCascade } from "@/lib/productSearch/cascade";
import { collectDuckDuckGoCandidates } from "@/lib/productSearch/duckduckgo";
import { collectOpenAIWebCandidates } from "@/lib/productSearch/openaiSearch";
import { prevalidateCandidates } from "@/lib/productSearch/prevalidate";
import { blacklistIp, checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { normalizeProductQuery } from "@/lib/ai/productNormalize";

/** Combien de candidats web pré-validés on garde au final pour l'affichage.
 *  La pré-validation = on extrait l'INCI en parallèle pour chaque candidat,
 *  et on ne garde que ceux qui ont une INCI valide. Garantie côté UX : zéro
 *  carte cliquable qui aboutit sur "composition introuvable". */
const VALIDATED_TARGET = 8;

// Premier batch : 24 candidats demandés à OpenAI. L'UI en affiche 8 d'entrée
// puis 8 de plus à chaque "Voir plus". Quand les 24 sont épuisés, l'UI peut
// re-appeler cette route avec `exclude` = les déjà-vus pour ramener un
// nouveau batch de 24 (pagination infinie).
const FIRST_BATCH_LIMIT = 24;
const LOAD_MORE_LIMIT = 24;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  query?: string;
  hp?: string;
  /** Liste de "brand productName" déjà affichés côté UI, à exclure du
   *  prochain batch retourné par OpenAI Web Search. Permet la pagination
   *  infinie sans re-proposer les mêmes produits. */
  exclude?: string[];
};

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  // Tighter than search/autocomplete because each miss can chain
  // OBF + INCIDecoder + DDG + Mistral = expensive.
  // 20 / min : un utilisateur actif qui teste plusieurs produits + utilise
  // la pagination "Charger plus" peut facilement dépasser 8. Chaque call
  // OpenAI Web Search coûte ~$0.025, donc 20/min/IP = $0.50/min max — OK.
  const rl = checkRateLimit(ip, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de recherches récentes. Patiente une minute." },
      {
        status: 429,
        headers: { "Retry-After": Math.ceil(rl.retryAfter / 1000).toString() },
      },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (body.hp && body.hp.length > 0) {
    blacklistIp(ip);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const query = (body.query ?? "").trim();
  if (query.length < 3) {
    return NextResponse.json(
      { error: "Tape au moins 3 caractères (marque + nom du produit)." },
      { status: 400 },
    );
  }

  // GPT-4o-mini pre-normalization: handles barcodes pasted into the name
  // field, common typos, missing brand, and surfaces multiple candidates
  // when ambiguous. Falls through to the raw cascade if not useful.
  const norm = await normalizeProductQuery(query);

  if (norm.kind === "barcode") {
    // Re-route to the dedicated barcode endpoint by calling the cascade
    // with the canonical barcode string (the cascade detects barcodes as
    // an early step too, so this guarantees consistent routing).
    const result = await searchProductCascade(norm.barcode);
    return NextResponse.json({ ...result, normalization: { kind: "barcode", value: norm.barcode } });
  }

  if (norm.kind === "candidates") {
    // Ambiguous - return the candidates so the UI can let the user pick,
    // without burning the deep cascade. The frontend can re-call this
    // route with the chosen candidate.
    return NextResponse.json({
      results: [],
      candidates: norm.candidates,
      reason: norm.reason,
      normalization: { kind: "candidates" },
    });
  }

  const refinedQuery = norm.kind === "query" ? norm.query : query;
  const exclude = Array.isArray(body.exclude)
    ? body.exclude.filter((e): e is string => typeof e === "string").slice(0, 30)
    : [];
  const isLoadMore = exclude.length > 0;

  // Mode "Voir plus" : on saute la cascade catalogue (déjà passée au 1er hit)
  // et on appelle directement OpenAI Web Search avec la liste d'exclusion,
  // puis on pré-valide pour ne renvoyer que des candidats cliquables.
  if (isLoadMore) {
    const raw = await collectOpenAIWebCandidates(
      refinedQuery,
      LOAD_MORE_LIMIT,
      exclude,
    );
    const { validated } = await prevalidateCandidates(raw, VALIDATED_TARGET);
    return NextResponse.json({
      found: false,
      reason: "load_more",
      webCandidates: validated,
      normalization: { kind: "load_more" },
    });
  }

  const result = await searchProductCascade(refinedQuery);

  // When the cascade failed to identify a single canonical product, we ALSO
  // fetch web candidates via OpenAI Web Search puis on PRÉ-VALIDE chaque
  // candidat (extraction GPT de l'INCI en parallèle) pour ne garder que ceux
  // qui sont réellement cliquables. L'utilisateur ne voit plus de carte
  // qui aboutit sur "composition introuvable".
  //
  // Primary: OpenAI web search — reliable from Vercel IPs. Fallback: DDG
  // HTML scrape, used only when OpenAI returns nothing (key missing, quota,
  // timeout). DDG is free but bot-walled on datacenter IPs, hence the order.
  let webCandidates: Awaited<ReturnType<typeof collectDuckDuckGoCandidates>> = [];
  if (!result.found) {
    let raw = await collectOpenAIWebCandidates(refinedQuery, FIRST_BATCH_LIMIT);
    if (raw.length === 0) {
      raw = await collectDuckDuckGoCandidates(refinedQuery, FIRST_BATCH_LIMIT);
    }
    const { validated } = await prevalidateCandidates(raw, VALIDATED_TARGET);
    webCandidates = validated;
  }

  return NextResponse.json({
    ...result,
    webCandidates,
    normalization:
      norm.kind === "query"
        ? { kind: "query", original: query, refined: refinedQuery, confidence: norm.confidence }
        : { kind: "unchanged" },
  });
}
