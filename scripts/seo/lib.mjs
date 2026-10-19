/**
 * Outils communs aux scripts du robot SEO (`scripts/seo/*.mjs`).
 *
 * Chaque matin, une session Claude lance ces scripts pour decider quel article
 * ecrire et lequel retravailler. Elle lit leurs fichiers JSON et leur resume
 * markdown : tout ce qui sort d'ici doit donc etre stable d'un jour a l'autre,
 * date en heure de Paris, et ne jamais contenir un secret.
 *
 * Porte depuis `Memory-Pilot-Web/scripts/seo/lib.mjs`, lui-meme jumeau de
 * `RevealChat-Web/scripts/seo/lib.mjs` : memes noms de fonctions, meme forme
 * de sortie, pour que la doctrine du robot se porte telle quelle d'un site a
 * l'autre.
 *
 * ## Pourquoi un module partage
 *
 * Trois choses doivent etre faites de la meme facon partout, sinon les fichiers
 * de deux scripts ne se recoupent plus :
 *
 * - le `.env` central se lit avec un seul parseur. Deux lectures du meme
 *   fichier qui divergeraient sur les guillemets produiraient deux verites ;
 * - un jour est un jour de Paris. Le site, PostHog (fuseau du projet) et les
 *   requetes Supabase decoupent tous a minuit Paris, et c'est ce qui permet
 *   d'aligner les series pour les correlations ;
 * - aucune valeur de cle ne sort, meme dans un message d'erreur relaye. Une API
 *   qui renvoie l'en-tete recu dans son corps d'erreur suffirait a en publier
 *   une dans `docs/`, qui est suivi par git.
 *
 * ## Le `.env` du depot, ignore par git
 *
 * Cosme Check n'a pas de `.env` central hors depot comme RevealChat et
 * MemoryPilot : ses cles vivent dans `C:\Projet\CosmetWiki\.env`, que
 * `.gitignore` ecarte (`.env*`, verifie le 19/10/2026 avec `git check-ignore`).
 * Le parseur est celui de RevealChat, recopie a l'identique. Les variables du
 * robot (PostHog, Search Console, App Store Connect) y ont ete ajoutees a la
 * fin, sous un commentaire qui le dit.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Le `.env` de Cosme Check. `COSMECHECK_ENV` permet de pointer ailleurs (une
 * autre machine, un test), sans jamais toucher au depot.
 */
export const CENTRAL = process.env.COSMECHECK_ENV || 'C:/Projet/CosmetWiki/.env';

/**
 * Racine du depot CosmetWiki, quel que soit le dossier d'ou le script est lance.
 *
 * ⚠️ `fileURLToPath` et pas `new URL(...).pathname` : sur Windows, `pathname`
 * rend `/C:/...` et encode les espaces en `%20` (lecon de MemoryPilot).
 */
export const RACINE = fileURLToPath(new URL('../../', import.meta.url));

/** Dossier du `.env` central : les chemins relatifs qu'il contient partent de la. */
export const DOSSIER_CENTRAL = path.dirname(CENTRAL);

export const SITE = 'https://www.cosme-check.com';

/** Annonce qui appelle, pour que chaque service puisse nous identifier et nous joindre. */
export const UA = 'CosmeCheck-robot/1.0 (+https://www.cosme-check.com)';

/**
 * Un User-Agent de navigateur, pour les appels a notre propre site.
 *
 * ⚠️ `middleware.ts` renvoie 403 a toute requete sans User-Agent, et aux
 * clients qui se disent `curl`, `wget`, `node-fetch`, `axios`… sur `/api/`.
 * On se presente en navigateur pour verifier exactement ce que voit un
 * visiteur.
 */
export const UA_NAVIGATEUR =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

/**
 * Lit un fichier `.env` : `CLE=valeur`, commentaires `#`, guillemets retires.
 *
 * Meme parseur que `RevealChat-Web/scripts/env.mjs`, volontairement. Un fichier
 * absent rend un objet vide : chaque source dira alors quelle variable lui
 * manque, au lieu d'un plantage au demarrage qui couperait toutes les autres.
 */
export function lire(chemin = CENTRAL) {
  if (!fs.existsSync(chemin)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(chemin, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
      .map((l) => [
        l.slice(0, l.indexOf('=')).trim(),
        l
          .slice(l.indexOf('=') + 1)
          .trim()
          .replace(/^["']|["']$/g, ''),
      ]),
  );
}

let env;

/** Le `.env` central, lu une seule fois par execution. */
export function lireEnv() {
  if (!env) env = lire(CENTRAL);
  return env;
}

/** Resout un chemin du `.env` central : absolu tel quel, relatif depuis son dossier. */
export function cheminCentral(valeur) {
  if (!valeur) return null;
  return path.isAbsolute(valeur) ? valeur : path.join(DOSSIER_CENTRAL, valeur);
}

/* ---------------------------------------------------------------- secrets */

/**
 * Secrets qui ne sont pas dans le `.env` mais dans un fichier qu'il designe :
 * la cle privee du compte de service Google, par exemple. Le script qui les
 * lit les declare ici pour que `masquer` les connaisse aussi.
 */
const secretsSupplementaires = new Set();

export function declarerSecret(valeur) {
  if (typeof valeur === 'string' && valeur.length >= 12) secretsSupplementaires.add(valeur);
}

/**
 * Formes reconnaissables de secret, masquees meme si leur valeur exacte n'est
 * dans aucun fichier : un jeton qu'une API renverrait dans son message
 * d'erreur, une cle d'un autre projet. C'est le filet sous `masquer`, pas la
 * protection principale. Les trois premieres correspondent a ce que la
 * relecture cherche (`phx_`, `eyJ`, `-----BEGIN`).
 */
const FORMES_SECRETES = [
  /-----BEGIN [A-Z ]+-----[\s\S]*?-----END [A-Z ]+-----/g,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
  /\bph[xc]_[A-Za-z0-9]{20,}/g,
  /\bsb_secret_[A-Za-z0-9_-]{10,}/g,
  /\bsk-[A-Za-z0-9_-]{20,}/g,
];

/**
 * Les variables du `.env` central qui ne sont pas des secrets et que les
 * fichiers doivent pouvoir citer : la propriete Search Console, les
 * identifiants publics. Tout le reste est masque par defaut, y compris une
 * variable ajoutee demain dont personne n'aura pense a dire qu'elle est secrete.
 */
const PUBLIQUES = new Set([
  'GSC_SITE',
  'POSTHOG_HOST',
  'POSTHOG_PROJECT_ID',
  'NEXT_PUBLIC_POSTHOG_HOST',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SITE_URL',
  'APPLE_ASC_KEY_ID',
  'SUPABASE_URL',
  'SUPABASE_PROJECT_REF',
  'APPLE_APP_STORE_ID',
]);

/**
 * Remplace toute valeur du `.env` central presente dans un texte.
 *
 * Seules les valeurs assez longues pour etre des secrets sont cherchees : un
 * identifiant de trois caracteres masque partout rendrait les messages
 * illisibles sans rien proteger. Les adresses ne sont pas des secrets.
 */
export function masquer(texte) {
  let sortie = String(texte ?? '');
  const valeurs = Object.entries(lireEnv())
    .filter(([cle]) => !PUBLIQUES.has(cle))
    .map(([, valeur]) => valeur);
  for (const valeur of [...valeurs, ...secretsSupplementaires]) {
    if (valeur.length < 12 || /^https?:\/\//.test(valeur)) continue;
    sortie = sortie.split(valeur).join('[masque]');
  }
  for (const forme of FORMES_SECRETES) sortie = sortie.replace(forme, '[masque]');
  return sortie;
}

/* ------------------------------------------------------------------ dates */

const FORMAT_PARIS = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function partiesParis(date) {
  return Object.fromEntries(FORMAT_PARIS.formatToParts(date).map((x) => [x.type, x.value]));
}

/** Jour de Paris au format AAAA-MM-JJ. `formatToParts` plutot qu'une locale qui « tombe » sur ce format. */
export function jourParis(date = new Date()) {
  const p = partiesParis(date);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Date et heure de Paris, pour l'affichage : AAAA-MM-JJ HH:MM. */
export function heureParis(date = new Date()) {
  const p = partiesParis(date);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

/**
 * L'instant UTC de minuit, heure de Paris, au debut d'un jour AAAA-MM-JJ.
 *
 * Paris est a UTC+1 l'hiver et UTC+2 l'ete : on part de l'hypothese +2 et on
 * corrige d'une heure si le jour de Paris obtenu n'est pas le bon. Les deux
 * bascules d'heure tombent un dimanche a 2 h ou 3 h du matin, jamais a minuit,
 * donc minuit existe toujours et une seule fois.
 */
export function minuitParis(jour) {
  for (const decalageH of [2, 1]) {
    const t = new Date(Date.parse(`${jour}T00:00:00Z`) - decalageH * 3600000);
    const p = partiesParis(t);
    if (`${p.year}-${p.month}-${p.day}` === jour && p.hour === '00' && p.minute === '00') return t;
  }
  throw new Error(`minuit de Paris introuvable pour ${jour}`);
}

/**
 * Ajoute n jours a un jour AAAA-MM-JJ.
 *
 * Le calcul se fait a midi UTC : aucun changement d'heure ne peut faire sauter
 * ou doubler un jour, ce qui arrive avec minuit local deux fois par an.
 */
export function decaler(jour, n) {
  const d = new Date(`${jour}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Tous les jours de `debut` a `fin`, bornes comprises. */
export function joursEntre(debut, fin) {
  const jours = [];
  for (let j = debut; j <= fin; j = decaler(j, 1)) jours.push(j);
  return jours;
}

export function estJour(texte) {
  return /^\d{4}-\d{2}-\d{2}$/.test(texte ?? '');
}

/* --------------------------------------------------------------- fichiers */

/** Ecrit un JSON lisible, en creant les dossiers manquants. */
export function ecrireJson(chemin, valeur) {
  fs.mkdirSync(path.dirname(chemin), { recursive: true });
  fs.writeFileSync(chemin, `${JSON.stringify(valeur, null, 2)}\n`, 'utf8');
}

/** Lit un JSON, ou rend `defaut` s'il est absent ou illisible. */
export function lireJson(chemin, defaut) {
  try {
    return JSON.parse(fs.readFileSync(chemin, 'utf8'));
  } catch {
    return defaut;
  }
}

/** Chemin relatif a la racine du depot, en barres obliques : c'est ce que lit le modele. */
export function relatif(chemin) {
  return path.relative(RACINE, chemin).split(path.sep).join('/');
}

/* ------------------------------------------------------------ ligne de cmd */

/** Valeur de `--nom valeur`, ou `defaut`. */
export function option(args, nom, defaut) {
  const i = args.indexOf(`--${nom}`);
  if (i === -1 || i + 1 >= args.length) return defaut;
  return args[i + 1];
}

/** Arguments qui ne sont ni une option ni la valeur d'une option. */
export function positionnels(args, optionsAValeur = []) {
  const sortie = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith('--')) {
      if (optionsAValeur.includes(args[i].slice(2))) i += 1;
      continue;
    }
    sortie.push(args[i]);
  }
  return sortie;
}

/**
 * Rend son chemin de site a un argument que Git Bash a converti.
 *
 * ⚠️ Lance depuis Git Bash, `node script.mjs /blog/x` recoit
 * `C:/Program Files/Git/blog/x` : MSYS prend tout argument qui commence par une
 * barre pour un chemin de fichier et le traduit. Le robot peut tourner dans ce
 * shell. Un chemin Windows absolu ne pouvant jamais etre une adresse du site,
 * on retire la racine MSYS quand on la reconnait, et on refuse sinon.
 */
export function cheminSite(argument) {
  if (!/^[A-Za-z]:[\\/]/.test(argument)) return argument;
  const brut = argument.replace(/\\/g, '/');
  const racines = [];
  if (process.env.EXEPATH) {
    const exe = process.env.EXEPATH.replace(/\\/g, '/').replace(/\/$/, '');
    racines.push(exe.replace(/\/(usr\/)?bin$/i, ''), exe);
  }
  racines.push('C:/Program Files/Git');
  for (const racine of racines) {
    if (brut.toLowerCase().startsWith(`${racine.toLowerCase()}/`)) return brut.slice(racine.length);
  }
  throw new Error(
    `« ${argument} » est un chemin Windows. Git Bash a converti l'argument : ` +
      `passer l'adresse complete (${SITE}/...) ou lancer avec MSYS_NO_PATHCONV=1.`,
  );
}

export const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/* ----------------------------------------------------------------- reseau */

/**
 * `fetch` avec un delai maximal et notre User-Agent.
 *
 * Sans delai, un service qui ne repond pas bloque le robot du matin jusqu'a ce
 * que la session soit coupee, et les autres sources ne sont jamais lues.
 */
export async function requete(url, init = {}, delaiMs = 30000) {
  return fetch(url, {
    ...init,
    headers: { 'User-Agent': UA, ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(delaiMs),
  });
}

/** Message d'erreur court et sans secret, pour le champ `erreurs` des fichiers. */
export function messageErreur(e) {
  const brut = e?.cause?.code ? `${e.message} (${e.cause.code})` : (e?.message ?? String(e));
  return masquer(brut).slice(0, 400);
}

/** Arrondi a n decimales, `null` conserve. */
export function arrondi(x, n = 2) {
  if (x === null || x === undefined || Number.isNaN(x)) return null;
  const f = 10 ** n;
  return Math.round(x * f) / f;
}
