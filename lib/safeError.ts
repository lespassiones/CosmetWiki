/**
 * Returns a generic NextResponse for internal errors (Supabase, fetch, etc.)
 * WITHOUT leaking the raw error message to the client.
 *
 * Why this matters: a raw `error.message` from Supabase can disclose the
 * schema (column names, constraint names, RLS hints…) to an attacker who
 * deliberately provokes failures. We log the full detail server-side via
 * `logError` (which goes to Vercel logs + cosme_check.error_log) and return
 * a clean French message to the user.
 *
 *   if (error) return safeError(error, { route: "analyser.rpc_match" });
 *
 * Use this for INTERNAL errors only - for validation errors that should be
 * shown to the user verbatim ("Email invalide.", "Mot de passe trop court"),
 * keep the existing NextResponse.json({ error: "..." }) pattern.
 */
import { NextResponse } from "next/server";
import { logError } from "./log";

export type SafeErrorOptions = {
  /** Identifier for the server-side log entry. */
  route: string;
  /** HTTP status code. Default 500. */
  status?: number;
  /** Public message shown to the user. Default = generic French message. */
  publicMessage?: string;
  /** Caller's user id, if available, for log correlation. */
  userId?: string | null;
};

const DEFAULT_PUBLIC_MESSAGE = "Une erreur est survenue. Réessaye dans un instant.";

export function safeError(err: unknown, opts: SafeErrorOptions): NextResponse {
  logError(opts.route, err, { userId: opts.userId ?? null });
  return NextResponse.json(
    { error: opts.publicMessage ?? DEFAULT_PUBLIC_MESSAGE },
    { status: opts.status ?? 500 },
  );
}
