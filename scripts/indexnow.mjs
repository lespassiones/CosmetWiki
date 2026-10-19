/**
 * Prévenir les moteurs qu'une page a changé, sans attendre leur passage.
 *
 * IndexNow est le protocole que Bing, Yandex, Naver et Seznam partagent : une
 * requête, la liste des adresses, et le moteur passe dans l'heure au lieu de
 * revenir quand il l'avait prévu. Bing compte double ici, parce qu'il alimente
 * aussi DuckDuckGo, Copilot et la recherche de ChatGPT. Google ne le suit pas :
 * pour lui, c'est le sitemap déclaré dans la Search Console qui fait foi.
 *
 * ⚠️ **La clé est publique par construction.** Le protocole vérifie qu'on
 * possède le domaine en allant lire `https://www.cosme-check.com/<clé>.txt` (`public/a7c4f8b2d9e3a16c5b8f2d4e7a1c9b3f.txt`, la même que `lib/indexnow.ts`), donc la
 * poser dans `public/` n'expose rien. Il n'y a rien à cacher, il n'y a qu'à la
 * garder stable : la changer, c'est repartir de zéro chez chaque moteur.
 *
 *   npm run indexnow                    toutes les adresses du sitemap en ligne
 *   npm run indexnow -- /blog/mon-slug  une ou plusieurs adresses seulement
 *   npm run indexnow -- <adresses> --dry-run
 *                                       vérifie tout (clé en ligne comprise), n'envoie rien
 *
 * ⚠️ **L'hôte annoncé est celui des adresses envoyées.** Le site répond sur
 * `www.cosme-check.com` et `cosme-check.com` y redirige : annoncer des adresses
 * `www` sous l'hôte `cosme-check.com` fait refuser l'envoi entier (le protocole
 * exige que chaque adresse appartienne à l'hôte déclaré, et que la clé se lise
 * sur ce même hôte). Les adresses données en entier fixent donc l'hôte et
 * l'emplacement de la clé ; les chemins nus et le sitemap gardent `SITE.url`. Porté de MemoryPilot.
 * Un seul hôte par envoi : le protocole n'en accepte pas deux.
 */

import { readdirSync } from 'node:fs';
const SITE = { url: 'https://www.cosme-check.com' };

const cle = readdirSync('public')
  .map((f) => /^([0-9a-f]{32})\.txt$/.exec(f)?.[1])
  .find(Boolean);

if (!cle) {
  console.error(
    'Aucune clé IndexNow dans public/ : il faut un fichier <32 caractères hexadécimaux>.txt.',
  );
  process.exit(1);
}

const aBlanc = process.argv.includes('--dry-run');
const demandees = process.argv.slice(2).filter((a) => a !== '--dry-run');
let adresses;
if (demandees.length) {
  adresses = demandees.map((a) => (a.startsWith('http') ? a : SITE.url + a));
} else {
  const plan = await (await fetch(`${SITE.url}/sitemap.xml`)).text();
  adresses = [...plan.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

if (!adresses.length) {
  console.error('Aucune adresse à envoyer.');
  process.exit(1);
}

const origines = [...new Set(adresses.map((a) => new URL(a).origin))];
if (origines.length > 1) {
  console.error(`IndexNow n'accepte qu'un hôte par envoi, ici ${origines.join(' et ')}. Envoyer en deux fois.`);
  process.exit(1);
}
const origine = origines[0];
const corps = {
  host: new URL(origine).host,
  key: cle,
  keyLocation: `${origine}/${cle}.txt`,
  urlList: adresses,
};

if (aBlanc) {
  // À blanc : rien ne part chez IndexNow, mais la clé doit se lire là où on la déclare.
  const r = await fetch(corps.keyLocation, { redirect: 'manual' });
  const lue = r.status === 200 ? (await r.text()).trim() : '';
  const cleOk = lue === cle;
  console.log(
    `À blanc : ${adresses.length} adresses pour l'hôte ${corps.host}, rien n'est envoyé.` +
      `\nClé ${corps.keyLocation} : ${cleOk ? 'en ligne et conforme' : `INTROUVABLE (HTTP ${r.status})`}`,
  );
  for (const a of adresses) console.log('  ' + a);
  process.exitCode = cleOk ? 0 : 1;
} else {
  const reponse = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(corps),
  });

  console.log(
    `${adresses.length} adresses envoyées pour l'hôte ${corps.host}, réponse ${reponse.status} ${reponse.statusText}`,
  );
  for (const a of adresses) console.log('  ' + a);
  // `exitCode` et pas `process.exit()` : appelé juste après un `fetch`, ce
  // dernier fait planter Node sous Windows (libuv, code 127) au lieu de rendre
  // le code voulu. Leçon relevée dans `RevealChat-Web/scripts/seo/photo.mjs`.
  process.exitCode = reponse.ok ? 0 : 1;
}
