/**
 * Centralised AI client. Every AI call in the app goes through here so we
 * have one place to handle: model selection, retry, fallback, cache, logging.
 *
 * Provider strategy: OpenAI gpt-4o-mini as primary for everything (text +
 * vision). Mistral / Tesseract / no-op as fallbacks per feature.
 */
import OpenAI from "openai";
import { supabaseService } from "@/lib/supabase";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

export const AI_MODEL = "gpt-4o-mini";

let _openai: OpenAI | null = null;
export function openai(): OpenAI {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  if (!_openai) _openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  return _openai;
}

export function hasOpenAI(): boolean {
  return Boolean(OPENAI_API_KEY);
}

export function hasMistral(): boolean {
  return Boolean(MISTRAL_API_KEY);
}

export type AIFeature =
  | "synthesis"
  | "ocr"
  | "typo"
  | "categorize"
  | "validate"
  | "product_search"
  | "explain"
  | "parse_inci";

export type AIProvider = "openai" | "mistral" | "tesseract" | "cache";

type LogEntry = {
  feature: AIFeature;
  provider: AIProvider;
  status: "success" | "fallback" | "error";
  tokens_in?: number | null;
  tokens_out?: number | null;
  duration_ms?: number | null;
  user_id?: string | null;
};

/** Fire-and-forget log to cosmetwiki.ai_logs. */
export function logAI(entry: LogEntry): void {
  try {
    const sb = supabaseService();
    void sb
      .schema("cosmetwiki")
      .from("ai_logs")
      .insert({
        feature: entry.feature,
        provider: entry.provider,
        status: entry.status,
        tokens_in: entry.tokens_in ?? null,
        tokens_out: entry.tokens_out ?? null,
        duration_ms: entry.duration_ms ?? null,
        user_id: entry.user_id ?? null,
      })
      .then(() => undefined);
  } catch {
    // never let logging break the actual flow
  }
}

/** Cache lookup helper. Returns the cached `result` payload or null. */
export async function getCached<T = unknown>(cacheKey: string): Promise<T | null> {
  try {
    const sb = supabaseService();
    const { data } = await sb
      .schema("cosmetwiki")
      .from("ai_cache")
      .select("result")
      .eq("cache_key", cacheKey)
      .maybeSingle();
    if (!data) return null;
    // Best-effort hit counter (ignore failure)
    void sb
      .schema("cosmetwiki")
      .rpc("cosmetwiki_increment_ai_cache_hit", { p_key: cacheKey })
      .then(() => undefined);
    return data.result as T;
  } catch {
    return null;
  }
}

export async function setCached(cacheKey: string, result: unknown): Promise<void> {
  try {
    const sb = supabaseService();
    await sb
      .schema("cosmetwiki")
      .from("ai_cache")
      .upsert({ cache_key: cacheKey, result }, { onConflict: "cache_key" });
  } catch {
    // ignore — cache miss is acceptable
  }
}

/**
 * Wraps an OpenAI call with timeout + try/fallback semantics. The caller
 * provides a `primary` async function and an optional `fallback`. Errors,
 * timeouts and rate limits trigger the fallback.
 */
export async function callWithFallback<T>(opts: {
  feature: AIFeature;
  userId?: string | null;
  primary: () => Promise<{ value: T; tokensIn?: number; tokensOut?: number }>;
  fallback?: () => Promise<{ value: T; provider: AIProvider }>;
  timeoutMs?: number;
}): Promise<T> {
  const { feature, primary, fallback } = opts;
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const t0 = Date.now();

  try {
    const result = await Promise.race<{ value: T; tokensIn?: number; tokensOut?: number }>([
      primary(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("AI timeout")), timeoutMs)),
    ]);
    logAI({
      feature,
      provider: "openai",
      status: "success",
      tokens_in: result.tokensIn ?? null,
      tokens_out: result.tokensOut ?? null,
      duration_ms: Date.now() - t0,
      user_id: opts.userId ?? null,
    });
    return result.value;
  } catch (err) {
    if (!fallback) {
      logAI({
        feature,
        provider: "openai",
        status: "error",
        duration_ms: Date.now() - t0,
        user_id: opts.userId ?? null,
      });
      throw err;
    }
    try {
      const result = await fallback();
      logAI({
        feature,
        provider: result.provider,
        status: "fallback",
        duration_ms: Date.now() - t0,
        user_id: opts.userId ?? null,
      });
      return result.value;
    } catch (err2) {
      logAI({
        feature,
        provider: "openai",
        status: "error",
        duration_ms: Date.now() - t0,
        user_id: opts.userId ?? null,
      });
      throw err2;
    }
  }
}
