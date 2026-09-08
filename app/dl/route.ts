/**
 * GET /dl
 *
 * Lien intelligent unique derrière le QR code imprimé (flyers, packaging,
 * salons, stories). On détecte l'OS depuis le User-Agent et on redirige vers la
 * bonne fiche store, ce qui évite d'imprimer deux QR :
 *
 *   iOS / iPadOS   → App Store
 *   Android        → Google Play
 *   desktop / bots → page d'accueil (les deux badges stores y figurent déjà)
 *
 * Deux détails qui comptent :
 *  - 302 et non 301 : un 301 est mémorisé par le navigateur ET par le CDN, donc
 *    un desktop ayant ouvert le lien une fois resterait collé sur la
 *    destination desktop même en rescannant depuis un téléphone.
 *  - `Cache-Control: no-store` : la réponse dépend du User-Agent, elle ne doit
 *    jamais entrer dans un cache partagé (sinon le premier scanneur décide pour
 *    tous les suivants).
 *
 * `?c=<slug>` propage un nom de campagne aux deux stores (ex. /dl?c=flyer_salon)
 * et `?m=<slug>` le média côté Play (ex. /dl?c=insta_bio&m=social). Sans `m` on
 * reste sur `qr_code`, valeur des QR déjà imprimés.
 * La logique de résolution vit dans `lib/storeLink.ts` (testée).
 */
import { NextResponse, type NextRequest } from "next/server";

import { campaignSlug, mediumSlug, storeUrlFor } from "@/lib/storeLink";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  const campaign = campaignSlug(req.nextUrl.searchParams.get("c"));
  const medium = mediumSlug(req.nextUrl.searchParams.get("m"));
  return NextResponse.redirect(storeUrlFor(ua, campaign, medium), {
    status: 302,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
