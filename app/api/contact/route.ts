/**
 * POST /api/contact
 *
 * Persists a message from the public contact form into
 * `cosme_check.user_feedback` (kind='contact'). Anonymous-safe: writes
 * through the service role since the contact form is public.
 *
 * Light hardening:
 *   - Honey-pot field rejects bots before we touch Postgres.
 *   - Per-IP rate-limit (5 / 10 min) via the existing rate_limits table.
 *   - Field length caps + email regex.
 */
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer, supabaseService } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUBJECTS = ["Question", "Bug", "Suggestion", "Partenariat"] as const;
type Subject = (typeof SUBJECTS)[number];

type Body = {
  firstName?: string;
  email?: string;
  subject?: string;
  message?: string;
  /** Honey-pot - bots fill it, real browsers don't. */
  hp?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) { const parts = xff.split(","); return parts[parts.length - 1]!.trim(); }
  return headers.get("x-real-ip") ?? "0.0.0.0";
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (body.hp && body.hp.length > 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const firstName = (body.firstName ?? "").trim().slice(0, 80);
  const email = (body.email ?? "").trim().slice(0, 200);
  const subject = (body.subject ?? "").trim();
  const message = (body.message ?? "").trim().slice(0, 1000);

  if (!firstName) {
    return NextResponse.json({ error: "Prénom obligatoire." }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }
  if (!subject || !(SUBJECTS as readonly string[]).includes(subject)) {
    return NextResponse.json({ error: "Sujet invalide." }, { status: 400 });
  }
  if (message.length < 5) {
    return NextResponse.json({ error: "Message trop court." }, { status: 400 });
  }

  const svc = supabaseService();

  // ── Burst rate-limit (5 / 10 min per IP) ─────────────────────────────────
  const ip = getClientIp(req.headers);
  type RateLimitResult =
    | { ok: true; remaining: number; reset_at: string }
    | { ok: false; remaining: 0; retry_after_ms: number };
  const { data: rateData } = await svc.rpc("cosme_check_check_rate_limit", {
    p_key: `contact:${ip}`,
    p_max: 5,
    p_window_sec: 600,
  });
  const rate = (rateData ?? { ok: true, remaining: 5, reset_at: "" }) as RateLimitResult;
  if (!rate.ok) {
    const retrySec = Math.max(1, Math.ceil(rate.retry_after_ms / 1000));
    return NextResponse.json(
      { error: "Trop de messages envoyés. Réessaye plus tard." },
      { status: 429, headers: { "Retry-After": String(retrySec) } },
    );
  }

  // Best-effort: attach user_id if the sender happens to be signed in. Not
  // required (contact form is public-facing) - purely so the admin sees the
  // connection.
  let userId: string | null = null;
  try {
    const cookieStore = await cookies();
    const sb = supabaseServer(cookieStore);
    const { data: userData } = await sb.auth.getUser();
    userId = userData.user?.id ?? null;
  } catch {
    /* ignore - anonymous contact is fine */
  }

  const { error } = await svc
    .schema("cosme_check")
    .from("user_feedback")
    .insert({
      user_id: userId,
      kind: "contact",
      contact_first_name: firstName,
      contact_email: email,
      contact_subject: subject as Subject,
      message,
    });

  if (error) {
    return NextResponse.json({ error: "Échec de l'envoi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
