/**
 * Splitter INCI assisté par GPT-4o-mini.
 *
 * Cas d'usage : l'utilisateur colle une liste recopiée d'une étiquette
 * physique sans virgules ("AQUA / WATER / EAU DIMETHICONE CETEARYL
 * ALCOHOL PHENOXYETHANOL POLYQUATERNIUM-37 PARFUM…"). Le parser local
 * (lib/inciParser.ts) split sur , ; \n et / entourés d'espaces, donc il
 * échoue sur ce format et ne sort que 2-3 tokens géants.
 *
 * Stratégie : on appelle GPT-4o-mini avec instruction stricte "ré-insère
 * une virgule entre chaque ingrédient, n'INVENTE rien". Le résultat est
 * une chaîne formatée "Aqua, Water, Eau, Dimethicone, ..." que le parser
 * standard peut ensuite tokeniser correctement.
 */
import { hasOpenAI, openai } from "./client";

const SPLIT_TIMEOUT_MS = 10_000;

export async function splitInciWithGpt(rawText: string): Promise<string | null> {
  if (!hasOpenAI()) return null;
  const text = rawText.trim();
  if (text.length < 20 || text.length > 6000) return null;

  const prompt = `Tu reçois une liste INCI cosmétique collée par un utilisateur sans virgules entre les ingrédients (texte recopié d'une étiquette physique ou OCR'd). Ré-insère UNE virgule entre chaque ingrédient distinct.

Règles strictes :
- N'INVENTE AUCUN ingrédient. Ne reformule pas. Garde la casse d'origine si possible.
- Les noms multilingues séparés par "/" (ex : "AQUA / WATER / EAU") sont des SYNONYMES du MÊME ingrédient — garde-les groupés (ou choisis la première forme), ne les sépare PAS en plusieurs ingrédients.
- Les noms INCI composés avec slash sans espace (ex : "DICAPRYLATE/DICAPRATE", "CAPRYLIC/CAPRIC TRIGLYCERIDE") sont UN SEUL ingrédient.
- Les marqueurs de concentration (0.12%, 1%) restent attachés au nom.
- Renvoie UNIQUEMENT la liste séparée par virgules, sans commentaire, sans préambule.
- Si tu ne reconnais pas le format ou que ce n'est pas une INCI, réponds NONE.

Texte brut :
"""
${text}
"""`;

  try {
    const r = await Promise.race([
      openai().chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("split_timeout")), SPLIT_TIMEOUT_MS),
      ),
    ]);
    const out = (r.choices?.[0]?.message?.content ?? "").trim();
    if (!out || out.toUpperCase() === "NONE") return null;
    // Sanity check : la réponse doit contenir au moins 3 virgules, sinon
    // GPT n'a pas réellement splitté la liste.
    if ((out.match(/,/g) || []).length < 3) return null;
    return out;
  } catch {
    return null;
  }
}
