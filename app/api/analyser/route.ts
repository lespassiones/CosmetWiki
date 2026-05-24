import { NextRequest, NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase";
import { parseInciList, computeScore, scoreLabel, type ColorRating } from "@/lib/inciParser";
import { apiGate } from "@/lib/apiGate";
import { idempotencyKey, idempotencyLookup, idempotencyStore } from "@/lib/idempotency";
import { logError, logWarn } from "@/lib/log";
import { safeError } from "@/lib/safeError";
import { generateSynthesis } from "@/lib/ai/synthesis";
import { loadProfileForPrompt } from "@/lib/skin/promptFormat";
import { loadRestrictionsContext } from "@/lib/restrictions/promptFormat";
import { checkRestrictions } from "@/lib/restrictions/check";
import { categorizeProduct, type ProductCategory } from "@/lib/ai/categorize";
import { NEUTRAL_OR_POSITIVE_TAGS, normalizeProductTypeToCategory } from "@/lib/essentiel/engine";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import { correctTypo } from "@/lib/ai/typo";
import { parseInciWithAI } from "@/lib/ai/parseInci";
import { splitInciWithGpt } from "@/lib/ai/splitInci";
import { validateInciInput } from "@/lib/ai/validate";
import {
  EU_ALLERGENS_TOTAL,
  EU_FRAGRANCE_ALLERGENS,
  getEuFragranceAllergen,
  isEuFragranceAllergen,
} from "@/lib/euAllergens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MatchRow = {
  input_token: string;
  position_idx: number;
  inci_id: number | null;
  slug: string | null;
  name: string | null;
  color_rating: ColorRating | null;
  cas_number: string | null;
  translation_fr: string | null;
  primary_function: string | null;
  tags: string[] | null;
  match_kind: "exact" | "alias" | "fuzzy_high" | "suggestion" | null;
  confidence: number | string | null;
};

type ThresholdContext =
  | "before_fragrance"
  | "after_fragrance"
  | "before_preservative"
  | "after_preservative"
  | null;

type AnalysePayload = {
  text: string;
  hp?: string;
  withSynthesis?: boolean;
  /** Optional human label of the analysed product (e.g. "La Roche-Posay Effaclar Duo+"),
   *  used to vary the AI synthesis. Sent by the product search frontend. */
  productLabel?: string;
  /** Brand name extracted from the front-photo OCR (e.g. "CeraVe"). Persisted
   *  separately from productLabel so the web-search identification step can
   *  use it as a strong filter. */
  brand?: string;
  /** Product type extracted from the front-photo OCR (e.g. "nettoyant visage").
   *  Lets the identification step disambiguate "CeraVe Foaming" → cleanser
   *  vs lotion. */
  productType?: string;
  /** When true, the resulting analysis is also pushed to the signed-in user's
   *  routine (`routine_items`). Set by the "+ Ajouter un produit" button on
   *  /routine via sessionStorage → AnalysisRunner. */
  addToRoutine?: boolean;
};

const TAG_LABELS: Record<string, string> = {
  paraben: "Parabens",
  silicone: "Silicones",
  sulfate: "Sulfates",
  "huile-minerale": "Huiles minérales",
  ethoxyle: "Composés éthoxylés",
  propoxyle: "Composés propoxylés",
  "colorant-synthese": "Colorants de synthèse",
  "ammonium-quaternaire": "Ammoniums quaternaires",
  "allergene-parfumant": "Allergènes parfum",
  "allergene-reglemente": "Allergènes réglementés",
  conservateur: "Conservateurs",
  "parfum-synthese": "Parfums de synthèse",
  "huile-essentielle": "Huiles essentielles",
  "filtre-uv": "Filtres UV",
  cmr: "CMR",
  ogm: "OGM",
};

// Tags reported as "good when absent". The rest are reported only when present.
// Extended on 2026-05 to cover `conservateur`, `propoxyle`, `ogm` - users asked
// for an exhaustive observations panel rather than a curated subset.
const ABSENCE_REPORTED = new Set([
  "paraben",
  "sulfate",
  "huile-minerale",
  "silicone",
  "allergene-parfumant",
  "allergene-reglemente",
  "ethoxyle",
  "propoxyle",
  "colorant-synthese",
  "ammonium-quaternaire",
  "parfum-synthese",
  "filtre-uv",
  "cmr",
  "conservateur",
  "ogm",
]);

// Tags whose absence is a NEUTRAL observation (not a "win"). Essential oils
// are a deliberate inclusion in natural brands - absence isn't necessarily
// good news, so we surface it as "info" instead of the green "absent" pill.
// Anything in this set MUST also be in ABSENCE_REPORTED above for the absence
// branch to fire.
const NEUTRAL_WHEN_ABSENT = new Set(["huile-essentielle"]);
// Keep huile-essentielle reported when absent (in the neutral form).
ABSENCE_REPORTED.add("huile-essentielle");

// Names that count as "water" when found in position 0 (first ingredient).
const WATER_NAMES = new Set(["aqua", "water", "eau"]);

// Number of leading positions considered "top of the list" for the
// "problematic actives near the top" observation.
const TOP_LIST_WINDOW = 5;

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

/**
 * Heuristic that says "this INCI text looks already clean — no AI parser /
 * validator needed". Tuned to match the output of the product-search and
 * barcode flows (comma-separated, ASCII + diacritics only, no OCR noise),
 * but it also catches a well-formatted manual paste. When this returns true
 * we skip three AI round-trips (parseInciWithAI + validateInciInput +
 * splitInciWithGpt) that would otherwise add ~500-1300 ms to the response.
 */
// Charset accepted on the fast path. Covers commas + bullets (•·●◆▪) + the
// usual cosmetic-list punctuation. Brackets and "+/-" are tolerated because
// the local parseInciList strips them as noise (MAY CONTAIN labels).
const CLEAN_INCI_CHARSET_RE = /^[\sA-Za-z0-9\-\(\)\.\/,;:'&%À-ſ•·●◆▪\[\]+]+$/;
const SEPARATOR_RE = /[,•·●◆▪]/;
function isCleanInciInput(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length < 20) return false;
  // Need at least one of: comma, bullet, middot, black circle, diamond, small
  // square. Brand labels use a wild variety so we accept any of them.
  if (!SEPARATOR_RE.test(trimmed)) return false;
  const tokens = trimmed
    .split(/[,•·●◆▪]/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length < 4) return false;
  // Reject if any token is suspiciously long (>140 chars) — usually a sign
  // of a paragraph rather than a list. Note: we measure the FIRST raw token
  // too because brand prefixes like "G2047548 - INGREDIENTS: AQUA" still get
  // stripped by parseInciList's noise patterns; we just need the overall
  // shape to look list-y.
  for (const tok of tokens) {
    if (tok.length === 0 || tok.length > 140) return false;
  }
  return CLEAN_INCI_CHARSET_RE.test(trimmed);
}

export async function POST(req: NextRequest) {
  let body: AnalysePayload;
  try {
    body = (await req.json()) as AnalysePayload;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  // Honey-pot anti-bot field - reject before touching Supabase.
  if (body.hp && body.hp.length > 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rawText = (body.text ?? "").slice(0, 8000);
  if (!rawText.trim()) {
    return NextResponse.json({ error: "Liste vide." }, { status: 400 });
  }

  // Auth + IP rate-limit only. Credit charged AFTER idempotency lookup so a
  // double-click doesn't double-bill.
  const gate = await apiGate(req, { feature: "analyser", costCredits: 0 });
  if (!gate.ok) return gate.response;
  const { user, supabase: sbAuth } = gate;

  const idemKey = idempotencyKey(user.id, "analyser", {
    text: rawText,
    productLabel: body.productLabel ?? null,
    brand: body.brand ?? null,
    productType: body.productType ?? null,
    withSynthesis: body.withSynthesis !== false,
    addToRoutine: body.addToRoutine === true,
  });
  const cached = await idempotencyLookup(idemKey);
  if (cached) return cached;

  const charge = await gate.consumeCredit("analyser");
  if (!charge.ok) return charge.response;

  // Fast-path: when the input is already a well-formed comma-separated INCI
  // list (typical of barcode/product-search/clean paste), we skip the three
  // AI clean-up steps (parseInciWithAI + validateInciInput + splitInciWithGpt)
  // and feed the raw text directly into the local parser. Saves ~500-1300 ms
  // on the response time without sacrificing correctness — the local parser
  // handles clean lists perfectly, and the DB match step would simply ignore
  // any token it can't resolve anyway.
  const skipAiParse = isCleanInciInput(rawText);

  let text: string;
  if (skipAiParse) {
    text = rawText;
  } else {
    // AI-powered INCI parser cascade: Mistral (gratuit, primary) → OpenAI (fallback)
    // → regex (final fallback below). Handles lists pasted without separators,
    // OCR noise, typos. Cached by hash of input so a repeated paste is free.
    const aiParsed = await parseInciWithAI(rawText);
    // If the AI reconstructed the list, feed the clean comma-separated version
    // back into the rest of the pipeline. Validation + regex parser handle
    // clean input perfectly.
    text = aiParsed && aiParsed.ingredients.length > 0
      ? aiParsed.ingredients.join(", ")
      : rawText;

    // Pre-flight: bail out on garbage input (cheap local checks + AI for the
    // borderline cases). The AI defaults to "valid" if unavailable so we never
    // block a real user.
    const validation = await validateInciInput(text);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason ?? "Ceci ne ressemble pas à une liste INCI." },
        { status: 400 },
      );
    }
  }

  let tokens = parseInciList(text);

  // Rescue : si le parser local n'a presque rien sorti d'un texte long, c'est
  // probablement une liste recopiée d'étiquette sans virgules (typique des
  // emballages physiques : "AQUA / WATER / EAU DIMETHICONE CETEARYL ALCOHOL…").
  // On demande à GPT-4o-mini de ré-insérer les virgules entre ingrédients,
  // puis on re-parse. Cas pivot : <3 tokens dans un texte > 60 caractères.
  // Skipped on the fast-path: a clean comma-separated input never has <3
  // tokens (we filtered for ≥4 above), so the rescue would always be a no-op.
  if (!skipAiParse && tokens.length < 3 && text.length > 60) {
    const split = await splitInciWithGpt(text);
    if (split) {
      const rescued = parseInciList(split);
      if (rescued.length > tokens.length) {
        tokens = rescued;
      }
    }
  }

  if (tokens.length === 0) {
    return NextResponse.json({ error: "Aucun ingrédient détecté dans la liste." }, { status: 400 });
  }

  // Batch-match against the database
  const sb = supabaseAnon();
  const { data, error } = await sb.rpc("cosme_check_match_inci_batch", {
    p_tokens: tokens.map((t) => t.normalized),
  });
  if (error) {
    return safeError(error, {
      route: "analyser.rpc_match_inci_batch",
      publicMessage: "Erreur lors de l'analyse des ingrédients. Réessaye dans un instant.",
      userId: user.id,
    });
  }
  let rows = (data ?? []) as MatchRow[];

  // AI typo correction: for each "suggestion" row (fuzzy 0.55..0.90), ask
  // GPT-4o-mini to pick the most likely INCI candidate from the top-5 trigram
  // hits. If GPT is confident enough (≥0.85), upgrade the row to a real match
  // marked as "ai_corrected". Otherwise keep it as a suggestion.
  const suggestionRows = rows.filter((r) => r.match_kind === "suggestion");
  if (suggestionRows.length > 0) {
    await Promise.all(
      suggestionRows.map(async (row) => {
        const { data: candidates } = await sb.rpc("cosme_check_top_trigram_candidates", {
          p_token: tokens[row.position_idx]?.normalized ?? row.input_token,
          p_limit: 5,
        });
        const list = (candidates ?? []) as {
          inci_id: number;
          name: string;
          primary_function: string | null;
          similarity: number;
        }[];
        if (list.length === 0) return;
        const decision = await correctTypo(
          tokens[row.position_idx]?.normalized ?? row.input_token,
          list,
        );
        if (
          decision.matchedInciId !== null
          && decision.confidence >= 0.85
        ) {
          // Fetch the full row for the chosen INCI and replace the match in place.
          const { data: ingRows } = await sb
            .schema("cosme_check")
            .from("ingredients")
            .select(
              "inci_id, slug, name, color_rating, cas_number, translations, functions, tags",
            )
            .eq("inci_id", decision.matchedInciId)
            .limit(1);
          const ing = (ingRows ?? [])[0] as
            | {
                inci_id: number;
                slug: string;
                name: string;
                color_rating: ColorRating | null;
                cas_number: string | null;
                translations: Record<string, string> | null;
                functions: { name?: string }[] | null;
                tags: string[] | null;
              }
            | undefined;
          if (ing) {
            const idx = rows.findIndex((r) => r.position_idx === row.position_idx);
            if (idx >= 0) {
              rows[idx] = {
                input_token: row.input_token,
                position_idx: row.position_idx,
                inci_id: ing.inci_id,
                slug: ing.slug,
                name: ing.name,
                color_rating: ing.color_rating,
                cas_number: ing.cas_number,
                translation_fr: ing.translations?.fr ?? "",
                primary_function: ing.functions?.[0]?.name ?? "",
                tags: ing.tags,
                match_kind: "fuzzy_high",
                confidence: decision.confidence,
              };
            }
          }
        }
      }),
    );
  }

  // Re-attach the original raw token (for display) by position. Suggestions
  // (fuzzy 0.55..0.90) are NOT treated as matches: the candidate is kept on
  // the side so the UI can show "Did you mean: X?" but the ingredient is
  // counted as "unknown" in stats and excluded from the score.
  const rawEnriched = rows.map((r) => {
    const tok = tokens[r.position_idx];
    const isSuggestion = r.match_kind === "suggestion";
    const confidence =
      typeof r.confidence === "string" ? Number(r.confidence) : (r.confidence ?? 0);
    return {
      ...r,
      input_raw: tok ? tok.raw : r.input_token,
      // For the rest of the pipeline, treat suggestions as unmatched.
      effective_color: isSuggestion ? null : r.color_rating,
      effective_inci_id: isSuggestion ? null : r.inci_id,
      effective_name: isSuggestion ? null : r.name,
      effective_tags: isSuggestion ? null : r.tags,
      suggested_name: isSuggestion ? r.name : null,
      // Always preserve the color carried by the matched slug in the
      // ingredients table — regardless of whether we elevated the match to
      // "confirmed" status. The list UI uses this as a fallback so it stays
      // consistent with the ingredient detail page the row's arrow links to.
      // Counts / spectrum / score still use `effective_color` only, so a
      // low-confidence suggestion never silently shifts the verdict.
      db_color_rating: r.color_rating,
      confidence,
    };
  });

  // Capture FR/EN alias matches BEFORE we dedupe - the UI surfaces these as
  // "Doublons FR/EN détectés (Water → Aqua, Eau → Aqua)" so the user sees
  // why their pasted list shrank.
  const aliasesUsed = rawEnriched
    .filter((r) => r.match_kind === "alias")
    .map((r) => ({ from: r.input_raw, to: r.name }));

  // Dedupe by canonical INCI id (keep the earliest position). Without this,
  // pasting "AQUA, WATER, EAU" produces three identical "Aqua" rows in the
  // results table and triple-counts a single ingredient in score/spectrum/
  // observations. Suggestions and unmatched inputs (effective_inci_id null)
  // pass through untouched - each user-typed token is unique on its own.
  // Positions are renumbered to stay contiguous so the spectrum and the
  // threshold-context computation downstream don't see gaps.
  const seenInciIds = new Set<string | number>();
  const enriched = rawEnriched
    .slice()
    .sort((a, b) => a.position_idx - b.position_idx)
    .filter((r) => {
      if (!r.effective_inci_id) return true;
      if (seenInciIds.has(r.effective_inci_id)) return false;
      seenInciIds.add(r.effective_inci_id);
      return true;
    })
    .map((r, i) => ({ ...r, position_idx: i }));

  // Counters (suggestions count as "Non reconnu" - they did not match)
  const counts: Record<string, number> = { Vert: 0, Jaune: 0, Orange: 0, Rouge: 0, "Non reconnu": 0 };
  for (const r of enriched) {
    if (r.effective_color) counts[r.effective_color]++;
    else counts["Non reconnu"]++;
  }
  const matched = enriched.length - counts["Non reconnu"];

  // Score (suggestions ignored)
  const score = computeScore(
    enriched.map((r) => ({ color_rating: r.effective_color, position: r.position_idx })),
    enriched.length,
  );
  const { label: scoreLabelText, tone: scoreTone } = scoreLabel(score);

  // Tag aggregation : count + list of ingredients per tag
  const tagCounts: Record<string, number> = {};
  const tagItems: Record<string, { name: string; slug: string | null; colorRating: ColorRating | null }[]> = {};
  for (const r of enriched) {
    if (!r.effective_tags) continue;
    for (const t of r.effective_tags) {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
      if (!tagItems[t]) tagItems[t] = [];
      tagItems[t].push({
        name: r.effective_name ?? r.input_raw,
        slug: r.slug,
        colorRating: r.effective_color,
      });
    }
  }

  type Observation = {
    tag: string;
    label: string;
    status: "present" | "absent" | "info" | "warn";
    count: number;
    items: { name: string; slug: string | null; colorRating: ColorRating | null }[];
    message?: string;
  };
  const observations: Observation[] = [];
  // Reported absences (good news, except for NEUTRAL_WHEN_ABSENT tags which
  // are reported as "info" to avoid implying that absence is automatically
  // a win - essential oils are a legit ingredient in natural-brand products).
  for (const tag of ABSENCE_REPORTED) {
    const c = tagCounts[tag] || 0;
    if (c === 0) {
      const status: "absent" | "info" = NEUTRAL_WHEN_ABSENT.has(tag) ? "info" : "absent";
      observations.push({ tag, label: TAG_LABELS[tag] ?? tag, status, count: 0, items: [] });
    } else {
      observations.push({ tag, label: TAG_LABELS[tag] ?? tag, status: "present", count: c, items: tagItems[tag] ?? [] });
    }
  }
  // Other tags only when present.
  //
  // We skip the positive / neutral families (huile-vegetale, colorant-naturel,
  // filtre-uv-mineral, colorant-mineral) here — they're already excluded from
  // the "À surveiller" engine card, but they were leaking into the detailed
  // ObservationsCard below the synthesis with an orange "présents" pill,
  // which made testers read them as warnings ("Huiles végétales présentes"
  // looked like an alert even though it's a positive trait). One shared
  // source of truth lives in `lib/essentiel/engine.ts`.
  for (const [tag, c] of Object.entries(tagCounts)) {
    if (ABSENCE_REPORTED.has(tag)) continue;
    if (NEUTRAL_OR_POSITIVE_TAGS.has(tag)) continue;
    if (c > 0) {
      observations.push({ tag, label: TAG_LABELS[tag] ?? tag, status: "present", count: c, items: tagItems[tag] ?? [] });
    }
  }

  // ----- Computed observations (no tag, derived from the list itself) -----

  // Sort once by position so first-element checks are stable.
  const byPosition = [...enriched].sort((a, b) => a.position_idx - b.position_idx);

  // Kick off product categorisation in parallel — we only need its result
  // when assembling responsePayload further down, so issuing it now lets it
  // overlap with the synthesis LLM call. categorizeProduct caches by hash of
  // the top-5 ingredients, so repeat scans return instantly. The .catch()
  // collapses any LLM failure to "autre" so the awaiter below never throws.
  const categoryTop5Names = byPosition
    .slice(0, 5)
    .map((r) => r.effective_name ?? r.input_raw)
    .filter((n): n is string => Boolean(n));
  const categoryPromise: Promise<ProductCategory> = categoryTop5Names.length > 0
    ? categorizeProduct(categoryTop5Names, user.id).catch(() => "autre" as ProductCategory)
    : Promise.resolve("autre" as ProductCategory);

  // 1. Water-based formula : Aqua / Water in position 0.
  const first = byPosition[0];
  if (first) {
    const firstNorm = (first.name ?? first.input_raw ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(DIACRITICS_RE, "")
      .trim();
    const isWater = WATER_NAMES.has(firstNorm);
    if (isWater) {
      const display = (first.name ?? first.input_raw ?? "Aqua").trim();
      const displayCased = display.charAt(0).toUpperCase() + display.slice(1).toLowerCase();
      observations.push({
        tag: "water-based",
        label: "Formule à base d'eau",
        status: "info",
        count: 0,
        items: [],
        message: `${displayCased} en première position`,
      });
    }
  }

  // 2. Base coverage : how many ingredients we actually recognised.
  if (enriched.length > 0) {
    const pct = Math.round((matched / enriched.length) * 100);
    observations.push({
      tag: "coverage",
      label: "Couverture",
      status: "info",
      count: matched,
      items: [],
      message: `${matched}/${enriched.length} ingrédients reconnus (${pct}%)`,
    });
  }

  // 3. Problematic actives in the top of the list.
  // Position = concentration in INCI lists, so an Orange/Rouge in the top 5 is
  // a stronger signal than the same ingredient at the very end.
  const topProblematic = byPosition
    .slice(0, TOP_LIST_WINDOW)
    .filter((r) => r.effective_color === "Orange" || r.effective_color === "Rouge");
  if (topProblematic.length > 0) {
    observations.push({
      tag: "top-list-warning",
      label: "Ingrédients de pénalité en début de liste",
      status: "warn",
      count: topProblematic.length,
      items: topProblematic.map((r) => ({
        name: r.effective_name ?? r.input_raw,
        slug: r.slug,
        colorRating: r.effective_color,
      })),
      message: `${topProblematic.length} dans le top ${TOP_LIST_WINDOW} (concentration plus élevée)`,
    });
  }

  // Suggestions (fuzzy 0.55..0.90) - propose "Did you mean: X?" to the UI
  const suggestions = enriched
    .filter((r) => r.match_kind === "suggestion" && r.suggested_name)
    .map((r) => ({
      position: r.position_idx + 1,
      input: r.input_raw,
      suggestedName: r.suggested_name as string,
      confidence: Number(r.confidence.toFixed(3)),
    }));

  // ----- Threshold context: before/after first fragrance and/or preservative -----
  // Fragrance = ingredient whose name is PARFUM/FRAGRANCE OR tagged
  // "parfum-synthese". Preservative = ingredient tagged "conservateur".
  const FRAGRANCE_NAMES = new Set(["PARFUM", "FRAGRANCE", "AROMA", "FLAVOR"]);
  const firstFragranceIdx = byPosition.findIndex(
    (r) =>
      (r.effective_name && FRAGRANCE_NAMES.has(r.effective_name.toUpperCase())) ||
      (r.effective_tags?.includes("parfum-synthese") ?? false),
  );
  const firstPreservativeIdx = byPosition.findIndex(
    (r) => r.effective_tags?.includes("conservateur") ?? false,
  );
  // Prefer fragrance as the ≤1 % reference (standard cosmetic convention for
  // creams, shampoos, lotions: parfum is dosed below 1 % so anything after it
  // is necessarily in trace). Fall back to the first preservative when the
  // formula lists no fragrance at all.
  let earliestThresholdIdx: number;
  let thresholdKind: "fragrance" | "preservative" | null;
  if (firstFragranceIdx >= 0) {
    earliestThresholdIdx = firstFragranceIdx;
    thresholdKind = "fragrance";
  } else if (firstPreservativeIdx >= 0) {
    earliestThresholdIdx = firstPreservativeIdx;
    thresholdKind = "preservative";
  } else {
    earliestThresholdIdx = -1;
    thresholdKind = null;
  }

  function thresholdFor(positionIdx: number): {
    context: ThresholdContext;
    label: string | null;
  } {
    if (earliestThresholdIdx < 0 || !thresholdKind) return { context: null, label: null };
    if (positionIdx === earliestThresholdIdx) return { context: null, label: null };
    const before = positionIdx < earliestThresholdIdx;
    if (thresholdKind === "fragrance") {
      return before
        ? { context: "before_fragrance", label: "avant parfum" }
        : { context: "after_fragrance", label: "après parfum" };
    }
    return before
      ? { context: "before_preservative", label: "avant conservateur" }
      : { context: "after_preservative", label: "après conservateur" };
  }

  // ----- EU fragrance allergens (Annex III, 26 substances) -----
  // We scan effective_name + input_raw because some users paste raw labels
  // where the canonical INCI lookup fails (e.g. LYRAL old name).
  const allergensDetected: { inciName: string; label: string; note: string; position: number }[] = [];
  const seenAllergens = new Set<string>();
  for (const r of enriched) {
    const candidates = [r.effective_name, r.input_raw].filter(Boolean) as string[];
    for (const c of candidates) {
      const upper = c.toUpperCase().trim();
      if (seenAllergens.has(upper)) continue;
      if (isEuFragranceAllergen(upper)) {
        const meta = getEuFragranceAllergen(upper)!;
        allergensDetected.push({
          inciName: meta.inciName,
          label: meta.label,
          note: meta.note,
          position: r.position_idx + 1,
        });
        seenAllergens.add(upper);
        break;
      }
    }
  }
  // Add an observation when at least one is detected. Style matches existing
  // observations - "X allergènes parfumants UE sur 26 listés."
  if (allergensDetected.length > 0) {
    observations.push({
      tag: "eu-fragrance-allergens",
      label: "Allergènes parfumants UE",
      status: "warn",
      count: allergensDetected.length,
      items: allergensDetected.map((a) => ({ name: a.label, slug: null, colorRating: "Jaune" })),
      message: `${allergensDetected.length} sur ${EU_ALLERGENS_TOTAL} substances réglementées détectées.`,
    });
  }

  // ----- Post-fragrance penalty mitigation -----
  // In a regulation-compliant INCI list, anything below the fragrance marker
  // (PARFUM / FRAGRANCE / parfum-synthese tag) is typically present at
  // concentrations under ~1 %. Penalized ingredients (Jaune/Orange/Rouge)
  // sitting below that threshold are flagged as "impact limité" so the user
  // doesn't over-react to a Rouge buried at position 30.
  if (firstFragranceIdx >= 0) {
    const afterFragrance = byPosition
      .slice(firstFragranceIdx + 1)
      .filter(
        (r) =>
          r.effective_color === "Jaune" ||
          r.effective_color === "Orange" ||
          r.effective_color === "Rouge",
      );
    if (afterFragrance.length > 0) {
      const n = afterFragrance.length;
      observations.push({
        tag: "after-fragrance",
        label: "Pénalité atténuée par la position",
        status: "info",
        count: n,
        items: afterFragrance.map((r) => ({
          name: r.effective_name ?? r.input_raw,
          slug: r.slug,
          colorRating: r.effective_color,
        })),
        message: `${n} ingrédient${n > 1 ? "s" : ""} sensible${n > 1 ? "s" : ""} apparai${n > 1 ? "ssent" : "t"} après le parfum - concentration ≤ 1 %, impact réel limité.`,
      });
    }
  }

  // ----- Spectrum: color ratings of top 5 and top 10 ingredients -----
  const spectrumTop5: (ColorRating | null)[] = Array.from({ length: 5 }, (_, i) => {
    const r = byPosition[i];
    return r ? r.effective_color : null;
  });
  const spectrumTop10: (ColorRating | null)[] = Array.from({ length: 10 }, (_, i) => {
    const r = byPosition[i];
    return r ? r.effective_color : null;
  });

  // Optional AI synthesis (GPT-4o-mini primary, Mistral fallback, cached).
  // Personalised: the user's skin profile (if any) is injected into the
  // system prompt so the LLM tailors the puces to what's relevant for this
  // person. The profile block also enters the cache key, so two users with
  // different profiles get distinct synthèses on the same INCI list.
  let synthesis: string | null = null;
  if (body.withSynthesis !== false) {
    const [profileBlock, restrictionsCtx] = await Promise.all([
      loadProfileForPrompt(user.id),
      loadRestrictionsContext(user.id),
    ]);

    // Pre-compute the per-ingredient restriction matches so the LLM doesn't
    // have to cross-reference the restriction block manually. Each enriched
    // row gets a `restriction_reason` flag the prompt formatter surfaces
    // as `[restriction: X]` inside the row line.
    const checkItems = enriched.map((r) => ({
      position: r.position_idx + 1,
      input: r.input_raw,
      slug: r.slug,
      name: r.effective_name,
      tags: r.effective_tags ?? null,
    }));
    const restrictionMatches = checkRestrictions(
      checkItems,
      restrictionsCtx.restrictions,
      restrictionsCtx.families,
    );
    const reasonByPosition = new Map<number, string>();
    for (const m of restrictionMatches) {
      // Prefer the first reason for a given position; multiple matches on
      // the same ingredient stay listed in the warning card but the LLM
      // only needs one label to call it out.
      if (!reasonByPosition.has(m.position)) {
        reasonByPosition.set(m.position, m.label);
      }
    }

    synthesis = await generateSynthesis({
      enriched: enriched.map((r) => ({
        input_raw: r.input_raw,
        name: r.effective_name,
        color_rating: r.effective_color,
        primary_function: r.primary_function,
        tags: r.effective_tags,
        position_idx: r.position_idx,
        threshold_label: thresholdFor(r.position_idx).label,
        restriction_reason: reasonByPosition.get(r.position_idx + 1) ?? null,
      })),
      counts,
      score,
      scoreLabel: scoreLabelText,
      observations,
      productLabel: body.productLabel?.slice(0, 200) ?? null,
      userId: user.id,
      profileBlock,
      restrictionsBlock: restrictionsCtx.block,
    });
  }

  const itemsResponse = enriched.map((r) => {
    const threshold = thresholdFor(r.position_idx);
    return {
      position: r.position_idx + 1,
      input: r.input_raw,
      slug: r.slug,
      name: r.effective_name,
      colorRating: r.effective_color,
      // Color from the matched slug's row in `ingredients`, present even when
      // the match was a low-confidence suggestion that didn't elevate to a
      // confirmed status. Used by the list UI as a display fallback so an
      // ingredient that links to a green detail page also shows green in
      // the list, instead of a confusing grey dash.
      dbColorRating: r.db_color_rating,
      casNumber: r.cas_number,
      translationFr: r.translation_fr,
      primaryFunction: r.primary_function,
      tags: r.effective_tags,
      matchKind: r.match_kind,
      confidence: Number(r.confidence.toFixed(3)),
      thresholdContext: threshold.context,
      thresholdLabel: threshold.label,
    };
  });

  // Wait at most 1.5 s for the LLM categorisation. When the cache is warm
  // (same top-5 ingredients seen before) this resolves immediately; on a
  // cache miss + slow first token we'd rather ship the response than block
  // for the full 6 s upstream timeout. If we time out (or the LLM returned
  // "autre") we fall back to a keyword match against the OCR-extracted
  // `productType` — e.g. "déodorant spray" → deodorant. Final null means
  // "unknown context": the engine will then use universal `default` verbs.
  const llmCategory: ProductCategory | null = await Promise.race([
    categoryPromise.then((c) => (c && c !== "autre" ? c : null)),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
  ]);
  const resolvedCategory: ProductCategory | null =
    llmCategory ?? normalizeProductTypeToCategory(body.productType) ?? null;

  const responsePayload: AnalyseResponse = {
    counts: {
      total: enriched.length,
      matched,
      vert: counts["Vert"],
      jaune: counts["Jaune"],
      orange: counts["Orange"],
      rouge: counts["Rouge"],
      unknown: counts["Non reconnu"],
    },
    score,
    scoreLabel: scoreLabelText,
    scoreTone,
    items: itemsResponse,
    observations,
    aliasesUsed,
    suggestions,
    spectrum: { top5: spectrumTop5, top10: spectrumTop10 },
    euFragranceAllergens: {
      detected: allergensDetected,
      total: EU_ALLERGENS_TOTAL,
    },
    synthesis,
    productType: body.productType?.slice(0, 120) ?? null,
    category: resolvedCategory,
  };
  // Silence unused-import noise in some narrow code paths.
  void EU_FRAGRANCE_ALLERGENS;

  // Auto-save the analysis for signed-in users. We do this AFTER preparing
  // the response so a failure here never blocks the user. `resolvedCategory`
  // is what we already returned to the client (LLM if it came back in time,
  // otherwise a keyword fallback from `productType`); we persist it so the
  // history row matches what the user saw. The background promise below
  // still patches the row with the LLM's authoritative answer if it arrives
  // later than our 1.5 s race timeout — that way the routine engine always
  // ends up with the real category eventually.
  let savedAnalysisId: string | null = null;
  let addedToRoutine = false;
  try {
    const autoName = body.productLabel?.slice(0, 200)
      ?? `Analyse du ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}`;
    // We need the inserted row id when the caller wants the analysis pushed
    // to their routine, so use .select().single() instead of a bare insert.
    const { data: inserted, error: insertError } = await sbAuth
      .schema("cosme_check")
      .from("analyses")
      .insert({
        user_id: user.id,
        name: autoName,
        product_label: body.productLabel?.slice(0, 200) ?? null,
        brand: body.brand?.slice(0, 120) ?? null,
        product_type: body.productType?.slice(0, 120) ?? null,
        // Best-effort category from the 1.5 s race in responsePayload. May
        // be overwritten below if the LLM answer arrives after the race
        // timeout — `categoryPromise` is the SAME promise that started
        // before synthesis so we don't pay for a second LLM call.
        category: resolvedCategory,
        input_text: text,
        result_json: responsePayload,
        score: Number(score.toFixed(2)),
      })
      .select("id")
      .single();
    if (insertError) {
      logError("analyser.history_insert", insertError, { userId: user.id, code: insertError.code });
    } else if (inserted?.id) {
      savedAnalysisId = inserted.id as string;
      if (body.addToRoutine === true) {
        const { error: routineErr } = await sbAuth
          .schema("cosme_check")
          .from("routine_items")
          .upsert(
            { user_id: user.id, analysis_id: inserted.id, frequency: "daily" },
            { onConflict: "user_id,analysis_id" },
          );
        if (routineErr) {
          logError("analyser.routine_insert", routineErr, { userId: user.id });
        } else {
          addedToRoutine = true;
        }
      }
      // Reuse the SAME categoryPromise we launched before synthesis (no
      // duplicate LLM call thanks to the in-memory dedupe + cache). When it
      // resolves to a non-"autre" value that differs from what we already
      // wrote, patch the row so the DB ends up with the LLM's answer.
      const categorizeId = inserted.id as string;
      void categoryPromise
        .then(async (cat) => {
          if (!cat || cat === resolvedCategory) return;
          const { error: catUpdateError } = await sbAuth
            .schema("cosme_check")
            .from("analyses")
            .update({ category: cat })
            .eq("id", categorizeId);
          if (catUpdateError) {
            logWarn("[analyser] categorize update failed", {
              error: catUpdateError.message,
              userId: user.id,
            });
          }
        })
        .catch((catErr) => {
          logWarn("[analyser] categorize failed", { error: (catErr as Error).message });
        });
    }
  } catch (err) {
    logError("analyser.history_save", err, { userId: user.id });
  }

  const response = NextResponse.json({ ...responsePayload, analysisId: savedAnalysisId, addedToRoutine });
  await idempotencyStore(idemKey, response);
  return response;
}
