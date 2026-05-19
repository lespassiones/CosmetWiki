/**
 * POST /api/promesse/fetch-description
 *
 * Once the user has picked one of the candidates returned by
 * /api/promesse/identify, we issue a targeted web-search call to retrieve
 * the marketing promise of that specific product (claims, benefits, key
 * actives the brand highlights). The result is then persisted onto the
 * analyses row (product_description + promise_source_url) and fed to the
 * coherence wizard as the description input.
 *
 * The optional `analysisId` lets us PATCH the analyses row in the same call
 * - we trust RLS to gate the update to the row owner.
 */
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { webSearchComplete } from "@/lib/ai/webSearch";
import { llmParse } from "@/lib/zod/llmParse";
import { getCached, setCached } from "@/lib/ai/client";
import { apiGate } from "@/lib/apiGate";
import { logError, logWarn, logInfo } from "@/lib/log";

function normForCache(s: string | undefined | null): string {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

// Some web-search responses end with a markdown citation like
// "([example.com](https://example.com/...))" or "[source](https://...)" even
// when the prompt says no markdown. We don't want to surface that URL in the
// description shown to the user, so we strip trailing citations (possibly
// stacked) before persisting / returning.
function stripTrailingCitations(text: string): string {
  let cleaned = text.trimEnd();
  for (let i = 0; i < 4; i++) {
    const next = cleaned
      .replace(/\s*\(?\s*\[[^\]]+\]\(https?:\/\/[^)\s]+\)\s*\)?\s*\.?\s*$/u, "")
      .trimEnd();
    if (next === cleaned) break;
    cleaned = next;
  }
  return cleaned;
}

function descriptionCacheKey(input: {
  sourceUrl: string;
  candidateName: string;
  brand: string;
  productType: string;
}): string {
  const payload = JSON.stringify({
    sourceUrl: normForCache(input.sourceUrl),
    candidateName: normForCache(input.candidateName),
    brand: normForCache(input.brand),
    productType: normForCache(input.productType),
  });
  const hash = crypto.createHash("sha256").update(payload).digest("hex").slice(0, 24);
  return `promesse:description:${hash}`;
}

// What we cache in ai_cache. We DON'T cache the `persisted` flag - it depends
// on the analysisId the caller passes, which is user-specific. We re-PATCH on
// every cache hit so each user's analyses row gets updated correctly.
type CachedDescription = {
  description: string;
  sourceUrl: string;
};

// Shape the LLM may return. Validated at runtime via Zod - if the model
// invents { description: ["array"] } or returns a non-object, we refuse the
// response and treat it as "format_inattendu" instead of crashing on
// `parsed.description.trim()`.
const FetchDescriptionLlmSchema = z.object({
  notFound: z.boolean().optional(),
  reason: z.string().optional(),
  description: z.string().optional(),
  sourceUrl: z.string().optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FetchPayload = {
  sourceUrl?: string;
  candidateName?: string;
  brand?: string;
  productType?: string;
  analysisId?: string;
};

export type FetchDescriptionResponse =
  | {
      notFound: false;
      description: string;
      sourceUrl: string;
      persisted: boolean;
    }
  | { notFound: true; reason: string };

const MIN_DESC_LEN = 60;
const MAX_DESC_LEN = 5000;

export async function POST(req: NextRequest) {
  // Auth + rate-limit only here. Credit is charged AFTER cache lookup so two
  // users picking the same candidate don't each pay for the same web-search.
  const gate = await apiGate(req, { feature: "promesse.fetch_description", costCredits: 0 });
  if (!gate.ok) return gate.response;

  let body: FetchPayload;
  try {
    body = (await req.json()) as FetchPayload;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const sourceUrl = (body.sourceUrl ?? "").trim();
  const candidateName = (body.candidateName ?? "").trim().slice(0, 200);
  const brand = (body.brand ?? "").trim().slice(0, 120);
  const productType = (body.productType ?? "").trim().slice(0, 120);

  if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) {
    return NextResponse.json({ error: "URL source manquante ou invalide." }, { status: 400 });
  }
  if (!candidateName) {
    return NextResponse.json({ error: "Nom du produit manquant." }, { status: 400 });
  }

  // Cache lookup BEFORE consuming the credit. The cached payload contains
  // only {description, sourceUrl} - we re-PATCH the analyses row for the
  // current user below regardless of cache hit.
  const cacheKey = descriptionCacheKey({ sourceUrl, candidateName, brand, productType });
  const cachedDesc = await getCached<CachedDescription>(cacheKey);

  // On miss → charge the credit BEFORE doing the LLM call. On hit, we still
  // want to PATCH the user's analyses row (free, no LLM), so we fall through
  // to the persist block below with description/finalUrl pre-filled.
  let chargedFromMiss = false;
  if (!cachedDesc) {
    const charge = await gate.consumeCredit("promesse.fetch_description");
    if (!charge.ok) return charge.response;
    chargedFromMiss = true;
  } else {
    logInfo("promesse.fetch_description.cache_hit", { cacheKey });
  }

  const system = [
    "Tu reçois l'identité d'un produit cosmétique et l'URL de sa fiche officielle. Tu fais une recherche web ciblée sur cette URL (et sur la marque si l'URL ne suffit pas) pour récupérer la PROMESSE MARKETING du produit telle qu'elle est formulée par la marque.",
    "",
    "La promesse marketing = ce que le produit prétend faire pour la peau / les cheveux : bénéfices revendiqués, claims (anti-âge, hydratation 24h, etc.), actifs mis en avant, résultats annoncés, public cible, état souhaité de la peau / des cheveux après usage (douceur, souplesse, confort, beauté…).",
    "",
    "RÈGLES :",
    "1. Cite la marque, pas tes propres mots. Tu peux nettoyer le HTML, retirer les répétitions évidentes et structurer en paragraphe, mais tu ne raccourcis PAS au point de perdre des bénéfices.",
    "2. PRÉSERVATION DES PHRASES-PROMESSES : toute phrase ou tronçon de phrase qui décrit un effet sur la zone d'application doit être conservé verbatim (ou quasi-verbatim). Cela inclut explicitement les formulations courtes type slogan : \"rend les mains douces et belles\", \"laisse la peau souple\", \"donne du confort\", \"embellit le teint\", \"sublime les cheveux\". Ces phrases comptent comme des promesses analysables même si elles sonnent marketing. NE LES JETTE JAMAIS sous prétexte qu'elles paraissent secondaires.",
    "3. CE QUE TU PEUX CONDENSER : les redondances pures (le même claim répété 3 fois sur la page), les éléments hors-promesse (prix, code produit, FAQ logistique). PAS les claims distincts.",
    "4. N'INVENTE PAS de bénéfices. Si la marque ne dit pas \"rend les mains douces\", tu ne l'ajoutes pas. Si tu ne trouves pas de description marketing crédible, renvoie `{\"notFound\": true, \"reason\": \"…\"}`.",
    "5. Pas de listing d'ingrédients INCI complet - ça vient de l'autre côté. Mais si la marque cite explicitement des actifs (\"à l'huile d'argan\", \"enrichi en B5\"), tu les gardes : ils font partie de la promesse.",
    "6. Longueur cible : 400-1800 caractères, format paragraphe (pas de liste à puces, pas de markdown). Tu dépasses cette plage si la marque a beaucoup de claims distincts à conserver.",
    "7. Renvoie en JSON STRICT, pas de markdown.",
    "",
    "Format de réponse :",
    "Si trouvé : {\"notFound\": false, \"description\": \"<promesse marketing fidèle>\", \"sourceUrl\": \"<URL effectivement utilisée>\"}",
    "Si rien trouvé : {\"notFound\": true, \"reason\": \"<brève raison>\"}",
  ].join("\n");

  const hintsBlock = [
    brand ? `- Marque : ${brand}` : null,
    productType ? `- Type : ${productType}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const userMsg = `Produit : ${candidateName}
URL source : ${sourceUrl}
${hintsBlock ? `${hintsBlock}\n` : ""}
Cherche la promesse marketing officielle (claims, bénéfices, actifs mis en avant, slogans bénéfice-cible) telle que présentée par la marque. Préserve toutes les phrases qui décrivent un effet sur la peau ou les cheveux, même les phrases courtes type slogan. Réponds en JSON strict.`;

  // Updates we'll PATCH onto the analyses row at the end. We collect the
  // identity bits (label/brand/type) up-front so the row gets renamed from
  // the auto-generated "Analyse du 17 mai" to the actual product name the
  // moment the user confirms a candidate, even if the marketing description
  // fetch later fails. The description bits are added only if we manage to
  // resolve them.
  const updates: Record<string, string> = {};
  // product_label is the human title shown everywhere (history list, detail
  // page, analyse panel). Brand first if we have it, then the product name -
  // mirrors the convention used by AnalysisRunner when joining productSource.
  const newLabel = [brand, candidateName].filter(Boolean).join(" ").slice(0, 200);
  if (newLabel) updates.product_label = newLabel;
  if (brand) updates.brand = brand;
  if (productType) updates.product_type = productType;

  let description = "";
  let finalUrl = sourceUrl;
  let notFoundReason: string | null = null;

  if (cachedDesc) {
    // Cache hit - skip the LLM call entirely, reuse the cached payload.
    // Older cache entries may still embed a trailing citation, strip it here.
    description = stripTrailingCitations(cachedDesc.description);
    finalUrl = cachedDesc.sourceUrl;
  } else {
    try {
      const { text } = await webSearchComplete(system, userMsg, { timeoutMs: 35_000 });
      const parsed = llmParse(FetchDescriptionLlmSchema, text);

      if (!parsed) {
        notFoundReason = "format_inattendu";
      } else if (parsed.notFound === true || !parsed.description) {
        notFoundReason = parsed.reason ?? "pas_de_description";
      } else {
        description = stripTrailingCitations(parsed.description.trim()).slice(0, MAX_DESC_LEN);
        if (description.length < MIN_DESC_LEN) {
          notFoundReason = "description_trop_courte";
          description = "";
        } else if (parsed.sourceUrl && /^https?:\/\//i.test(parsed.sourceUrl)) {
          finalUrl = parsed.sourceUrl;
        }
      }
    } catch (err) {
      const msg = (err as Error).message ?? "unknown";
      if (msg.includes("openai_unavailable")) {
        return NextResponse.json({ error: "Recherche IA indisponible." }, { status: 503 });
      }
      if (msg.includes("timeout")) {
        return NextResponse.json({ error: "La recherche a pris trop de temps. Réessaie." }, { status: 504 });
      }
      logError("promesse.fetch_description", err, { userId: gate.user.id });
      return NextResponse.json({ error: "Erreur lors de la récupération." }, { status: 500 });
    }

    // Cache the successful result so the next user picking the same candidate
    // gets it for free. We don't cache misses - OBF/INCIDecoder data improves
    // over time and a retry might succeed.
    if (description && !notFoundReason) {
      void setCached(cacheKey, { description, sourceUrl: finalUrl } satisfies CachedDescription);
    }
  }
  // Mark `chargedFromMiss` as intentionally used (just metadata for now).
  void chargedFromMiss;

  // Fold the description bits into the same PATCH payload when we got them
  // - single round-trip to Supabase instead of two.
  if (description) {
    updates.product_description = description;
    updates.promise_source_url = finalUrl;
  }

  // Best-effort persist on the analyses row. The analysisId is optional -
  // the modal might call this endpoint before the analyse has been saved
  // (anonymous user, or RLS row not yet visible). In that case we just
  // return whatever we resolved and let the caller proceed.
  let persisted = false;
  if (
    body.analysisId
    && typeof body.analysisId === "string"
    && body.analysisId.length > 8
    && Object.keys(updates).length > 0
  ) {
    try {
      const { error: updateErr } = await gate.supabase
        .schema("cosme_check")
        .from("analyses")
        .update(updates)
        .eq("id", body.analysisId);
      if (updateErr) {
        logWarn("[promesse.fetch_description] persist failed", { error: updateErr.message });
      } else {
        persisted = true;
      }
    } catch (err) {
      logWarn("[promesse.fetch_description] persist threw", { error: (err as Error).message });
    }
  }

  if (!description) {
    return NextResponse.json({
      notFound: true,
      reason: notFoundReason ?? "pas_de_description",
    } satisfies FetchDescriptionResponse);
  }

  return NextResponse.json({
    notFound: false,
    description,
    sourceUrl: finalUrl,
    persisted,
  } satisfies FetchDescriptionResponse);
}
