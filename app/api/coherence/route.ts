import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import {
  detectProductType,
  exploreOpenPromise,
  extractPromisesFromDescription,
  generateConclusion,
  type FormulaItemForLlm,
} from "@/lib/ai/coherence";
import {
  buildCoherenceResult,
  dedupProposals,
  reclassifyOpenProposals,
  resolveAbsencePromise,
  resolveOpenPromise,
} from "@/lib/coherence/engine";
import { findCategoryBySlug, isAbsenceCategory } from "@/lib/coherence/claims";
import { descriptionSupportsAbsenceClaim } from "@/lib/coherence/absenceGuard";
import { isUsageInstruction } from "@/lib/coherence/usageInstructionGuard";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import type { CoherencePromise, ProductType } from "@/lib/coherence/types";
import { apiGate } from "@/lib/apiGate";
import { idempotencyKey, idempotencyLookup, idempotencyStore } from "@/lib/idempotency";
import { logError } from "@/lib/log";
import { loadProfileForPrompt } from "@/lib/skin/promptFormat";
import { loadRestrictionsForPrompt } from "@/lib/restrictions/promptFormat";
import { supabaseService } from "@/lib/supabase";

/**
 * Version du moteur de cohérence. v4 = resynchronisation stricte avec l'edge
 * coherence-analyze (dual-use Annexe III 3 slugs + formulaHasDeclaredFragrance
 * + keywords demelage unifiés) + HASH UNIFIÉ (items slug/name triés, plus le
 * texte INCI brut) + cache des conclusions PAR SIGNATURE de profil (fini la
 * conclusion personnalisée d'un user servie à un autre). Le cache est donc
 * PARTAGÉ entre web et mobile : même clé, même format.
 */
// v5 = garde déterministe des MODES D'EMPLOI (usageInstructionGuard) : une
// consigne d'usage ("appliquer avant le coucher") n'est plus comptée comme une
// promesse "non démontrée" + règle prompt correspondante. PARITÉ mobile (edge
// coherence-analyze ALGO_VERSION="v5"). Bumper invalide coherence_cache (v4).
const COHERENCE_ALGO_VERSION = "v5";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 25;

type Body = {
  analysis_id?: string;
  description?: string;
};

const sha256Hex = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

/**
 * POST /api/coherence
 * Body: { analysis_id, description }
 *
 * MIROIR EXACT de l'edge `coherence-analyze` (mobile) :
 *   1. Auth + rate-limit IP (0 crédit) + idempotence.
 *   2. RÉ-ANALYSE = PURE LECTURE : si CE user a déjà une coherence_analysis
 *      pour (analysis_id, description) → on la renvoie. 0 IA, 0 crédit.
 *   3. Cache cross-user `coherence_cache` (inci_hash items triés + desc hash,
 *      algo v4) : steps 0-3 servis sans IA ; conclusion servie sans IA si une
 *      signature de profil identique est déjà passée.
 *   4. Débit de 1 crédit UNIQUEMENT sur cache MISS (pipeline IA complet).
 *   5. Persist dans coherence_analyses + upsert du cache partagé.
 *
 * Returns: { id, result, cache: "user" | "full" | "partial" | "miss" }
 */
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const analysisId = (body.analysis_id ?? "").trim();
  const description = (body.description ?? "").trim();
  if (!analysisId) {
    return NextResponse.json({ error: "analysis_id manquant." }, { status: 400 });
  }
  if (description.length < 30) {
    return NextResponse.json(
      { error: "Description trop courte (au moins 30 caractères)." },
      { status: 400 },
    );
  }
  if (description.length > 6000) {
    return NextResponse.json(
      { error: "Description trop longue (max 6000 caractères)." },
      { status: 400 },
    );
  }

  // Auth + IP rate-limit (no credit yet - idempotency lookup first to avoid
  // double-billing duplicate clicks).
  const gate = await apiGate(req, { feature: "coherence", costCredits: 0 });
  if (!gate.ok) return gate.response;
  const { user, supabase: sb } = gate;

  const idemKey = idempotencyKey(user.id, "coherence", { analysisId, description });
  const cachedIdem = await idempotencyLookup(idemKey);
  if (cachedIdem) return cachedIdem;

  try {
    // Look up the parent analysis. RLS already restricts to the user's own
    // rows; we add an explicit user_id check as belt-and-braces.
    const { data: analysisRow, error: analysisErr } = await sb
      .schema("cosme_check")
      .from("analyses")
      .select("id, user_id, name, product_label, product_type, brand, result_json")
      .eq("id", analysisId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (analysisErr || !analysisRow) {
      return NextResponse.json(
        { error: "Analyse INCI introuvable ou inaccessible." },
        { status: 404 },
      );
    }

    const parent = analysisRow.result_json as AnalyseResponse;
    if (!parent || !Array.isArray(parent.items) || parent.items.length === 0) {
      return NextResponse.json(
        { error: "L'analyse INCI source est invalide ou vide." },
        { status: 400 },
      );
    }

    const productLabel
      = (analysisRow.product_label as string | null)
      ?? (analysisRow.name as string | null)
      ?? null;

    // ─── RÉ-ANALYSE = PURE LECTURE (même user, même produit, même promesse) ─
    const { data: existingRows } = await sb
      .schema("cosme_check")
      .from("coherence_analyses")
      .select("id, result_json")
      .eq("user_id", user.id)
      .eq("analysis_id", analysisId)
      .eq("description", description)
      .order("created_at", { ascending: false })
      .limit(1);
    const existing = existingRows?.[0] ?? null;
    if (existing?.result_json) {
      return NextResponse.json(
        { id: existing.id, result: existing.result_json, cache: "user" },
        { headers: { "X-Coherence-Cache": "user" } },
      );
    }

    // ─── Cache cross-user : HASH UNIFIÉ avec l'edge (items slug/name triés) ─
    const inciHash = sha256Hex(
      parent.items
        .map((it) => (it.slug || it.name || ""))
        .filter(Boolean)
        .sort()
        .join("|"),
    ).slice(0, 40);
    const descHash = sha256Hex(description.toLowerCase()).slice(0, 40);

    type Extraction = Awaited<ReturnType<typeof extractPromisesFromDescription>>;
    type CacheVal = {
      promises: CoherencePromise[];
      unverifiable: Extraction["unverifiable"];
      outOfScope: Extraction["outOfScope"];
      conclusions?: Record<string, string>;
    };

    let promises: CoherencePromise[];
    let unverifiable: Extraction["unverifiable"];
    let outOfScope: Extraction["outOfScope"];
    let productType: ProductType;

    const svc = supabaseService();
    const [cacheRead, profileBlock, restrictionsBlock] = await Promise.all([
      svc
        .schema("cosme_check")
        .from("coherence_cache")
        .select("result_json, product_type")
        .eq("inci_hash", inciHash)
        .eq("description_hash", descHash)
        .eq("algo_version", COHERENCE_ALGO_VERSION)
        .maybeSingle(),
      loadProfileForPrompt(user.id),
      loadRestrictionsForPrompt(user.id),
    ]);
    const personalSig = sha256Hex(`${profileBlock ?? ""}|${restrictionsBlock ?? ""}`).slice(0, 16);

    const cachedVal = (cacheRead.data as
      | { result_json: CacheVal; product_type: string | null }
      | null) ?? null;

    let cacheState: "full" | "partial" | "miss" = "miss";
    let cachedConclusion: string | null = null;

    if (cachedVal && Array.isArray(cachedVal.result_json?.promises)) {
      // HIT cross-user : on saute les LLM coûteux (steps 0-3). Pas de débit
      // (même règle que `analyser` sur cache EAN).
      promises = cachedVal.result_json.promises;
      unverifiable = cachedVal.result_json.unverifiable;
      outOfScope = cachedVal.result_json.outOfScope;
      productType = (cachedVal.product_type ?? "autre") as ProductType;
      cachedConclusion = cachedVal.result_json.conclusions?.[personalSig] ?? null;
      cacheState = cachedConclusion ? "full" : "partial";
    } else {
      // MISS → pipeline IA complet. Débit AVANT le travail.
      const charge = await gate.consumeCredit("coherence");
      if (!charge.ok) return charge.response;

      // ─── Step 0: detect product type (silent LLM call). ─────────────────
      const typeHint = [
        analysisRow.product_type as string | null,
        productLabel,
        analysisRow.brand as string | null,
      ]
        .filter((s): s is string => Boolean(s && s.trim()))
        .join(" - ");
      productType = await detectProductType(description, typeHint || null, user.id);

      // ─── Step 1: extract promises (LLM, JSON schema strict) ─────────────
      const extraction = await extractPromisesFromDescription(
        description,
        productType,
        user.id,
      );
      const reclassifiedProposals = reclassifyOpenProposals(
        extraction.proposals,
        productType,
      );
      const dedupedProposals = dedupProposals(reclassifiedProposals);

      // ─── Step 2: absence (déterministe, par tag) vs effet (LLM validé) ───
      // Garde anti-hallucination : on écarte une promesse d'absence si la
      // description ne l'affirme pas LITTÉRALEMENT (token ingrédient + marqueur
      // "sans/0 %/free" proche). Sans ça, un "sans X" inventé par le LLM + la
      // présence de X dans la formule = verdict "contredite" à tort — on
      // accuserait la marque d'une promesse jamais faite (audit prod 07/2026).
      const guardedProposals = dedupedProposals.filter((p) => {
        // Écarte les modes d'emploi ("appliquer avant le coucher", "masser…") :
        // ce ne sont pas des promesses vérifiables dans la formule.
        if (isUsageInstruction(p.label, p.excerpt)) return false;
        const cat = findCategoryBySlug(p.category_slug);
        if (cat && isAbsenceCategory(cat)) {
          return descriptionSupportsAbsenceClaim(cat.slug, description);
        }
        return true;
      });

      const cataloguePromises: CoherencePromise[] = [];
      const openProposals: typeof extraction.proposals = [];
      for (const p of guardedProposals) {
        const cat = findCategoryBySlug(p.category_slug);
        if (cat && isAbsenceCategory(cat)) {
          cataloguePromises.push(resolveAbsencePromise(p, cat, parent.items));
        } else {
          openProposals.push(p);
        }
      }

      // ─── Step 3: open promises - explore the formula via LLM in parallel ─
      const itemsForLlm: FormulaItemForLlm[] = parent.items
        .filter((it): it is typeof it & { slug: string; name: string } =>
          Boolean(it.slug) && Boolean(it.name),
        )
        .map((it) => ({
          slug: it.slug,
          name: it.name,
          primaryFunction: it.primaryFunction,
        }));

      const openPromises: CoherencePromise[] = await Promise.all(
        openProposals.map(async (p) => {
          const exploration = await exploreOpenPromise(
            p.label,
            p.excerpt,
            itemsForLlm,
            user.id,
          );
          return resolveOpenPromise(p, parent.items, exploration.matches, exploration.missing);
        }),
      );

      promises = [...cataloguePromises, ...openPromises];
      unverifiable = extraction.unverifiable;
      outOfScope = extraction.outOfScope;
    }

    // ─── Step 5: conclusion (LLM, only sees verdicts) + personnalisation ───
    // Servie depuis le cache si un profil identique est déjà passé (0 IA).
    const conclusion = cachedConclusion
      ?? (await generateConclusion(
        promises,
        productLabel,
        user.id,
        profileBlock,
        restrictionsBlock,
      ));

    // Écriture/mise à jour du cache cross-user : steps 0-3 + la conclusion de
    // CE profil (map bornée aux 20 dernières signatures).
    if (cacheState !== "full") {
      const prevConclusions = cachedVal?.result_json?.conclusions ?? {};
      const conclusionEntries = [
        ...Object.entries(prevConclusions).filter(([k]) => k !== personalSig),
        [personalSig, conclusion] as const,
      ].slice(-20);
      const val: CacheVal = {
        promises,
        unverifiable,
        outOfScope,
        conclusions: Object.fromEntries(conclusionEntries),
      };
      void (async () => {
        try {
          await svc
            .schema("cosme_check")
            .from("coherence_cache")
            .upsert(
              {
                inci_hash: inciHash,
                description_hash: descHash,
                result_json: val,
                product_type: productType,
                algo_version: COHERENCE_ALGO_VERSION,
              },
              { onConflict: "inci_hash,description_hash" },
            );
        } catch { /* non-blocking */ }
      })();
    }

    // ─── Step 4: build the full structured result (engine, deterministic) ──
    const result = buildCoherenceResult({
      description,
      promises,
      unverifiable,
      outOfScope,
      productType,
      parent,
      conclusion,
    });

    // Persist dans l'historique perso du user.
    const { data: saved, error: saveErr } = await sb
      .schema("cosme_check")
      .from("coherence_analyses")
      .insert({
        user_id: user.id,
        analysis_id: analysisId,
        description,
        result_json: result,
      })
      .select("id")
      .single();

    if (saveErr || !saved) {
      return NextResponse.json(
        { error: "Échec de sauvegarde de l'analyse de cohérence." },
        { status: 500 },
      );
    }

    const response = NextResponse.json(
      { id: saved.id, result, cache: cacheState },
      { headers: { "X-Coherence-Cache": cacheState } },
    );
    await idempotencyStore(idemKey, response);
    return response;
  } catch (err) {
    logError("coherence", err, { userId: user.id });
    return NextResponse.json(
      { error: "Erreur lors de l'analyse de cohérence." },
      { status: 500 },
    );
  }
}
