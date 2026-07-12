import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer, supabaseService } from "@/lib/supabase";
import { getClientIp } from "@/lib/ratelimit";
import { getAppConfig } from "@/lib/appConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // l'agent (gpt-5-mini @ low) peut prendre 10-17 s sur une reco

/**
 * Beauty Advisor — PROXY vers l'Edge Function `advisor-agent` (agent à outils,
 * gpt-5-mini @ reasoning_effort low). L'agent RAISONNE, cherche de vrais
 * produits notés, les VÉRIFIE côté serveur, gère RATE-LIMIT + CRÉDITS + PROFIL,
 * et renvoie en UNE réponse JSON : { reply, products, followup, ... }.
 *
 * Cette route ne fait donc plus d'appel LLM ni de débit crédit elle-même : elle
 * relaie l'auth de l'utilisateur (Bearer) à l'agent et retourne son JSON tel
 * quel (y compris le 429 no_credits, que le client `apiFetch` transforme en
 * modale « Crédits épuisés » → /offre).
 *
 * Twin mobile : components/advisor/AdvisorChat.tsx appelle directement l'edge
 * function avec le même contrat.
 */
export async function POST(req: NextRequest) {
  // Feature flag (admin Paramètres). Fail-open (flag_advisor défaut true).
  const cfg = await getAppConfig();
  if (!cfg.flag_advisor) {
    return new Response(
      JSON.stringify({ error: "Le Beauty Advisor est momentanément indisponible." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  // Rate-limit burst par IP (Postgres, partagé entre instances Vercel).
  const ip = getClientIp(req.headers);
  const svc = supabaseService();
  const { data: rateData } = await svc.rpc("cosme_check_check_rate_limit", {
    p_key: `burst:chat:${ip}`,
    p_max: 20,
    p_window_sec: 60,
  });
  const rate = (rateData ?? { ok: true }) as { ok: boolean };
  if (!rate.ok) {
    return new Response(
      JSON.stringify({ error: "Trop de messages récents. Patiente une minute." }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: { messages?: unknown; seen_eans?: unknown; stream?: unknown };
  try {
    body = (await req.json()) as { messages?: unknown; seen_eans?: unknown; stream?: unknown };
  } catch {
    return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });
  }
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "Pas de message" }), { status: 400 });
  }
  const seenEans = Array.isArray(body.seen_eans)
    ? body.seen_eans.filter((e): e is string => typeof e === "string")
    : [];
  // Streaming opt-in : le client demande des événements de progression (SSE).
  const wantStream = body.stream === true;

  // Auth : on récupère le token de session pour le relayer à l'edge function.
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { session } } = await sb.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return new Response(JSON.stringify({ error: "Non connecté." }), { status: 401 });
  }

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supaUrl || !anon) {
    return new Response(
      JSON.stringify({ error: "Assistant indisponible pour le moment." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const res = await fetch(`${supaUrl}/functions/v1/advisor-agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: anon,
      },
      body: JSON.stringify({ messages, seen_eans: seenEans, stream: wantStream }),
    });

    const contentType = res.headers.get("content-type") ?? "application/json";

    // Mode streaming : l'edge répond en text/event-stream → on RELAIE le flux tel
    // quel (événements status + result). La logique de l'agent est inchangée côté
    // edge ; on ne fait que laisser passer les octets au fur et à mesure.
    if (wantStream && res.ok && res.body && contentType.includes("text/event-stream")) {
      return new Response(res.body, {
        status: res.status,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // Sinon (mode bloquant, ou erreur gate 429/502 en JSON) : relaie corps + status
    // tels quels (429 no_credits inclus, transformé en modale par apiFetch).
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": contentType.includes("json") ? "application/json" : contentType },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Le conseiller IA est momentanément indisponible." }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}
