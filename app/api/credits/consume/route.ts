/**
 * POST /api/credits/consume
 *
 * Debits 1 credit before the client launches an internet search cascade.
 * Returns { ok: true, credits } on success.
 * Returns 401 if unauthenticated, 429 with { creditExhausted: true } if exhausted.
 */
import { NextRequest, NextResponse } from "next/server";
import { apiGate } from "@/lib/apiGate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const gate = await apiGate(req, { feature: "deep_search", costCredits: 1 });
  if (!gate.ok) {
    // Distinguish credit exhaustion from other failures so the client can
    // redirect to /offre instead of showing a generic error.
    const body = await gate.response.json().catch(() => ({}));
    if (gate.response.status === 429 && "credits" in body) {
      return NextResponse.json(
        { error: body.error, creditExhausted: true },
        { status: 429 },
      );
    }
    return gate.response;
  }
  return NextResponse.json({ ok: true, credits: gate.credits });
}
