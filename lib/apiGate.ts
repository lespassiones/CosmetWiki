/**
 * Single entry point for every protected API route. Does, in order:
 *
 *   1. Auth - must be a signed-in user (returns 401 otherwise).
 *   2. IP burst rate-limit - Postgres-backed (UNLOGGED table), shared across
 *      Vercel instances. The legacy in-memory Map was broken on serverless.
 *   3. Credits - atomically decrements cosme_check.user_credits (1 credit
 *      per call by default; pass `costCredits: 0` to skip).
 *
 * Routes use it like this:
 *
 *   const gate = await apiGate(req, { feature: "promesse.identify" });
 *   if (!gate.ok) return gate.response;
 *   const { user, supabase } = gate;
 *   // … rest of handler
 */
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { supabaseServer, supabaseService } from "./supabase";

export type GateOptions = {
  /** Identifier for credits/logs - e.g. "promesse.identify". */
  feature: string;
  /** Default 1. Pass 0 for cheap endpoints (search, suggest…). */
  costCredits?: 0 | 1;
  /** Burst limit (IP-based, per minute). Default 30/min. */
  rateMax?: number;
  rateWindowSec?: number;
};

export type CreditsState = { used: number; limit: number; remaining: number };

export type GateOk = {
  ok: true;
  user: User;
  supabase: SupabaseClient;
  credits: CreditsState;
  /**
   * Charge 1 credit AFTER passing all early-exit gates (typically used by
   * routes that do an idempotency lookup before charging). Returns either
   * the updated credits state, or a ready-to-return 429 response.
   */
  consumeCredit: (feature: string) => Promise<{ ok: true; credits: CreditsState } | { ok: false; response: NextResponse }>;
};

export type GateErr = {
  ok: false;
  response: NextResponse;
};

function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "0.0.0.0";
}

export async function apiGate(
  req: NextRequest | Request,
  opts: GateOptions,
): Promise<GateOk | GateErr> {
  const headers = req.headers;
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);

  // ── 1. Auth ────────────────────────────────────────────────────────────
  const { data: userData, error: userErr } = await sb.auth.getUser();
  if (userErr || !userData.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentification requise." },
        { status: 401 },
      ),
    };
  }
  const user = userData.user;

  // ── 2. IP burst rate-limit (Postgres, shared) ─────────────────────────
  const ip = getClientIp(headers);
  const rateMax = opts.rateMax ?? 30;
  const rateWindowSec = opts.rateWindowSec ?? 60;
  const svc = supabaseService();
  type RateLimitResult =
    | { ok: true; remaining: number; reset_at: string }
    | { ok: false; remaining: 0; retry_after_ms: number };
  const { data: rateData } = await svc.rpc("cosme_check_check_rate_limit", {
    p_key: `burst:${ip}`,
    p_max: rateMax,
    p_window_sec: rateWindowSec,
  });
  const rate = (rateData ?? { ok: true, remaining: rateMax, reset_at: "" }) as RateLimitResult;
  if (!rate.ok) {
    const retrySec = Math.max(1, Math.ceil(rate.retry_after_ms / 1000));
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Trop de requêtes. Réessaye dans un instant." },
        { status: 429, headers: { "Retry-After": String(retrySec) } },
      ),
    };
  }

  // ── 3. Credits ─────────────────────────────────────────────────────────
  type ConsumeResult =
    | { ok: true; used: number; limit: number; remaining: number }
    | { ok: false; used?: number; limit?: number; remaining?: number; error?: string };

  const chargeCredit = async (
    feature: string,
  ): Promise<{ ok: true; credits: CreditsState } | { ok: false; response: NextResponse }> => {
    const { data: creditData } = await sb.rpc("cosme_check_consume_credit", {
      p_feature: feature,
    });
    const consume = (creditData ?? { ok: false, error: "no_response" }) as ConsumeResult;
    if (!consume.ok) {
      const used = consume.used ?? 0;
      const limit = consume.limit ?? 100;
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: "Tu as utilisé tous tes crédits du jour. Reviens demain.",
            credits: { used, limit, remaining: 0 },
          },
          {
            status: 429,
            headers: { "Retry-After": "86400", "X-Credits-Remaining": "0" },
          },
        ),
      };
    }
    return {
      ok: true,
      credits: { used: consume.used, limit: consume.limit, remaining: consume.remaining },
    };
  };

  let credits: CreditsState = { used: 0, limit: 100, remaining: 100 };
  if ((opts.costCredits ?? 1) > 0) {
    const charge = await chargeCredit(opts.feature);
    if (!charge.ok) return { ok: false, response: charge.response };
    credits = charge.credits;
  }

  return { ok: true, user, supabase: sb, credits, consumeCredit: chargeCredit };
}
