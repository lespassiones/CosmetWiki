/**
 * Server-hash idempotency for expensive routes.
 *
 * Used on /api/coherence and /api/analyser where a double-click would cost the
 * user a credit twice and double-bill the LLM.
 *
 * Key is derived from `{userId, route, sha256(normalized_body)}` so we don't
 * need the client to send an Idempotency-Key header — duplicates within 24h
 * automatically return the cached response.
 *
 *   const idemKey = idempotencyKey(user.id, "coherence", body);
 *   const cached = await idempotencyLookup(idemKey);
 *   if (cached) return cached;
 *   // … do the work, get `response: NextResponse`
 *   await idempotencyStore(idemKey, response);
 *   return response;
 */
import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { supabaseService } from "./supabase";

const TTL_MS = 24 * 60 * 60 * 1000;

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

export function idempotencyKey(userId: string, route: string, body: unknown): string {
  const hash = createHash("sha256").update(stableStringify(body)).digest("hex").slice(0, 24);
  return `${route}:${userId}:${hash}`;
}

export async function idempotencyLookup(key: string): Promise<NextResponse | null> {
  try {
    const svc = supabaseService();
    const { data } = await svc
      .schema("cosme_check")
      .from("idempotency")
      .select("response, status_code, created_at")
      .eq("key", key)
      .maybeSingle();
    if (!data) return null;
    const age = Date.now() - new Date(data.created_at as string).getTime();
    if (age > TTL_MS) return null;
    return NextResponse.json(data.response, {
      status: (data.status_code as number) ?? 200,
      headers: { "X-Idempotent-Replay": "1" },
    });
  } catch {
    return null;
  }
}

export async function idempotencyStore(key: string, response: NextResponse): Promise<void> {
  // Only cache successful responses (2xx).
  if (response.status < 200 || response.status >= 300) return;
  try {
    const body = await response.clone().json();
    const svc = supabaseService();
    await svc
      .schema("cosme_check")
      .from("idempotency")
      .upsert(
        { key, response: body, status_code: response.status, created_at: new Date().toISOString() },
        { onConflict: "key" },
      );
  } catch {
    // ignore — caching is best-effort
  }
}
