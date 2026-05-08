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
    synthesis = await generateSynthesis({ enriched, counts, score, scoreLabel: scoreLabelText, observations });
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
}): Promise<string | null> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return null;

  const red = input.enriched
    .filter((r) => r.color_rating === "Rouge")
    .map((r) => `${r.name ?? r.input_raw} (${r.primary_function ?? "fonction inconnue"})`);
  const orange = input.enriched
    .filter((r) => r.color_rating === "Orange")
    .map((r) => `${r.name ?? r.input_raw} (${r.primary_function ?? "fonction inconnue"})`);
  const yellow = input.enriched
    .filter((r) => r.color_rating === "Jaune")
    .map((r) => r.name ?? r.input_raw);

  const positives = input.observations
    .filter((o) => o.status === "absent")
    .map((o) => o.label);
  const presents = input.observations
    .filter((o) => o.status === "present")
    .map((o) => `${o.label} (${o.count})`);

  const prompt = `Tu vas rédiger une synthèse en français pour une analyse de composition cosmétique INCI.

STRUCTURE EN 2 PARAGRAPHES :

Paragraphe 1 — État des lieux factuel (3 à 5 phrases) :
- Toujours mentionner TOUS les ingrédients rouges (le cas échéant) par leur nom INCI EXACT, encadré par **.
- Si plusieurs orange (≤ 5), citer chacun par son nom INCI en gras. Si > 5 orange, citer les 4 premiers + "et N autres".
- Mentionner brièvement les jaunes notables si pertinents.
- Mentionner ce qui est sain (parabens absents, sulfates absents, silicones absents, huiles minérales absentes, etc.) si pertinent.
- Si la liste contient des allergènes parfumants, les nommer brièvement.
- Ne JAMAIS inventer un ingrédient. Si une catégorie est vide, ne la mentionne pas.

Paragraphe 2 — Touche de conseil bienveillant (2 à 3 phrases) :
- Donner un ou deux conseils GÉNÉRAUX, doux et rassurants, en lien avec ce que la composition révèle. Exemples : suggérer un test sur une petite zone si la peau est réactive ; rappeler que ces ingrédients sont fréquents dans la cosmétique courante ; conseiller de privilégier une routine simple ; rappeler que la position dans la liste indique la concentration.
- Pas d'alarmisme, pas de jugement sur le produit, pas de recommandation d'achat ni d'évitement spécifique.
- Aucun conseil médical (ne pas dire "consultez un médecin", ne pas évoquer de pathologies).

CONSIGNES GÉNÉRALES :
- 5 à 8 phrases au total, deux paragraphes séparés par un saut de ligne.
- Reste neutre, posé, pédagogique.
- N'utilise pas d'emojis.
- Conserve les termes techniques INCI quand ils sont nécessaires.

DONNÉES :
Note globale : ${input.score.toFixed(1)}/20 (${input.scoreLabel})
Comptes : Vert ${input.counts.Vert}, Jaune ${input.counts.Jaune}, Orange ${input.counts.Orange}, Rouge ${input.counts.Rouge}

Ingrédients ROUGES (à citer tous) :
${red.length ? red.map((r) => `- ${r}`).join("\n") : "(aucun)"}

Ingrédients ORANGE (à citer dans la limite indiquée) :
${orange.length ? orange.map((r) => `- ${r}`).join("\n") : "(aucun)"}

Ingrédients JAUNES :
${yellow.length ? yellow.slice(0, 8).join(", ") + (yellow.length > 8 ? ` et ${yellow.length - 8} autres` : "") : "(aucun)"}

Observations positives (absences) : ${positives.join(", ") || "(aucune)"}
Observations présentes : ${presents.join(", ") || "(aucune)"}

Rédige maintenant la synthèse :`;

  try {
    const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        temperature: 0.2,
        max_tokens: 750,
        messages: [
          {
            role: "system",
            content:
              "Tu es un assistant spécialisé dans les compositions INCI cosmétiques. Tu rédiges à partir des données factuelles fournies, sans rien inventer. Tu peux ajouter quelques conseils généraux et bienveillants (test sur une petite zone, attention aux peaux sensibles, privilégier une routine simple, etc.), mais AUCUN conseil médical, AUCUNE recommandation d'achat ou d'évitement d'un produit précis, et AUCUN alarmisme. Tu restes neutre, posé, pédagogique, en 5 à 8 phrases organisées en deux paragraphes (état des lieux puis conseils). Quand tu cites un ingrédient INCI, tu l'encadres avec **.",
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
