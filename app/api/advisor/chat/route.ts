import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer, supabaseService } from "@/lib/supabase";
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
import { getClientIp } from "@/lib/ratelimit";
import type { AnalyseResponse } from "@/lib/analyseTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 25;

const MODEL = "gpt-4o-mini";
const MISTRAL_MODEL = "mistral-small-latest";

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
          // Only strip true en/em dashes and space-wrapped ascii hyphens;
          // bare hyphens in compound words (peut-être, souhaites-tu) are kept.
          const clean = delta
            .replace(/[ \t]*[–—][ \t]*/g, ", ")
            .replace(/ - /g, ", ");
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
  // Hard per-IP rate limit (Postgres-backed, shared across Vercel instances).
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

  // Crédit : 1 par message (handoff §7 : advisor = 1/msg), prélevé sur le même
  // compteur quotidien partagé que cohérence / routine_suggest / compare. On
  // débite AVANT l'appel LLM ; si le solde est épuisé -> paywall (429).
  const { data: creditData } = await sb.rpc("cosme_check_consume_credit", {
    p_feature: "advisor",
  });
  const credit = (creditData ?? { ok: false }) as { ok: boolean };
  if (!credit.ok) {
    return new Response(
      JSON.stringify({ error: "Tu as utilisé tous tes crédits du jour. Reviens demain !" }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  // Two independent reads - fan them out in parallel so the chat doesn't wait
  // 2× the network roundtrip.
  const [profileRes, routineRes] = await Promise.all([
    sb
      .schema("cosme_check")
      .from("user_profiles")
      .select("first_name, preferences")
      .eq("id", user.id)
      .maybeSingle(),
    sb
      .schema("cosme_check")
      .from("routine_items")
      .select("frequency, analyses(name, product_label, score, result_json)")
      .eq("user_id", user.id)
      .limit(12),
  ]);

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
- Si la question n'a rien à voir avec la cosmétique, redirige poliment en une phrase.
- CONTEXTE : tu AS déjà accès au profil complet et à la routine de l'utilisateur ci-dessous.
- LONGUEUR : Va droit au but.
- FOCUS : tu peux légèrement rappeler les fait connus mais de maniere très concise, donne directement le conseil ou la suggestion utile.
- FORMAT markdown : **gras** pour les ingrédients clés, *italique* pour les nuances, __souligné__ pour la conclusion, tirets - pour les listes courtes (3 items max).
- QUESTION DE SUIVI : termine TOUJOURS ta réponse par une question courte, intelligente et utile qui fait avancer la conversation (ex. approfondir le besoin, affiner le conseil, proposer un angle complémentaire). La question doit être naturelle, jamais générique.

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
              emit(delta.replace(/[ \t]*[–—][ \t]*/g, ", ").replace(/ - /g, ", "));
            }
            const usage = (part as unknown as { usage?: { prompt_tokens?: number; completion_tokens?: number } }).usage;
            if (usage) {
              totalIn = usage.prompt_tokens ?? 0;
              totalOut = usage.completion_tokens ?? 0;
            }
          }
          controller.close();
          logAI({
            feature: "advisor",
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
              feature: "advisor",
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
            feature: "advisor",
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
          feature: "advisor",
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
          feature: "advisor",
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
