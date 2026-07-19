import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAnon, supabaseServer } from "@/lib/supabase";
import { blacklistIp, checkRateLimitShared, getClientIp } from "@/lib/ratelimit";
import { normalizeProductQuery } from "@/lib/ai/productNormalize";
import type { OpenBeautyFactsCandidate } from "@/lib/productSearch/openBeautyFacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Catalog-only: OBF / INCIDecoder / OpenAI are behind the manual "Recherche
// approfondie" button (credit-gated). Never auto-triggered here.
const CATALOG_LIMIT = 24;
const CACHE_LIMIT = 16;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function dedupeKey(brand: string | null, name: string | null): string {
  const all = `${brand ?? ""} ${name ?? ""}`;
  return normalize(all).split(/\s+/).filter(Boolean).sort().slice(0, 6).join(" ");
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimitShared(`suggest:${ip}`, 30, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de recherches récentes. Patiente une minute." },
      { status: 429, headers: { "Retry-After": Math.ceil(rl.retryAfterMs / 1000).toString() } },
    );
  }

  const url = new URL(req.url);
  const hp = url.searchParams.get("hp") ?? "";
  if (hp && hp.length > 0) {
    blacklistIp(ip);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const query = (url.searchParams.get("query") ?? "").trim().slice(0, 200);
  if (query.length < 3) {
    return NextResponse.json({ error: "Tape au moins 3 caractères." }, { status: 400 });
  }

  // GPT-based query normalization improves catalog match quality (typos,
  // word order, brand synonyms). Only on page 1; pagination is gone.
  let catalogQuery = query;
  try {
    const norm = await normalizeProductQuery(query);
    if (norm.kind === "query" && norm.confidence >= 0.6) {
      catalogQuery = norm.query;
    }
  } catch {
    // normalisation failure → keep original query
  }

  const [catalogRes, cacheRes] = await Promise.allSettled([
    fetchCatalogCandidates(catalogQuery, CATALOG_LIMIT),
    fetchCachedCandidates(query, CACHE_LIMIT),
  ]);
  const catalog = catalogRes.status === "fulfilled" ? catalogRes.value : [];
  const cached = cacheRes.status === "fulfilled" ? cacheRes.value : [];

  const seen = new Set<string>();
  const merged: OpenBeautyFactsCandidate[] = [];
  for (const list of [catalog, cached]) {
    for (const c of list) {
      const key = dedupeKey(c.brand, c.productName);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(c);
    }
  }

  return NextResponse.json(
    { candidates: merged, hasMore: false, page: 1 },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}

async function fetchCachedCandidates(
  query: string,
  limit: number,
): Promise<OpenBeautyFactsCandidate[]> {
  try {
    const cookieStore = await cookies();
    const sb = supabaseServer(cookieStore);
    // Neutralise les métacaractères de la grammaire PostgREST .or()
    // (% _ , . ( ) : *) pour éviter une injection de filtre (ex: query=x,brand.not.is.null).
    const term = query.replace(/[%_,().:*]/g, "").trim();
    if (term.length < 2) return [];
    const like = `%${term}%`;
    const { data, error } = await sb
      .schema("cosme_check")
      .from("product_inci_cache")
      .select("id, brand, product_name, ingredients_text, source, source_url")
      .or(`brand.ilike.${like},product_name.ilike.${like},query_norm.ilike.${like}`)
      .limit(limit);
    if (error || !data) return [];
    return data.map((r) => ({
      id: `cache-${r.id}`,
      brand: r.brand,
      productName: r.product_name,
      ingredientsText: r.ingredients_text ?? "",
      imageUrl: null,
      sourceUrl: r.source_url ?? "",
      source: "cache" as const,
    }));
  } catch {
    return [];
  }
}

async function fetchCatalogCandidates(
  query: string,
  limit: number,
): Promise<OpenBeautyFactsCandidate[]> {
  try {
    const { data, error } = await supabaseAnon()
      .rpc("cosme_check_search_catalog", { p_query: query, p_limit: limit });
    if (error || !data) return [];
    return (
      data as Array<{
        ean: string;
        brand: string | null;
        name: string;
        category: string | null;
        image_url: string | null;
        source_url: string | null;
        score: number;
        score_label: string;
        score_tone: string;
        count_total: number | null;
        ingredients_text: string | null;
      }>
    ).map((r) => ({
      id: `catalog-${r.ean}`,
      brand: r.brand,
      productName: r.name,
      ingredientsText: r.ingredients_text ?? "",
      imageUrl: r.image_url,
      sourceUrl: r.source_url ?? "",
      source: "catalog" as const,
      ean: r.ean,
      score: r.score,
      scoreLabel: r.score_label,
      scoreTone: r.score_tone,
    }));
  } catch {
    return [];
  }
}
