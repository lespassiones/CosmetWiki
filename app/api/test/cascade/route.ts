/**
 * 🚧 EPHEMERAL TEST ENDPOINT — DELETE AFTER VALIDATION 🚧
 *
 * Used once after the #18 cascade refactor to verify the parallel behaviour
 * end-to-end without going through the auth-gated /api/analyser flow.
 *
 * Protected by a random token (header `Authorization: Bearer …` or query
 * `?token=…`). The token is intentionally hardcoded so it's easy to grep
 * and remove this whole folder when we're done.
 *
 * Usage:
 *   curl "https://www.cosme-check.com/api/test/cascade?q=Nivea+Q10&token=Tk_a9f3c2bd5e1842f0"
 *
 * REMOVE: app/api/test/cascade/ folder once cascade is validated.
 */
import { NextResponse, type NextRequest } from "next/server";
import { searchProductCascade } from "@/lib/productSearch/cascade";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEST_TOKEN = "Tk_a9f3c2bd5e1842f0";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const auth = req.headers.get("authorization") ?? "";
  const tokenFromHeader = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const tokenFromQuery = url.searchParams.get("token") ?? "";

  if (tokenFromHeader !== TEST_TOKEN && tokenFromQuery !== TEST_TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const query = (url.searchParams.get("q") ?? "").trim();
  if (!query) {
    return NextResponse.json({ error: "missing q parameter" }, { status: 400 });
  }

  const startedAt = Date.now();
  const result = await searchProductCascade(query);
  const durationMs = Date.now() - startedAt;

  return NextResponse.json(
    {
      query,
      durationMs,
      result,
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
