/**
 * Smart routine suggestions.
 *
 * Given the user's current routine + a precomputed RoutineMetrics, ask GPT-4o-mini
 * to identify 2 concrete actions the user could take to lower their exposure.
 *
 * IMPORTANT: GPT never recommends a brand. It suggests a "profile to look for"
 * (e.g. "shampooing sans sulfates ni parfum"). The numerical impact is provided
 * BY THE ENGINE, not by GPT - we ask GPT only to phrase the advice based on
 * facts we already computed.
 *
 * Result cached by routine fingerprint so repeat visits are free.
 */
import crypto from "node:crypto";
import { AI_MODEL, callWithFallback, getCached, hasOpenAI, openai, setCached } from "./client";
import { NO_LONG_DASHES_RULE, stripLongDashes } from "./sanitize";
import type { RoutineMetrics, RoutineProduct } from "@/lib/routine/engine";

export type RoutineSuggestion = {
  /** Short bullet (1 sentence, no marketing). */
  text: string;
  /** Optional structured fields from the engine. */
  impact?: { from: number; to: number; delta: number; productName?: string | null };
};

export type RoutineSuggestionsResponse = {
  suggestions: RoutineSuggestion[];
  cached: boolean;
};

// Bump when the prompt structure changes meaningfully so previous cached
// answers stop being served.
const PROMPT_VERSION = 2;

function fingerprint(
  products: RoutineProduct[],
  profileBlock: string | null,
  restrictionsBlock: string | null,
): string {
  const sig = products
    .map((p) => `${p.id}:${p.frequency}:${(p.score ?? 0).toFixed(1)}`)
    .sort()
    .join("|");
  const profileKey = profileBlock
    ? `|prof=${crypto.createHash("sha256").update(profileBlock).digest("hex").slice(0, 12)}`
    : "";
  const restrictionsKey = restrictionsBlock
    ? `|res=${crypto.createHash("sha256").update(restrictionsBlock).digest("hex").slice(0, 12)}`
    : "";
  const versionKey = `|v=${PROMPT_VERSION}`;
  return crypto
    .createHash("sha256")
    .update(sig + profileKey + restrictionsKey + versionKey)
    .digest("hex")
    .slice(0, 24);
}

export async function generateRoutineSuggestions(
  metrics: RoutineMetrics,
  products: RoutineProduct[],
  userId?: string | null,
  /** Pre-formatted skin profile block (from loadProfileForPrompt). */
  profileBlock?: string | null,
  /** Pre-formatted restrictions block (from loadRestrictionsForPrompt). */
  restrictionsBlock?: string | null,
): Promise<RoutineSuggestionsResponse> {
  if (products.length === 0) return { suggestions: [], cached: false };

  const profile = profileBlock ?? null;
  const restrictions = restrictionsBlock ?? null;
  const cacheKey = `routinetips:${fingerprint(products, profile, restrictions)}`;
  const cached = await getCached<RoutineSuggestionsResponse>(cacheKey);
  if (cached) return { ...cached, cached: true };

  // Engine-derived insights (deterministic). We pre-compute the actionable
  // "remove worst N" facts so GPT only has to phrase them well.
  const engineSuggestions: RoutineSuggestion[] = [];
  if (
    metrics.simulation.minus1.removedName
    && metrics.simulation.minus1.exposureScore > metrics.exposureScore
  ) {
    engineSuggestions.push({
      text: `Remplacer **${metrics.simulation.minus1.removedName}** par une alternative neutre.`,
      impact: {
        from: metrics.exposureScore,
        to: metrics.simulation.minus1.exposureScore,
        delta: Number((metrics.simulation.minus1.exposureScore - metrics.exposureScore).toFixed(1)),
        productName: metrics.simulation.minus1.removedName,
      },
    });
  }
  if (metrics.allergenOverlap.length >= 2) {
    const top = metrics.allergenOverlap.slice(0, 2).map((a) => a.label).join(" et ");
    engineSuggestions.push({
      text: `Réduire l'exposition à **${top}** en cherchant des formules sans parfum.`,
    });
  }

  if (!hasOpenAI()) {
    return { suggestions: engineSuggestions.slice(0, 3), cached: false };
  }

  // Ask GPT to refine + add one cross-cutting tip. We feed it our facts so it
  // can phrase, but it must NOT invent stats or brands.
  const facts = {
    exposureScore: metrics.exposureScore,
    exposureLabel: metrics.exposureLabel,
    topTags: metrics.tagExposure.slice(0, 5).map((t) => `${t.label} (${t.cumulativeCount.toFixed(2)}/j)`),
    topIngredients: metrics.topIngredients.map((i) => `${i.name} (${i.colorRating}, dans ${i.productCount} produits)`),
    allergenOverlap: metrics.allergenOverlap.map((a) => `${a.label} (×${a.productCount})`),
    worstProduct: metrics.simulation.minus1.removedName,
    expectedScoreIfRemoved: metrics.simulation.minus1.exposureScore,
  };

  const baseSystem =
    "Tu es un analyste de routine cosmétique. Tu reçois des FAITS CHIFFRÉS issus de l'analyse INCI de la routine de l'utilisateur. " +
    "Ton job : proposer 2 à 3 suggestions courtes et concrètes pour réduire son exposition, ADAPTÉES à son profil et à ses restrictions s'ils sont fournis. " +
    "RÈGLES STRICTES :\n" +
    "- AUCUNE marque ni nom de produit alternatif (suggère uniquement un PROFIL d'ingrédients à chercher, ex : 'shampooing sans sulfates ni parfum'). " +
    "- N'invente AUCUNE statistique ni étude. " +
    "- N'invente AUCUN ingrédient. Si tu cites un ingrédient, il doit venir des faits fournis. " +
    "- Pas d'emoji. Pas de marketing. Pas de conseil médical. " +
    "- Encadre les noms d'ingrédients ou de catégories cités avec ** (markdown gras). " +
    NO_LONG_DASHES_RULE + " " +
    "Réponds en JSON STRICT : { \"suggestions\": [\"<phrase 1>\", \"<phrase 2>\", \"<phrase 3>\"] }";

  let system = baseSystem;
  if (profile) {
    system += `\n\n${profile}\n\nAdapte tes suggestions au profil ci-dessus : priorise les axes qui parlent vraiment à cette personne (peau sèche → cherche les ingrédients desséchants ; cheveux secs → cherche les sulfates / alcohol denat ; allergies → cherche les allergènes du parfum).`;
  }
  if (restrictions) {
    system += `\n\n${restrictions}\n\nIMPORTANT : les familles/ingrédients ci-dessus sont DÉJÀ pris en compte par l'utilisateur. Ne lui suggère JAMAIS de "chercher un produit sans X" si X est déjà dans ses restrictions, sauf pour confirmer qu'un produit de sa routine actuelle viole cette restriction. Concentre tes suggestions sur des axes encore pertinents pour lui.`;
  }

  const user = `FAITS :
${JSON.stringify(facts, null, 2)}

Donne 2-3 suggestions concrètes${profile || restrictions ? ", adaptées au profil et aux restrictions ci-dessus" : ""}.`;

  try {
    const aiSuggestions = await callWithFallback<RoutineSuggestion[]>({
      feature: "synthesis",  // re-using the "synthesis" feature bucket for logging
      userId: userId ?? null,
      timeoutMs: 8000,
      primary: async () => {
        const r = await openai().chat.completions.create({
          model: AI_MODEL,
          temperature: 0.5,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        });
        const raw = r.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(raw) as { suggestions?: unknown };
        const out: RoutineSuggestion[] = Array.isArray(parsed.suggestions)
          ? (parsed.suggestions as unknown[])
              .filter((s): s is string => typeof s === "string")
              .map((s) => ({ text: stripLongDashes(s.trim()) }))
              .filter((s) => s.text.length > 0)
              .slice(0, 3)
          : [];
        return { value: out, tokensIn: r.usage?.prompt_tokens, tokensOut: r.usage?.completion_tokens };
      },
      fallback: async () => ({ value: engineSuggestions, provider: "openai" }),
    });

    // Merge: prefer AI phrasing but always keep the engine's concrete delta
    // on the first suggestion (so the impact number is real, not invented).
    const result: RoutineSuggestionsResponse = {
      suggestions: aiSuggestions.length > 0
        ? aiSuggestions.map((s, i) => ({
            ...s,
            impact: i === 0 ? engineSuggestions[0]?.impact : undefined,
          }))
        : engineSuggestions,
      cached: false,
    };

    void setCached(cacheKey, result);
    return result;
  } catch {
    return { suggestions: engineSuggestions, cached: false };
  }
}
