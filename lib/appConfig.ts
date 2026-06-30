/**
 * App-wide runtime config (feature flags + maintenance), read from the admin
 * "Paramètres" page via the public RPC `public.cosme_check_get_app_config()`.
 *
 * Design notes:
 *  - FAIL-OPEN. A transient DB hiccup must never take the site down or flip a
 *    feature off. On any error we serve the last known-good value, or the
 *    all-enabled defaults if we never managed a successful read.
 *  - Cached in-module with a short TTL so we don't add a DB round-trip to every
 *    request (the middleware maintenance gate runs on every navigation). At most
 *    one RPC per TTL window per server isolate.
 *  - Dependency-free `fetch` against the PostgREST RPC endpoint so the same
 *    helper works in BOTH the Edge runtime (middleware) and the Node runtime
 *    (server components, server actions, route handlers).
 */

export type AppConfig = {
  signups_open: boolean;
  flag_deep_search: boolean;
  flag_suggestions: boolean;
  flag_advisor: boolean;
  flag_public_share: boolean;
  maintenance_mode: boolean;
  maintenance_message: string | null;
};

const DEFAULTS: AppConfig = {
  signups_open: true,
  flag_deep_search: true,
  flag_suggestions: true,
  flag_advisor: true,
  flag_public_share: true,
  maintenance_mode: false,
  maintenance_message: null,
};

const TTL_MS = 60_000;
const FETCH_TIMEOUT_MS = 1500;

let cache: { value: AppConfig; at: number } | null = null;
let inflight: Promise<AppConfig> | null = null;

function coerce(raw: unknown): AppConfig {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const bool = (k: keyof AppConfig): boolean =>
    typeof o[k] === "boolean" ? (o[k] as boolean) : (DEFAULTS[k] as boolean);
  return {
    signups_open: bool("signups_open"),
    flag_deep_search: bool("flag_deep_search"),
    flag_suggestions: bool("flag_suggestions"),
    flag_advisor: bool("flag_advisor"),
    flag_public_share: bool("flag_public_share"),
    maintenance_mode: bool("maintenance_mode"),
    maintenance_message:
      typeof o.maintenance_message === "string" ? o.maintenance_message : null,
  };
}

async function fetchConfig(): Promise<AppConfig> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return DEFAULTS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${url}/rest/v1/rpc/cosme_check_get_app_config`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: "{}",
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`rpc ${res.status}`);
    return coerce(await res.json());
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Returns the current app config, served from cache when fresh. Never throws:
 * on error returns the last known-good value, or all-enabled defaults.
 */
export async function getAppConfig(): Promise<AppConfig> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.value;
  if (inflight) return inflight;

  inflight = fetchConfig()
    .then((value) => {
      cache = { value, at: Date.now() };
      return value;
    })
    .catch(() => cache?.value ?? DEFAULTS)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
