/**
 * IndexNow - protocole gratuit qui notifie instantanément Bing, Yandex,
 * Seznam, Naver et DuckDuckGo (via Bing) qu'une URL doit être crawlée.
 * Pas supporté par Google.
 *
 * https://www.indexnow.org/documentation
 *
 * Comment ça marche :
 *   1. On héberge un fichier `<KEY>.txt` à la racine du site contenant la clé.
 *   2. On POST une liste d'URLs au endpoint api.indexnow.org/IndexNow.
 *   3. Les moteurs vérifient la clé sur notre site puis crawlent les URLs.
 */

import { SITE_URL } from "./siteUrl";

// Clé statique - doit correspondre au nom du fichier dans public/<KEY>.txt.
// Si tu changes cette clé, renomme aussi le fichier public/.
export const INDEXNOW_KEY = "a7c4f8b2d9e3a16c5b8f2d4e7a1c9b3f";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";
// IndexNow plafonne à 10 000 URLs par requête.
const MAX_URLS_PER_REQUEST = 10_000;

export type IndexNowResult = {
  ok: boolean;
  submitted: number;
  batches: number;
  statuses: number[];
  errors: string[];
};

/**
 * Extrait le host (sans protocole, sans slash final) depuis SITE_URL.
 * IndexNow exige `host` au format "www.exemple.com".
 */
function getHost(): string {
  return SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function getKeyLocation(): string {
  return `${SITE_URL}/${INDEXNOW_KEY}.txt`;
}

/**
 * Soumet une liste d'URLs à IndexNow, en batchs de 10 000 URLs max.
 * Seules les URLs appartenant au domaine SITE_URL sont autorisées par
 * le protocole - on filtre côté client pour éviter un rejet 422 du serveur.
 */
export async function submitToIndexNow(urls: string[]): Promise<IndexNowResult> {
  const host = getHost();
  const allowed = urls.filter((u) => {
    try {
      const parsed = new URL(u);
      return parsed.host === host;
    } catch {
      return false;
    }
  });

  if (allowed.length === 0) {
    return { ok: true, submitted: 0, batches: 0, statuses: [], errors: [] };
  }

  const batches: string[][] = [];
  for (let i = 0; i < allowed.length; i += MAX_URLS_PER_REQUEST) {
    batches.push(allowed.slice(i, i + MAX_URLS_PER_REQUEST));
  }

  const statuses: number[] = [];
  const errors: string[] = [];
  let submitted = 0;

  for (const batch of batches) {
    try {
      const res = await fetch(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Accept: "application/json",
        },
        body: JSON.stringify({
          host,
          key: INDEXNOW_KEY,
          keyLocation: getKeyLocation(),
          urlList: batch,
        }),
      });
      statuses.push(res.status);
      // IndexNow renvoie :
      //   200 OK              - URLs reçues
      //   202 Accepted        - clé en cours de vérification (1er appel)
      //   400/403/422/429    - erreurs côté requête
      if (res.ok || res.status === 202) {
        submitted += batch.length;
      } else {
        const text = await res.text().catch(() => "");
        errors.push(`HTTP ${res.status} ${res.statusText} ${text}`.trim());
      }
    } catch (err) {
      statuses.push(0);
      errors.push((err as Error).message || "fetch failed");
    }
  }

  return {
    ok: errors.length === 0,
    submitted,
    batches: batches.length,
    statuses,
    errors,
  };
}
