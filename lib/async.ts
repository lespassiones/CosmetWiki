/**
 * Fire-and-forget helper for "side-effect" promises (analytics inserts,
 * cache writes, log appends…) that the caller doesn't want to await.
 *
 * Why this exists: `void somePromise()` swallows rejections silently. If
 * Supabase or Mistral goes down, the side effect simply vanishes with no
 * trace in our logs. `fireAndForget` keeps the same non-blocking semantics
 * but also funnels rejections into `error_log` so we can see them later.
 *
 *   fireAndForget(
 *     sb.from("ai_logs").insert({ feature, status, user_id: userId }),
 *     { route: "analyser.log_ai" },
 *   );
 */
import { logError } from "./log";

export type FireAndForgetOptions = {
  /** Identifier surfaced into error_log if the promise rejects. */
  route: string;
  /** Caller's user id when available, for log correlation. */
  userId?: string | null;
};

export function fireAndForget<T>(
  promise: Promise<T>,
  opts: FireAndForgetOptions,
): void {
  promise.catch((err) => {
    logError(opts.route, err, { userId: opts.userId ?? null });
  });
}
