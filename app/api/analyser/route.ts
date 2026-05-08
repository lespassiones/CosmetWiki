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
const ABSENCE_REPORTED = new Set(["paraben", "sulfate", "huile-minerale", "silicone"]);

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
    status: "present" | "absent";
    count: number;
    items: { name: string; slug: string | null; colorRating: ColorRating | null }[];
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
  observations: { label: string; status: "present" | "absent"; count: number }[];
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

  const prompt = `Tu rédiges la synthèse d'une analyse INCI cosmétique pour un consommateur français non-chimiste.

STRUCTURE OBLIGATOIRE — DEUX PARTIES SÉPARÉES PAR UNE LIGNE VIDE.

PARTIE 1 — Récap accessible (2 à 4 phrases en prose, AUCUNE puce)
- Donne un ressenti général sur la composition, en langage clair et humain.
- Adapte le ton au cas : compo très saine, compo équilibrée avec quelques points d'attention, compo chargée en X, etc.
- Si tu peux deviner l'usage du produit (hydratation, anti-imperfection, anti-âge, nettoyage, démaquillage, soin après-soleil…) à partir des ingrédients principaux, mentionne-le.
- VARIE l'attaque : ne commence PAS toujours par "Cette composition…" ni par "Cette analyse…". Tu peux commencer par l'usage présumé, par ce qui ressort, par ce qui est rassurant, etc.
- Reste neutre, jamais alarmiste, jamais "produit à éviter" ou "produit dangereux".

PARTIE 2 — Détail en PUCES (chaque ligne commence par "- ")
- Cite CHAQUE ingrédient ROUGE en puce : "- **NOM_INCI** : [1 phrase courte expliquant pourquoi pénalisé]"
- Cite CHAQUE ingrédient ORANGE (limite 6, sinon les 5 premiers + "- et N autres") : "- **NOM_INCI** ([fonction])"
- Si plus de 3 jaunes notables, regroupe-les en UNE puce : "- Quelques ingrédients jaunes à surveiller : **NOM1**, **NOM2**, **NOM3**…"
- Ajoute une puce sur les absences positives SI pertinent : "- Sans **parabens**, sans **sulfates**, sans **silicones**, sans **huiles minérales**" (ne mentionne que les absences réelles).
- Termine par UNE puce de conseil contextuel non-médical : "- À savoir : …" (test sur petite zone, position dans la liste = concentration, routine simple, etc.).

CONTRAINTES STRICTES
- Ne JAMAIS inventer un ingrédient. Si une catégorie est vide, ne fais simplement pas la puce.
- AUCUN emoji.
- AUCUN conseil médical (pas de "consultez un médecin", pas de pathologies citées).
- AUCUNE recommandation d'achat / d'évitement d'un produit précis.
- Encadre TOUJOURS les noms INCI cités avec **.
- 4 à 8 puces maximum dans la PARTIE 2.

DONNÉES
${input.productLabel ? `Produit analysé : ${input.productLabel}` : "Produit : composition collée par l'utilisateur (pas de nom fourni)."}
Note globale : ${input.score.toFixed(1)}/20 (${input.scoreLabel})
Comptes : Vert ${input.counts.Vert}, Jaune ${input.counts.Jaune}, Orange ${input.counts.Orange}, Rouge ${input.counts.Rouge}
3 premiers ingrédients (concentration) : ${mainIngredients.join(", ") || "(non disponibles)"}

Ingrédients ROUGES :
${red.length ? red.map((r) => `- ${r.name} — ${r.fn}`).join("\n") : "(aucun)"}

Ingrédients ORANGE :
${orange.length ? orange.map((r) => `- ${r.name} — ${r.fn}`).join("\n") : "(aucun)"}

Ingrédients JAUNES (jusqu'à 8 cités) :
${yellow.length ? yellow.slice(0, 8).join(", ") + (yellow.length > 8 ? ` et ${yellow.length - 8} autres` : "") : "(aucun)"}

Observations positives (absences) : ${positives.join(", ") || "(aucune)"}
Observations présentes : ${presents.join(", ") || "(aucune)"}

Rédige maintenant la synthèse en respectant la structure (Partie 1 en prose, ligne vide, Partie 2 en puces) :`;

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
              "Tu es un assistant qui rédige des synthèses INCI cosmétiques pour le grand public, à partir de données factuelles fournies — JAMAIS d'invention. Tu varies tes formulations d'un produit à l'autre pour ne JAMAIS sonner robotique : ouverture, ton, mots-clés. Tu restes neutre, jamais alarmiste, jamais médical. Tu structures TOUJOURS ta sortie en deux blocs : un paragraphe de récap accessible (prose, pas de puces), une ligne vide, puis un bloc de puces (chaque ligne commençant par '- '). Tu encadres les noms INCI avec **.",
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
