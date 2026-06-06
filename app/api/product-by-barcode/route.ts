import { NextRequest, NextResponse } from "next/server";
import { blacklistIp, checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { searchProductCascade } from "@/lib/productSearch/cascade";
import type { ProductSearchResult } from "@/lib/productSearch/types";
import {
  upsertCatalogProduct,
  getCatalogByEan,
  registerScannedBarcode,
} from "@/lib/db/catalog";
import { searchProductByBarcode } from "@/lib/productSearch/barcodeWebSearch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// INCI lists have many short comma-separated tokens. Marketing text has few
// commas and long sentences. Threshold: ≥5 tokens, average length ≤40 chars.
function looksLikeInci(text: string): boolean {
  const tokens = text.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
  if (tokens.length < 5) return false;
  const avgLen = tokens.reduce((s, t) => s + t.length, 0) / tokens.length;
  return avgLen <= 40;
}

type RequestBody = {
  barcode?: string;
  hp?: string;
};

// EAN-8 / EAN-13 / UPC-A / UPC-E / ITF-14
const BARCODE_RE = /^\d{8,14}$/;

// Recherche Internet (OBF / OPF / cascade / web search) DÉSACTIVÉE.
// Le scan lit UNIQUEMENT notre catalogue par EAN ; si le produit n'y est pas
// (ou pas assez enrichi), on enregistre le code-barres pour le compléter plus
// tard. Le code Internet est conservé derrière ce flag — repasser à `true`
// réactive l'ancien comportement (enrichissement à la volée OBF/OPF/web).
const ENABLE_INTERNET_FALLBACK = false;

// EAN présent au catalogue mais sans liste INCI exploitable (produit "désactivé"
// tant qu'il n'est pas enrichi). Aligné sur l'app mobile.
const INCOMPLETE: ProductSearchResult = {
  found: false,
  reason: "incomplete",
  message: "Ce produit n'a pas encore été référencé dans notre base de données.",
};

// EAN totalement inconnu : on vient de l'enregistrer pour enrichissement futur.
const REGISTERED: ProductSearchResult = {
  found: false,
  reason: "registered",
  message:
    "Ce produit a été enregistré et sera référencé très prochainement sur Cosme Check.",
};

// Un produit du catalogue est exploitable pour l'analyse s'il a une vraie liste
// INCI (≥ 5 ingrédients). En-dessous, on le considère "non encore référencé"
// (même règle que le masquage count_total >= 5 du catalogue).
function hasUsableInci(ingredientsText: string | null): boolean {
  return !!ingredientsText && looksLikeInci(ingredientsText);
}

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

  // ─── 1. Notre catalogue par EAN — source unique de vérité. ──────────────
  const local = await getCatalogByEan(barcode);
  if (local) {
    if (hasUsableInci(local.ingredients_text)) {
      return NextResponse.json({
        found: true,
        brand: local.brand,
        productName: local.name,
        ingredientsText: local.ingredients_text as string,
        source: "cache" as const,
        sourceUrl: local.source_url,
        confidence: 0.9,
      } satisfies ProductSearchResult);
    }
    // EAN présent mais INCI pas encore remplie → "à compléter".
    return NextResponse.json(INCOMPLETE);
  }

  // ─── 2. Recherche externe (DÉSACTIVÉE via ENABLE_INTERNET_FALLBACK). ─────
  if (ENABLE_INTERNET_FALLBACK) {
    const internet = await searchViaInternet(barcode);
    if (internet) return NextResponse.json(internet);
  }

  // ─── 3. Code-barres inconnu → on l'enregistre pour le compléter plus tard.
  void registerScannedBarcode(barcode);
  return NextResponse.json(REGISTERED);
}

// Cascade Internet (OBF + OPF + cascade par nom + recherche web). Retourne un
// hit (found:true) ou null si rien d'exploitable n'a été trouvé (on bascule
// alors sur le catalogue / l'enregistrement).
async function searchViaInternet(
  barcode: string,
): Promise<ProductSearchResult | null> {
  // 1. OBF + OPF en parallèle — on prend le premier avec INCI ≥ 30 chars.
  //    Priorité à OBF si les deux ont un INCI valide.
  const [obfResult, opfResult] = await Promise.allSettled([
    fetchOFFProduct("world.openbeautyfacts.org", barcode),
    fetchOFFProduct("world.openproductsfacts.org", barcode),
  ]);

  const obf = obfResult.status === "fulfilled" ? obfResult.value : null;
  const opf = opfResult.status === "fulfilled" ? opfResult.value : null;

  // Priorité OBF si INCI valide, sinon OPF si INCI valide.
  if (obf && obf.inci.length >= 30) {
    if (looksLikeInci(obf.inci)) {
      void upsertCatalogProduct({
        ean: barcode,
        brand: obf.brand,
        name: obf.name,
        ingredientsText: obf.inci,
        sourceUrl: obf.sourceUrl,
      });
    }
    return {
      found: true,
      brand: obf.brand,
      productName: obf.name,
      ingredientsText: obf.inci,
      source: "openbeautyfacts",
      sourceUrl: obf.sourceUrl,
      confidence: 0.98,
    } satisfies ProductSearchResult;
  }

  if (opf && opf.inci.length >= 30) {
    if (looksLikeInci(opf.inci)) {
      void upsertCatalogProduct({
        ean: barcode,
        brand: opf.brand,
        name: opf.name,
        ingredientsText: opf.inci,
        sourceUrl: opf.sourceUrl,
      });
    }
    return {
      found: true,
      brand: opf.brand,
      productName: opf.name,
      ingredientsText: opf.inci,
      source: "openproductsfacts",
      sourceUrl: opf.sourceUrl,
      confidence: 0.95,
    } satisfies ProductSearchResult;
  }

  // 2. Si l'un des deux a un nom mais sans INCI → cascade par nom.
  //    Si la cascade réussit → écriture catalog avec l'EAN (Action 3).
  const partial = obf?.name ? obf : opf?.name ? opf : null;
  if (partial?.name) {
    const nameQuery = [partial.brand, partial.name]
      .filter(Boolean)
      .join(" ")
      .trim();
    const cascadeResult = await searchProductCascade(nameQuery);
    if (cascadeResult.found) {
      if (looksLikeInci(cascadeResult.ingredientsText)) {
        void upsertCatalogProduct({
          ean: barcode,
          brand: cascadeResult.brand ?? partial.brand,
          name: cascadeResult.productName ?? partial.name,
          ingredientsText: cascadeResult.ingredientsText,
          sourceUrl: cascadeResult.sourceUrl ?? partial.sourceUrl,
        });
      }
      // Prefer the brand/name we got from the barcode DB since they're more
      // reliable than whatever the cascade scraped from a web page.
      return {
        ...cascadeResult,
        brand: cascadeResult.brand ?? partial.brand,
        productName: cascadeResult.productName ?? partial.name,
      } satisfies ProductSearchResult;
    }
    // Cascade sans INCI exploitable → on bascule sur le catalogue/enregistrement.
    return null;
  }

  // 3. Code-barres totalement inconnu (OBF + OPF ne connaissent pas l'EAN)
  //    → web search GPT comme dernier recours (Action 1).
  const webResult = await searchProductByBarcode(barcode);
  if (webResult.found) {
    if (looksLikeInci(webResult.ingredientsText)) {
      void upsertCatalogProduct({
        ean: barcode,
        brand: webResult.brand,
        name: webResult.productName,
        ingredientsText: webResult.ingredientsText,
        sourceUrl: webResult.sourceUrl,
      });
    }
    return {
      found: true,
      brand: webResult.brand,
      productName: webResult.productName,
      ingredientsText: webResult.ingredientsText,
      source: "web_search",
      sourceUrl: webResult.sourceUrl,
      confidence: webResult.confidence,
    } satisfies ProductSearchResult;
  }

  // 4. Rien d'exploitable trouvé sur Internet.
  return null;
}
