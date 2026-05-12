import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { searchOpenBeautyFactsList } from "@/lib/productSearch/openBeautyFacts";
import { searchInciDecoderList } from "@/lib/productSearch/inciDecoder";
import { supabaseServer } from "@/lib/supabase";
import { blacklistIp, checkRateLimit, getClientIp } from "@/lib/ratelimit";
import type { OpenBeautyFactsCandidate } from "@/lib/productSearch/openBeautyFacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  query?: string;
  page?: number;
  hp?: string;
};

const PAGE_SIZE = 20;
// Cache and INCIDecoder only contribute on page 1 — page 2+ is pure OBF
// pagination since cache hits are a small fixed set and INCIDecoder lists
// are also a single search-page extract.
const CACHE_LIMIT = 8;
const INCIDECODER_LIMIT = 8;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Dedupe key — same brand+product (normalized) should not appear twice across
 * sources. We collapse on the first 6 tokens to absorb minor wording diffs
 * ("La Roche-Posay Effaclar Duo+" vs "Effaclar Duo+ La Roche Posay").
 */
function dedupeKey(brand: string | null, name: string | null): string {
  const all = `${brand ?? ""} ${name ?? ""}`;
  return normalize(all).split(/\s+/).filter(Boolean).sort().slice(0, 6).join(" ");
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(ip, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de recherches récentes. Patiente une minute." },
      { status: 429, headers: { "Retry-After": Math.ceil(rl.retryAfter / 1000).toString() } },
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

  const query = (body.query ?? "").trim().slice(0, 200);
  if (query.length < 3) {
    return NextResponse.json({ error: "Tape au moins 3 caractères." }, { status: 400 });
  }

  const page = Math.max(1, Math.min(20, Math.floor(body.page ?? 1)));
  const isFirstPage = page === 1;

  // Cache + INCIDecoder only contribute on page 1 (they're fixed-size sets,
  // not paginated like OBF).
  const obfP = searchOpenBeautyFactsList(query, page, PAGE_SIZE);
  const cacheP = isFirstPage ? fetchCachedCandidates(query, CACHE_LIMIT) : Promise.resolve([] as OpenBeautyFactsCandidate[]);
  const inciP = isFirstPage
    ? fetchInciDecoderCandidates(query, INCIDECODER_LIMIT)
    : Promise.resolve([] as OpenBeautyFactsCandidate[]);

  // allSettled : a failure in one source must not kill the others.
  const [obfRes, cacheRes, inciRes] = await Promise.allSettled([obfP, cacheP, inciP]);

  const obf = obfRes.status === "fulfilled" ? obfRes.value : { candidates: [], hasMore: false };
  const cached = cacheRes.status === "fulfilled" ? cacheRes.value : [];
  const inci = inciRes.status === "fulfilled" ? inciRes.value : [];

  // Merge order: cache first (cheapest, already verified), then OBF (rich
  // metadata + INCI), then INCIDecoder (lazy-loaded).
  const seen = new Set<string>();
  const merged: OpenBeautyFactsCandidate[] = [];
  for (const list of [cached, obf.candidates, inci]) {
    for (const c of list) {
      const key = dedupeKey(c.brand, c.productName);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(c);
    }
  }

  return NextResponse.json({
    candidates: merged,
    hasMore: obf.hasMore,
    page,
  });
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
