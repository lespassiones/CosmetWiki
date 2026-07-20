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
import { ingredientPageUrls, staticPageUrls } from "@/lib/sitemapData";
import { INDEX_INGREDIENTS } from "@/lib/seoConfig";

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
  // Même source de vérité que les sitemaps (lib/sitemapData.ts). Si la RPC
  // des slugs échoue, on soumet au moins les pages statiques.
  const staticUrls = staticPageUrls();
  // Les fiches ingrédient ne sont soumises à IndexNow que si on les indexe
  // (cf. lib/seoConfig.ts). Positionnement = compatibilité, pas annuaire INCI.
  if (!INDEX_INGREDIENTS) return staticUrls;
  try {
    const ingredientUrls = await ingredientPageUrls();
    return [...staticUrls, ...ingredientUrls];
  } catch {
    return staticUrls;
  }
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

/**
 * GET = déclencheur du cron Vercel (vercel.json → /api/indexnow, hebdo).
 * Vercel envoie ses crons en GET avec `Authorization: Bearer <CRON_SECRET>`
 * (header injecté automatiquement quand la variable d'env CRON_SECRET est
 * définie sur le projet). On accepte aussi INDEXNOW_SECRET pour pouvoir
 * déclencher une synchro à la main avec curl.
 * Effet : soumet TOUTES les URLs du site (statiques + 15 700 fiches) à
 * IndexNow → Bing / DuckDuckGo / Yandex recrawlent sous quelques heures.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const isCron = Boolean(cronSecret) && auth === `Bearer ${cronSecret}`;
  if (!isCron && !isAuthorized(req)) return unauthorized();

  const urls = await loadAllSitemapUrls();
  const result = await submitToIndexNow(urls);

  return NextResponse.json(result, {
    status: result.ok ? 200 : 502,
    headers: { "Cache-Control": "no-store" },
  });
}
