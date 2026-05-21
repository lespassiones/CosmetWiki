// Standalone test of the Mistral streaming path used by the Beauty Advisor
// fallback. Replicates `streamMistralChat` from
// app/api/advisor/chat/route.ts but writes chunks to stdout instead of a
// ReadableStreamDefaultController so we can run it from the CLI.
//
// Usage:  node --env-file=.env scripts/test-mistral-stream.mjs

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
if (!MISTRAL_API_KEY) {
  console.error("MISTRAL_API_KEY missing - run with `node --env-file=.env ...`");
  process.exit(1);
}

const SYSTEM = `Tu es un assistant cosmétique factuel pour Cosme Check. Tu réponds à un consommateur français à partir de FAITS et UNIQUEMENT à partir de faits. Style : phrases courtes, ton calme, pas d'emoji.`;

const MESSAGES = [
  { role: "user", content: "C'est quoi le panthénol ? Réponds en 2 phrases max." },
];

async function streamMistralChat({ system, messages }) {
  const t0 = Date.now();
  const resp = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      temperature: 0.4,
      max_tokens: 600,
      stream: true,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });

  console.log(`[META] status=${resp.status} ttfb=${Date.now() - t0}ms`);
  if (!resp.ok || !resp.body) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Mistral ${resp.status}: ${body.slice(0, 200)}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let tokensIn = 0;
  let tokensOut = 0;
  let chunks = 0;
  let chars = 0;

  process.stdout.write("[OUT] ");
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nl;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") {
        process.stdout.write("\n");
        console.log(`[META] chunks=${chunks} chars=${chars} tokensIn=${tokensIn} tokensOut=${tokensOut} total=${Date.now() - t0}ms`);
        return { tokensIn, tokensOut };
      }
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          const clean = delta.replace(/\s*[-–]\s*/g, ", ");
          process.stdout.write(clean);
          chunks++;
          chars += clean.length;
        }
        if (parsed.usage) {
          tokensIn = parsed.usage.prompt_tokens ?? 0;
          tokensOut = parsed.usage.completion_tokens ?? 0;
        }
      } catch {
        // skip malformed
      }
    }
  }
  process.stdout.write("\n");
  console.log(`[META] (no [DONE]) chunks=${chunks} chars=${chars} total=${Date.now() - t0}ms`);
  return { tokensIn, tokensOut };
}

try {
  const usage = await streamMistralChat({ system: SYSTEM, messages: MESSAGES });
  console.log("[OK]", usage);
  process.exit(0);
} catch (err) {
  console.error("[FAIL]", err.message);
  process.exit(1);
}
