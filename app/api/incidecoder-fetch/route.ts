import { NextRequest, NextResponse } from "next/server";
import { fetchInciDecoderProduct } from "@/lib/productSearch/inciDecoder";
import { checkRateLimitShared, getClientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lazy-fetches the INCI list for a single INCIDecoder product slug.
 * Used by ProductSearchInput when the user clicks an INCIDecoder candidate
 * surfaced by /api/product-suggest (those candidates ship without their INCI
 * to keep the suggestion endpoint fast).
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimitShared(`incidecoder:${ip}`, 20, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes." },
      { status: 429, headers: { "Retry-After": Math.ceil(rl.retryAfterMs / 1000).toString() } },
    );
  }

  let body: { slug?: string };
  try {
    body = (await req.json()) as { slug?: string };
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const slug = (body.slug ?? "").replace(/[^a-z0-9\-]/gi, "").slice(0, 120);
  if (!slug) {
    return NextResponse.json({ error: "Slug manquant." }, { status: 400 });
  }

  const result = await fetchInciDecoderProduct(slug);
  if (!result) {
    return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
  }
  return NextResponse.json(result);
}
