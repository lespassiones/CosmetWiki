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
 *
 * No domain whitelist: any http(s) URL is accepted. Garde-fous are technical
 * (8 s timeout, content-type check, never echoing raw HTML back), not
 * editorial — small/indie brands need to work too.
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchPageHtml } from "@/lib/productSearch/httpFetch";
import { extractInciFromHtml } from "@/lib/productSearch/extractWithMistral";
import { checkRateLimitShared, getClientIp } from "@/lib/ratelimit";
import { validateUserUrl } from "@/lib/productSearch/validateUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  url?: string;
  label?: string;
};

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  // Tight: 6 deep-fetches per minute is plenty for normal use and protects
  // us from someone clicking through 12 candidates in a loop.
  // 20 / min : un utilisateur qui clique plusieurs candidats successifs
  // (le scénario "le 1er ne marche pas, j'essaie le 2e") dépassait 6.
  // Chaque extraction = 1 fetch HTTP + 1 call GPT-4o-mini (~$0.001).
  const rl = await checkRateLimitShared(`deepfetch:${ip}`, 20, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de récupérations récentes. Patiente une minute." },
      {
        status: 429,
        headers: { "Retry-After": Math.ceil(rl.retryAfterMs / 1000).toString() },
      },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  // SSRF : valider l'URL (schéma http(s), pas d'IP privée/métadonnées/localhost)
  // AVANT tout fetch. fetchPageHtml revalide aussi chaque redirection.
  const v = validateUserUrl((body.url ?? "").trim());
  if (!v.ok) {
    return NextResponse.json({ error: v.reason }, { status: 400 });
  }
  const url = v.url.toString();

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
