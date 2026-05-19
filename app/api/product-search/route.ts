import { NextRequest, NextResponse } from "next/server";
import { searchProductCascade } from "@/lib/productSearch/cascade";
import { collectDuckDuckGoCandidates } from "@/lib/productSearch/duckduckgo";
import { collectOpenAIWebCandidates } from "@/lib/productSearch/openaiSearch";
import { blacklistIp, checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { normalizeProductQuery } from "@/lib/ai/productNormalize";

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
  const rl = checkRateLimit(ip, 8, 60_000);
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
  // et on appelle directement OpenAI Web Search avec la liste d'exclusion.
  if (isLoadMore) {
    const more = await collectOpenAIWebCandidates(
      refinedQuery,
      LOAD_MORE_LIMIT,
      exclude,
    );
    return NextResponse.json({
      found: false,
      reason: "load_more",
      webCandidates: more,
      normalization: { kind: "load_more" },
    });
  }

  const result = await searchProductCascade(refinedQuery);

  // When the cascade failed to identify a single canonical product, we ALSO
  // fetch a wider list of web candidates so the UI can show "voir plus".
  // L'UI affiche 8 par défaut, "Voir plus" affiche 8 de plus jusqu'à 24.
  // Au-delà, l'UI appelle cette route avec `exclude` pour un nouveau batch.
  //
  // Primary: OpenAI web search — reliable from Vercel IPs. Fallback: DDG
  // HTML scrape, used only when OpenAI returns nothing (key missing, quota,
  // timeout). DDG is free but bot-walled on datacenter IPs, hence the order.
  let webCandidates: Awaited<ReturnType<typeof collectDuckDuckGoCandidates>> = [];
  if (!result.found) {
    webCandidates = await collectOpenAIWebCandidates(refinedQuery, FIRST_BATCH_LIMIT);
    if (webCandidates.length === 0) {
      webCandidates = await collectDuckDuckGoCandidates(refinedQuery, FIRST_BATCH_LIMIT);
    }
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
