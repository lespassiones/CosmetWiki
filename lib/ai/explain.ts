/**
 * On-demand human-friendly explanation of a single INCI ingredient.
 *
 * Strategy:
 *   1. Try the permanent DB cache (cosme_check.ingredient_explanations).
 *      Once generated, it's served forever for free.
 *   2. If absent, call GPT-4o-mini with structured context (name, function,
 *      color rating, tags) and store the result.
 *   3. Optionally append a one-line **personal context** when we know the
 *      user is exposed to this ingredient in their own routine - this
 *      personal line is NOT cached (it depends on the caller).
 */
import { AI_MODEL, hasMistral, hasOpenAI, openai } from "./client";
import { NO_LONG_DASHES_RULE, stripLongDashes } from "./sanitize";
import { supabaseService } from "@/lib/supabase";

export type ExplainContext = {
  inciId: number;
  name: string;
  primaryFunction: string | null;
  colorRating: "Vert" | "Jaune" | "Orange" | "Rouge" | null;
  tags: string[] | null;
  userExposure?: {
    /** Number of products in the user's routine that contain this ingredient. */
    routineCount: number;
    /** Number of past analyses that contained this ingredient. */
    historyCount: number;
  };
};

export type Explanation = {
  text: string;
  personalLine: string | null;
  cached: boolean;
};

function buildPersonalLine(ctx: ExplainContext): string | null {
  const exp = ctx.userExposure;
  if (!exp) return null;
  if (exp.routineCount >= 1) {
    const plural = exp.routineCount > 1 ? "s" : "";
    return `Tu as cet ingrédient dans ${exp.routineCount} produit${plural} de ta routine.`;
  }
  if (exp.historyCount >= 3) {
    return `Tu as déjà rencontré cet ingrédient dans ${exp.historyCount} de tes analyses passées.`;
  }
  return null;
}

export async function explainIngredient(ctx: ExplainContext, userId?: string | null): Promise<Explanation> {
  const sb = supabaseService();

  // 1. Permanent DB cache lookup (free).
  const { data: cached } = await sb
    .schema("cosme_check")
    .from("ingredient_explanations")
    .select("explanation")
    .eq("inci_id", ctx.inciId)
    .maybeSingle();
  if (cached?.explanation) {
    return {
      // Strip on read too: old cached entries written before the rule was
      // added may still contain em-dashes.
      text: stripLongDashes(cached.explanation),
      personalLine: buildPersonalLine(ctx),
      cached: true,
    };
  }

  // 2. No AI available → graceful degradation.
  if (!hasMistral() && !hasOpenAI()) {
    return {
      text: "Pas d'explication disponible pour le moment.",
      personalLine: buildPersonalLine(ctx),
      cached: false,
    };
  }

  // 3. Generate once, then store forever.
  const tags = (ctx.tags ?? []).join(", ") || "(aucun tag connu)";
  const system =
    "Tu vulgarises un ingrédient INCI cosmétique pour un grand public francophone. Style: factuel, court, jamais alarmiste, jamais marketing. AUCUN conseil médical. Pas d'emoji. Tu rends en 3 phrases, séparées par des sauts de ligne :\n1) À quoi sert cet ingrédient (fonction principale).\n2) Pourquoi cette tolérance Vert/Jaune/Orange/Rouge selon la grille (impact santé, environnement, ou réglementaire).\n3) Une alternative ou une vigilance courte si pertinent. Si la note est Vert, dis simplement pourquoi il est considéré comme sûr.\nN'invente AUCUNE étude, AUCUNE marque, AUCUNE statistique. "
    + NO_LONG_DASHES_RULE;
  const user = `Ingrédient : ${ctx.name}
Fonction principale : ${ctx.primaryFunction ?? "non renseignée"}
Tolérance : ${ctx.colorRating ?? "non classée"}
Tags : ${tags}

Réponds avec UNIQUEMENT le texte de l'explication (3 phrases sur 3 lignes).`;

  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
  const FALLBACK_TEXT = "Pas d'explication disponible pour le moment.";

  // 3. Génération : MISTRAL PRIMAIRE → GPT en repli.
  let text = "";
  if (hasMistral()) {
    try {
      const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({ model: "mistral-small-latest", temperature: 0.4, max_tokens: 220, messages }),
      });
      if (r.ok) {
        const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
        text = stripLongDashes((j.choices?.[0]?.message?.content ?? "").trim());
      }
    } catch {
      // bascule GPT
    }
  }

  // Repli GPT si Mistral indisponible / vide.
  if (!text && hasOpenAI()) {
    try {
      const r = await openai().chat.completions.create({ model: AI_MODEL, temperature: 0.4, max_tokens: 220, messages });
      text = stripLongDashes((r.choices?.[0]?.message?.content ?? "").trim());
    } catch {
      // laisse text vide
    }
  }

  if (!text) {
    return { text: FALLBACK_TEXT, personalLine: buildPersonalLine(ctx), cached: false };
  }

  // Permanent cache (one row per inci_id).
  await sb
    .schema("cosme_check")
    .from("ingredient_explanations")
    .upsert({ inci_id: ctx.inciId, explanation: text }, { onConflict: "inci_id" });

  return { text, personalLine: buildPersonalLine(ctx), cached: false };
}
