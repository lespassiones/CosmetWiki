const apiKey = process.env.MISTRAL_API_KEY;
if (!apiKey) {
  console.error("MISTRAL_API_KEY missing");
  process.exit(1);
}

const product = "Effaclar Duo+ La Roche-Posay (40ml, version classique sans SPF, sans teinte)";

const prompt = `Donne-moi la liste INCI complète et exacte du produit "${product}".
Réponds UNIQUEMENT par la liste INCI séparée par des virgules, sans introduction ni commentaire.
Si tu ne connais pas la composition exacte, réponds "INCONNU".`;

const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: "mistral-small-latest",
    temperature: 0.1,
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  }),
});

if (!r.ok) {
  console.error("HTTP", r.status, await r.text());
  process.exit(1);
}

const json = await r.json();
console.log("=== MODEL ===");
console.log(json.model);
console.log("=== ANSWER ===");
console.log(json.choices?.[0]?.message?.content);
console.log("=== USAGE ===");
console.log(json.usage);
