/**
 * Structured logger.
 *
 * Plain console.* under the hood so Vercel's Runtime Logs (free tier) pick it
 * up. The JSON shape makes queries possible later if we move to a real
 * log backend, and `logError` ALSO persists to cosme_check.error_log so we
 * keep history beyond Vercel Hobby's 1-hour retention.
 */
import { supabaseService } from "./supabase";

type LogContext = Record<string, unknown>;

function emit(level: "info" | "warn" | "error", msg: string, ctx?: LogContext) {
  const line = { lvl: level, msg, t: new Date().toISOString(), ...ctx };
  if (level === "error") console.error(JSON.stringify(line));
  else if (level === "warn") console.warn(JSON.stringify(line));
  else console.log(JSON.stringify(line));
}

export function logInfo(msg: string, ctx?: LogContext) {
  emit("info", msg, ctx);
}

export function logWarn(msg: string, ctx?: LogContext) {
  emit("warn", msg, ctx);
}

/**
 * Persists the error to cosme_check.error_log (best-effort, never throws)
 * AND emits a structured console.error line. Call this from API route catch
 * blocks instead of bare console.error.
 */
export function logError(
  route: string,
  err: unknown,
  ctx?: LogContext & { userId?: string | null },
): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  emit("error", message, { route, ...ctx, stack });

  // Fire-and-forget DB log. Wrapped so we never propagate failures.
  try {
    const svc = supabaseService();
    void svc
      .rpc("cosme_check_log_error", {
        p_route: route,
        p_error: message.slice(0, 2000),
        p_stack: stack ? stack.slice(0, 4000) : null,
        p_user_id: ctx?.userId ?? null,
      })
      .then(() => undefined);
  } catch {
    // ignore — logging must never break the request
  }
}
