/**
 * OpenAI web-search candidate collector. Uses `gpt-4o-mini-search-preview`
 * (via `lib/ai/webSearch.ts`) to find cosmetic product pages that match the
 * user query. Returns the same `DuckDuckGoCandidate` shape so it can be
 * swapped in/out wherever DDG scraping is used today.
 *
 * Rationale: DuckDuckGo's HTML endpoint (`html.duckduckgo.com/html/`) bot-
 * walls Vercel/datacenter IPs in production — locally we see real results,
 * in prod the scrape comes back empty and the cascade falls through to
 * `not_found`. OpenAI's native web search runs server-side from a trusted
 * origin and isn't subject to that IP-based rate-limiting, so it's the
 * reliable primary; DDG stays as a free fallback for when OpenAI is
 * unavailable.
 */
import { z } from "zod";
import { webSearchComplete } from "@/lib/ai/webSearch";
import { llmParse } from "@/lib/zod/llmParse";
import { hasOpenAI } from "@/lib/ai/client";
import { logWarn } from "../log";
import type { DuckDuckGoCandidate } from "./duckduckgo";

const CandidatesSchema = z.object({
  candidates: z
    .array(
      z.object({
        brand: z.string().nullable().optional(),
        productName: z.string().nullable().optional(),
        url: z.string().optional(),
      }),
    )
    .optional(),
});

function safeDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isWebUrl(url: string): boolean {
  try {
    const proto = new URL(url).protocol;
    return proto === "https:" || proto === "http:";
  } catch {
    return false;
  }
}

export async function collectOpenAIWebCandidates(
  query: string,
  limit: number,
): Promise<DuckDuckGoCandidate[]> {
  if (!hasOpenAI()) return [];
  const q = query.trim();
  if (q.length < 3) return [];

  const system = [
    "Tu es un assistant de recherche de produits cosmétiques.",
    "Tu reçois une saisie utilisateur (potentiellement mal orthographiée, abrégée ou avec marque manquante) et tu utilises la recherche web pour identifier les FICHES PRODUITS correspondantes.",
    "",
    "RÈGLES CRITIQUES :",
    `1. Renvoie au maximum ${limit} candidats classés par pertinence décroissante.`,
    "2. Chaque candidat DOIT avoir une URL HTTPS pointant vers une fiche produit réelle : site officiel de la marque, INCIDecoder, IncBeauty, Sephora/Marionnaud/Nocibé, ou marchand reconnu (Amazon, Auchan, Carrefour, pharmacies en ligne…). JAMAIS de YouTube, TikTok, Instagram, Pinterest, ou autre réseau social.",
    "3. N'invente AUCUNE URL. Si tu n'es pas certain qu'une URL existe vraiment, omets ce candidat.",
    "4. Pour chaque candidat, fournis : brand (marque exacte, sans accents perdus), productName (nom du produit sans répéter la marque), url (lien direct vers la fiche).",
    "5. Réponse en JSON STRICT, sans markdown, sans commentaire.",
    "",
    'Format : {"candidates": [{"brand": "…", "productName": "…", "url": "https://…"}, …]}',
    'Si aucun résultat crédible : {"candidates": []}',
  ].join("\n");

  const userMsg = `Saisie utilisateur : """${q.slice(0, 200)}"""

Cherche sur le web et propose les fiches produits cosmétiques qui correspondent. Réponds en JSON strict.`;

  try {
    const { text } = await webSearchComplete(system, userMsg, {
      timeoutMs: 20_000,
    });
    const parsed = llmParse(CandidatesSchema, text);
    if (!parsed || !Array.isArray(parsed.candidates)) return [];

    const out: DuckDuckGoCandidate[] = [];
    const seen = new Set<string>();
    for (const c of parsed.candidates) {
      const url = (c.url ?? "").trim();
      if (!url || !isWebUrl(url)) continue;
      if (seen.has(url)) continue;
      seen.add(url);
      const brand = c.brand ? c.brand.trim().slice(0, 80) || null : null;
      const productName = c.productName ? c.productName.trim().slice(0, 160) || null : null;
      const title = [brand, productName].filter(Boolean).join(" ").slice(0, 200);
      out.push({
        url,
        title: title || url,
        domain: safeDomain(url),
        brand,
        productName,
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch (err) {
    logWarn("openai_search.error", {
      query: q.slice(0, 60),
      error: (err as Error).message?.slice(0, 200),
    });
    return [];
  }
}
