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
 * — we trust RLS to gate the update to the row owner.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { extractJsonObject, webSearchComplete } from "@/lib/ai/webSearch";
import { supabaseServer } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

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
const MAX_DESC_LEN = 4000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(ip, 6, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessaye dans une minute." },
      { status: 429, headers: { "Retry-After": Math.ceil(rl.retryAfter / 1000).toString() } },
    );
  }

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

  const system = [
    "Tu reçois l'identité d'un produit cosmétique et l'URL de sa fiche officielle. Tu fais une recherche web ciblée sur cette URL (et sur la marque si l'URL ne suffit pas) pour récupérer la PROMESSE MARKETING du produit telle qu'elle est formulée par la marque.",
    "",
    "La promesse marketing = ce que le produit prétend faire pour la peau / les cheveux : bénéfices revendiqués, claims (anti-âge, hydratation 24h, etc.), actifs mis en avant, résultats annoncés, public cible.",
    "",
    "RÈGLES :",
    "1. Cite la marque, pas tes propres mots. Reformule légèrement si nécessaire mais reste FIDÈLE au discours de la marque.",
    "2. N'INVENTE PAS de bénéfices. Si tu ne trouves pas de description marketing crédible, renvoie `{\"notFound\": true, \"reason\": \"…\"}`.",
    "3. Pas de listing d'ingrédients INCI — ça vient de l'autre côté. Concentre-toi sur les promesses et les actifs marketing.",
    "4. Longueur cible : 200-600 caractères, format paragraphe (pas de liste à puces, pas de markdown).",
    "5. Renvoie en JSON STRICT, pas de markdown.",
    "",
    "Format de réponse :",
    "Si trouvé : {\"notFound\": false, \"description\": \"<promesse marketing>\", \"sourceUrl\": \"<URL effectivement utilisée>\"}",
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
Cherche la promesse marketing officielle (claims, bénéfices, actifs mis en avant) telle que présentée par la marque. Réponds en JSON strict.`;

  let description = "";
  let finalUrl = sourceUrl;
  let notFoundReason: string | null = null;

  try {
    const { text } = await webSearchComplete(system, userMsg, { timeoutMs: 35_000 });
    const parsed = extractJsonObject<{
      notFound?: boolean;
      reason?: string;
      description?: string;
      sourceUrl?: string;
    }>(text);

    if (!parsed) {
      notFoundReason = "format_inattendu";
    } else if (parsed.notFound === true || !parsed.description) {
      notFoundReason = parsed.reason ?? "pas_de_description";
    } else {
      description = parsed.description.trim().slice(0, MAX_DESC_LEN);
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
    console.error("[promesse/fetch-description] failed:", msg);
    return NextResponse.json({ error: "Erreur lors de la récupération." }, { status: 500 });
  }

  if (!description) {
    return NextResponse.json({
      notFound: true,
      reason: notFoundReason ?? "pas_de_description",
    } satisfies FetchDescriptionResponse);
  }

  // Best-effort persist on the analyses row. The analysisId is optional —
  // the modal might call this endpoint before the analyse has been saved
  // (anonymous user, or RLS row not yet visible). In that case we just
  // return the description and let the caller proceed.
  let persisted = false;
  if (body.analysisId && typeof body.analysisId === "string" && body.analysisId.length > 8) {
    try {
      const cookieStore = await cookies();
      const sb = supabaseServer(cookieStore);
      const { error: updateErr } = await sb
        .schema("cosme_check")
        .from("analyses")
        .update({
          product_description: description,
          promise_source_url: finalUrl,
        })
        .eq("id", body.analysisId);
      if (updateErr) {
        console.warn("[promesse/fetch-description] persist failed:", updateErr.message);
      } else {
        persisted = true;
      }
    } catch (err) {
      console.warn("[promesse/fetch-description] persist threw:", (err as Error).message);
    }
  }

  return NextResponse.json({
    notFound: false,
    description,
    sourceUrl: finalUrl,
    persisted,
  } satisfies FetchDescriptionResponse);
}
