/**
 * GET /api/health
 *
 * Lightweight liveness + DB connectivity probe for UptimeRobot or any external
 * monitor. Returns 200 with JSON if Supabase responds within 3 s, 503 otherwise.
 *
 * Intentionally NOT gated by apiGate — UptimeRobot is unauthenticated and we
 * want a flat 200/503 signal that's easy to alert on.
 */
import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 3000;

export async function GET() {
  const startedAt = Date.now();

  const dbCheck = (async () => {
    try {
      const svc = supabaseService();
      // Cheapest possible round-trip: a single-row select with a strict filter
      // that uses the PK index. No data leaves Supabase if zero rows match.
      const { error } = await svc
        .schema("cosme_check")
        .from("user_credits")
        .select("user_id", { count: "exact", head: true })
        .limit(1);
      return error ? { ok: false, error: error.message } : { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message ?? "unknown" };
    }
  })();

  const timeout = new Promise<{ ok: false; error: string }>((resolve) => {
    setTimeout(() => resolve({ ok: false, error: "db_timeout" }), DB_TIMEOUT_MS);
  });

  const db = await Promise.race([dbCheck, timeout]);
  const latency = Date.now() - startedAt;

  if (!db.ok) {
    return NextResponse.json(
      { ok: false, db: db, latency_ms: latency, ts: new Date().toISOString() },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { ok: true, db: "ok", latency_ms: latency, ts: new Date().toISOString() },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
