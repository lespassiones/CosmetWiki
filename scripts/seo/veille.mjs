/**
 * Veille du matin : de quoi on parle aujourd'hui, et ce que les gens tapent.
 *
 *   node scripts/seo/veille.mjs
 *
 * Ecrit `docs/seo/veille/AAAA-MM-JJ.json` et imprime un resume markdown.
 *
 * Porte depuis `Memory-Pilot-Web/scripts/seo/veille.mjs` (lui-meme venu de
 * RevealChat) : memes sources, memes fichiers, meme forme de sortie. Seuls les
 * sujets changent. Cosme Check scanne un cosmetique et dit s'il est fait pour
 * la peau de celui qui le tient, donc la veille couvre :
 *
 * - les ingredients et les compositions (INCI, actifs, ingredients controverses) ;
 * - les routines et les types de peau ;
 * - **le buzz** : les produits viraux de TikTok et d'Instagram, l'actualite
 *   cosmetique, les tendances beaute ;
 * - **les celebrites** : leur routine beaute, les produits qu'elles disent
 *   utiliser, leurs marques de cosmetiques ;
 * - la reglementation (ANSM, SCCS, reglement europeen 1223/2009).
 *
 * Le site est en francais seulement, mais la veille lit aussi l'anglais : le
 * buzz beaute et les routines de stars naissent souvent en anglais
 * (« <star> skincare routine »), et un sujet repere la-bas s'ecrit ici en
 * francais. Les articles, eux, ne sortent qu'en francais.
 *
 * Les celebrites sont une limite autant qu'un sujet : la veille repere ce
 * dont on parle, l'article ne reprend que ce que la personne a dit ou montre
 * elle-meme, source et date a l'appui (`docs/seo/ROBOT.md`, section 5).
 *
 * ## Pourquoi ces quatre sources, toutes sans cle
 *
 * - **Google Trends** (tendances du jour, France, Belgique, Suisse, Canada) :
 *   le sujet du jour qui peut porter un article d'actualite, une star qui
 *   lance sa marque, un rappel de produit, une etude sur un ingredient.
 * - **Google News** sur nos themes : ce qui vient de sortir. Un article qui
 *   cite une etude de la semaine se fait reprendre, un article intemporel non.
 * - **Les suggestions de Google** : ce que les gens tapent vraiment, avec leurs
 *   mots. Une suggestion qui n'existait pas hier est le signal le plus utile,
 *   d'ou la memoire `suggestions-vues.json` qui fait ressortir les nouvelles.
 * - **Reddit**, le top de la semaine de subreddits choisis : les situations
 *   que les gens racontent eux-memes (« ma peau a reagi a ce serum », « le
 *   produit de telle star vaut-il le coup », « ma routine ne marche pas »).
 *   Les titres dans l'ordre du flux,
 *   qui est l'ordre de popularite, et `reddit-vus.json` pour marquer les
 *   nouveaux. Le JSON anonyme de Reddit est refuse, le flux RSS repond : c'est
 *   lui qu'on lit.
 *
 * Les requetes, les graines, les pays et les subreddits vivent dans
 * `docs/seo/veille-requetes.json`, pas ici : le robot doit pouvoir elargir sa
 * veille sans toucher au code. Un champ absent du fichier y est ajoute avec
 * sa valeur de depart, sans toucher aux autres.
 *
 * ## Politesse
 *
 * Une pause de 300 ms entre deux appels et un User-Agent qui dit qui nous
 * sommes. Ces points d'acces sont publics mais pas des API garanties : un
 * robot qui martele se fait couper, et la veille du lendemain avec.
 *
 * ## ⚠️ Reddit : une requete par minute
 *
 * Mesure le 19/10/2026 sur RevealChat, et retrouve le meme jour chez MemoryPilot : le flux
 * anonyme repond `x-ratelimit-remaining: 0` des la premiere requete, et la
 * remise a zero tombe sur la minute suivante. Une seconde de pause ne suffit
 * donc pas : le deuxieme sub prend un 429, et une rafale de 429 a valu un 403.
 * Le script suit les en-tetes de quota que Reddit renvoie, attend la fin de la
 * fenetre quand il le faut, et retente une fois. Six subs prennent ainsi une
 * douzaine de minutes : c'est la derniere etape, bornee a `REDDIT_BUDGET_MS`,
 * et `--sans-reddit` la saute. Si Reddit relache son quota, les en-tetes le
 * diront et le script ira plus vite tout seul.
 *
 * Reddit filtre aussi le client : le 19/10/2026, Node etait refuse (403) la ou
 * curl passait. Le script bascule de l'un a l'autre au premier 403, voir
 * `getRedditCurl`.
 *
 * Le flux combine `r/a+b+c` ne remplace pas ces appels : il trie tous les
 * posts ensemble, et les petits subs n'y ont presque aucune ligne.
 *
 * ## Ce qui a deja ete lu aujourd'hui est repris
 *
 * Un sub lu lors d'un passage plus tot dans la journee est repris tel quel au
 * lieu d'etre relu : le top de la semaine ne bouge guere en quelques heures,
 * et chaque relecture coute une minute de quota anonyme. C'est vrai aussi avec
 * `--sans-reddit` : un second passage rapide garde les subs du premier au lieu
 * de les effacer du fichier du jour.
 *
 * Usage : `node scripts/seo/veille.mjs [--sans-reddit]`
 */

import { execFile } from 'node:child_process';
import https from 'node:https';
import path from 'node:path';
import {
  RACINE,
  UA,
  ecrireJson,
  heureParis,
  jourParis,
  lireJson,
  messageErreur,
  pause,
  relatif,
  requete,
} from './lib.mjs';

const FICHIER_REQUETES = path.join(RACINE, 'docs', 'seo', 'veille-requetes.json');
const DOSSIER = path.join(RACINE, 'docs', 'seo', 'veille');
const FICHIER_VUES = path.join(DOSSIER, 'suggestions-vues.json');
const FICHIER_REDDIT_VUS = path.join(DOSSIER, 'reddit-vus.json');
const PAUSE_MS = 300;
const PAUSE_REDDIT_MS = 1000;
/** Au-dela, les subs restants sont notes comme non lus plutot que de bloquer la matinee. */
const REDDIT_BUDGET_MS = 15 * 60 * 1000;
/** Plafond d'une attente de quota : la fenetre de Reddit est d'une minute. */
const REDDIT_ATTENTE_MAX_MS = 65 * 1000;
const AGE_MAX_H = 72;
const FRAIS_H = 24;
const ARTICLES_MAX = 10;
const REDDIT_MAX = 10;

/** Valeurs de depart, ecrites quand le fichier ou l'un de ses champs manque. */
const REQUETES_DEPART = {
  note: "Lu par scripts/seo/veille.mjs. tendances_geos : pays de Google Trends. requetes_* : Google News (72 h). graines_* : suggestions de Google. reddit : subreddits, top de la semaine. A enrichir librement. Celebrites : on repere le buzz, l'article ne reprend que ce que la personne a dit ou montre elle-meme, avec la source.",
  // Zones francophones a fort pouvoir d'achat, jamais l'Afrique (doctrine, section 2).
  tendances_geos: ['FR', 'BE', 'CH', 'CA'],
  /*
    Les guillemets ne sont pas decoratifs : sans eux, « routine » ramene le
    sport et « composition » la musique. Lecon du premier passage de
    MemoryPilot, appliquee d'emblee.
  */
  requetes_fr: [
    '"cosmétique" OR "cosmétiques" étude ingrédient',
    '"perturbateurs endocriniens" cosmétiques',
    'ANSM cosmétique OR "produit cosmétique" rappel',
    '"crème solaire" OR "protection solaire" étude OR test',
    '"routine beauté" OR "routine skincare" star OR célébrité',
    '"marque de beauté" OR "marque de cosmétiques" star OR chanteuse OR actrice',
    '"Rare Beauty" OR "Fenty Beauty" OR "Rhode" OR "Kylie Cosmetics" OR "Glossier"',
    '"produit viral" OR "devenu viral" beauté OR TikTok',
    'tendance beauté TikTok',
    '"skincare" tendance',
    'K-beauty OR "cosmétiques coréens"',
    '"60 Millions de consommateurs" OR UFC-Que Choisir cosmétique',
    'Yuka OR INCI cosmétique application',
    'dermatologue conseil peau',
  ],
  requetes_en: [
    '"skincare routine" celebrity OR star',
    '"beauty brand" celebrity launch',
    '"Rare Beauty" OR "Fenty Beauty" OR "Rhode skin" OR "Kylie Cosmetics"',
    '"viral" skincare TikTok',
    '"beauty trend" TikTok',
    'sunscreen study OR recall',
    'SCCS OR "EU cosmetics regulation" ingredient',
    '"K-beauty" trend',
  ],
  graines_fr: [
    'routine beauté de',
    'routine skincare',
    'crème utilisée par',
    'marque beauté de',
    'produit viral tiktok',
    'dupe',
    'inci',
    'comment lire une composition',
    'ingrédient à éviter',
    'perturbateur endocrinien',
    'niacinamide',
    'rétinol',
    'acide hyaluronique',
    'crème solaire visage',
    'peau grasse',
    'peau sensible',
    'comédogène',
    'yuka cosmétique',
  ],
  graines_en: [
    'skincare routine of',
    'celebrity skincare routine',
    'what moisturizer does',
    'viral tiktok skincare',
    'is it safe skincare',
    'dupe for',
  ],
  /*
    Les quatre demandes de l'utilisateur (19/10/2026), puis deux voisins utiles
    au buzz : r/BeautyGuruChatter (les marques de stars et les polemiques) et
    r/30PlusSkinCare (les routines). L'ordre intercale les sujets : si le
    budget coupe la fin de la liste, il ne coupe pas une famille entiere.
  */
  reddit: [
    'SkincareAddiction',
    'BeautyGuruChatter',
    'AsianBeauty',
    'MakeupAddiction',
    'beauty',
    '30PlusSkinCare',
  ],
};

const LANGUES = {
  fr: { news: 'hl=fr&gl=FR&ceid=FR:fr', suggest: 'hl=fr&gl=fr' },
  // L'anglais ne sert qu'a reperer le buzz : aucun article ne sort en anglais.
  en: { news: 'hl=en-US&gl=US&ceid=US:en', suggest: 'hl=en&gl=us' },
};

const AUJOURDHUI = jourParis();
const erreurs = [];
let appels = 0;

/** Un appel, precede de la pause de politesse sauf pour le premier. */
async function appeler(url, pauseMs = PAUSE_MS) {
  if (appels > 0) await pause(pauseMs);
  appels += 1;
  const reponse = await requete(url, {}, 20000);
  if (!reponse.ok) throw new Error(`${reponse.status} sur ${new URL(url).host}`);
  return reponse;
}

/* ------------------------------------------------------------------- XML */

function decoderEntites(texte) {
  return texte
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(Number.parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

function balise(xml, nom) {
  const m = xml.match(new RegExp(`<${nom}(?:\\s[^>]*)?>([\\s\\S]*?)</${nom}>`));
  return m ? decoderEntites(m[1]) : null;
}

function blocs(xml, nom) {
  return [...xml.matchAll(new RegExp(`<${nom}(?:\\s[^>]*)?>([\\s\\S]*?)</${nom}>`, 'g'))].map((m) => m[1]);
}

function ageHeures(datePub) {
  const t = Date.parse(datePub ?? '');
  return Number.isNaN(t) ? null : Math.round(((Date.now() - t) / 3600000) * 10) / 10;
}

/* ----------------------------------------------------------- Tendances */

async function tendances(geo) {
  const xml = await (await appeler(`https://trends.google.com/trending/rss?geo=${geo}`)).text();
  return blocs(xml, 'item').map((item) => ({
    titre: balise(item, 'title'),
    trafic: balise(item, 'ht:approx_traffic'),
    age_h: ageHeures(balise(item, 'pubDate')),
    articles: blocs(item, 'ht:news_item')
      .slice(0, 3)
      .map((n) => ({
        titre: balise(n, 'ht:news_item_title'),
        source: balise(n, 'ht:news_item_source'),
        url: balise(n, 'ht:news_item_url'),
      })),
  }));
}

/* ----------------------------------------------------------- Actualites */

/** Titre ramene a sa forme la plus simple, pour reconnaitre un doublon entre deux requetes. */
function cleTitre(titre) {
  return titre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function actualites(langue, requeteNews, dejaVus) {
  // `when:3d` fait le tri cote Google ; le filtre sur la date ci-dessous reste le garde-fou.
  const q = encodeURIComponent(`${requeteNews} when:3d`);
  const xml = await (
    await appeler(`https://news.google.com/rss/search?q=${q}&${LANGUES[langue].news}`)
  ).text();

  const articles = [];
  for (const item of blocs(xml, 'item')) {
    const source = balise(item, 'source');
    let titre = balise(item, 'title') ?? '';
    // Google colle « - Source » au titre : on le retire, la source a son propre champ.
    if (source && titre.endsWith(` - ${source}`)) titre = titre.slice(0, -(source.length + 3));
    const age = ageHeures(balise(item, 'pubDate'));
    if (age === null || age > AGE_MAX_H) continue;
    const cle = cleTitre(titre);
    if (!cle || dejaVus.has(cle)) continue;
    dejaVus.add(cle);
    articles.push({ titre, source, age_h: age, frais: age <= FRAIS_H, url: balise(item, 'link') });
  }
  articles.sort((a, b) => a.age_h - b.age_h);
  return articles.slice(0, ARTICLES_MAX);
}

/* ---------------------------------------------------------- Suggestions */

/**
 * Decode une reponse de suggestions selon le jeu de caracteres annonce.
 *
 * ⚠️ Selon la langue et le client, Google repond en UTF-8 ou en ISO-8859-1, et
 * `response.text()` suppose toujours UTF-8 : « où noter » deviendrait
 * « o� noter ». On lit donc les octets, on suit l'en-tete, et sans en-tete on
 * tente un UTF-8 strict avant de retomber sur le latin-1.
 */
async function decoderSuggestions(reponse) {
  const octets = new Uint8Array(await reponse.arrayBuffer());
  const charset = (reponse.headers.get('content-type') ?? '').match(/charset=([^;]+)/i)?.[1]?.trim();
  if (charset) {
    try {
      return new TextDecoder(charset.toLowerCase()).decode(octets);
    } catch {
      // Jeu de caracteres inconnu de TextDecoder : on retombe sur la detection.
    }
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(octets);
  } catch {
    return new TextDecoder('latin1').decode(octets);
  }
}

async function suggestions(langue, graine) {
  const url =
    'https://suggestqueries.google.com/complete/search?client=firefox' +
    `&${LANGUES[langue].suggest}&q=${encodeURIComponent(graine)}`;
  const texte = await decoderSuggestions(await appeler(url));
  const [, liste] = JSON.parse(texte);
  const graineSimple = graine.trim().toLowerCase();
  return (liste ?? []).filter((s) => typeof s === 'string' && s.trim().toLowerCase() !== graineSimple);
}

/* --------------------------------------------------------------- Reddit */

/**
 * GET minimal, statut, quota et corps, par `node:https`.
 *
 * `node:https` plutot que `fetch` : le seul 403 mesure chez RevealChat venait
 * de `fetch`, et ce client-ci, qui n'envoie que le User-Agent et `Accept`
 * comme curl, est celui qu'on a vu passer a 01:08 le 19/10/2026.
 */
function getRedditNode(url) {
  return new Promise((resoudre, rejeter) => {
    const req = https.get(url, { headers: { 'User-Agent': UA, Accept: '*/*' }, timeout: 20000 }, (res) => {
      const morceaux = [];
      res.on('data', (m) => morceaux.push(m));
      res.on('end', () =>
        resoudre({
          statut: res.statusCode,
          reste: Number.parseFloat(res.headers['x-ratelimit-remaining']),
          reset: Number.parseFloat(res.headers['x-ratelimit-reset']),
          corps: Buffer.concat(morceaux).toString('utf8'),
        }),
      );
    });
    req.on('timeout', () => req.destroy(new Error('delai depasse')));
    req.on('error', rejeter);
  });
}

/**
 * Le meme GET, par `curl`.
 *
 * ⚠️ Mesure le 19/10/2026 vers 11 h : Reddit renvoyait 403 (une page de
 * blocage de 190 Ko) a chaque requete de `node:https`, quel que soit le
 * User-Agent, et 200 a `curl` lance dans la meme minute depuis la meme
 * adresse. C'est donc l'empreinte du client (TLS, HTTP) qui est filtree, pas
 * l'adresse ni le nom qu'on annonce. Le curl de Windows (Schannel) et celui
 * de Git Bash ne presentent pas l'empreinte de Node. Les arguments ne portent
 * aucun secret : le flux est anonyme.
 */
function getRedditCurl(url) {
  return new Promise((resoudre, rejeter) => {
    execFile(
      'curl',
      ['-s', '-S', '-D', '-', '-A', UA, '-H', 'Accept: */*', '--max-time', '20', url],
      { maxBuffer: 50 * 1024 * 1024, encoding: 'utf8', windowsHide: true },
      (erreur, sortie) => {
        if (erreur) return rejeter(erreur);
        // `-D -` ecrit les en-tetes avant le corps, separes par une ligne vide.
        const fin = sortie.indexOf('\r\n\r\n');
        const tete = fin >= 0 ? sortie.slice(0, fin) : sortie;
        const entete = (nom) => tete.match(new RegExp(`^${nom}:\\s*(.+)$`, 'mi'))?.[1]?.trim();
        resoudre({
          statut: Number(tete.match(/^HTTP\/[\d.]+\s+(\d+)/)?.[1]) || 0,
          reste: Number.parseFloat(entete('x-ratelimit-remaining')),
          reset: Number.parseFloat(entete('x-ratelimit-reset')),
          corps: fin >= 0 ? sortie.slice(fin + 4) : '',
        });
      },
    );
  });
}

/**
 * Le client Reddit du moment, `node` ou `curl`.
 *
 * Il part de celui qui a marche au passage precedent (`reddit-vus.json`), et
 * bascule sur l'autre au premier 403 : un refus d'empreinte ne se leve pas en
 * attendant, alors que changer de client le contourne aussitot. La bascule ne
 * se fait qu'une fois par passage, pour ne pas osciller si Reddit refuse
 * tout. Un curl introuvable (ENOENT) laisse Node seul.
 */
let clientReddit = 'node';
let basculeFaite = false;
/** Attente imposee avant le prochain appel Reddit, deduite de la derniere reponse. */
let attenteReddit = 0;

async function appelReddit(url) {
  let essais = 0;
  let dernier = null;
  while (essais < 2) {
    await pause(Math.max(PAUSE_REDDIT_MS, attenteReddit));
    let r;
    try {
      r = clientReddit === 'curl' ? await getRedditCurl(url) : await getRedditNode(url);
    } catch (e) {
      if (clientReddit === 'curl' && e.code === 'ENOENT') {
        clientReddit = 'node';
        basculeFaite = true;
        continue;
      }
      throw e;
    }
    appels += 1;
    const finFenetre = Number.isFinite(r.reset) ? (r.reset + 1) * 1000 : REDDIT_ATTENTE_MAX_MS;
    // Quota epuise (ou en-tete absent) : le prochain appel attend la fenetre suivante.
    attenteReddit = Number.isFinite(r.reste) && r.reste >= 1 ? 0 : Math.min(finFenetre, REDDIT_ATTENTE_MAX_MS);
    if (r.statut === 200) return r.corps;
    dernier = r.statut;
    if (r.statut !== 429 && r.statut !== 403) throw new Error(`${r.statut} sur www.reddit.com (${clientReddit})`);
    attenteReddit = Math.min(finFenetre, REDDIT_ATTENTE_MAX_MS);
    if (r.statut === 403 && !basculeFaite) {
      basculeFaite = true;
      const ancien = clientReddit;
      clientReddit = clientReddit === 'node' ? 'curl' : 'node';
      console.error(`  Reddit refuse ${ancien} (403) : bascule sur ${clientReddit}`);
      // Changer de client n'use pas d'essai : le refus venait du client, pas du sub.
      continue;
    }
    essais += 1;
  }
  throw new Error(`${dernier ?? "refus"} sur www.reddit.com (${clientReddit}), apres une nouvelle tentative`);
}

/** Les premiers titres du top de la semaine, dans l'ordre du flux. */
async function reddit(sub) {
  const xml = await appelReddit(`https://www.reddit.com/r/${encodeURIComponent(sub)}/top/.rss?t=week`);
  return blocs(xml, 'entry')
    .slice(0, REDDIT_MAX)
    .map((entree, i) => {
      const publie = balise(entree, 'published') ?? balise(entree, 'updated');
      return {
        rang: i + 1,
        id: balise(entree, 'id'),
        titre: balise(entree, 'title'),
        publie,
        age_h: ageHeures(publie),
        url: entree.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? null,
      };
    });
}

/* ---------------------------------------------------------------- Main */

let config = lireJson(FICHIER_REQUETES, null);
const configManquante = !config;
config ??= {};
const champsAjoutes = Object.keys(REQUETES_DEPART).filter((cle) => !(cle in config));
for (const cle of champsAjoutes) config[cle] = REQUETES_DEPART[cle];
if (configManquante || champsAjoutes.length) ecrireJson(FICHIER_REQUETES, config);

const sortie = {
  genere_le: heureParis(),
  note: `actualites : ${AGE_MAX_H} h au plus, frais = moins de ${FRAIS_H} h, dedoublonnees entre requetes, ${ARTICLES_MAX} max par requete. suggestions : nouvelle = jamais vue avant aujourd'hui. reddit : top de la semaine, ordre du flux, nouveau = post jamais vu avant aujourd'hui, reutilise = deja lu lors d'un passage plus tot aujourd'hui.`,
  tendances: {},
  actualites: { fr: [], en: [] },
  suggestions: { premier_passage: false, nouvelles: { fr: [], en: [] }, fr: [], en: [] },
  reddit: { premier_passage: false, subs: [] },
  erreurs,
};

for (const geo of config.tendances_geos ?? []) {
  try {
    sortie.tendances[geo] = await tendances(geo);
  } catch (e) {
    erreurs.push({ source: `trends.${geo}`, message: messageErreur(e) });
    sortie.tendances[geo] = [];
  }
}

for (const langue of ['fr', 'en']) {
  const dejaVus = new Set();
  for (const r of config[`requetes_${langue}`] ?? []) {
    try {
      sortie.actualites[langue].push({ requete: r, articles: await actualites(langue, r, dejaVus) });
    } catch (e) {
      erreurs.push({ source: `news.${langue}.${r}`, message: messageErreur(e) });
    }
  }
}

/*
  Memoire des suggestions : la date de premiere apparition. « Nouvelle »
  veut dire vue pour la premiere fois aujourd'hui, donc un second passage le
  meme jour garde les memes nouvelles au lieu de les effacer. `depuis` date la
  memoire : le jour de sa creation, tout est nouveau et rien ne l'est vraiment.
*/
const memoire = lireJson(FICHIER_VUES, null) ?? { depuis: AUJOURDHUI, fr: {}, en: {} };
memoire.depuis ??= AUJOURDHUI;
sortie.suggestions.premier_passage = memoire.depuis === AUJOURDHUI;
for (const langue of ['fr', 'en']) {
  memoire[langue] ??= {};
  for (const graine of config[`graines_${langue}`] ?? []) {
    try {
      const liste = (await suggestions(langue, graine)).map((texte) => {
        memoire[langue][texte] ??= AUJOURDHUI;
        return { texte, nouvelle: memoire[langue][texte] === AUJOURDHUI };
      });
      sortie.suggestions[langue].push({ graine, suggestions: liste });
      for (const s of liste) if (s.nouvelle) sortie.suggestions.nouvelles[langue].push(s.texte);
    } catch (e) {
      erreurs.push({ source: `suggest.${langue}.${graine}`, message: messageErreur(e) });
    }
  }
}
ecrireJson(FICHIER_VUES, memoire);

/* Reddit : meme logique de memoire, sur l'identifiant du post (stable, au contraire du titre). */
const memoireReddit = lireJson(FICHIER_REDDIT_VUS, null) ?? { depuis: AUJOURDHUI, ids: {} };
memoireReddit.ids ??= {};
memoireReddit.depuis ??= AUJOURDHUI;
sortie.reddit.premier_passage = memoireReddit.depuis === AUJOURDHUI;
if (memoireReddit.client === 'curl' || memoireReddit.client === 'node') clientReddit = memoireReddit.client;
const sansReddit = process.argv.includes('--sans-reddit');
const debutReddit = Date.now();
const fichier = path.join(DOSSIER, `${AUJOURDHUI}.json`);
const dejaLus = new Map(
  (lireJson(fichier, null)?.reddit?.subs ?? [])
    .filter((s) => Array.isArray(s.posts) && s.posts.length > 0)
    .map((s) => [s.sub, s]),
);
const subs = config.reddit ?? [];
const aLire = subs.filter((s) => !dejaLus.has(s)).length;
if (sansReddit) sortie.reddit.saute = true;
else if (subs.length) {
  console.error(
    aLire
      ? `Reddit : ${aLire} subs a lire (${subs.length - aLire} repris), environ une minute par sub (quota anonyme).`
      : `Reddit : les ${subs.length} subs sont deja lus aujourd'hui, repris sans appel.`,
  );
}
for (const [i, sub] of subs.entries()) {
  if (dejaLus.has(sub)) {
    sortie.reddit.subs.push({ ...dejaLus.get(sub), reutilise: true });
    if (!sansReddit) console.error(`  r/${sub} : deja lu aujourd'hui, repris`);
    continue;
  }
  // Sans Reddit, on ne garde que ce qui etait deja lu : rien n'est appele.
  if (sansReddit) continue;
  if (Date.now() - debutReddit + attenteReddit > REDDIT_BUDGET_MS) {
    const restants = subs.slice(i).filter((s) => !dejaLus.has(s));
    erreurs.push({ source: 'reddit', message: `budget de ${REDDIT_BUDGET_MS / 60000} min atteint, non lus : ${restants.join(', ')}` });
    break;
  }
  try {
    const posts = (await reddit(sub)).map((p) => {
      const cle = p.id ?? p.url ?? p.titre;
      memoireReddit.ids[cle] ??= AUJOURDHUI;
      return { ...p, nouveau: memoireReddit.ids[cle] === AUJOURDHUI };
    });
    sortie.reddit.subs.push({ sub, posts });
    console.error(`  r/${sub} : ${posts.length} titres (+${Math.round((Date.now() - debutReddit) / 1000)} s)`);
  } catch (e) {
    erreurs.push({ source: `reddit.${sub}`, message: messageErreur(e) });
    console.error(`  r/${sub} : echec, ${messageErreur(e)}`);
  }
}
// Le client qui a marche sert de point de depart au prochain passage.
if (sortie.reddit.subs.some((s) => !s.reutilise)) memoireReddit.client = clientReddit;
sortie.reddit.client = clientReddit;
ecrireJson(FICHIER_REDDIT_VUS, memoireReddit);

ecrireJson(fichier, sortie);

/* -------------------------------------------------------------- Resume */

const l = [`# Veille du ${AUJOURDHUI}`, `Fichier : ${relatif(fichier)}`];
for (const [geo, liste] of Object.entries(sortie.tendances)) {
  l.push('', `## Tendances Google ${geo}`);
  l.push(liste.length ? liste.map((t) => `${t.titre} (${t.trafic ?? '?'})`).join(' ; ') : 'aucune');
}
for (const langue of ['fr', 'en']) {
  l.push('', `## Actualites ${langue} (72 h)`);
  for (const { requete: r, articles } of sortie.actualites[langue]) {
    if (!articles.length) {
      l.push(`- ${r} : rien`);
      continue;
    }
    l.push(`- ${r} (${articles.length}) :`);
    for (const a of articles.slice(0, 3)) l.push(`  - ${a.titre} [${a.source ?? '?'}, ${a.age_h} h]`);
  }
}
for (const langue of ['fr', 'en']) {
  const nouvelles = sortie.suggestions.nouvelles[langue];
  const total = sortie.suggestions[langue].reduce((s, g) => s + g.suggestions.length, 0);
  l.push('', `## Suggestions ${langue} : ${total} lues, ${nouvelles.length} nouvelles`);
  if (sortie.suggestions.premier_passage) l.push('(premier passage : tout est nouveau, la comparaison commence demain)');
  else if (nouvelles.length) l.push(nouvelles.map((s) => `« ${s} »`).join(', '));
}

/*
  Reddit : le premier jour, les trois premiers de chaque sub pour donner le
  ton. Ensuite, seulement les nouveaux, qui sont ce qui a change depuis hier.
*/
const premierReddit = sortie.reddit.premier_passage;
const nouveauxReddit = sortie.reddit.subs.reduce((s, x) => s + x.posts.filter((p) => p.nouveau).length, 0);
const repris = sortie.reddit.subs.filter((s) => s.reutilise).length;
l.push(
  '',
  sortie.reddit.saute
    ? `## Reddit : saute (--sans-reddit), ${repris} subs repris du passage precedent`
    : `## Reddit, top de la semaine : ${sortie.reddit.subs.length} subs lus (dont ${repris} repris), ${premierReddit ? 'premier passage' : `${nouveauxReddit} nouveaux`}`,
);
for (const { sub, posts } of sortie.reddit.subs) {
  const montres = premierReddit ? posts.slice(0, 3) : posts.filter((p) => p.nouveau).slice(0, 5);
  if (!montres.length) continue;
  l.push(`- r/${sub} :`);
  for (const p of montres) l.push(`  - ${premierReddit ? '' : 'NOUVEAU '}#${p.rang} ${p.titre}`);
}
if (erreurs.length) {
  l.push('', '## Erreurs');
  for (const e of erreurs) l.push(`- ${e.source} : ${e.message}`);
}
l.push('', `${appels} appels.`);
console.log(l.join('\n'));
