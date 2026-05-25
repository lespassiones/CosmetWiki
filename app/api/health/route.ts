/**
 * GET /api/health
 *
 * Liveness + dependency probe for UptimeRobot or any external monitor.
 * Returns 200 if Supabase responds, 503 otherwise.
 * AI provider status is included for diagnostics but does not affect the
 * HTTP status — if OpenAI is down but Supabase is up, the app still serves
 * (with Mistral fallback or appropriate error messages).
 *
 * Intentionally NOT gated by apiGate — unauthenticated, flat 200/503 signal.
 */
import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 8000;
const AI_TIMEOUT_MS = 5000;

async function checkDb(): Promise<{ ok: boolean; error?: string }> {
  try {
    const svc = supabaseService();
    const { error } = await svc
      .schema("cosme_check")
      .from("user_credits")
      .select("user_id", { count: "exact", head: true })
      .limit(1);
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message ?? "unknown" };
  }
}

async function checkAiProvider(
  name: string,
  url: string,
  apiKey: string | undefined,
): Promise<{ ok: boolean; error?: string } | null> {
  if (!apiKey) return null;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    });
    return res.ok ? { ok: true } : { ok: false, error: `http_${res.status}` };
  } catch (err) {
    return { ok: false, error: (err as Error).message ?? name + "_timeout" };
  }
}

export async function GET() {
  const startedAt = Date.now();

  const dbRace = Promise.race([
    checkDb(),
    new Promise<{ ok: false; error: string }>((resolve) =>
      setTimeout(() => resolve({ ok: false, error: "db_timeout" }), DB_TIMEOUT_MS),
    ),
  ]);

  const [db, openai, mistral] = await Promise.all([
    dbRace,
    checkAiProvider(
      "openai",
      "https://api.openai.com/v1/models",
      process.env.OPENAI_API_KEY,
    ),
    checkAiProvider(
      "mistral",
      "https://api.mistral.ai/v1/models",
      process.env.MISTRAL_API_KEY,
    ),
  ]);

  const latency = Date.now() - startedAt;
  const status = db.ok ? 200 : 503;

  return NextResponse.json(
    {
      ok: db.ok,
      db: db.ok ? "ok" : db.error,
      openai: openai === null ? "not_configured" : openai.ok ? "ok" : openai.error,
      mistral: mistral === null ? "not_configured" : mistral.ok ? "ok" : mistral.error,
      latency_ms: latency,
      ts: new Date().toISOString(),
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
