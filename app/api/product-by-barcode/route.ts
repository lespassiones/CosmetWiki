import { NextRequest, NextResponse } from "next/server";
import { blacklistIp, checkRateLimit, getClientIp } from "@/lib/ratelimit";
import type { ProductSearchResult } from "@/lib/productSearch/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  barcode?: string;
  hp?: string;
};

// EAN-8 / EAN-13 / UPC-A / UPC-E / ITF-14
const BARCODE_RE = /^\d{8,14}$/;

const NOT_FOUND: ProductSearchResult = {
  found: false,
  reason: "not_found",
  message:
    "Code-barres non référencé sur Open Beauty Facts. Tape le nom du produit ou colle sa liste INCI.",
};

type OBFV2Response = {
  status: 0 | 1;
  product?: {
    code?: string;
    product_name?: string;
    product_name_fr?: string;
    product_name_en?: string;
    brands?: string;
    ingredients_text?: string;
    ingredients_text_fr?: string;
    ingredients_text_en?: string;
  };
};

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(ip, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de scans récents. Patiente une minute." },
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

  const barcode = (body.barcode ?? "").trim();
  if (!BARCODE_RE.test(barcode)) {
    return NextResponse.json(
      { error: "Code-barres invalide." },
      { status: 400 },
    );
  }

  const url = `https://world.openbeautyfacts.org/api/v2/product/${barcode}.json`;
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "CosmetWiki/1.0 (https://cosmetwiki.vercel.app)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!r.ok) {
      return NextResponse.json(NOT_FOUND);
    }
    const data = (await r.json()) as OBFV2Response;
    if (data.status !== 1 || !data.product) {
      return NextResponse.json(NOT_FOUND);
    }
    const p = data.product;
    const name =
      p.product_name_fr || p.product_name || p.product_name_en || null;
    const ingredientsText =
      p.ingredients_text_fr || p.ingredients_text || p.ingredients_text_en || "";
    if (ingredientsText.length < 30) {
      return NextResponse.json({
        found: false,
        reason: "not_found",
        message:
          "Produit trouvé mais sans liste INCI exploitable. Essaie de coller la liste INCI manuellement.",
      } satisfies ProductSearchResult);
    }
    return NextResponse.json({
      found: true,
      brand: p.brands ?? null,
      productName: name,
      ingredientsText,
      source: "openbeautyfacts",
      sourceUrl: `https://world.openbeautyfacts.org/product/${barcode}`,
      confidence: 0.98,
    } satisfies ProductSearchResult);
  } catch {
    return NextResponse.json(NOT_FOUND);
  }
}
