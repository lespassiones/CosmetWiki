/**
 * POST /api/deep-fetch
 * Body: { url: string, label?: string }
 *
 * Pulls a single web page and runs Mistral extraction to surface its INCI
 * list. Called when the user clicks a candidate in the "recherche
 * approfondie" results — we don't extract INCI up-front for all 12
 * candidates to save Mistral cost.
 *
 * Light rate-limit (per-IP) since this triggers a Mistral call and a remote
 * HTTP fetch each time. No credits consumed: the credit was already taken
 * when the user pressed "Recherche approfondie" on the prior step.
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchPageHtml } from "@/lib/productSearch/httpFetch";
import { extractInciFromHtml } from "@/lib/productSearch/extractWithMistral";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FETCHABLE_DOMAINS = [
  "incidecoder.com",
  "cosdna.com",
  "m.cosdna.com",
  "laroche-posay.fr",
  "laroche-posay.com",
  "loreal-paris.fr",
  "loreal-paris.com",
  "vichy.fr",
  "vichy.com",
  "avene.fr",
  "avene.com",
  "nivea.fr",
  "nivea.com",
  "yves-rocher.fr",
  "garnier.fr",
  "the-ordinary.com",
  "cerave.fr",
  "cerave.com",
  "bioderma.fr",
  "bioderma.com",
];

function isFetchable(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return FETCHABLE_DOMAINS.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return false;
  }
}

type Body = {
  url?: string;
  label?: string;
};

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  // Tight: 6 deep-fetches per minute is plenty for normal use and protects
  // us from someone clicking through 12 candidates in a loop.
  const rl = checkRateLimit(ip, 6, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de récupérations récentes. Patiente une minute." },
      {
        status: 429,
        headers: { "Retry-After": Math.ceil(rl.retryAfter / 1000).toString() },
      },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const url = (body.url ?? "").trim();
  if (!url || !isFetchable(url)) {
    return NextResponse.json(
      { error: "URL non supportée pour l'extraction automatique." },
      { status: 400 },
    );
  }

  const html = await fetchPageHtml(url);
  if (!html) {
    return NextResponse.json(
      { error: "Impossible de charger la page." },
      { status: 502 },
    );
  }

  const label = (body.label ?? "").slice(0, 200) || "produit cosmétique";
  const inci = await extractInciFromHtml({ label, html });
  if (!inci) {
    return NextResponse.json(
      { error: "Composition introuvable sur cette page." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    ingredientsText: inci,
    sourceUrl: url,
  });
}
