/**
 * Side-by-side compare insights. Generates short, human portraits of two
 * products and a "comment choisir ?" hint. Never says "A est mieux que B" -
 * the reader infers the better fit themselves from the descriptions.
 *
 * Cached by hash of the (ordered) pair of ingredient lists.
 */
import crypto from "node:crypto";
import {
  AI_MODEL,
  callWithFallback,
  getCached,
  hasMistral,
  hasOpenAI,
  openai,
  setCached,
} from "./client";
import { NO_LONG_DASHES_RULE, stripLongDashes } from "./sanitize";
import type { AnalyseResponse } from "@/lib/analyseTypes";

// Bumped to 4 when we taught the prompt to use real product names instead
// of "produit A" / "produit B" - old cache entries can't be reused since
// the text content now changes per pair (was previously canonical with A/B).
const PROMPT_VERSION = 4;

export type CompareSideInput = {
  name: string;
  result: AnalyseResponse;
};

export type CompareInsights = {
  portraitA: string;
  portraitB: string;
  common: string;
  howToChoose: string;
};

function fingerprint(side: CompareSideInput): string {
  return side.result.items
    .map((i) => `${(i.name ?? i.input).trim().toUpperCase()}:${i.colorRating ?? "?"}`)
    .join("|");
}

function makeCacheKey(a: CompareSideInput, b: CompareSideInput): string {
  const raw = `${fingerprint(a)}<>${fingerprint(b)}|v=${PROMPT_VERSION}`;
  const hash = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
  return `compare:${hash}`;
}

function topIngredients(side: CompareSideInput, max: number): string[] {
  return side.result.items
    .slice()
    .sort((x, y) => x.position - y.position)
    .slice(0, max)
    .map((i) => `${i.name ?? i.input}${i.primaryFunction ? ` (${i.primaryFunction})` : ""}`);
}

function flagged(side: CompareSideInput, color: "Rouge" | "Orange" | "Jaune", max: number): string[] {
  return side.result.items
    .filter((i) => i.colorRating === color)
    .slice(0, max)
    .map((i) => `${i.name ?? i.input}${i.primaryFunction ? ` (${i.primaryFunction})` : ""}`);
}


function buildPrompt(a: CompareSideInput, b: CompareSideInput): { system: string; user: string } {
  const sideBlock = (label: string, side: CompareSideInput) => {
    const c = side.result.counts;
    return [
      `${label} : "${side.name}"`,
      `  Note : ${side.result.score.toFixed(1)}/20 (${side.result.scoreLabel})`,
      `  Comptes, vert: ${c.vert}, jaune: ${c.jaune}, orange: ${c.orange}, rouge: ${c.rouge} (sur ${c.matched} reconnus)`,
      `  3 premiers ingrédients : ${topIngredients(side, 3).join(" • ") || "(n.c.)"}`,
      `  Rouges : ${flagged(side, "Rouge", 4).join(" • ") || "(aucun)"}`,
      `  Oranges : ${flagged(side, "Orange", 4).join(" • ") || "(aucun)"}`,
      `  Jaunes : ${flagged(side, "Jaune", 5).join(" • ") || "(aucun)"}`,
    ].join("\n");
  };

  const system =
    "Tu écris une comparaison entre deux produits cosmétiques pour un consommateur français. " +
    "Style : un pote bien informé qui décrit, pas un juge qui tranche. " +
    "Phrases courtes, vocabulaire simple, pas de jargon scientifique. " +
    "Tu n'écris JAMAIS \"X est mieux que Y\", \"X est meilleur\", \"recommandé\", \"à éviter\", " +
    "\"premier choix\", \"vainqueur\" : tu décris ce que chaque produit est et à qui il s'adresse, " +
    "le lecteur déduit lui-même celui qui lui convient. " +
    "Tu utilises TOUJOURS les vrais noms des produits (ceux qui te sont donnés entre guillemets) " +
    "et JAMAIS les mots \"produit A\", \"produit B\", \"A\", \"B\" comme étiquettes - " +
    "ça parle bien plus à l'utilisateur final. " +
    NO_LONG_DASHES_RULE + " " +
    "Pas de marketing (idéal, généreux, agréable...), pas de description sensorielle, pas d'emoji, " +
    "pas de conseil médical. Tu peux mentionner une famille d'ingrédient simple (tensioactif, " +
    "alcool, conservateur, silicone, actif hydratant) si ça aide à comprendre. Tu retournes UNIQUEMENT " +
    "un objet JSON valide, sans markdown, sans texte autour.";

  // Inject the real names directly in the user message so the model has them
  // front-and-centre - and back them up with the explicit "use these names"
  // instruction in the system prompt. The JSON KEY names stay portraitA /
  // portraitB (machine-stable) but the TEXT inside refers to the real
  // product names.
  const user = `Voici les données de deux produits à comparer. Rédige 4 champs courts.

${sideBlock("PRODUIT 1", a)}

${sideBlock("PRODUIT 2", b)}

NOMS À UTILISER DANS LE TEXTE (verbatim, ne les modifie pas) :
- Pour le produit 1 : "${a.name}"
- Pour le produit 2 : "${b.name}"

Rends un JSON avec exactement ces 4 clés :

{
  "portraitA": "1 à 2 phrases qui décrivent la formule de \"${a.name}\" : son caractère (eau-glycérine, huileux, moussant, à base d'alcool…), ce qu'elle apporte, son point d'attention principal si pertinent. Cite \"${a.name}\" par son nom au moins une fois. Ne dis jamais qu'elle est bonne ou mauvaise.",
  "portraitB": "Idem pour \"${b.name}\". Cite \"${b.name}\" par son nom au moins une fois.",
  "common": "1 phrase concrète qui résume ce que les deux produits ont en commun (type de formule, point de vigilance partagé, ou rien de notable). Si rien d'intéressant en commun, dis 'Les deux suivent des logiques de formulation très différentes.' Tu peux écrire \"les deux produits\" ou citer les noms.",
  "howToChoose": "1 à 2 phrases qui aident le lecteur à choisir SANS trancher. Ex : 'Si tu cherches un soin doux pour peau réactive, ${a.name} correspond à ce profil. Si tu privilégies un nettoyant moussant efficace, ${b.name} est conçu pour ça.' Pas de 'meilleur', pas de 'préfère X'. JAMAIS \"A\" / \"B\" / \"produit A\" / \"produit B\" - toujours les vrais noms."
}

CONTRAINTES
- JSON valide, rien d'autre.
- Chaque champ : 1 à 2 phrases max, jamais de liste à puces.
- Ne cite pas les notes /20.
- Ne mentionne pas le mot "score" ou "note".
- Ne dis pas qu'un produit est meilleur, gagnant, recommandé, déconseillé.
- Tu peux citer un ingrédient INCI en **gras** (avec doubles astérisques) si ça enrichit, max 2 par champ.
- INTERDIT : "produit A", "produit B", "le produit A", "le produit B", "A pourrait...", "B est conçu...". Utilise toujours les vrais noms ci-dessus.`;

  return { system, user };
}

function tryParse(raw: string): CompareInsights | null {
  if (!raw) return null;
  // Strip code fences if the model wrapped the JSON.
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  try {
    const obj = JSON.parse(s) as Partial<CompareInsights>;
    if (
      typeof obj.portraitA === "string" &&
      typeof obj.portraitB === "string" &&
      typeof obj.common === "string" &&
      typeof obj.howToChoose === "string"
    ) {
      return {
        portraitA: stripLongDashes(obj.portraitA),
        portraitB: stripLongDashes(obj.portraitB),
        common: stripLongDashes(obj.common),
        howToChoose: stripLongDashes(obj.howToChoose),
      };
    }
  } catch {
    // fallthrough
  }
  return null;
}

async function callMistralFallback(
  a: CompareSideInput,
  b: CompareSideInput,
): Promise<CompareInsights | null> {
  if (!hasMistral()) return null;
  const { system, user } = buildPrompt(a, b);
  const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      temperature: 0.5,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!r.ok) return null;
  const json = (await r.json()) as { choices?: { message?: { content?: string } }[] };
  return tryParse(json?.choices?.[0]?.message?.content ?? "");
}

export async function generateCompareInsights(
  a: CompareSideInput,
  b: CompareSideInput,
  opts: { userId?: string | null } = {},
): Promise<CompareInsights | null> {
  const cacheKey = makeCacheKey(a, b);
  const cached = await getCached<CompareInsights>(cacheKey);
  if (cached?.portraitA && cached?.portraitB) return cached;

  if (!hasOpenAI() && !hasMistral()) return null;

  const { system, user } = buildPrompt(a, b);

  try {
    const result = await callWithFallback<CompareInsights | null>({
      feature: "compare",
      userId: opts.userId ?? null,
      timeoutMs: 18_000,
      primary: async () => {
        if (!hasOpenAI()) throw new Error("openai disabled");
        const resp = await openai().chat.completions.create({
          model: AI_MODEL,
          temperature: 0.5,
          max_tokens: 700,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        });
        const value = tryParse(resp.choices?.[0]?.message?.content ?? "");
        return {
          value,
          tokensIn: resp.usage?.prompt_tokens,
          tokensOut: resp.usage?.completion_tokens,
        };
      },
      fallback: async () => ({
        value: await callMistralFallback(a, b),
        provider: "mistral",
      }),
    });

    if (result) {
      void setCached(cacheKey, result);
    }
    return result;
  } catch {
    return null;
  }
}
