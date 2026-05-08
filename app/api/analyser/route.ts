import { NextRequest, NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase";
import { parseInciList, computeScore, scoreLabel, type ColorRating } from "@/lib/inciParser";
import { blacklistIp, checkRateLimit, getClientIp } from "@/lib/ratelimit";

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
  match_kind: "exact" | "alias" | "fuzzy" | null;
};

type AnalysePayload = {
  text: string;
  hp?: string;
  withSynthesis?: boolean;
  /** Optional human label of the analysed product (e.g. "La Roche-Posay Effaclar Duo+"),
   *  used to vary the AI synthesis. Sent by the product search frontend. */
  productLabel?: string;
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
  conservateur: "Conservateurs",
  "parfum-synthese": "Parfums de synthèse",
  "huile-essentielle": "Huiles essentielles",
  ogm: "OGM",
};

// Tags reported as "good when absent". The rest are reported only when present.
const ABSENCE_REPORTED = new Set([
  "paraben",
  "sulfate",
  "huile-minerale",
  "silicone",
  "allergene-parfumant",
  "ethoxyle",
  "colorant-synthese",
  "ammonium-quaternaire",
  "parfum-synthese",
]);

// Names that count as "water" when found in position 0 (first ingredient).
const WATER_NAMES = new Set(["aqua", "water", "eau"]);

// Number of leading positions considered "top of the list" for the
// "problematic actives near the top" observation.
const TOP_LIST_WINDOW = 5;

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  // Tighter limit on the analyser API : 5/min/IP, 50/day/IP
  const rl = checkRateLimit(ip, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop d'analyses récentes. Réessaye dans une minute." },
      {
        status: 429,
        headers: { "Retry-After": Math.ceil(rl.retryAfter / 1000).toString() },
      },
    );
  }

  let body: AnalysePayload;
  try {
    body = (await req.json()) as AnalysePayload;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (body.hp && body.hp.length > 0) {
    blacklistIp(ip);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const text = (body.text ?? "").slice(0, 8000);
  if (!text.trim()) {
    return NextResponse.json({ error: "Liste vide." }, { status: 400 });
  }

  const tokens = parseInciList(text);
  if (tokens.length === 0) {
    return NextResponse.json({ error: "Aucun ingrédient détecté dans la liste." }, { status: 400 });
  }

  // Batch-match against the database
  const sb = supabaseAnon();
  const { data, error } = await sb.rpc("cosmetwiki_match_inci_batch", {
    p_tokens: tokens.map((t) => t.normalized),
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const rows = (data ?? []) as MatchRow[];

  // Re-attach the original raw token (for display) by position
  const enriched = rows.map((r) => {
    const tok = tokens[r.position_idx];
    return {
      ...r,
      input_raw: tok ? tok.raw : r.input_token,
    };
  });

  // Counters
  const counts: Record<string, number> = { Vert: 0, Jaune: 0, Orange: 0, Rouge: 0, "Non reconnu": 0 };
  for (const r of enriched) {
    if (r.color_rating) counts[r.color_rating]++;
    else counts["Non reconnu"]++;
  }
  const matched = enriched.length - counts["Non reconnu"];

  // Score
  const score = computeScore(
    enriched.map((r) => ({ color_rating: r.color_rating, position: r.position_idx })),
    enriched.length,
  );
  const { label: scoreLabelText, tone: scoreTone } = scoreLabel(score);

  // Tag aggregation : count + list of ingredients per tag
  const tagCounts: Record<string, number> = {};
  const tagItems: Record<string, { name: string; slug: string | null; colorRating: ColorRating | null }[]> = {};
  for (const r of enriched) {
    if (!r.tags) continue;
    for (const t of r.tags) {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
      if (!tagItems[t]) tagItems[t] = [];
      tagItems[t].push({
        name: r.name ?? r.input_raw,
        slug: r.slug,
        colorRating: r.color_rating,
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
  // Reported absences (good news)
  for (const tag of ABSENCE_REPORTED) {
    const c = tagCounts[tag] || 0;
    if (c === 0) {
      observations.push({ tag, label: TAG_LABELS[tag] ?? tag, status: "absent", count: 0, items: [] });
    } else {
      observations.push({ tag, label: TAG_LABELS[tag] ?? tag, status: "present", count: c, items: tagItems[tag] ?? [] });
    }
  }
  // Other tags only when present
  for (const [tag, c] of Object.entries(tagCounts)) {
    if (ABSENCE_REPORTED.has(tag)) continue;
    if (c > 0) {
      observations.push({ tag, label: TAG_LABELS[tag] ?? tag, status: "present", count: c, items: tagItems[tag] ?? [] });
    }
  }

  // ----- Computed observations (no tag, derived from the list itself) -----

  // Sort once by position so first-element checks are stable.
  const byPosition = [...enriched].sort((a, b) => a.position_idx - b.position_idx);

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
    .filter((r) => r.color_rating === "Orange" || r.color_rating === "Rouge");
  if (topProblematic.length > 0) {
    observations.push({
      tag: "top-list-warning",
      label: "Ingrédients de pénalité en début de liste",
      status: "warn",
      count: topProblematic.length,
      items: topProblematic.map((r) => ({
        name: r.name ?? r.input_raw,
        slug: r.slug,
        colorRating: r.color_rating,
      })),
      message: `${topProblematic.length} dans le top ${TOP_LIST_WINDOW} (concentration plus élevée)`,
    });
  }

  // Aliases used (FR/EN equivalents that were resolved)
  const aliasesUsed = enriched
    .filter((r) => r.match_kind === "alias")
    .map((r) => ({ from: r.input_raw, to: r.name }));

  // Optional AI synthesis
  let synthesis: string | null = null;
  if (body.withSynthesis !== false) {
    synthesis = await generateSynthesis({
      enriched,
      counts,
      score,
      scoreLabel: scoreLabelText,
      observations,
      productLabel: body.productLabel?.slice(0, 200) ?? null,
    });
  }

  return NextResponse.json({
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
    items: enriched.map((r) => ({
      position: r.position_idx + 1,
      input: r.input_raw,
      slug: r.slug,
      name: r.name,
      colorRating: r.color_rating,
      casNumber: r.cas_number,
      translationFr: r.translation_fr,
      primaryFunction: r.primary_function,
      tags: r.tags,
      matchKind: r.match_kind,
    })),
    observations,
    aliasesUsed,
    synthesis,
  });
}

// ============================================================
// Mistral synthesis
// ============================================================
type EnrichedItem = {
  input_raw: string;
  name: string | null;
  color_rating: ColorRating | null;
  primary_function: string | null;
  tags: string[] | null;
  position_idx: number;
};

async function generateSynthesis(input: {
  enriched: EnrichedItem[];
  counts: Record<string, number>;
  score: number;
  scoreLabel: string;
  observations: { label: string; status: "present" | "absent" | "info" | "warn"; count: number }[];
  productLabel: string | null;
}): Promise<string | null> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return null;

  const red = input.enriched
    .filter((r) => r.color_rating === "Rouge")
    .map((r) => ({
      name: r.name ?? r.input_raw,
      fn: r.primary_function ?? "fonction inconnue",
    }));
  const orange = input.enriched
    .filter((r) => r.color_rating === "Orange")
    .map((r) => ({
      name: r.name ?? r.input_raw,
      fn: r.primary_function ?? "fonction inconnue",
    }));
  const yellow = input.enriched
    .filter((r) => r.color_rating === "Jaune")
    .map((r) => r.name ?? r.input_raw);

  // Top main ingredients (first 3 in the list) — gives Mistral context to
  // infer the product category for paragraph 1.
  const mainIngredients = input.enriched
    .slice(0, 3)
    .map((r) => `${r.name ?? r.input_raw}${r.primary_function ? ` (${r.primary_function})` : ""}`);

  const positives = input.observations
    .filter((o) => o.status === "absent")
    .map((o) => o.label);
  const presents = input.observations
    .filter((o) => o.status === "present")
    .map((o) => `${o.label} (${o.count})`);

  // Pick the first green ingredient with a known function — the "hero" we
  // can mention briefly in paragraph 1 without lapsing into marketing.
  const greenHero = input.enriched.find(
    (r) => r.color_rating === "Vert" && r.primary_function && r.name,
  );
  const greenHeroLine = greenHero
    ? `${greenHero.name} (${greenHero.primary_function})`
    : "(aucun ingrédient vert avec fonction connue)";

  const prompt = `Tu rédiges la synthèse d'une analyse INCI cosmétique pour un consommateur français.
Tu es un analyste FACTUEL, pas un rédacteur marketing. Pas de blabla, pas de mise en valeur du produit.

STRUCTURE OBLIGATOIRE — DEUX BLOCS SÉPARÉS PAR UNE LIGNE VIDE.

BLOC 1 — Paragraphe court (2 à 3 phrases MAXIMUM, en prose, AUCUNE puce)
Ce paragraphe doit dire dans cet ordre logique :
  (a) Le constat chiffré : combien d'ingrédients verts (bon signal) vs combien d'orange ou rouges (à examiner).
      Ex : "Sur les ${(input.counts.Vert ?? 0) + (input.counts.Jaune ?? 0) + (input.counts.Orange ?? 0) + (input.counts.Rouge ?? 0)} ingrédients reconnus, ${input.counts.Vert} sont classés vert et ${input.counts.Orange + input.counts.Rouge} demandent une attention particulière."
  (b) UNE phrase qui cite UN seul bon ingrédient présent et dit BREF à quoi il sert (pas d'éloge).
      Ex : "**${greenHero?.name ?? "[ingrédient vert]"}** y joue son rôle d'${greenHero?.primary_function ?? "[fonction]"}."
  (c) UNE phrase de TRANSITION qui introduit la liste à puces qui suit.
      Cette phrase doit ressembler à : "Voici les ingrédients sur lesquels attirer votre attention :" ou "Les points de vigilance ci-dessous :" ou "Voici le détail des ingrédients problématiques :".

BLOC 2 — Liste en PUCES (chaque ligne commence par "- ")
- Cite CHAQUE ingrédient ROUGE : "- **NOM_INCI** ([fonction]) : [1 phrase courte expliquant la pénalité]"
- Cite CHAQUE ingrédient ORANGE (limite 6, sinon les 5 premiers + "- et N autres") : "- **NOM_INCI** ([fonction]) : [1 phrase courte sur la pénalité]"
- Si plus de 3 jaunes notables, regroupe-les en UNE puce : "- Quelques ingrédients jaunes à surveiller : **NOM1**, **NOM2**, **NOM3**…"
- Si pertinent, UNE puce d'absences : "- Sans **parabens**, sans **sulfates**, sans **silicones**, sans **huiles minérales**" — uniquement les absences réelles.
- Termine par UNE puce factuelle "- À savoir : …" (ex. test sur petite zone, position dans la liste = concentration). Pas de conseil médical.

CE QUE TU NE DOIS JAMAIS FAIRE
- AUCUN langage marketing. Mots et tournures INTERDITS : "mise sur", "rassurante", "rassurant", "généreuse", "généreux", "idéal", "idéale", "parfait", "parfaite", "doux comme caresse", "simplicité", "merites", "vanter", "offre", "apporte un confort", "soin idéal", "à appliquer matin et soir", "en confiance", "agréable".
- AUCUNE recommandation d'achat ou d'évitement ("à acheter", "à éviter", "produit dangereux", "produit excellent", "à recommander").
- AUCUNE description sensorielle (texture, parfum, agréable, doux, fondant, onctueux…).
- AUCUNE phrase qui déduit un usage ("crème pour peau sèche", "produit anti-âge"…) — concentre-toi UNIQUEMENT sur les ingrédients.
- AUCUN conseil médical, AUCUN emoji.
- Tu ne dis JAMAIS "ce produit est bon" ni "ce produit est mauvais". Tu énonces les faits ingrédient par ingrédient.
- Encadre TOUJOURS les noms INCI cités avec **.
- VARIE les formulations entre produits — ne réutilise pas mécaniquement la même phrase d'attaque.

DONNÉES FACTUELLES
${input.productLabel ? `Produit analysé : ${input.productLabel}` : "Produit : composition collée par l'utilisateur (pas de nom fourni)."}
Note globale : ${input.score.toFixed(1)}/20 (${input.scoreLabel})
Comptes : Vert ${input.counts.Vert}, Jaune ${input.counts.Jaune}, Orange ${input.counts.Orange}, Rouge ${input.counts.Rouge}
3 premiers ingrédients (concentration) : ${mainIngredients.join(", ") || "(non disponibles)"}
Ingrédient vert "hero" suggéré pour le paragraphe : ${greenHeroLine}

Ingrédients ROUGES :
${red.length ? red.map((r) => `- ${r.name} — ${r.fn}`).join("\n") : "(aucun)"}

Ingrédients ORANGE :
${orange.length ? orange.map((r) => `- ${r.name} — ${r.fn}`).join("\n") : "(aucun)"}

Ingrédients JAUNES (jusqu'à 8 cités) :
${yellow.length ? yellow.slice(0, 8).join(", ") + (yellow.length > 8 ? ` et ${yellow.length - 8} autres` : "") : "(aucun)"}

Observations positives (absences) : ${positives.join(", ") || "(aucune)"}
Observations présentes : ${presents.join(", ") || "(aucune)"}

Rédige maintenant la synthèse. Bloc 1 (prose, 2-3 phrases, finis par la phrase de transition), ligne vide, puis Bloc 2 (puces) :`;

  try {
    const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        temperature: 0.55,
        top_p: 0.95,
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content:
              "Tu es un analyste INCI FACTUEL — pas un rédacteur marketing, pas un vendeur. Tu écris pour le grand public français à partir de données fournies, JAMAIS d'invention. Tu énonces les faits chiffrés et tu attires l'attention sur les ingrédients problématiques sans dramatiser. Tu n'utilises JAMAIS de langage marketing (pas de 'mise sur', 'rassurant', 'idéal', 'généreux', 'simplicité', 'apporte', 'offre', 'agréable', 'idéal pour'…). Tu ne décris JAMAIS la texture ni le parfum. Tu ne recommandes JAMAIS d'acheter ni d'éviter le produit. Tu ne donnes AUCUN conseil médical. Tu structures TOUJOURS ta sortie en deux blocs : un paragraphe court de 2-3 phrases (prose, pas de puces) qui (a) donne le constat chiffré, (b) cite UN bon ingrédient avec sa fonction, (c) FINIT par une phrase de transition introduisant la liste, puis une ligne vide, puis un bloc de puces (chaque ligne commençant par '- '). Tu encadres les noms INCI avec **. Tu varies les formulations d'un produit à l'autre.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!r.ok) return null;
    const json = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const txt = json?.choices?.[0]?.message?.content?.trim();
    return txt || null;
  } catch {
    return null;
  }
}
