/**
 * AI-assisted typo correction for ingredients. Called when pg_trgm returns
 * an ambiguous suggestion (confidence 0.55..0.90). GPT picks the most
 * plausible candidate among the top 5 trigram matches, or returns null if
 * none looks right. Result is cached by normalized token.
 */
import { AI_MODEL, callWithFallback, getCached, hasOpenAI, openai, setCached } from "./client";

type Candidate = {
  inci_id: number;
  name: string;
  primary_function: string | null;
};

export type TypoResult = {
  matchedInciId: number | null;
  matchedName: string | null;
  confidence: number;
  reason: string | null;
};

export async function correctTypo(
  token: string,
  candidates: Candidate[],
  userId?: string | null,
): Promise<TypoResult> {
  if (candidates.length === 0) {
    return { matchedInciId: null, matchedName: null, confidence: 0, reason: null };
  }
  const cacheKey = `typo:${token.toUpperCase()}`;
  const cached = await getCached<TypoResult>(cacheKey);
  if (cached) return cached;

  if (!hasOpenAI()) {
    return { matchedInciId: null, matchedName: null, confidence: 0, reason: null };
  }

  const candidatesText = candidates
    .map((c, i) => `${i + 1}. ${c.name}${c.primary_function ? ` — ${c.primary_function}` : ""}`)
    .join("\n");

  const system =
    "Tu es un expert en nomenclature INCI cosmétique. Tu reçois un token mal orthographié ou douteux saisi par un utilisateur, et une liste de candidats INCI proches. Tu dois identifier lequel correspond le plus probablement au token, ou répondre qu'aucun ne correspond. Ne JAMAIS inventer un nom hors de la liste fournie. Si plusieurs candidats sont plausibles, choisis le plus probable. Si tu hésites fortement, retourne null. Réponse en JSON strict, sans texte hors JSON.";

  const user = `Token saisi : "${token}"

Candidats INCI proches :
${candidatesText}

Réponds en JSON :
{
  "matched_index": <numéro 1..${candidates.length} ou null>,
  "confidence": <nombre 0..1>,
  "reason": "<phrase courte en français>"
}`;

  try {
    const value = await callWithFallback<TypoResult>({
      feature: "typo",
      userId: userId ?? null,
      timeoutMs: 7000,
      primary: async () => {
        const r = await openai().chat.completions.create({
          model: AI_MODEL,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        });
        const raw = r.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(raw) as {
          matched_index: number | null;
          confidence: number;
          reason: string;
        };
        const idx = parsed.matched_index;
        const chosen = idx && idx >= 1 && idx <= candidates.length ? candidates[idx - 1] : null;
        const result: TypoResult = chosen
          ? {
              matchedInciId: chosen.inci_id,
              matchedName: chosen.name,
              confidence: Number((parsed.confidence ?? 0).toFixed(3)),
              reason: parsed.reason ?? null,
            }
          : { matchedInciId: null, matchedName: null, confidence: 0, reason: parsed.reason ?? null };
        return {
          value: result,
          tokensIn: r.usage?.prompt_tokens,
          tokensOut: r.usage?.completion_tokens,
        };
      },
      fallback: async () => ({
        value: { matchedInciId: null, matchedName: null, confidence: 0, reason: null } as TypoResult,
        provider: "openai",
      }),
    });

    void setCached(cacheKey, value);
    return value;
  } catch {
    return { matchedInciId: null, matchedName: null, confidence: 0, reason: null };
  }
}
