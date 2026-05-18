import { NextRequest, NextResponse } from "next/server";
import { blacklistIp, checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { searchProductCascade } from "@/lib/productSearch/cascade";
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
    "Code-barres non référencé sur nos sources publiques. Tape le nom du produit ou colle sa liste INCI.",
};

type OFFProduct = {
  name: string | null;
  brand: string | null;
  inci: string;
  sourceUrl: string;
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

// Shared lookup against any Open*Facts domain (OBF and OPF use the same API).
async function fetchOFFProduct(
  domain: string,
  barcode: string,
): Promise<OFFProduct | null> {
  try {
    const r = await fetch(
      `https://${domain}/api/v2/product/${barcode}.json`,
      {
        headers: {
          "User-Agent": "Cosme-Check/1.0 (https://cosme-check.vercel.app)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!r.ok) return null;
    const data = (await r.json()) as OBFV2Response;
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    const name =
      p.product_name_fr || p.product_name || p.product_name_en || null;
    const inci =
      p.ingredients_text_fr || p.ingredients_text || p.ingredients_text_en || "";
    return {
      name,
      brand: p.brands ?? null,
      inci,
      sourceUrl: `https://${domain}/product/${barcode}`,
    };
  } catch {
    return null;
  }
}

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

  // 1. Open Beauty Facts - primary source for cosmetics.
  const obf = await fetchOFFProduct("world.openbeautyfacts.org", barcode);
  if (obf && obf.inci.length >= 30) {
    return NextResponse.json({
      found: true,
      brand: obf.brand,
      productName: obf.name,
      ingredientsText: obf.inci,
      source: "openbeautyfacts",
      sourceUrl: obf.sourceUrl,
      confidence: 0.98,
    } satisfies ProductSearchResult);
  }

  // 2. Open Products Facts - same API, covers more household/personal-care
  // products that are not in OBF (shampoos, deodorants, cleaning products…).
  const opf = await fetchOFFProduct("world.openproductsfacts.org", barcode);
  if (opf && opf.inci.length >= 30) {
    return NextResponse.json({
      found: true,
      brand: opf.brand,
      productName: opf.name,
      ingredientsText: opf.inci,
      source: "openproductsfacts",
      sourceUrl: opf.sourceUrl,
      confidence: 0.95,
    } satisfies ProductSearchResult);
  }

  // 3. If either source returned a product name but no usable INCI list, run
  // that name through the full product-search cascade (cache → OBF text search
  // → INCIDecoder scrape → DuckDuckGo + Mistral extraction). This recovers the
  // INCI for many products that are registered in the barcode DB but whose
  // ingredient list was never entered by the community.
  const partial = obf?.name ? obf : opf?.name ? opf : null;
  if (partial?.name) {
    const nameQuery = [partial.brand, partial.name]
      .filter(Boolean)
      .join(" ")
      .trim();
    const cascadeResult = await searchProductCascade(nameQuery);
    if (cascadeResult.found) {
      // Prefer the brand/name we got from the barcode DB since they're more
      // reliable than whatever the cascade scraped from a web page.
      return NextResponse.json({
        ...cascadeResult,
        brand: cascadeResult.brand ?? partial.brand,
        productName: cascadeResult.productName ?? partial.name,
      } satisfies ProductSearchResult);
    }
    // The cascade found the product in a DB but no INCI anywhere.
    return NextResponse.json({
      found: false,
      reason: "not_found",
      message: `Produit identifié (${partial.name}) mais sans liste INCI exploitable sur nos sources. Colle la liste INCI du packaging.`,
    } satisfies ProductSearchResult);
  }

  // 4. Barcode completely unknown across all sources.
  return NextResponse.json(NOT_FOUND);
}
