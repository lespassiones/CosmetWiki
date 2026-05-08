import { NextRequest, NextResponse } from "next/server";
import { searchOpenBeautyFactsList } from "@/lib/productSearch/openBeautyFacts";
import { blacklistIp, checkRateLimit, getClientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  query?: string;
  page?: number;
  hp?: string;
};

const PAGE_SIZE = 10;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  // Looser than /product-search: this endpoint only hits OBF (no Mistral, no
  // INCIDecoder scrape, no DDG), so a single call is cheap.
  const rl = checkRateLimit(ip, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de recherches récentes. Patiente une minute." },
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

  const query = (body.query ?? "").trim().slice(0, 200);
  if (query.length < 3) {
    return NextResponse.json(
      { error: "Tape au moins 3 caractères." },
      { status: 400 },
    );
  }

  const page = Math.max(1, Math.min(20, Math.floor(body.page ?? 1)));

  const { candidates, hasMore } = await searchOpenBeautyFactsList(
    query,
    page,
    PAGE_SIZE,
  );

  return NextResponse.json({ candidates, hasMore, page });
}
