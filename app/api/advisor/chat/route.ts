import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { openai, hasOpenAI, logAI } from "@/lib/ai/client";
import { NO_LONG_DASHES_RULE } from "@/lib/ai/sanitize";
import { readSkinProfile, SKIN_CONCERN_LABEL, SKIN_TYPE_LABEL } from "@/lib/skin/profile";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import type { AnalyseResponse } from "@/lib/analyseTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "gpt-4o-mini";
const MAX_MESSAGES_PER_DAY = 30;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  // Hard per-IP rate limit to keep the cost bounded.
  const rl = checkRateLimit(ip, 12, 60_000);
  if (!rl.ok) {
    return new Response(
      JSON.stringify({ error: "Trop de messages récents. Patiente une minute." }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!hasOpenAI()) {
    return new Response(
      JSON.stringify({ error: "Assistant indisponible pour le moment." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: { messages?: unknown };
  try {
    body = (await req.json()) as { messages?: unknown };
  } catch {
    return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });
  }

  const raw = Array.isArray(body.messages) ? body.messages : [];
  const messages: ChatMessage[] = raw
    .filter((m): m is { role: string; content: string } =>
      typeof m === "object"
      && m !== null
      && typeof (m as { role?: unknown }).role === "string"
      && typeof (m as { content?: unknown }).content === "string",
    )
    .map<ChatMessage>((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content.slice(0, 2000),
    }))
    .slice(-12);   // keep last 12 turns max
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "Pas de message" }), { status: 400 });
  }

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Non connecté." }), { status: 401 });
  }

  // Three independent reads - fan them out in parallel so the chat doesn't
  // wait 3× the network roundtrip. The daily cap check still gates the
  // response, but profile + routine are fetched concurrently for free.
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const [usedTodayRes, profileRes, routineRes] = await Promise.all([
    sb
      .schema("cosme_check")
      .from("ai_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("feature", "synthesis")
      .gte("created_at", since.toISOString()),
    sb
      .schema("cosme_check")
      .from("user_profiles")
      .select("first_name, preferences")
      .eq("id", user.id)
      .maybeSingle(),
    sb
      .schema("cosme_check")
      .from("routine_items")
      .select("frequency, analyses(name, product_label, score, result_json)"),
  ]);

  const usedToday = usedTodayRes.count;
  if ((usedToday ?? 0) > MAX_MESSAGES_PER_DAY) {
    return new Response(
      JSON.stringify({ error: `Limite quotidienne atteinte (${MAX_MESSAGES_PER_DAY}/jour). À demain !` }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  const profileRow = profileRes.data;
  const skin = readSkinProfile((profileRow?.preferences ?? null) as Record<string, unknown> | null);

  const routineRows = routineRes.data;
  const routineFacts = ((routineRows ?? []) as unknown as {
    frequency: string;
    analyses: { name: string | null; product_label: string | null; score: number | null; result_json: AnalyseResponse } | null;
  }[])
    .filter((r) => r.analyses)
    .slice(0, 12)
    .map((r) => {
      const tags = new Set<string>();
      for (const it of r.analyses!.result_json.items) {
        for (const t of it.tags ?? []) tags.add(t);
      }
      return {
        name: r.analyses!.product_label ?? r.analyses!.name ?? "Analyse",
        score: r.analyses!.score,
        frequency: r.frequency,
        tags: Array.from(tags).slice(0, 6),
      };
    });

  const profileSummary = [
    skin.skinType ? `Type de peau : ${SKIN_TYPE_LABEL[skin.skinType]}` : "Type de peau : non renseigné",
    skin.concerns && skin.concerns.length > 0
      ? `Préoccupations : ${skin.concerns.map((c) => SKIN_CONCERN_LABEL[c]).join(", ")}`
      : "Préoccupations : non renseignées",
    skin.allergiesFreeform
      ? `Allergies / intolérances : ${skin.allergiesFreeform}`
      : "",
  ].filter(Boolean).join("\n");

  const routineSummary = routineFacts.length === 0
    ? "Routine : (aucune)"
    : "Routine :\n" + routineFacts
        .map((r) => `- ${r.name} (${r.score?.toFixed(1) ?? "?"}/20, ${r.frequency}, tags: ${r.tags.join(", ") || "(aucun)"})`)
        .join("\n");

  const system = `Tu es un assistant cosmétique factuel pour Cosme Check. Tu réponds à un consommateur français à partir de FAITS et UNIQUEMENT à partir de faits. RÈGLES STRICTES :
- AUCUN conseil médical, AUCUN diagnostic, AUCUNE mention de marque.
- Si la question relève du soin médical (acné sévère, rosacée diagnostiquée, eczéma...), oriente vers un dermatologue.
- Tu peux mentionner des ingrédients (par leur nom INCI) connus pour une catégorie (ex. niacinamide, acide salicylique, panthénol) mais sans recommander un produit précis.
- Tu cites les FAITS PERSONNELS de l'utilisateur (type de peau, routine actuelle) si pertinents, en restant factuel.
- Style : phrases courtes, ton calme, pas d'emoji, pas de marketing.
- Si la question n'a rien à voir avec la cosmétique, redirige poliment.

${NO_LONG_DASHES_RULE}

CONTEXTE UTILISATEUR :
${profileSummary}

${routineSummary}`;

  const t0 = Date.now();
  let totalIn = 0;
  let totalOut = 0;

  // Streaming SSE-like response. We emit chunks of text separated by newlines
  // and a final "[DONE]" line. The client parses incrementally.
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const enc = new TextEncoder();
        const completion = await openai().chat.completions.create({
          model: MODEL,
          temperature: 0.4,
          max_tokens: 600,
          stream: true,
          messages: [{ role: "system", content: system }, ...messages],
        });
        for await (const part of completion) {
          const delta = part.choices?.[0]?.delta?.content;
          if (delta) {
            // Safety net for the streaming path: strip any em/en-dash that
            // sneaks through despite the instruction. Done per-chunk; this
            // covers the common case where GPT emits the dash as a single
            // token. The rare cross-chunk split is acceptable collateral.
            const clean = delta.replace(/\s*[-–]\s*/g, ", ");
            controller.enqueue(enc.encode(clean));
          }
          const usage = (part as unknown as { usage?: { prompt_tokens?: number; completion_tokens?: number } }).usage;
          if (usage) {
            totalIn = usage.prompt_tokens ?? 0;
            totalOut = usage.completion_tokens ?? 0;
          }
        }
        controller.close();
        logAI({
          feature: "synthesis",
          provider: "openai",
          status: "success",
          tokens_in: totalIn,
          tokens_out: totalOut,
          duration_ms: Date.now() - t0,
          user_id: user.id,
        });
      } catch (err) {
        logAI({
          feature: "synthesis",
          provider: "openai",
          status: "error",
          duration_ms: Date.now() - t0,
          user_id: user.id,
        });
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Accel-Buffering": "no",
    },
  });
}
