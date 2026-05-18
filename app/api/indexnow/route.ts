/**
 * /api/indexnow - notifie Bing/Yandex/DuckDuckGo qu'une ou plusieurs URLs
 * doivent être (re-)crawlées immédiatement, via le protocole IndexNow.
 *
 * Protégé par le header `Authorization: Bearer <INDEXNOW_SECRET>` (env var
 * à définir dans Vercel). Sans ce secret, le endpoint renvoie 401 - sinon
 * n'importe qui pourrait spammer IndexNow en notre nom et faire blacklister
 * notre clé.
 *
 * Deux modes d'utilisation :
 *
 *   1. POST /api/indexnow
 *      body : { "urls": ["https://www.cosme-check.com/faq", "..."] }
 *      → soumet la liste fournie.
 *
 *   2. POST /api/indexnow
 *      body : { "sync": true }
 *      → soumet TOUTES les URLs du sitemap en cours (statiques + ingrédients).
 *        Pratique après un gros changement, à appeler depuis un cron Vercel
 *        ou manuellement avec curl après chaque déploiement.
 */
import { NextResponse, type NextRequest } from "next/server";
import { submitToIndexNow } from "@/lib/indexnow";
import { SITE_URL } from "@/lib/siteUrl";
import { supabaseAnon } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  urls?: unknown;
  sync?: unknown;
};

function unauthorized() {
  return NextResponse.json(
    { ok: false, error: "unauthorized" },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.INDEXNOW_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (!auth) return false;
  const expected = `Bearer ${secret}`;
  // Comparaison en temps quasi-constant pour limiter les attaques de timing.
  if (auth.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < auth.length; i++) {
    diff |= auth.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

async function loadAllSitemapUrls(): Promise<string[]> {
  const staticUrls = [
    `${SITE_URL}/`,
    `${SITE_URL}/fonctionnalites`,
    `${SITE_URL}/comment-ca-marche`,
    `${SITE_URL}/blog`,
    `${SITE_URL}/blog/spf-50-visage-7-erreurs`,
    `${SITE_URL}/blog/perturbateurs-endocriniens-cosmetiques-2026`,
    `${SITE_URL}/blog/serums-visage-guide`,
    `${SITE_URL}/blog/masque-led-visage`,
    `${SITE_URL}/blog/lip-oils-huiles-levres`,
    `${SITE_URL}/blog/cremes-hydratantes-reparatrices`,
    `${SITE_URL}/blog/creme-solaire-coreenne-k-beauty`,
    `${SITE_URL}/faq`,
    `${SITE_URL}/contact`,
  ];

  const { data, error } = await supabaseAnon().rpc(
    "cosme_check_list_active_slugs_json",
  );
  if (error || !Array.isArray(data)) return staticUrls;

  const ingredientUrls = (data as unknown[])
    .filter((s): s is string => typeof s === "string")
    .map((slug) => `${SITE_URL}/i/${slug}`);

  return [...staticUrls, ...ingredientUrls];
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    // Body vide ou JSON invalide → on tolère, et on traite comme un appel
    // sans urls/sync.
  }

  let urls: string[] = [];

  if (body.sync === true) {
    urls = await loadAllSitemapUrls();
  } else if (Array.isArray(body.urls)) {
    urls = body.urls.filter((u): u is string => typeof u === "string");
  }

  if (urls.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "no_urls_provided",
        hint: 'Pass { "urls": ["…"] } or { "sync": true } in the body.',
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await submitToIndexNow(urls);

  return NextResponse.json(result, {
    status: result.ok ? 200 : 502,
    headers: { "Cache-Control": "no-store" },
  });
}
