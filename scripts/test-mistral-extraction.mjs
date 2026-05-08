// Tests whether Mistral can EXTRACT (not generate) an INCI list
// from a raw HTML page. This is the critical primitive for the
// DuckDuckGo fallback in the product search cascade.

const apiKey = process.env.MISTRAL_API_KEY;
if (!apiKey) {
  console.error("MISTRAL_API_KEY missing");
  process.exit(1);
}

const targets = [
  {
    label: "Effaclar Duo+ (LRP) via INCIDecoder",
    url: "https://incidecoder.com/products/la-roche-posay-effaclar-duo-2",
  },
  {
    label: "CeraVe Moisturizing Cream via INCIDecoder",
    url: "https://incidecoder.com/products/cerave-moisturizing-cream",
  },
  {
    label: "Effaclar Duo+ (LRP) via SkinSort",
    url: "https://skinsort.com/products/la-roche-posay/effaclar-duo",
  },
  {
    label: "Effaclar Duo+ (LRP) via INCIBeauty (FR)",
    url: "https://incibeauty.com/en/produit/3337875863858",
  },
];

function reduceHtmlToInciContext(html) {
  // Strip scripts/styles, then keep ~3KB around the first match of
  // ingredient-related keywords. Heavily reduces token cost.
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const re = /(ingredients|composition|inci|ingr[eé]dients)/i;
  const m = re.exec(stripped);
  if (!m) return stripped.slice(0, 6000);
  const start = Math.max(0, m.index - 500);
  const end = Math.min(stripped.length, m.index + 6000);
  return stripped.slice(start, end);
}

async function fetchHtml(url) {
  const r = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Upgrade-Insecure-Requests": "1",
    },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.text();
}

async function extractWithMistral(label, context) {
  const prompt = `Tu es un extracteur d'INCI. Voici le texte brut d'une page produit cosmétique. Trouve UNIQUEMENT la liste INCI (la liste des ingrédients) telle qu'elle apparaît, et renvoie-la en une seule ligne, ingrédients séparés par des virgules.

Règles strictes :
- N'invente AUCUN ingrédient. Ne reformule pas. Ne traduis pas.
- Si la page ne contient pas de liste INCI claire, réponds NONE.
- Pas de commentaire, pas de "Voici" ou "INCI :", uniquement la liste séparée par virgules.

Produit : ${label}

Texte brut :
"""
${context}
"""`;

  const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      temperature: 0.0,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!r.ok) throw new Error(`Mistral HTTP ${r.status}: ${await r.text()}`);
  const json = await r.json();
  return {
    answer: json.choices?.[0]?.message?.content?.trim() ?? "",
    usage: json.usage,
  };
}

for (const t of targets) {
  console.log(`\n=== ${t.label} ===`);
  console.log(`URL: ${t.url}`);
  try {
    const html = await fetchHtml(t.url);
    console.log(`HTML length: ${html.length}`);
    const ctx = reduceHtmlToInciContext(html);
    console.log(`Reduced context length: ${ctx.length}`);
    const { answer, usage } = await extractWithMistral(t.label, ctx);
    console.log(`Tokens: ${usage.total_tokens} (prompt ${usage.prompt_tokens} / out ${usage.completion_tokens})`);
    console.log(`Answer:\n${answer}\n`);
  } catch (err) {
    console.error(`FAIL: ${err.message}`);
  }
}
