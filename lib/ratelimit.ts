import { supabaseService } from "./supabase";
import { getTrustedIp } from "./clientIp";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const blacklist = new Map<string, number>();

const DEFAULT_MAX = 30;
const DEFAULT_WINDOW = 60_000;
const BLACKLIST_TTL = 24 * 60 * 60 * 1000;

export function checkRateLimit(
  ip: string,
  max = DEFAULT_MAX,
  windowMs = DEFAULT_WINDOW,
): { ok: true; remaining: number } | { ok: false; retryAfter: number } {
  const now = Date.now();

  const bannedUntil = blacklist.get(ip);
  if (bannedUntil && bannedUntil > now) {
    return { ok: false, retryAfter: bannedUntil - now };
  } else if (bannedUntil) {
    blacklist.delete(ip);
  }

  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }
  if (bucket.count >= max) {
    return { ok: false, retryAfter: bucket.resetAt - now };
  }
  bucket.count += 1;
  return { ok: true, remaining: max - bucket.count };
}

export function blacklistIp(ip: string, ttlMs = BLACKLIST_TTL) {
  blacklist.set(ip, Date.now() + ttlMs);
}

export function getClientIp(headers: Headers): string {
  // Délègue au helper d'IP fiable : ne jamais faire confiance au leftmost de
  // x-forwarded-for (spoofable → contournement du rate-limit).
  return getTrustedIp(headers);
}

/**
 * Rate-limit PARTAGÉ entre toutes les instances serverless (backend Postgres,
 * via la RPC déjà utilisée par apiGate). À utiliser pour les routes coûteuses
 * NON authentifiées : le limiteur in-memory ci-dessus ne compte que par
 * instance Lambda et ne limite donc rien en prod. Fail-open si la DB est
 * indisponible (on ne bloque pas le trafic légitime pour un hoquet d'infra).
 */
export async function checkRateLimitShared(
  key: string,
  max: number,
  windowSec: number,
): Promise<{ ok: boolean; retryAfterMs: number }> {
  try {
    const { data } = await supabaseService().rpc("cosme_check_check_rate_limit", {
      p_key: key,
      p_max: max,
      p_window_sec: windowSec,
    });
    const r = (data ?? { ok: true }) as { ok?: boolean; retry_after_ms?: number };
    return { ok: r.ok !== false, retryAfterMs: r.retry_after_ms ?? 0 };
  } catch {
    return { ok: true, retryAfterMs: 0 };
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of buckets) {
    if (b.resetAt < now) buckets.delete(ip);
  }
  for (const [ip, t] of blacklist) {
    if (t < now) blacklist.delete(ip);
  }
}, 5 * 60 * 1000).unref?.();
