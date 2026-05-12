import { NextRequest, NextResponse } from "next/server";
import { searchProductCascade } from "@/lib/productSearch/cascade";
import { blacklistIp, checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { normalizeProductQuery } from "@/lib/ai/productNormalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  query?: string;
  hp?: string;
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
    // Ambiguous — return the candidates so the UI can let the user pick,
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
  const result = await searchProductCascade(refinedQuery);
  return NextResponse.json({
    ...result,
    normalization:
      norm.kind === "query"
        ? { kind: "query", original: query, refined: refinedQuery, confidence: norm.confidence }
        : { kind: "unchanged" },
  });
}
