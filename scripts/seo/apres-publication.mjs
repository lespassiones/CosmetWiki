/**
 * Apres un push : attend que les pages soient en ligne, puis les annonce a IndexNow.
 *
 *   npm run seo:publie -- https://www.cosme-check.com/blog/<slug>
 *   npm run seo:publie -- /blog/<slug>
 *   npm run seo:publie -- /blog/<slug> --contient "Mis a jour le 19 octobre"
 *   npm run seo:publie -- /blog/<slug> --dry-run
 *   npm run seo:publie -- /blog/<slug> --minutes 20
 *
 * Porte depuis `Memory-Pilot-Web/scripts/seo/apres-publication.mjs` (venu de RevealChat). L'annonce
 * elle-meme est faite par `scripts/indexnow.mjs`, avec la cle de `public/` :
 * ce script ne fait qu'attendre, puis lui passer ce qui est en ligne.
 *
 * `--dry-run` attend les pages pour de vrai, puis passe le meme drapeau a
 * `indexnow.mjs`, qui verifie que la cle est en ligne et n'envoie rien.
 *
 * ## Pourquoi attendre
 *
 * Annoncer une page avant qu'elle soit en ligne fait explorer une 404, que le
 * moteur retient. Or un push sur main ne met la page en ligne qu'une fois le
 * deploiement Vercel termine, une a quelques minutes plus tard. Ce script
 * interroge donc chaque adresse toutes les 20 secondes, 12 minutes au plus
 * (`--minutes` pour changer), et n'annonce que ce qui repond 200.
 *
 * ## `--contient` pour un article retravaille
 *
 * Une page qui existait deja repond 200 tout de suite, avec l'ancienne
 * version. L'annoncer a ce moment ferait relire l'ancien texte, et gacherait
 * la seule chose qu'IndexNow apporte : la fraicheur. Avec `--contient`, une
 * page ne compte comme en ligne que si son HTML contient ce texte, a choisir
 * dans ce qui vient d'etre ajoute (un titre de section, une phrase neuve).
 *
 * ## Exactement l'adresse servie
 *
 * Le site repond sur `https://www.cosme-check.com`, sans barre finale ;
 * `cosme-check.com` y redirige. Les adresses recues sont ramenees a cette
 * forme (hote `www`, barre finale retiree), puis les redirections ne sont pas
 * suivies : on n'annonce jamais une autre adresse que celle qui repond 200, et
 * une redirection restante est signalee comme un echec.
 *
 * La derniere ligne, `Bilan :`, resume tout pour le robot. Sort 1 si une page
 * n'est jamais en ligne (les autres sont quand meme annoncees) ou si IndexNow
 * refuse, 2 si la commande est mal formee.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import {
  RACINE,
  SITE,
  cheminSite,
  heureParis,
  messageErreur,
  option,
  pause,
  positionnels,
  requete,
} from './lib.mjs';

const INTERVALLE_MS = 20 * 1000;

const args = process.argv.slice(2);
const contient = option(args, 'contient', null);
const aBlanc = args.includes('--dry-run');
const minutes = Number.parseFloat(option(args, 'minutes', '12'));
const demandes = positionnels(args, ['contient', 'minutes']);

/** Les hotes qui designent ce site ; tous sont ramenes a `SITE`. */
const HOTES = new Set([new URL(SITE).host, new URL(SITE).host.replace(/^www\./, '')]);

/** Un argument (adresse ou chemin) ramene au chemin servi : `/blog/x`, sans barre finale. */
function normaliser(argument) {
  let chemin = cheminSite(argument);
  if (/^https?:\/\//.test(chemin)) {
    const url = new URL(chemin);
    if (!HOTES.has(url.host)) throw new Error(`${argument} n'est pas sur ${SITE}`);
    chemin = url.pathname;
  }
  if (!chemin.startsWith('/')) chemin = `/${chemin}`;
  if (chemin.length > 1) chemin = chemin.replace(/\/+$/, '');
  return chemin;
}

/** Un essai sur une page : `{ ok, detail }`. */
async function verifier(chemin) {
  try {
    // Le parametre contourne un eventuel cache du CDN sur une ancienne 404.
    const r = await requete(
      `${SITE}${chemin}?verif=${Date.now()}`,
      { redirect: 'manual', headers: { 'Cache-Control': 'no-cache' } },
      20000,
    );
    if (r.status >= 300 && r.status < 400) {
      await r.body?.cancel();
      return { ok: false, detail: `${r.status} vers ${r.headers.get('location')}` };
    }
    if (r.status !== 200) {
      await r.body?.cancel();
      return { ok: false, detail: String(r.status) };
    }
    if (contient && !(await r.text()).includes(contient)) {
      return { ok: false, detail: '200 sans le texte attendu (ancienne version ?)' };
    }
    if (!contient) await r.body?.cancel();
    return { ok: true, detail: '200' };
  } catch (e) {
    return { ok: false, detail: messageErreur(e) };
  }
}

/** Lance `scripts/indexnow.mjs` et rend son code de sortie, en relayant ce qu'il dit. */
function lancerIndexNow(adresses) {
  return new Promise((resoudre) => {
    // `indexnow.mjs` lit `public/<cle>.txt` en relatif : il doit tourner depuis la racine du depot.
    const enfant = spawn(
      process.execPath,
      // Sans l'avertissement de Node sur les `.ts` relus en module : du bruit dans la sortie du robot.
      [
        '--disable-warning=MODULE_TYPELESS_PACKAGE_JSON',
        path.join('scripts', 'indexnow.mjs'),
        ...adresses,
        ...(aBlanc ? ['--dry-run'] : []),
      ],
      { cwd: RACINE, stdio: 'inherit' },
    );
    enfant.on('close', (code) => resoudre(code ?? 1));
    enfant.on('error', () => resoudre(1));
  });
}

async function main() {
  if (demandes.length === 0 || !(minutes > 0)) {
    console.error(
      'Usage : apres-publication.mjs <adresse ou chemin> [...] [--contient "<texte>"] [--minutes 12] [--dry-run]',
    );
    return 2;
  }
  let chemins;
  try {
    chemins = [...new Set(demandes.map(normaliser))];
  } catch (e) {
    console.error(e.message);
    return 2;
  }

  const dureeMax = minutes * 60 * 1000;
  const debut = Date.now();
  const enLigne = [];
  const derniers = new Map();
  let attente = [...chemins];
  console.log(
    `${heureParis()} : attente de ${chemins.length} page(s) sur ${SITE}` +
      `${contient ? ` contenant « ${contient} »` : ''}, ${minutes} min au plus.`,
  );

  while (attente.length > 0) {
    const essais = await Promise.all(attente.map(async (c) => [c, await verifier(c)]));
    for (const [c, { ok, detail }] of essais) {
      derniers.set(c, detail);
      if (ok) enLigne.push(c);
    }
    attente = attente.filter((c) => !enLigne.includes(c));
    const ecoule = Math.round((Date.now() - debut) / 1000);
    console.log(
      `  +${ecoule} s : ${enLigne.length}/${chemins.length} en ligne` +
        (attente.length ? `, en attente : ${attente.map((c) => `${c} (${derniers.get(c)})`).join(', ')}` : ''),
    );
    if (attente.length === 0 || Date.now() - debut + INTERVALLE_MS > dureeMax) break;
    await pause(INTERVALLE_MS);
  }

  let code = 0;
  if (attente.length > 0) {
    console.log(`\nJamais en ligne apres ${minutes} min : ${attente.map((c) => `${c} (${derniers.get(c)})`).join(', ')}`);
    console.log('Ces pages ne sont pas annoncees. Verifier le deploiement Vercel puis relancer pour elles.');
    code = 1;
  }
  let indexNow = 'rien a annoncer';
  if (enLigne.length > 0) {
    console.log(`\nAnnonce IndexNow de ${enLigne.length} page(s)${aBlanc ? ' (a blanc)' : ''} :`);
    const codeIndexNow = await lancerIndexNow(enLigne.map((c) => `${SITE}${c}`));
    indexNow = codeIndexNow === 0 ? (aBlanc ? 'a blanc, cle verifiee' : 'acceptee') : `en echec (code ${codeIndexNow})`;
    if (codeIndexNow !== 0) code = 1;
  }
  console.log(
    `\nBilan : ${enLigne.length}/${chemins.length} en ligne` +
      (attente.length ? ` (manquent : ${attente.join(', ')})` : '') +
      `, IndexNow ${indexNow}.`,
  );
  return code;
}

process.exitCode = await main();
