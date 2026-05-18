/**
 * LLM calls for the "Promesses vs Formule" feature.
 *
 * Two roles, two calls:
 *   1. extractPromisesFromDescription - reads the marketing copy, returns a
 *      structured list of detected promises (constrained to a closed enum of
 *      category slugs from claims.ts) and unverifiable fragments.
 *   2. generateConclusion - writes a single sentence summarising the engine's
 *      verdicts. No invention possible: it's only allowed to rephrase the
 *      already-computed verdicts.
 *
 * Both calls use OpenAI's strict JSON schema mode so the model literally
 * cannot return free-form text. Mistral fallback uses prompt-only structure
 * (Mistral doesn't fully enforce JSON schemas) - the parser is defensive.
 */

import {
  AI_MODEL,
  callWithFallback,
  hasMistral,
  hasOpenAI,
  openai,
} from "./client";
import { NO_LONG_DASHES_RULE, stripLongDashes } from "./sanitize";
import {
  absenceCategoriesForPrompt,
  effectCategoriesForPrompt,
} from "@/lib/coherence/claims";
import {
  PRODUCT_TYPE_LABELS,
  type CoherencePromise,
  type OutOfScopePromise,
  type ProductType,
} from "@/lib/coherence/types";
import type { LlmPromiseProposal, OpenLlmMatch } from "@/lib/coherence/engine";

// -----------------------------------------------------------------------------
// 1) Promise extraction
// -----------------------------------------------------------------------------

export type ExtractionResult = {
  proposals: LlmPromiseProposal[];
  unverifiable: { excerpt: string; reason: string }[];
  /** Claims that don't apply to this product type (e.g. anti-âge on shampoo). */
  outOfScope: OutOfScopePromise[];
};

const UNVERIFIABLE_REASONS = [
  "composition",
  "certification",
  "sensoriel",
  "marketing_general",
  "autre",
] as const;

/**
 * For each product type, the categories of effect promises that are
 * BIOLOGICALLY meaningful. Any claim outside this scope must go into
 * `out_of_scope` instead of `promises`. Absence claims (sans paraben…)
 * apply universally so we don't gate them here.
 *
 * "autre" = unknown type → permissive (we don't want to drop everything
 * just because the type detector failed).
 */
const RELEVANT_EFFECT_BY_TYPE: Record<ProductType, "hair" | "skin" | "lips" | "fragrance" | "teeth" | "nails" | "makeup" | "any"> = {
  cheveux: "hair",
  peau_visage: "skin",
  peau_corps: "skin",
  levres: "lips",
  parfum: "fragrance",
  dents: "teeth",
  ongles: "nails",
  maquillage: "makeup",
  autre: "any",
};

/**
 * Short FR description of what each product type can legitimately claim,
 * shipped to the LLM so it knows when to send a claim to out_of_scope.
 */
const PRODUCT_TYPE_GUIDANCE: Record<ProductType, string> = {
  cheveux:
    "Le produit agit sur la fibre capillaire et le cuir chevelu. Promesses pertinentes : hydratation, démêlage, brillance, anti-frisottis, anti-chute, densification, anti-pellicules, fixation/coiffage, protection thermique, fortification de la fibre. Le cheveu mort ne contient ni collagène ni cellules vivantes - toute promesse 'régénère les cellules du cheveu' / 'collagène capillaire' / 'jeunesse cellulaire' / 'anti-âge cellulaire' est HORS-SUJET biologiquement. Le cuir chevelu peut être apaisé / nourri (peau).",
  peau_visage:
    "Le produit agit sur la peau du visage. Promesses pertinentes : hydratation, apaisement, anti-âge, éclat, exfoliation, raffermissement, anti-tache, anti-pores, anti-acné, protection UV. HORS-SUJET : promesses capillaires (démêlage, anti-frisottis…), olfactives (tenue parfum), dentaires.",
  peau_corps:
    "Le produit agit sur la peau du corps. Promesses pertinentes : hydratation, apaisement, nourrissant, anti-âge corps, raffermissement, exfoliation, anti-vergetures. HORS-SUJET : promesses capillaires, dentaires, oculaires.",
  levres:
    "Le produit agit sur les lèvres. Promesses pertinentes : hydratation, nourrissant, repulpant, anti-gerçures, protection UV, brillance/couvrance. HORS-SUJET : promesses capillaires, dentaires, anti-rides cellulaire profonde.",
  parfum:
    "Le produit est un parfum / eau de toilette. Promesses pertinentes : tenue, sillage, fraîcheur, intensité, persistance, notes olfactives. HORS-SUJET : hydratation (sauf base alcoolique mentionnée comme telle), anti-âge, démêlage, etc.",
  dents:
    "Le produit agit sur les dents et la cavité buccale. Promesses pertinentes : blancheur, anti-tartre, anti-caries, fraîcheur d'haleine, gencives, sensibilité. HORS-SUJET : promesses capillaires, cutanées, anti-âge cellulaire.",
  ongles:
    "Le produit agit sur les ongles et cuticules. Promesses pertinentes : durcissement, brillance, anti-cassure, soin cuticules, base/top coat. HORS-SUJET : promesses capillaires, cutanées (sauf cuticules), olfactives.",
  maquillage:
    "Le produit est un maquillage (teint, yeux, lèvres). Promesses pertinentes : tenue, couvrance, fini (mat/satin/glow), confort de port, anti-transfert. Promesses soin parfois ajoutées (hydratation, anti-âge) à analyser comme bonus, mais le cœur reste maquillage. HORS-SUJET : promesses capillaires.",
  autre:
    "Type de produit inconnu - analyse de façon permissive, n'envoie en hors-sujet que les claims manifestement absurdes (ex: 'régénère les cellules' sur un parfum).",
};

function buildExtractionPrompt(description: string, productType: ProductType) {
  const effectCats = effectCategoriesForPrompt();
  const absenceCats = absenceCategoriesForPrompt();
  const effectList = effectCats
    .map(
      (c) =>
        `- ${c.slug} (${c.label}) - actifs typiques : ${c.example_actives.join(", ")}`,
    )
    .join("\n");
  const absenceList = absenceCats
    .map((c) => `- ${c.slug} (${c.label}) - mots-clés : ${c.keywords.join(", ")}`)
    .join("\n");

  const typeLabel = PRODUCT_TYPE_LABELS[productType];
  const typeGuidance = PRODUCT_TYPE_GUIDANCE[productType];

  const system = `Tu es un assistant qui analyse les descriptions marketing de produits cosmétiques en français.

Ta mission : identifier TOUTES les PROMESSES VÉRIFIABLES (effets ET absences d'ingrédients) et les classer.

═══ TYPE DE PRODUIT ═══
${typeLabel}

${typeGuidance}

═══ CATÉGORIES D'EFFETS (promesses positives sur la peau/cheveux) ═══
${effectList}

═══ CATÉGORIES D'ABSENCE (promesses "sans X") ═══
${absenceList}

CATÉGORIE "autre" :
Si une promesse décrit un effet attendu sur la peau/cheveux MAIS ne tombe dans AUCUNE catégorie d'effet ci-dessus, utilise category_slug="autre" avec un label descriptif clair (ex: "Fixation des boucles", "Régulation du sébum", "Renforcement de la barrière cutanée"…).

═══ MÉTHODE SYSTÉMATIQUE (suivre dans l'ordre) ═══

Étape 1 - Découpage : lis la description et coupe-la mentalement EN PHRASES. N'ignore aucune phrase.

Étape 2 - Pour chaque phrase, repère :
  (a) Un VERBE D'EFFET (liste indicative non exhaustive) :
      hydrate, nourrit, fortifie, renforce, raffermit, lisse, démêle, fixe, coiffe, définit,
      stimule, ralentit, prévient, élimine, réduit, atténue, apaise, calme, protège, régénère,
      répare, restaure, sublime, illumine, éclaircit, unifie, donne du volume, densifie,
      gaine, scelle, condition, parfume, désodorise, blanchit, durcit, repulpe, tient, dure,
      conserve, contient (suivi d'un actif), agit, contribue à, favorise, aide à.
  (b) Une CIBLE (peau, cheveux, lèvres, ongles, dents, fibre, cuir chevelu, boucles, pointes…).
  (c) OU une mention "sans X" / "0 % de X" / "free of X".

Si une phrase ne contient aucun de (a), (b), (c) → pas une promesse, passe.

Étape 3 - Filtre PERTINENCE selon le TYPE DE PRODUIT :
  Pour chaque promesse identifiée, vérifie qu'elle est BIOLOGIQUEMENT pertinente pour un produit de type "${typeLabel}".
  Si la promesse décrit un effet qui n'a PAS de sens biologique sur ce type de produit (ex: "production de collagène" sur les cheveux - le cheveu mort ne produit pas de collagène),
  → mets-la dans le champ \`out_of_scope\` (pas dans \`promises\`), avec une explication courte (1 phrase).

Étape 4 - DÉDUPLICATION FINALE : avant de retourner ton JSON, RELIS ta liste \`promises\`.
  Si deux entrées partagent le même \`category_slug\` OU expriment la même intention reformulée
  (ex: "anti-chute" + "stoppe la chute" + "ralentit la chute" = 1 seule promesse),
  GARDE celle dont l'excerpt est le plus complet, SUPPRIME les autres.
  La liste finale ne contient JAMAIS deux fois la même promesse.

═══ RÈGLES IMPORTANTES ═══

1. EXHAUSTIVITÉ : Sois EXHAUSTIF. Une description marketing contient typiquement 3 à 8 promesses distinctes (effets + absences). Si tu n'en trouves qu'une seule sur un texte de 5+ phrases, tu en oublies sûrement. Reprends ta méthode (étape 1-2) plutôt que de répondre trop court.

2. CLAIMS "SANS X" SONT DES PROMESSES VÉRIFIABLES :
   "sans sulfate", "sans paraben", "sans silicone", "sans huile minérale", "sans colorant", "sans parfum" → catégorie absence_* correspondante. Ce sont des promesses, PAS des unverifiable.

3. promesse vs unverifiable :
   ✓ EST UNE PROMESSE = un EFFET attendu OU une absence d'ingrédient.
   ✗ EST UNVERIFIABLE = ni effet ni absence identifiable :
     - composition générale : "97 % d'origine naturelle", "à base de B5", "formule clean"
     - certification : "Ecocert", "Cosmos Organic", "vegan", "cruelty-free", "bio"
     - sensoriel : "odeur sucrée", "texture fondante", "mousse rapidement"
     - marketing_general : "véritable soin", "efficacité prouvée", "résultats visibles"

4. RÈGLE D'OR : si une phrase dit qu'un ingrédient FAIT quelque chose ("la provitamine B5 fortifie les cheveux"), c'est une PROMESSE d'effet. Si elle dit qu'un ingrédient N'EST PAS dedans ("sans sulfate"), c'est une PROMESSE d'absence. Sinon c'est unverifiable.

5. EXCERPT : verbatim exact (ou fragment fidèle), max 80 caractères.

6. La description peut être en français ou en anglais.

═══ EXEMPLE 1 (cheveux, claim pertinent) ═══

Type : Cheveux
Description : "Cette gelée hydrate les cheveux, fixe les boucles et limite les frisottis. Sans sulfate ni silicone, formulée à 96 % naturel, odeur de vanille."

Sortie :
- promises:
  · {category_slug: "hydratation", label: "Hydratation", excerpt: "hydrate les cheveux"}
  · {category_slug: "autre", label: "Fixation des boucles", excerpt: "fixe les boucles"}
  · {category_slug: "anti_frisottis", label: "Anti-frisottis", excerpt: "limite les frisottis"}
  · {category_slug: "absence_sulfate", label: "Sans sulfate", excerpt: "sans sulfate"}
  · {category_slug: "absence_silicone", label: "Sans silicone", excerpt: "ni silicone"}
- unverifiable:
  · {excerpt: "formulée à 96 % naturel", reason: "composition"}
  · {excerpt: "odeur de vanille", reason: "sensoriel"}
- out_of_scope: []

═══ EXEMPLE 2 (cheveux, claim hors-sujet biologique) ═══

Type : Cheveux
Description : "L'Huile Essentielle de Géranium Rosat contribue à la production de collagène dans le cheveu. Elle régénère les cellules pour maintenir la beauté de la chevelure. Sans paraben."

Sortie :
- promises:
  · {category_slug: "absence_paraben", label: "Sans paraben", excerpt: "Sans paraben"}
- unverifiable: []
- out_of_scope:
  · {excerpt: "production de collagène dans le cheveu", claimed_effect: "anti-âge cellulaire", reason: "Le cheveu mort ne contient pas de cellules vivantes ni de collagène - la production de collagène n'a pas de support biologique sur un produit capillaire."}
  · {excerpt: "régénère les cellules", claimed_effect: "régénération cellulaire", reason: "Les cellules du cheveu kératinisé ne se régénèrent pas - promesse biologiquement non applicable à un produit capillaire."}

═══ EXEMPLE 3 (parfum, dédup) ═══

Type : Parfum
Description : "Un parfum qui tient toute la journée. Sa tenue de 12 h est impressionnante. Sillage longue durée."

Sortie :
- promises:
  · {category_slug: "autre", label: "Tenue longue durée", excerpt: "tient toute la journée"}  ← une seule entrée, on FUSIONNE "tient" + "tenue de 12 h" + "longue durée"
- unverifiable: []
- out_of_scope: []`;

  const user = `Description du produit (type: ${typeLabel}) à analyser :
"""
${description.trim().slice(0, 6000)}
"""

Retourne le JSON.`;

  return { system, user };
}

const EXTRACTION_SCHEMA = {
  name: "promise_extraction",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      promises: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            category_slug: { type: "string" },
            label: { type: "string" },
            excerpt: { type: "string" },
          },
          required: ["category_slug", "label", "excerpt"],
        },
      },
      unverifiable: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            excerpt: { type: "string" },
            reason: { type: "string", enum: [...UNVERIFIABLE_REASONS] },
          },
          required: ["excerpt", "reason"],
        },
      },
      out_of_scope: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            excerpt: { type: "string" },
            claimed_effect: { type: "string" },
            reason: { type: "string" },
          },
          required: ["excerpt", "claimed_effect", "reason"],
        },
      },
    },
    required: ["promises", "unverifiable", "out_of_scope"],
  },
} as const;

/** Mistral fallback (prompt-only structure, defensive parser). */
async function mistralExtract(
  description: string,
  productType: ProductType,
): Promise<ExtractionResult | null> {
  if (!hasMistral()) return null;
  const { system, user } = buildExtractionPrompt(description, productType);
  const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `${user}\n\nFormat strict :\n{ "promises": [{"category_slug","label","excerpt"}], "unverifiable": [{"excerpt","reason"}], "out_of_scope": [{"excerpt","claimed_effect","reason"}] }`,
        },
      ],
    }),
  });
  if (!r.ok) return null;
  const json = (await r.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json?.choices?.[0]?.message?.content;
  if (!raw) return null;
  return safeParseExtraction(raw);
}

function safeParseExtraction(raw: string): ExtractionResult | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as Record<string, unknown>;
    const promises = Array.isArray(obj.promises) ? obj.promises : [];
    const unverifiable = Array.isArray(obj.unverifiable) ? obj.unverifiable : [];
    const outOfScope = Array.isArray(obj.out_of_scope) ? obj.out_of_scope : [];
    return {
      proposals: promises
        .map((p) => p as Record<string, unknown>)
        .filter(
          (p): p is { category_slug: string; label: string; excerpt: string } =>
            typeof p.category_slug === "string"
            && typeof p.label === "string"
            && typeof p.excerpt === "string",
        )
        .map((p) => ({
          category_slug: p.category_slug,
          label: p.label,
          excerpt: p.excerpt.slice(0, 200),
        })),
      unverifiable: unverifiable
        .map((u) => u as Record<string, unknown>)
        .filter(
          (u): u is { excerpt: string; reason: string } =>
            typeof u.excerpt === "string" && typeof u.reason === "string",
        )
        .map((u) => ({
          excerpt: u.excerpt.slice(0, 200),
          reason: UNVERIFIABLE_REASONS.includes(
            u.reason as (typeof UNVERIFIABLE_REASONS)[number],
          )
            ? u.reason
            : "autre",
        })),
      outOfScope: outOfScope
        .map((o) => o as Record<string, unknown>)
        .filter(
          (o): o is { excerpt: string; claimed_effect: string; reason: string } =>
            typeof o.excerpt === "string"
            && typeof o.claimed_effect === "string"
            && typeof o.reason === "string",
        )
        .map((o) => ({
          excerpt: o.excerpt.slice(0, 200),
          claimed_effect: o.claimed_effect.slice(0, 80),
          reason: o.reason.slice(0, 280),
        })),
    };
  } catch {
    return null;
  }
}

export async function extractPromisesFromDescription(
  description: string,
  productType: ProductType,
  userId?: string | null,
): Promise<ExtractionResult> {
  if (!hasOpenAI() && !hasMistral()) {
    return { proposals: [], unverifiable: [], outOfScope: [] };
  }

  const { system, user } = buildExtractionPrompt(description, productType);

  try {
    const result = await callWithFallback<ExtractionResult | null>({
      feature: "categorize",
      userId: userId ?? null,
      timeoutMs: 30_000,
      primary: async () => {
        if (!hasOpenAI()) throw new Error("openai disabled");
        const resp = await openai().chat.completions.create({
          model: AI_MODEL,
          temperature: 0.1,
          max_tokens: 2000,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: {
            type: "json_schema",
            json_schema: EXTRACTION_SCHEMA,
          },
        });
        const raw = resp.choices?.[0]?.message?.content ?? null;
        const value = raw ? safeParseExtraction(raw) : null;
        return {
          value,
          tokensIn: resp.usage?.prompt_tokens,
          tokensOut: resp.usage?.completion_tokens,
        };
      },
      fallback: async () => ({
        value: await mistralExtract(description, productType),
        provider: "mistral",
      }),
    });
    return result ?? { proposals: [], unverifiable: [], outOfScope: [] };
  } catch {
    return { proposals: [], unverifiable: [], outOfScope: [] };
  }
}

// -----------------------------------------------------------------------------
// Product type detection (lightweight LLM call before extraction)
// -----------------------------------------------------------------------------

const PRODUCT_TYPE_SCHEMA = {
  name: "product_type_detection",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      product_type: {
        type: "string",
        enum: [
          "cheveux",
          "peau_visage",
          "peau_corps",
          "levres",
          "parfum",
          "dents",
          "ongles",
          "maquillage",
          "autre",
        ],
      },
      confidence: { type: "number" },
      hint: { type: "string" },
    },
    required: ["product_type", "confidence", "hint"],
  },
} as const;

function isProductType(s: string): s is ProductType {
  return (
    s === "cheveux"
    || s === "peau_visage"
    || s === "peau_corps"
    || s === "levres"
    || s === "parfum"
    || s === "dents"
    || s === "ongles"
    || s === "maquillage"
    || s === "autre"
  );
}

/**
 * Classify a marketing description into one of the 8 product types (+ autre).
 * Used by /api/coherence when no `product_type` hint is provided by the
 * upstream analysis. Short prompt, low max_tokens - cheap.
 */
export async function detectProductType(
  description: string,
  hint?: string | null,
  userId?: string | null,
): Promise<ProductType> {
  if (!hasOpenAI() && !hasMistral()) return "autre";

  const system = `Tu classifies un texte marketing cosmétique en UN type de produit.

Types disponibles :
- cheveux           → shampoings, après-shampoings, masques, sérums, huiles capillaires, gels, mousses coiffantes
- peau_visage       → crèmes visage, sérums visage, contour des yeux, masques visage, nettoyants visage, démaquillants
- peau_corps        → laits, baumes, huiles corps, gommages corps, gels douche soin
- levres            → baumes à lèvres, gloss soin (pas maquillage couvrant)
- parfum            → eaux de parfum, eaux de toilette, brumes parfumées, déodorants parfumés
- dents             → dentifrices, bains de bouche, soins gencives
- ongles            → vernis, soins ongles, bases / top coats
- maquillage        → fonds de teint, mascaras, rouges à lèvres couvrants, fards, blushs, eyeliners
- autre             → si vraiment impossible à classer (déodorant non parfumé, hygiène intime, etc.)

Règles :
1. Choisis UN seul type, le plus probable.
2. Confidence ∈ [0,1] : 1.0 = certain, &lt;0.5 = ambigu.
3. Si la description mentionne explicitement le type (ex: "shampoing"), confidence ≥ 0.9.
4. Si ambigu mais une zone d'application est citée ("cheveux", "visage"), suis-la.
5. Si vraiment indécidable, "autre" avec confidence = 0.5.

Retourne JSON strict.`;

  const userMsg = `${hint ? `Indice externe : ${hint}\n\n` : ""}Texte :\n"""\n${description.trim().slice(0, 1500)}\n"""`;

  try {
    const detected = await callWithFallback<ProductType | null>({
      feature: "categorize",
      userId: userId ?? null,
      timeoutMs: 10_000,
      primary: async () => {
        if (!hasOpenAI()) throw new Error("openai disabled");
        const resp = await openai().chat.completions.create({
          model: AI_MODEL,
          temperature: 0,
          max_tokens: 80,
          messages: [
            { role: "system", content: system },
            { role: "user", content: userMsg },
          ],
          response_format: {
            type: "json_schema",
            json_schema: PRODUCT_TYPE_SCHEMA,
          },
        });
        const raw = resp.choices?.[0]?.message?.content ?? null;
        let value: ProductType | null = null;
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as { product_type?: string };
            if (parsed.product_type && isProductType(parsed.product_type)) {
              value = parsed.product_type;
            }
          } catch {
            // fallthrough
          }
        }
        return {
          value,
          tokensIn: resp.usage?.prompt_tokens,
          tokensOut: resp.usage?.completion_tokens,
        };
      },
      fallback: async () => {
        if (!hasMistral()) return { value: null, provider: "mistral" as const };
        const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
          },
          body: JSON.stringify({
            model: "mistral-small-latest",
            temperature: 0,
            max_tokens: 80,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: system },
              { role: "user", content: `${userMsg}\n\nFormat: { "product_type": "...", "confidence": 0.9, "hint": "..." }` },
            ],
          }),
        });
        if (!r.ok) return { value: null, provider: "mistral" as const };
        const json = (await r.json()) as { choices?: { message?: { content?: string } }[] };
        const raw = json?.choices?.[0]?.message?.content;
        let value: ProductType | null = null;
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as { product_type?: string };
            if (parsed.product_type && isProductType(parsed.product_type)) {
              value = parsed.product_type;
            }
          } catch {
            // fallthrough
          }
        }
        return { value, provider: "mistral" as const };
      },
    });
    return detected ?? "autre";
  } catch {
    return "autre";
  }
}

// -----------------------------------------------------------------------------
// 1.5) Open-promise exploration
//      For promises that don't map to a static catalogue category, we ask the
//      LLM to look at the actual ingredients of the formula and pick the ones
//      it considers active for that specific promise. The LLM is given the
//      list of items by slug - it can ONLY cite slugs from that list, so it
//      cannot invent ingredients. The engine re-validates every cited slug
//      anyway as a defence-in-depth measure (see resolveOpenPromise).
// -----------------------------------------------------------------------------

export type FormulaItemForLlm = {
  slug: string;
  name: string;
  primaryFunction: string | null;
};

export type OpenPromiseExploration = {
  matches: OpenLlmMatch[];
  /** Documented actives the LLM expected but didn't find in the formula. */
  missing: string[];
};

const OPEN_PROMISE_SCHEMA = {
  name: "open_promise_exploration",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      matches: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            item_slug: { type: "string" },
            item_name: { type: "string" },
            evidence: {
              type: "string",
              enum: ["documented", "supportive", "marketing"],
            },
            reason: { type: "string" },
          },
          required: ["item_slug", "item_name", "evidence", "reason"],
        },
      },
      missing: { type: "array", items: { type: "string" } },
    },
    required: ["matches", "missing"],
  },
} as const;

function buildOpenPromisePrompt(
  promiseLabel: string,
  promiseExcerpt: string,
  items: FormulaItemForLlm[],
) {
  // Compact list - only items with a slug (the only ones we can match back
  // mechanically). Truncate to 60 to control prompt size on long formulas.
  const itemsList = items
    .slice(0, 60)
    .map(
      (it, i) =>
        `${i + 1}. ${it.name} (slug: ${it.slug})${
          it.primaryFunction ? ` - ${it.primaryFunction}` : ""
        }`,
    )
    .join("\n");

  const system = `Tu es chimiste cosmétique. On te donne une promesse marketing extraite d'un produit, et la liste réelle des ingrédients de ce produit. Tu dois identifier QUELS ingrédients de la liste soutiennent biologiquement cette promesse.

RÈGLES STRICTES (anti-hallucination) :
1. Tu ne peux citer QUE les ingrédients de la liste fournie. Le champ item_slug DOIT être un slug exact présent dans la liste. JAMAIS d'ingrédient inventé.
2. Pour chaque ingrédient pertinent, choisis un niveau d'évidence :
   - "documented" : actif biologiquement reconnu pour cette promesse, à des doses cosmétiques usuelles (ex: caféine pour anti-chute, niacinamide pour pores)
   - "supportive" : contribue indirectement (ex: panthénol pour confort général)
   - "marketing" : effet visuel/sensoriel uniquement, pas biologique (ex: silicones qui donnent un toucher "lisse")
3. Si AUCUN ingrédient de la liste ne soutient la promesse, retourne matches: [].
4. Sois conservateur. Mieux vaut sous-citer que sur-citer. Si tu n'es pas sûr, ne cite pas.
5. Pas plus de 6 matches au total.
6. Tu peux aussi lister jusqu'à 5 actifs documentés qui auraient typiquement été utilisés pour cette promesse mais qui ne sont PAS dans la liste (champ "missing"). Noms en français de préférence.`;

  const user = `Promesse à vérifier : "${promiseLabel}"
Phrase exacte de la description : "${promiseExcerpt}"

Liste des ingrédients du produit (slug INCI + fonction principale) :
${itemsList}

Retourne le JSON.`;

  return { system, user };
}

function safeParseOpenPromise(raw: string): OpenPromiseExploration | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as Record<string, unknown>;
    const matches = Array.isArray(obj.matches) ? obj.matches : [];
    const missing = Array.isArray(obj.missing) ? obj.missing : [];
    return {
      matches: matches
        .map((m) => m as Record<string, unknown>)
        .filter(
          (
            m,
          ): m is {
            item_slug: string;
            item_name: string;
            evidence: "documented" | "supportive" | "marketing";
            reason: string;
          } =>
            typeof m.item_slug === "string"
            && typeof m.item_name === "string"
            && typeof m.reason === "string"
            && (m.evidence === "documented"
              || m.evidence === "supportive"
              || m.evidence === "marketing"),
        )
        .slice(0, 6)
        .map((m) => ({
          item_slug: m.item_slug,
          item_name: m.item_name,
          evidence: m.evidence,
          reason: m.reason.slice(0, 200),
        })),
      missing: missing
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.slice(0, 80))
        .slice(0, 5),
    };
  } catch {
    return null;
  }
}

async function mistralExploreOpen(
  promiseLabel: string,
  promiseExcerpt: string,
  items: FormulaItemForLlm[],
): Promise<OpenPromiseExploration | null> {
  if (!hasMistral()) return null;
  const { system, user } = buildOpenPromisePrompt(promiseLabel, promiseExcerpt, items);
  const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      temperature: 0.2,
      max_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `${user}\n\nFormat strict :\n{ "matches": [{"item_slug","item_name","evidence","reason"}], "missing": ["string"] }`,
        },
      ],
    }),
  });
  if (!r.ok) return null;
  const json = (await r.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json?.choices?.[0]?.message?.content;
  if (!raw) return null;
  return safeParseOpenPromise(raw);
}

export async function exploreOpenPromise(
  promiseLabel: string,
  promiseExcerpt: string,
  items: FormulaItemForLlm[],
  userId?: string | null,
): Promise<OpenPromiseExploration> {
  if (items.length === 0) return { matches: [], missing: [] };
  if (!hasOpenAI() && !hasMistral()) return { matches: [], missing: [] };

  const { system, user } = buildOpenPromisePrompt(promiseLabel, promiseExcerpt, items);

  try {
    const result = await callWithFallback<OpenPromiseExploration | null>({
      feature: "categorize",
      userId: userId ?? null,
      timeoutMs: 20_000,
      primary: async () => {
        if (!hasOpenAI()) throw new Error("openai disabled");
        const resp = await openai().chat.completions.create({
          model: AI_MODEL,
          temperature: 0.2,
          max_tokens: 1200,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: {
            type: "json_schema",
            json_schema: OPEN_PROMISE_SCHEMA,
          },
        });
        const raw = resp.choices?.[0]?.message?.content ?? null;
        const value = raw ? safeParseOpenPromise(raw) : null;
        return {
          value,
          tokensIn: resp.usage?.prompt_tokens,
          tokensOut: resp.usage?.completion_tokens,
        };
      },
      fallback: async () => ({
        value: await mistralExploreOpen(promiseLabel, promiseExcerpt, items),
        provider: "mistral",
      }),
    });
    return result ?? { matches: [], missing: [] };
  } catch {
    return { matches: [], missing: [] };
  }
}

// -----------------------------------------------------------------------------
// 2) Conclusion sentence
// -----------------------------------------------------------------------------

function buildConclusionPrompt(
  promises: CoherencePromise[],
  productLabel: string | null,
) {
  const tenue = promises.filter((p) => p.verdict === "tenue").map((p) => p.label);
  const partielle = promises.filter((p) => p.verdict === "partielle").map((p) => p.label);
  const marketing = promises.filter((p) => p.verdict === "marketing").map((p) => p.label);
  const non = promises.filter((p) => p.verdict === "non_demontree").map((p) => p.label);
  const contredite = promises.filter((p) => p.verdict === "contredite").map((p) => p.label);

  const system = `Tu rédiges UNE phrase de conclusion (50-120 mots maximum) pour une analyse de cohérence entre les promesses d'un produit cosmétique et sa formule.

Style : direct, factuel, accessible à un consommateur français lambda. Pas de jugement moral, pas d'emoji, pas de marketing inversé ("trompeur"). Tu décris ce que la formule fait probablement vs ce qui est promis.

Si des promesses sont CONTREDITES (le produit dit "sans X" mais contient X), mentionne-les en priorité - c'est l'info la plus actionnable pour l'utilisateur.

Structure attendue : "[ce que la formule tient] mais [ce qu'elle ne tient pas / ce qui est contredit]. Effet attendu : [ce que l'utilisateur peut réellement ressentir]."

NE CITE QUE LES VERDICTS QUE JE TE DONNE. N'invente jamais d'ingrédient ni de verdict.

${NO_LONG_DASHES_RULE}`;

  const user = `${productLabel ? `Produit : ${productLabel}\n\n` : ""}Verdicts (déjà calculés mécaniquement) :
- Promesses TENUES : ${tenue.length ? tenue.join(", ") : "(aucune)"}
- Cohérence PARTIELLE : ${partielle.length ? partielle.join(", ") : "(aucune)"}
- Effet MARKETING uniquement : ${marketing.length ? marketing.join(", ") : "(aucun)"}
- Promesses NON DÉMONTRÉES : ${non.length ? non.join(", ") : "(aucune)"}
- Promesses CONTREDITES par la formule : ${contredite.length ? contredite.join(", ") : "(aucune)"}

Écris la phrase de conclusion. Pas de préambule, juste la phrase.`;

  return { system, user };
}

async function mistralConclusion(
  promises: CoherencePromise[],
  productLabel: string | null,
): Promise<string | null> {
  if (!hasMistral()) return null;
  const { system, user } = buildConclusionPrompt(promises, productLabel);
  const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      temperature: 0.3,
      max_tokens: 250,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!r.ok) return null;
  const json = (await r.json()) as { choices?: { message?: { content?: string } }[] };
  return json?.choices?.[0]?.message?.content?.trim() ?? null;
}

/** Default conclusion when the LLM is unavailable. */
function fallbackConclusion(promises: CoherencePromise[]): string {
  const tenue = promises.filter((p) => p.verdict === "tenue").length;
  const total = promises.length;
  if (total === 0) {
    return "Aucune promesse d'effet n'a été détectée dans la description fournie.";
  }
  if (tenue === total) {
    return "Toutes les promesses détectées sont soutenues par des actifs documentés dans la formule.";
  }
  if (tenue === 0) {
    return "Aucune des promesses détectées n'est soutenue par un actif documenté dans la formule.";
  }
  return `${tenue} promesse${tenue > 1 ? "s sont tenues" : " est tenue"} sur ${total}, les autres manquent d'actifs documentés dans la formule.`;
}

export async function generateConclusion(
  promises: CoherencePromise[],
  productLabel: string | null,
  userId?: string | null,
): Promise<string> {
  if (!hasOpenAI() && !hasMistral()) return fallbackConclusion(promises);

  const { system, user } = buildConclusionPrompt(promises, productLabel);

  try {
    const text = await callWithFallback<string | null>({
      feature: "synthesis",
      userId: userId ?? null,
      timeoutMs: 15_000,
      primary: async () => {
        if (!hasOpenAI()) throw new Error("openai disabled");
        const resp = await openai().chat.completions.create({
          model: AI_MODEL,
          temperature: 0.3,
          max_tokens: 250,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        });
        const raw = resp.choices?.[0]?.message?.content?.trim() ?? null;
        const value = raw ? stripLongDashes(raw) : null;
        return {
          value,
          tokensIn: resp.usage?.prompt_tokens,
          tokensOut: resp.usage?.completion_tokens,
        };
      },
      fallback: async () => {
        const raw = await mistralConclusion(promises, productLabel);
        return {
          value: raw ? stripLongDashes(raw) : null,
          provider: "mistral" as const,
        };
      },
    });
    return text ?? fallbackConclusion(promises);
  } catch {
    return fallbackConclusion(promises);
  }
}
