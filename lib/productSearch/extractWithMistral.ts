// Reduces an HTML page to a token-cheap text excerpt focused on the INCI
// section, then asks GPT-4o-mini (primary) to EXTRACT (not generate) the
// ingredient list. Mistral kept as a fallback in case OpenAI is unavailable.

import { hasOpenAI, openai } from "@/lib/ai/client";

/**
 * Compress a page HTML down to a token-cheap excerpt the LLM can chew on.
 *
 * Strategy (in order of preference):
 *   1. Look for an INCI-shaped sequence directly — AQUA or WATER followed by
 *      several uppercase tokens separated by `,`, `.`, `;` or `•`. When we
 *      find one we capture a window around it: this is the most reliable
 *      signal on pharma sites (Avène, La Roche-Posay, Bioderma) where the
 *      first "composition" keyword hit on the page lands on a CSS class name
 *      thousands of chars upstream of the real list.
 *   2. Fall back to keyword search ("ingredients", "composition", "inci",
 *      "ingrédients"). On these we now capture up to three matches and
 *      concatenate their windows, so a page with the keyword in the nav AND
 *      in the real section still surfaces the right text.
 *   3. Last resort: first 5 KB of the page.
 */
function reduceHtmlForExtraction(html: string): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

  // Step 1: locate an INCI-shaped sequence. Pattern: AQUA or WATER, followed
  // by punctuation, then 2+ uppercase tokens within the next 200 chars (3 in
  // total). This is loose enough to catch Avène's "AVENE AQUA. CAPRYLIC/…"
  // and tight enough to skip arbitrary occurrences of the word "AQUA" in a
  // marketing paragraph.
  const inciShape = /\b(?:AQUA|WATER)\b[^A-Za-z]{0,5}[,.;•·][^A-Za-z]{0,5}[A-Z][A-Z0-9/ \-]{2,40}[,.;•·][^A-Za-z]{0,5}[A-Z]/;
  const inciMatch = inciShape.exec(stripped);
  if (inciMatch) {
    const start = Math.max(0, inciMatch.index - 200);
    const end = Math.min(stripped.length, inciMatch.index + 4_800);
    return stripped.slice(start, end);
  }

  // Step 2: keyword-driven excerpts. Take up to 3 hits, dedupe their windows.
  const re = /(ingredients|composition|inci|ingr[eé]dients|liste\s+complète|liste\s+des\s+ingr)/gi;
  const matches = [...stripped.matchAll(re)].slice(0, 3);
  if (matches.length === 0) return stripped.slice(0, 5_000);

  const slices: string[] = [];
  let usedChars = 0;
  for (const m of matches) {
    const start = Math.max(0, (m.index ?? 0) - 200);
    const remaining = 6_000 - usedChars;
    if (remaining <= 0) break;
    const end = Math.min(stripped.length, (m.index ?? 0) + Math.min(3_000, remaining));
    const slice = stripped.slice(start, end);
    slices.push(slice);
    usedChars += slice.length;
  }
  return slices.join("\n\n---\n\n");
}

function looksLikeInciList(text: string): boolean {
  if (!text) return false;
  if (text.length < 20) return false;
  const upper = text.toUpperCase();
  if (upper === "NONE" || upper === "INCONNU") return false;
  // INCI lists are comma-or-bullet separated and have many tokens.
  const tokens = text
    .split(/[,;•·]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && t.length < 80);
  return tokens.length >= 3;
}

export async function extractInciFromHtml(input: {
  label: string;
  html: string;
}): Promise<string | null> {
  const ctx = reduceHtmlForExtraction(input.html);
  if (ctx.length < 80) return null;

  const prompt = `Tu es un extracteur d'INCI. Voici le texte brut d'une page produit cosmétique. Trouve UNIQUEMENT la liste INCI (la liste des ingrédients) telle qu'elle apparaît, et renvoie-la en une seule ligne, ingrédients séparés par des virgules.

Règles strictes :
- N'invente AUCUN ingrédient. Ne reformule pas. Ne traduis pas.
- Si la page ne contient pas de liste INCI claire, réponds NONE.
- Pas de commentaire, pas de "Voici" ou "INCI :", uniquement la liste séparée par virgules.
- Les noms INCI sont en latin/anglais et habituellement en MAJUSCULES (ex: AQUA, GLYCERIN, BUTYROSPERMUM PARKII BUTTER).
- **Séparateurs possibles dans la source** : les marques pharmaceutiques françaises (Avène, La Roche-Posay, Bioderma, Eucerin…) utilisent souvent des POINTS au lieu de virgules entre ingrédients. Si tu repères ce pattern, normalise la sortie en utilisant des VIRGULES.
  Exemple input : "AVENE AQUA. CAPRYLIC/CAPRIC TRIGLYCERIDE. MINERAL OIL. GLYCERIN."
  Exemple output : "AVENE AQUA, CAPRYLIC/CAPRIC TRIGLYCERIDE, MINERAL OIL, GLYCERIN"
- Autres séparateurs possibles à normaliser en virgules : • (bullet), · (middot), ; (point-virgule).
- Garde les parenthèses et la casse d'origine (les ingrédients sont souvent en MAJUSCULES).

Produit : ${input.label}

Texte brut :
"""
${ctx}
"""`;

  // Primary : GPT-4o-mini (cohérent avec le reste de la recherche produit
  // qui utilise déjà GPT Web Search + GPT pour la promesse marketing).
  // Timeout dur 12 s : sans ça, l'appel pouvait dépasser le budget serverless
  // Vercel (25 s) et déclencher un 502 Bad Gateway côté client.
  if (hasOpenAI()) {
    try {
      const r = await Promise.race([
        openai().chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0,
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("openai_extract_timeout")), 12_000),
        ),
      ]);
      const txt = (r.choices?.[0]?.message?.content ?? "").trim();
      if (looksLikeInciList(txt)) return txt;
    } catch {
      // Tombe sur Mistral en fallback
    }
  }

  // Fallback : Mistral. Utile si OpenAI est down ou que la clé n'est pas
  // configurée. Coût similaire (mistral-small ~ gpt-4o-mini) mais on évite
  // les misses utilisateur dûs à une panne ponctuelle d'un seul fournisseur.
  const mistralKey = process.env.MISTRAL_API_KEY;
  if (!mistralKey) return null;

  try {
    const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mistralKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        temperature: 0.0,
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!r.ok) return null;
    const json = (await r.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const txt = (json?.choices?.[0]?.message?.content ?? "").trim();
    if (!looksLikeInciList(txt)) return null;
    return txt;
  } catch {
    return null;
  }
}
