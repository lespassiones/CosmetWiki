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

/** Génère une clé de produit canonique pour dédup : minuscules, sans accents,
 *  sans ponctuation, sans informations de volume (75ml, 3x75ml, etc.).
 *  Garde les concentrations (0.12%) car elles distinguent des variantes
 *  réellement différentes. */
function normalizeProductKey(brand: string | null, productName: string | null): string {
  const raw = [brand ?? "", productName ?? ""].join(" ").toLowerCase();
  if (!raw.trim()) return "";
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\b\d+\s*(?:ml|g|gr|kg|l)\b/g, "")
    .replace(/\b\d+\s*[x×]\s*\d+\s*(?:ml|g|gr|kg|l)?\b/g, "")
    .replace(/[^\w%]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function collectOpenAIWebCandidates(
  query: string,
  limit: number,
  excludeProducts: string[] = [],
): Promise<DuckDuckGoCandidate[]> {
  if (!hasOpenAI()) return [];
  const q = query.trim();
  if (q.length < 3) return [];

  // Liste d'exclusion pour la pagination "Voir plus" : on demande à OpenAI
  // de NE PAS re-proposer les produits déjà ramenés au premier call.
  const excludeBlock = excludeProducts.length > 0
    ? `\n\nÀ EXCLURE absolument (déjà proposés à l'utilisateur) : ${excludeProducts
        .slice(0, 30)
        .map((p) => `"${p}"`)
        .join(", ")}.`
    : "";

  const system = [
    "Tu es un assistant de recherche de produits cosmétiques.",
    "Tu reçois une saisie utilisateur (potentiellement mal orthographiée, abrégée ou avec marque manquante) et tu utilises la recherche web pour identifier les FICHES PRODUITS correspondantes.",
    "",
    "RÈGLES CRITIQUES :",
    `1. Renvoie au maximum ${limit} candidats. UN SEUL candidat par produit unique — pas 5 URLs différentes du même produit chez 5 pharmacies. Si tu trouves un produit identique chez plusieurs marchands, ne le liste qu'UNE fois (préfère la source qui expose la composition INCI).`,
    "2. PRIORITÉ ABSOLUE aux URLs qui exposent une liste INCI complète : INCIDecoder, INCIBeauty, Cosmétothèque, site officiel de la marque, fiche produit Sephora/Marionnaud/Nocibé. Ces sources sont MEILLEURES qu'une page marchande generique.",
    "3. URLs autorisées ensuite : marchands reconnus avec fiche produit détaillée (Amazon, Auchan, Carrefour, pharmacies en ligne). INTERDIT : YouTube, TikTok, Instagram, Pinterest, réseaux sociaux.",
    "4. N'invente AUCUNE URL. Si tu n'es pas certain qu'une URL existe vraiment, omets ce candidat.",
    "5. Pour chaque candidat : brand (marque exacte), productName (nom sans répéter la marque), url (lien direct).",
    "6. Réponse en JSON STRICT, sans markdown, sans commentaire.",
    "",
    'Format : {"candidates": [{"brand": "…", "productName": "…", "url": "https://…"}, …]}',
    'Si aucun résultat crédible : {"candidates": []}',
  ].join("\n");

  const userMsg = `Saisie utilisateur : """${q.slice(0, 200)}"""${excludeBlock}

Cherche sur le web et propose les fiches produits cosmétiques qui correspondent. Réponds en JSON strict.`;

  try {
    const { text } = await webSearchComplete(system, userMsg, {
      timeoutMs: 20_000,
    });
    const parsed = llmParse(CandidatesSchema, text);
    if (!parsed || !Array.isArray(parsed.candidates)) return [];

    const out: DuckDuckGoCandidate[] = [];
    const seenUrls = new Set<string>();
    const seenProducts = new Set<string>();
    for (const c of parsed.candidates) {
      const url = (c.url ?? "").trim();
      if (!url || !isWebUrl(url)) continue;
      if (seenUrls.has(url)) continue;
      const brand = c.brand ? c.brand.trim().slice(0, 80) || null : null;
      const productName = c.productName ? c.productName.trim().slice(0, 160) || null : null;
      // Déduplication par produit (brand+productName normalisés) en plus de
      // l'URL : sinon 8 pharmacies vendant le même "GUM Paroex 0,12%"
      // ramènent 8 cartes identiques.
      const productKey = normalizeProductKey(brand, productName);
      if (productKey && seenProducts.has(productKey)) continue;
      seenUrls.add(url);
      if (productKey) seenProducts.add(productKey);
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
