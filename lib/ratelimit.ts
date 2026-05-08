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
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "0.0.0.0";
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
