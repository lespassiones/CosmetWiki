import OpenAI from "openai";

const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error("OPENAI_API_KEY manquante");
  process.exit(1);
}

const client = new OpenAI({ apiKey: key });
const t0 = Date.now();

try {
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Réponds en une phrase courte en français." },
      { role: "user", content: "Bonjour, peux-tu confirmer que tu fonctionnes ?" },
    ],
    max_tokens: 60,
  });

  const dt = Date.now() - t0;
  console.log("OK en", dt, "ms");
  console.log("Modèle:", res.model);
  console.log("Réponse:", res.choices[0]?.message?.content);
  console.log("Tokens — in:", res.usage?.prompt_tokens, " out:", res.usage?.completion_tokens);
} catch (e) {
  console.error("Échec ping OpenAI:");
  console.error(e?.status, e?.code, e?.message);
  process.exit(1);
}
