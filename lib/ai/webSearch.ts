/**
 * Thin wrapper around OpenAI's web-search-enabled models. Used to identify
 * a cosmetic product from its INCI list and to fetch its marketing promise
 * from the brand's official page.
 *
 * Model: gpt-4o-mini-search-preview — cheap inference + native web search.
 * The web search is billed separately by OpenAI (~$0.025/call as of 2025-Q4
 * for tier 1). We use search_context_size="medium" (the default sweet spot
 * between accuracy and cost).
 */
import { hasOpenAI, openai } from "./client";

const WEB_SEARCH_MODEL = "gpt-4o-mini-search-preview";

export type WebSearchResult = {
  text: string;
  /** Citations harvested from message.annotations — URLs the model
   *  effectively used to ground its answer. */
  citations: { url: string; title: string | null }[];
};

/**
 * Ask the web-search model for a single completion. The system + user
 * messages are concatenated as a chat conversation. Always uses temperature
 * 0 and the small/cheap context window — the search-preview models don't
 * accept the usual `temperature` override.
 */
export async function webSearchComplete(
  system: string,
  userMsg: string,
  opts: { timeoutMs?: number; userId?: string | null } = {},
): Promise<WebSearchResult> {
  if (!hasOpenAI()) {
    throw new Error("openai_unavailable");
  }
  const timeoutMs = opts.timeoutMs ?? 30_000;

  const completion = await Promise.race([
    openai().chat.completions.create({
      model: WEB_SEARCH_MODEL,
      // search-preview models reject `temperature`/`response_format`/`tools`
      // — they ship with web search baked in and behave at temp 0 by default.
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
      web_search_options: {
        search_context_size: "medium",
      },
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("web-search timeout")), timeoutMs),
    ),
  ]);

  const choice = completion.choices?.[0];
  const text = choice?.message?.content ?? "";
  // The SDK exposes URL citations under `message.annotations` as
  // { type: "url_citation", url_citation: { url, title, start_index, end_index } }
  type Annot = { type?: string; url_citation?: { url?: string; title?: string } };
  const annots = (choice?.message as unknown as { annotations?: Annot[] } | undefined)?.annotations ?? [];
  const citations = annots
    .filter((a) => a.type === "url_citation" && a.url_citation?.url)
    .map((a) => ({ url: a.url_citation!.url as string, title: a.url_citation!.title ?? null }));

  return { text, citations };
}

/**
 * Extract a single JSON object from a text blob. Search-preview models
 * sometimes wrap JSON in ```json fences or add a preamble; we strip
 * everything outside the outermost `{...}` block before parsing.
 */
export function extractJsonObject<T = unknown>(text: string): T | null {
  if (!text) return null;
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace <= firstBrace) return null;
  const candidate = text.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
}
