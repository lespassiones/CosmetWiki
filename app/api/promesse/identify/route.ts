/**
 * POST /api/promesse/identify
 *
 * Given an INCI list (mandatory) and any product identity hints we have
 * (productLabel, brand, productType), search the web for the top 3
 * candidate products and return them with a source URL each. The user
 * picks one in the modal; we then call /api/promesse/fetch-description
 * on the chosen candidate to retrieve its marketing promise.
 *
 * Returns:
 *   { candidates: [{ name, brand, productType, sourceUrl, confidence }], notFound: false }
 *   or
 *   { candidates: [], notFound: true, reason }
 */
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { webSearchComplete } from "@/lib/ai/webSearch";
import { llmParse } from "@/lib/zod/llmParse";
import { getCached, setCached } from "@/lib/ai/client";
import { apiGate } from "@/lib/apiGate";
import { logError, logInfo } from "@/lib/log";

function normForCache(s: string | undefined | null): string {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function identifyCacheKey(input: {
  inci: string;
  productLabel: string;
  brand: string;
  productType: string;
}): string {
  const payload = JSON.stringify({
    inci: normForCache(input.inci),
    productLabel: normForCache(input.productLabel),
    brand: normForCache(input.brand),
    productType: normForCache(input.productType),
  });
  const hash = crypto.createHash("sha256").update(payload).digest("hex").slice(0, 24);
  return `promesse:identify:${hash}`;
}

// Shape the LLM may return - validated at runtime. If the model returns a
// non-object or candidates that aren't an array, we treat it as not found
// instead of crashing in the downstream filtering loop.
const IdentifyLlmSchema = z.object({
  notFound: z.boolean().optional(),
  reason: z.string().optional(),
  candidates: z
    .array(
      z.object({
        name: z.string().optional(),
        brand: z.string().nullable().optional(),
        productType: z.string().nullable().optional(),
        sourceUrl: z.string().optional(),
        confidence: z.number().optional(),
      }),
    )
    .optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 25;

type IdentifyPayload = {
  inci?: string;
  productLabel?: string;
  brand?: string;
  productType?: string;
};

export type IdentifyCandidate = {
  name: string;
  brand: string | null;
  productType: string | null;
  sourceUrl: string;
  confidence: number;
};

export type IdentifyResponse =
  | { candidates: IdentifyCandidate[]; notFound: false }
  | { candidates: []; notFound: true; reason: string };

const MAX_INCI_LEN = 4000;

export async function POST(req: NextRequest) {
  // Auth + rate-limit only at this stage. The credit is charged AFTER the
  // cache lookup so two users scanning the same product (same INCI + identity
  // hints) don't each pay for an LLM call. The first one runs the web-search,
  // the second is served from ai_cache instantly and for free.
  const gate = await apiGate(req, { feature: "promesse.identify", costCredits: 0 });
  if (!gate.ok) return gate.response;

  let body: IdentifyPayload;
  try {
    body = (await req.json()) as IdentifyPayload;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const inci = (body.inci ?? "").trim().slice(0, MAX_INCI_LEN);
  if (!inci) {
    return NextResponse.json({ error: "Liste INCI manquante." }, { status: 400 });
  }
  const productLabel = (body.productLabel ?? "").trim().slice(0, 200);
  const brand = (body.brand ?? "").trim().slice(0, 120);
  const productType = (body.productType ?? "").trim().slice(0, 120);

  // Cache lookup BEFORE consuming the credit. A second user scanning the
  // same product (same INCI + identity hints) gets the result for free.
  const cacheKey = identifyCacheKey({ inci, productLabel, brand, productType });
  const cached = await getCached<IdentifyResponse>(cacheKey);
  if (cached) {
    logInfo("promesse.identify.cache_hit", { cacheKey });
    return NextResponse.json(cached);
  }

  // Cache miss → charge the credit, then run the LLM call.
  const charge = await gate.consumeCredit("promesse.identify");
  if (!charge.ok) return charge.response;

  const system = [
    "Tu es un expert en identification de produits cosmétiques. Tu reçois une liste INCI et des indices d'identité (nom partiel, marque, type) - éventuellement vides.",
    "",
    "Ta mission : faire une recherche web pour identifier les produits cosmétiques commercialisés dont la formule correspond à cette liste INCI. Renvoie jusqu'à 3 candidats plausibles classés par confiance décroissante.",
    "",
    "RÈGLES CRITIQUES :",
    "1. Chaque candidat DOIT avoir une URL source vérifiable (fiche produit officielle de la marque, page Sephora/Marionnaud/Nocibé/INCIDecoder/Beauty Lookup, page d'une enseigne reconnue). Refuse tout candidat sans URL crédible.",
    "2. N'INVENTE PAS de produit. Si tu ne trouves aucune correspondance crédible, renvoie `{\"notFound\": true, \"reason\": \"…\"}`.",
    "3. Une liste INCI peut correspondre à plusieurs produits (mêmes formules dans plusieurs gammes/marques). C'est normal - propose les 2-3 plus probables si tu en trouves.",
    "4. Confiance : 1.0 = formule identique + nom/marque qui matchent l'indice ; 0.7 = formule très proche ; 0.5 = formule plausible mais incertain ; <0.4 = ne le propose pas.",
    "5. Réponse en JSON STRICT, pas de markdown, pas de commentaire.",
    "",
    "Format de réponse :",
    "Si tu as trouvé : {\"notFound\": false, \"candidates\": [{\"name\": \"…\", \"brand\": \"…\", \"productType\": \"…\", \"sourceUrl\": \"https://…\", \"confidence\": 0.9}, …]}",
    "Si rien trouvé : {\"notFound\": true, \"reason\": \"<brève raison>\"}",
  ].join("\n");

  const hintsBlock = [
    productLabel ? `- Nom (indice) : ${productLabel}` : null,
    brand ? `- Marque (indice) : ${brand}` : null,
    productType ? `- Type (indice) : ${productType}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const userMsg = `Liste INCI :
${inci}

${hintsBlock ? `Indices d'identité :\n${hintsBlock}\n` : "Aucun indice supplémentaire - base-toi uniquement sur la liste INCI."}

Cherche sur le web et propose jusqu'à 3 candidats. Réponds en JSON strict, sans markdown.`;

  try {
    const { text, citations } = await webSearchComplete(system, userMsg, {
      timeoutMs: 35_000,
    });
    const parsed = llmParse(IdentifyLlmSchema, text);

    if (!parsed) {
      // The model returned prose without a JSON block - treat as notFound but
      // log the citations so we can debug. Avoid surfacing a 500 to the user.
      return NextResponse.json({
        candidates: [],
        notFound: true,
        reason: "format_inattendu",
      } satisfies IdentifyResponse);
    }

    if (parsed.notFound === true || !Array.isArray(parsed.candidates) || parsed.candidates.length === 0) {
      return NextResponse.json({
        candidates: [],
        notFound: true,
        reason: parsed.reason ?? "aucun_match",
      } satisfies IdentifyResponse);
    }

    // Sanitize + dedupe by name+brand. Drop any candidate without a
    // crédible URL - the prompt explicitly demands one and we trust the
    // model more than our format-tolerance.
    const seen = new Set<string>();
    const candidates: IdentifyCandidate[] = [];
    for (const c of parsed.candidates) {
      const name = (c.name ?? "").trim().slice(0, 200);
      const url = (c.sourceUrl ?? "").trim();
      const conf = typeof c.confidence === "number" ? c.confidence : 0;
      if (!name || !url || !/^https?:\/\//i.test(url) || conf < 0.4) continue;
      const key = `${name.toLowerCase()}|${(c.brand ?? "").toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({
        name,
        brand: c.brand ? c.brand.trim().slice(0, 120) : null,
        productType: c.productType ? c.productType.trim().slice(0, 120) : null,
        sourceUrl: url,
        confidence: Math.min(1, Math.max(0, conf)),
      });
      if (candidates.length >= 3) break;
    }

    if (candidates.length === 0) {
      return NextResponse.json({
        candidates: [],
        notFound: true,
        reason: "aucun_match_credible",
      } satisfies IdentifyResponse);
    }

    // Cross-reference citations: if the model gave a candidate without an
    // explicit URL but a matching citation exists, we could fill it in.
    // We log unused citations server-side for future tuning but don't act
    // on them - better a missing candidate than a wrong one.
    void citations;

    const response: IdentifyResponse = { candidates, notFound: false };
    // Cache only successful identifications. "Not found" results are not
    // cached so a second attempt can pick up new data (OBF/INCIDecoder may
    // have indexed the product since the first miss).
    void setCached(cacheKey, response);
    return NextResponse.json(response);
  } catch (err) {
    const msg = (err as Error).message ?? "unknown";
    if (msg.includes("openai_unavailable")) {
      return NextResponse.json({ error: "Recherche IA indisponible." }, { status: 503 });
    }
    if (msg.includes("timeout")) {
      return NextResponse.json({ error: "La recherche a pris trop de temps. Réessaie." }, { status: 504 });
    }
    logError("promesse.identify", err, { userId: gate.user.id });
    return NextResponse.json({ error: "Erreur lors de la recherche." }, { status: 500 });
  }
}
