// Reduces an HTML page to a token-cheap text excerpt focused on the INCI
// section, then asks GPT-4o-mini (primary) to EXTRACT (not generate) the
// ingredient list. Mistral kept as a fallback in case OpenAI is unavailable.

import { hasOpenAI, openai } from "@/lib/ai/client";

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

  const re = /(ingredients|composition|inci|ingr[eé]dients)/i;
  const m = re.exec(stripped);
  if (!m) return stripped.slice(0, 5_000);
  const start = Math.max(0, m.index - 300);
  const end = Math.min(stripped.length, m.index + 5_000);
  return stripped.slice(start, end);
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

Produit : ${input.label}

Texte brut :
"""
${ctx}
"""`;

  // Primary : GPT-4o-mini (cohérent avec le reste de la recherche produit
  // qui utilise déjà GPT Web Search + GPT pour la promesse marketing).
  if (hasOpenAI()) {
    try {
      const r = await openai().chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      });
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
