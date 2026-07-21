/**
 * Safe JSON parser for LLM responses (OpenAI / Mistral / web-search).
 *
 * Why this exists: LLMs hallucinate JSON structure. A prompt that says
 * "return {description: string}" can come back as {description: ["array"]}
 * or {desc: "..."} or {description: null}. The naive `JSON.parse(text) as T`
 * accepts ANY shape, then the calling code reads a field that doesn't exist
 * and either crashes or - much worse - writes garbage to the DB via
 * setProductCache / analyses inserts.
 *
 * `llmParse(schema, text)` runs the Zod schema against the parsed JSON and
 * returns null if it doesn't match. The caller decides what to do (retry,
 * skip cache, fall back to manual entry…) - explicitly, instead of letting
 * bad data leak into Supabase.
 */
import type { ZodType } from "zod";

/**
 * Extracts a JSON object from an LLM response that may be wrapped in
 * markdown fences (```json ... ```) or include leading/trailing prose.
 * Same as `extractJsonObject` in lib/ai/webSearch.ts but reusable.
 */
function extractJsonBlock(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Try direct parse first (most common when response_format=json_object).
  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through
  }

  // Strip markdown code fences if present.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // fall through
    }
  }

  // Find the first top-level {…} or […] balanced span.
  const firstBrace = trimmed.search(/[{[]/);
  if (firstBrace === -1) return null;
  for (let i = trimmed.length; i > firstBrace; i--) {
    const slice = trimmed.slice(firstBrace, i);
    try {
      return JSON.parse(slice);
    } catch {
      // keep narrowing
    }
  }
  return null;
}

/**
 * Parse raw LLM text → typed object (validated by Zod). Returns null on
 * parse failure OR schema mismatch. Never throws.
 *
 *   const schema = z.object({ description: z.string().min(60) });
 *   const parsed = llmParse(schema, text);
 *   if (!parsed) return null;  // caller decides what to do
 *   // parsed is now strongly typed AND validated
 */
export function llmParse<T>(schema: ZodType<T>, text: string): T | null {
  const raw = extractJsonBlock(text);
  if (raw === null) return null;
  const result = schema.safeParse(raw);
  if (!result.success) return null;
  return result.data;
}
