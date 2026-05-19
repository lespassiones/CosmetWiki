/**
 * Pré-validation des candidats web avant affichage à l'utilisateur.
 *
 * Problème : OpenAI Web Search renvoie des URLs vers des pages marchandes
 * (pharmacies en ligne, marketplaces) qui n'exposent pas TOUJOURS la liste
 * INCI dans leur HTML. L'utilisateur cliquait sur une carte et tombait sur
 * un 404 "composition introuvable" — frustrant.
 *
 * Solution : on tente l'extraction GPT en parallèle sur les N premiers
 * candidats, on ne garde que ceux qui ont effectivement une INCI. Coût :
 * 1 fetch + 1 call gpt-4o-mini par candidat testé (~$0.001).
 *
 * Trade-off latence : ~3-6 s ajoutés à la recherche initiale (les calls
 * partent en parallèle, max = le plus lent). Acceptable pour avoir 100 %
 * de cartes cliquables ensuite.
 */

import { fetchPageHtml } from "./httpFetch";
import { extractInciFromHtml } from "./extractWithMistral";
import type { DuckDuckGoCandidate } from "./duckduckgo";

const PER_CANDIDATE_TIMEOUT_MS = 6000;
const BATCH_SIZE = 8;

/**
 * Pré-valide jusqu'à `targetCount` candidats. Lance les vérifications en
 * parallèle par batch de `batchSize` pour ne pas saturer Vercel/Mistral si
 * la liste est longue. Retourne les candidats validés (avec leur INCI
 * extraite stockée à part) plus la liste des URLs qu'on a déjà essayées
 * sans succès, pour les exclure d'un futur batch.
 */
export type PrevalidatedCandidate = DuckDuckGoCandidate & {
  /** INCI extraite lors de la pré-validation. Réutilisable côté client
   *  pour éviter un second appel deep-fetch quand l'user clique. */
  ingredientsText: string;
};

export async function prevalidateCandidates(
  candidates: DuckDuckGoCandidate[],
  targetCount: number,
): Promise<{
  validated: PrevalidatedCandidate[];
  failedUrls: string[];
}> {
  const validated: PrevalidatedCandidate[] = [];
  const failedUrls: string[] = [];

  for (let i = 0; i < candidates.length && validated.length < targetCount; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (c) => {
        try {
          const html = await Promise.race([
            fetchPageHtml(c.url),
            new Promise<null>((resolve) =>
              setTimeout(() => resolve(null), PER_CANDIDATE_TIMEOUT_MS),
            ),
          ]);
          if (!html) return { candidate: c, inci: null };
          const label = [c.brand, c.productName].filter(Boolean).join(" ") || c.title;
          const inci = await extractInciFromHtml({ label, html });
          return { candidate: c, inci };
        } catch {
          return { candidate: c, inci: null };
        }
      }),
    );
    for (const r of results) {
      if (r.inci) {
        validated.push({ ...r.candidate, ingredientsText: r.inci });
        if (validated.length >= targetCount) break;
      } else {
        failedUrls.push(r.candidate.url);
      }
    }
  }

  return { validated, failedUrls };
}
