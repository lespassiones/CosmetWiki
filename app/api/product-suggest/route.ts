import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { searchOpenBeautyFactsList } from "@/lib/productSearch/openBeautyFacts";
import { searchInciDecoderList } from "@/lib/productSearch/inciDecoder";
import {
  collectDuckDuckGoCandidates,
  type DuckDuckGoCandidate,
} from "@/lib/productSearch/duckduckgo";
import { collectOpenAIWebCandidates } from "@/lib/productSearch/openaiSearch";
import { prevalidateCandidates } from "@/lib/productSearch/prevalidate";
import { supabaseAnon, supabaseServer } from "@/lib/supabase";
import { blacklistIp, checkRateLimit, getClientIp } from "@/lib/ratelimit";
import type { OpenBeautyFactsCandidate } from "@/lib/productSearch/openBeautyFacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  query?: string;
  page?: number;
  hp?: string;
};

const PAGE_SIZE = 24;
// Own catalog covers ~39K products with pre-computed scores.
// If catalog returns enough, we skip OBF/INCIDecoder entirely.
const CATALOG_LIMIT = 24;
const CATALOG_THRESHOLD = 8;   // catalog hits needed to skip OBF
const CACHE_LIMIT = 16;
const INCIDECODER_LIMIT = 20;
const WEB_FALLBACK_THRESHOLD = 5;
const WEB_FALLBACK_LIMIT = 8;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Dedupe key - same brand+product (normalized) should not appear twice across
 * sources. We collapse on the first 6 tokens to absorb minor wording diffs
 * ("La Roche-Posay Effaclar Duo+" vs "Effaclar Duo+ La Roche Posay").
 */
function dedupeKey(brand: string | null, name: string | null): string {
  const all = `${brand ?? ""} ${name ?? ""}`;
  return normalize(all).split(/\s+/).filter(Boolean).sort().slice(0, 6).join(" ");
}

// Migrated from POST to GET so Vercel Edge CDN can cache by URL. The body
// fields (query, page, hp) are now query params - same semantics, but the
// top 100 search terms collapse to a handful of Lambda calls per 5 min.
export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(ip, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de recherches récentes. Patiente une minute." },
      { status: 429, headers: { "Retry-After": Math.ceil(rl.retryAfter / 1000).toString() } },
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

  const pageParam = url.searchParams.get("page");
  const page = Math.max(1, Math.min(20, Math.floor(Number(pageParam ?? 1) || 1)));
  const isFirstPage = page === 1;

  // Catalog (own DB) : toujours interrogé en premier.
  // OBF / INCIDecoder : uniquement si le catalog n'a pas assez de résultats
  // ou si on est sur une page > 1 (pagination OBF).
  const catalogP = isFirstPage
    ? fetchCatalogCandidates(query, CATALOG_LIMIT)
    : Promise.resolve([] as OpenBeautyFactsCandidate[]);
  const cacheP = isFirstPage
    ? fetchCachedCandidates(query, CACHE_LIMIT)
    : Promise.resolve([] as OpenBeautyFactsCandidate[]);

  const [catalogRes, cacheRes] = await Promise.allSettled([catalogP, cacheP]);
  const catalog = catalogRes.status === "fulfilled" ? catalogRes.value : [];
  const cached = cacheRes.status === "fulfilled" ? cacheRes.value : [];

  // Si le catalog a assez de résultats, on saute OBF et INCIDecoder.
  const needFallback = catalog.length < CATALOG_THRESHOLD;

  const obfP = needFallback || !isFirstPage
    ? searchOpenBeautyFactsList(query, page, PAGE_SIZE)
    : Promise.resolve({ candidates: [] as OpenBeautyFactsCandidate[], hasMore: false });
  const inciP = isFirstPage && needFallback
    ? fetchInciDecoderCandidates(query, INCIDECODER_LIMIT)
    : Promise.resolve([] as OpenBeautyFactsCandidate[]);

  const [obfRes, inciRes] = await Promise.allSettled([obfP, inciP]);
  const obf = obfRes.status === "fulfilled" ? obfRes.value : { candidates: [], hasMore: false };
  const inci = inciRes.status === "fulfilled" ? inciRes.value : [];

  // Ordre de fusion : catalog > cache > OBF > INCIDecoder
  const seen = new Set<string>();
  const merged: OpenBeautyFactsCandidate[] = [];
  for (const list of [catalog, cached, obf.candidates, inci]) {
    for (const c of list) {
      const key = dedupeKey(c.brand, c.productName);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(c);
    }
  }

  // Web fallback : on attache des candidats web pré-validés quand le catalogue
  // est pauvre. La pré-validation extrait l'INCI via GPT-4o-mini en parallèle
  // → seuls les candidats cliquables sont renvoyés au front. L'INCI est
  // embarquée dans chaque candidat, donc au clic le frontend skip /api/deep-fetch.
  //
  // Primary: OpenAI web search (reliable from Vercel IPs). Fallback: DDG
  // HTML scrape (free but bot-walled on datacenter IPs).
  let webCandidates: DuckDuckGoCandidate[] = [];
  if (isFirstPage && merged.length < WEB_FALLBACK_THRESHOLD) {
    try {
      // On demande plus de candidats à OpenAI (16) qu'on ne va en garder (8)
      // pour avoir de la marge — la pré-validation va en filtrer une partie.
      let raw = await collectOpenAIWebCandidates(query, 16);
      if (raw.length === 0) {
        raw = await collectDuckDuckGoCandidates(query, 16);
      }
      // Dédup contre le catalogue avant la pré-validation (économise des
      // calls GPT inutiles si un même produit est déjà en haut de l'écran).
      const catalogueKeys = new Set(
        merged.map((c) => dedupeKey(c.brand, c.productName)),
      );
      raw = raw.filter(
        (w) => !catalogueKeys.has(dedupeKey(w.brand, w.productName ?? w.title)),
      );
      const { validated } = await prevalidateCandidates(raw, WEB_FALLBACK_LIMIT);
      webCandidates = validated;
    } catch {
      webCandidates = [];
    }
  }

  return NextResponse.json(
    {
      candidates: merged,
      hasMore: obf.hasMore,
      page,
      webCandidates,
    },
    {
      headers: {
        // Vercel Edge CDN caches by URL - popular queries collapse to one
        // upstream call per 5 min per region.
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}

async function fetchCachedCandidates(
  query: string,
  limit: number,
): Promise<OpenBeautyFactsCandidate[]> {
  try {
    const cookieStore = await cookies();
    const sb = supabaseServer(cookieStore);
    const like = `%${query.replace(/[%_]/g, "")}%`;
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

async function fetchInciDecoderCandidates(
  query: string,
  limit: number,
): Promise<OpenBeautyFactsCandidate[]> {
  try {
    const list = await searchInciDecoderList(query, limit);
    return list.map((c) => ({
      id: `incidecoder-${c.slug}`,
      brand: c.brand,
      productName: c.productName,
      ingredientsText: "", // lazy-loaded on click
      imageUrl: null,
      sourceUrl: c.sourceUrl,
      source: "incidecoder" as const,
      slug: c.slug,
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
      .schema("cosme_check")
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
