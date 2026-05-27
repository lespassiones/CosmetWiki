/**
 * GET /api/health
 *
 * Liveness probe for UptimeRobot or any external monitor.
 * Returns 200 if Supabase responds, 503 otherwise.
 * Intentionally NOT gated by apiGate — unauthenticated, flat 200/503 signal.
 */
import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

const DB_TIMEOUT_MS = 5000;

export async function GET() {
  const startedAt = Date.now();
  let db: { ok: boolean; error?: string };
  try {
    const { error } = await Promise.race([
      supabaseService()
        .schema("cosme_check")
        .from("user_credits")
        .select("user_id", { count: "exact", head: true })
        .limit(1),
      new Promise<{ error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ error: { message: "db_timeout" } }), DB_TIMEOUT_MS),
      ),
    ]);
    db = error ? { ok: false, error: error.message } : { ok: true };
  } catch (err) {
    db = { ok: false, error: (err as Error).message ?? "unknown" };
  }

  return NextResponse.json(
    { ok: db.ok, db: db.ok ? "ok" : db.error, latency_ms: Date.now() - startedAt, ts: new Date().toISOString() },
    { status: db.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
