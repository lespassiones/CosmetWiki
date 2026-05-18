/**
 * Pre-flight validation of a pasted text before launching the full analysis.
 * Catches "asdfgh", recipes, song lyrics… in one cheap GPT call.
 *
 * Defaults to "valid" if the AI is unavailable or fails (we don't want to
 * block a real user because OpenAI is down).
 */
import { AI_MODEL, callWithFallback, getCached, hasOpenAI, openai, setCached } from "./client";

export type ValidateResult = { valid: boolean; reason: string | null };

export async function validateInciInput(
  text: string,
  userId?: string | null,
): Promise<ValidateResult> {
  const trimmed = text.trim();
  // Local fast-fail BEFORE any AI call: at least 3 commas OR 3 words ≥ 4 chars.
  const commas = (trimmed.match(/,/g) ?? []).length;
  const longWords = (trimmed.match(/\b[A-Za-z]{4,}\b/g) ?? []).length;
  if (commas < 2 && longWords < 4) {
    return { valid: false, reason: "Texte trop court pour être une liste INCI." };
  }
  // Short-circuit obvious garbage early.
  if (/^[asdfghjklqwertyuiop\s]{6,}$/i.test(trimmed)) {
    return { valid: false, reason: "Texte non reconnu comme liste INCI." };
  }

  // For longer inputs we trust the local checks above and skip the AI step
  // to keep this call essentially free on the hot path.
  if (commas >= 3 && longWords >= 6) {
    return { valid: true, reason: null };
  }

  const cacheKey = `validate:${trimmed.slice(0, 200).toLowerCase()}`;
  const cached = await getCached<ValidateResult>(cacheKey);
  if (cached) return cached;

  if (!hasOpenAI()) return { valid: true, reason: null };

  const system =
    "Tu es un classificateur strict : on te donne un texte court, tu réponds si oui ou non c'est une liste d'ingrédients INCI cosmétiques (noms anglais/latins séparés par virgules). Tu réponds en JSON `{valid: bool, reason: string}`. Une seule recette de cuisine, une suite de mots aléatoires, une phrase en prose → invalid. Une vraie liste comme 'Aqua, Glycerin, Phenoxyethanol' → valid.";

  const user = `Texte saisi : """${trimmed.slice(0, 800)}"""

Est-ce une liste INCI plausible ? Réponds en JSON.`;

  try {
    const value = await callWithFallback<ValidateResult>({
      feature: "validate",
      userId: userId ?? null,
      timeoutMs: 5000,
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
        const parsed = JSON.parse(raw) as { valid?: boolean; reason?: string };
        return {
          value: {
            valid: Boolean(parsed.valid),
            reason: parsed.reason ?? null,
          },
          tokensIn: r.usage?.prompt_tokens,
          tokensOut: r.usage?.completion_tokens,
        };
      },
      // If OpenAI fails, default to "valid" - don't block a real user.
      fallback: async () => ({
        value: { valid: true, reason: null } as ValidateResult,
        provider: "openai",
      }),
    });
    void setCached(cacheKey, value);
    return value;
  } catch {
    return { valid: true, reason: null };
  }
}
