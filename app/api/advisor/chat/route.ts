import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { openai, hasOpenAI, hasMistral, logAI } from "@/lib/ai/client";
import { NO_LONG_DASHES_RULE } from "@/lib/ai/sanitize";
import {
  readSkinProfile,
  SKIN_CONCERN_LABEL,
  SKIN_TYPE_BODY_LABEL,
  SKIN_TYPE_FACE_LABEL,
} from "@/lib/skin/profile";
import { readUserRestrictions } from "@/lib/restrictions/types";
import { loadIngredientFamilies } from "@/lib/restrictions/families";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import type { AnalyseResponse } from "@/lib/analyseTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "gpt-4o-mini";
const MISTRAL_MODEL = "mistral-small-latest";
const MAX_MESSAGES_PER_DAY = 30;

type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * Streame une réponse chat depuis Mistral (API compatible OpenAI au format
 * SSE). Émet chaque token dans `controller` au fur et à mesure. Renvoie les
 * compteurs de tokens pour le log.
 *
 * Utilisé en fallback du streaming OpenAI : si OpenAI échoue AVANT toute
 * émission, on bascule ici de manière transparente pour le client.
 */
async function streamMistralChat(opts: {
  system: string;
  messages: ChatMessage[];
  controller: ReadableStreamDefaultController<Uint8Array>;
  enc: TextEncoder;
}): Promise<{ tokensIn: number; tokensOut: number }> {
  const { system, messages, controller, enc } = opts;
  const resp = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      temperature: 0.4,
      max_tokens: 600,
      stream: true,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (!resp.ok || !resp.body) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Mistral ${resp.status}: ${body.slice(0, 200)}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let tokensIn = 0;
  let tokensOut = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE lines from the buffer.
    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return { tokensIn, tokensOut };
      try {
        const parsed = JSON.parse(data) as {
          choices?: { delta?: { content?: string } }[];
          usage?: { prompt_tokens?: number; completion_tokens?: number };
        };
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          // Same em/en-dash sanitization as the OpenAI streaming path.
          const clean = delta.replace(/\s*[-–]\s*/g, ", ");
          controller.enqueue(enc.encode(clean));
        }
        if (parsed.usage) {
          tokensIn = parsed.usage.prompt_tokens ?? 0;
          tokensOut = parsed.usage.completion_tokens ?? 0;
        }
      } catch {
        // Skip malformed SSE payloads silently.
      }
    }
  }

  return { tokensIn, tokensOut };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  // Hard per-IP rate limit to keep the cost bounded.
  const rl = checkRateLimit(ip, 20, 60_000);
  if (!rl.ok) {
    return new Response(
      JSON.stringify({ error: "Trop de messages récents. Patiente une minute." }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  // We require at least one chat provider. OpenAI is preferred (better
  // adherence to the prompt), Mistral is the streaming fallback.
  if (!hasOpenAI() && !hasMistral()) {
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
  const restrictions = readUserRestrictions((profileRow?.preferences ?? null) as Record<string, unknown> | null);
  const hasRestrictions =
    restrictions.families.length > 0 || restrictions.ingredients.length > 0;
  const families = hasRestrictions ? await loadIngredientFamilies() : [];
  const familyLabelBySlug = new Map(families.map((f) => [f.slug, f.name] as const));
  const restrictedFamilyNames = restrictions.families
    .map((s) => familyLabelBySlug.get(s))
    .filter((n): n is string => Boolean(n));
  const restrictedIngredientNames = restrictions.ingredients.map((i) => i.name);
  const restrictionsSummary = hasRestrictions
    ? [
        restrictedFamilyNames.length > 0
          ? `Familles évitées : ${restrictedFamilyNames.join(", ")}`
          : "",
        restrictedIngredientNames.length > 0
          ? `Ingrédients évités : ${restrictedIngredientNames.join(", ")}`
          : "",
      ].filter(Boolean).join("\n")
    : "Restrictions : aucune";

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

  const faceLabel = skin.skinTypeFace
    ? SKIN_TYPE_FACE_LABEL[skin.skinTypeFace]
    : skin.otherSkinTypeFace;
  const bodyLabel = skin.skinTypeBody
    ? SKIN_TYPE_BODY_LABEL[skin.skinTypeBody]
    : skin.otherSkinTypeBody;
  const profileSummary = [
    faceLabel ? `Type de peau visage : ${faceLabel}` : "Type de peau visage : non renseigné",
    bodyLabel ? `Type de peau corps : ${bodyLabel}` : "Type de peau corps : non renseigné",
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

${restrictionsSummary}

${routineSummary}

Quand l'utilisateur évoque un produit, vérifie d'abord si la formule contient un ingrédient présent dans ses restrictions et signale-le explicitement. Ne propose jamais un produit qui contient un de ces ingrédients comme alternative.`;

  const t0 = Date.now();

  // Streaming response. Provider strategy:
  //  1. OpenAI streaming (primary, preferred for tone/policy compliance)
  //  2. Mistral streaming (fallback) - kicks in ONLY if OpenAI fails BEFORE
  //     emitting any chunk. Mid-stream failures can't be recovered
  //     transparently (the client already received partial text), so those
  //     just propagate.
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      let hasEmitted = false;

      // Wrap controller.enqueue so we know whether anything has been sent
      // to the client yet - this is what gates the fallback decision.
      const emit = (text: string) => {
        controller.enqueue(enc.encode(text));
        hasEmitted = true;
      };

      // ── 1) OpenAI streaming ─────────────────────────────────────────────
      if (hasOpenAI()) {
        let totalIn = 0;
        let totalOut = 0;
        try {
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
              // Safety net for the streaming path: strip any em/en-dash
              // that sneaks through despite the instruction. Done
              // per-chunk; this covers the common case where GPT emits
              // the dash as a single token.
              emit(delta.replace(/\s*[-–]\s*/g, ", "));
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
          return;
        } catch (err) {
          if (hasEmitted || !hasMistral()) {
            // Mid-stream error OR no fallback available - can't recover.
            logAI({
              feature: "synthesis",
              provider: "openai",
              status: "error",
              duration_ms: Date.now() - t0,
              user_id: user.id,
            });
            controller.error(err);
            return;
          }
          // OpenAI failed before any chunk - silently fall through to
          // Mistral. Log the OpenAI failure as `fallback` so the metric
          // distinguishes it from a hard error.
          logAI({
            feature: "synthesis",
            provider: "openai",
            status: "fallback",
            duration_ms: Date.now() - t0,
            user_id: user.id,
          });
        }
      }

      // ── 2) Mistral streaming (fallback, or primary if no OpenAI key) ───
      const tM = Date.now();
      try {
        const usage = await streamMistralChat({
          system,
          messages,
          controller,
          enc,
        });
        // Mistral path doesn't use `emit` so flip the flag manually for
        // any future code that reads it.
        if (usage.tokensOut > 0) hasEmitted = true;
        controller.close();
        logAI({
          feature: "synthesis",
          provider: "mistral",
          // "fallback" when OpenAI was tried first, "success" when Mistral
          // ran primary (OpenAI key absent).
          status: hasOpenAI() ? "fallback" : "success",
          tokens_in: usage.tokensIn,
          tokens_out: usage.tokensOut,
          duration_ms: Date.now() - tM,
          user_id: user.id,
        });
      } catch (err) {
        logAI({
          feature: "synthesis",
          provider: "mistral",
          status: "error",
          duration_ms: Date.now() - tM,
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
