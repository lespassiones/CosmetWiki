/**
 * Photos libres pour les articles : chercher, regarder, prendre.
 *
 *   npm run seo:photo -- "skincare bathroom shelf"            cherche 8 photos (Openverse)
 *   npm run seo:photo -- "sunscreen beach" --n 12             en cherche 12 (15 au plus)
 *   npm run seo:photo -- "cosmetics shop" --source wikimedia
 *   npm run seo:photo -- --prendre <id Openverse> --slug <nom>
 *   npm run seo:photo -- --prendre "https://commons.wikimedia.org/wiki/File:X.jpg" --slug <nom>
 *   npm run seo:photo -- --prendre "File:X.jpg" --slug <nom> [--remplacer]
 *
 * Porte depuis `Memory-Pilot-Web/scripts/seo/photo.mjs` (lui-meme venu de
 * RevealChat), adapte a Cosme Check : les images vont dans
 * `public/image/blog/`, et le bloc imprime separe `credit` (l'auteur et la
 * provenance) et `licence`, comme le type `Credit` de `contenu/articles.ts`.
 * Le site est en francais seulement : un seul bloc.
 *
 * ⚠️ Jamais la photo d'une celebrite (droit a l'image, `docs/seo/ROBOT.md`) :
 * une photo d'ambiance libre a la place.
 *
 * ## Les licences acceptees, et le credit qu'elles exigent
 *
 * Une photo d'article est publiee, donc redistribuee, sur un site qui fait la
 * promotion d'une app : la licence doit autoriser l'usage commercial et la
 * reproduction telle quelle. Sont acceptees :
 *
 * | licence | ce qu'elle exige | credit imprime |
 * |---|---|---|
 * | CC0, domaine public | rien | auteur, « CC0 » ou « domaine public », provenance |
 * | CC BY | **l'auteur et la licence**, et un lien vers l'original | auteur, « CC BY 2.0 », provenance |
 * | CC BY-SA | idem ; le partage a l'identique ne vise que les adaptations, et on ne fait que reduire l'image | auteur, « CC BY-SA 4.0 », provenance |
 *
 * NC (pas d'usage commercial) et ND (pas de modification) sont refusees. Le
 * credit suit la forme des images deja publiees (« Travis Wise, CC BY 2.0, via
 * Wikimedia Commons ») et `source` pointe vers la page d'origine : le site
 * affiche l'un sous l'image, et l'autre en lien. C'est ce que le type
 * `Article` exige, et ce que `seo:verifier` controle.
 *
 * Le mode « prendre » **relit la licence** sur la fiche de l'image avant de
 * telecharger, au lieu de faire confiance a la recherche : un identifiant
 * colle a la main peut venir de n'importe ou.
 *
 * ## Deux temps : regarder, puis prendre
 *
 * La recherche telecharge des miniatures dans
 * `docs/seo/photos-candidates/<requete>/`, pour que le modele les regarde
 * avant de choisir. Ce dossier a son propre `.gitignore` : des brouillons que
 * personne n'a choisis n'ont rien a faire dans l'historique.
 *
 * Le mode « prendre » ecrit `public/image/blog/<nom>.webp` (1200 px de large
 * au plus) et `<nom>-s.webp` (700 px), puis **imprime le bloc `image`** et la
 * `couverture`, prets a coller. Le texte
 * alternatif et la legende restent a ecrire : ils portent `<À ÉCRIRE>`, que
 * `seo:verifier` refuse de laisser partir.
 *
 * ## Limites connues
 *
 * - Openverse anonyme : 20 appels par minute, 200 par jour. Une recherche de
 *   8 photos en coute 9.
 * - On n'agrandit jamais : une source de 900 px donne un grand fichier de 900.
 */

import fs from 'node:fs';
import path from 'node:path';
import { RACINE, ecrireJson, messageErreur, option, positionnels, relatif, requete } from './lib.mjs';

const API = 'https://api.openverse.org/v1/images';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const CANDIDATES = path.join(RACINE, 'docs', 'seo', 'photos-candidates');
const IMAGES = path.join(RACINE, 'public', 'image', 'blog');
const LICENCES_OPENVERSE = ['cc0', 'pdm', 'by', 'by-sa'];
const GRANDE = 1200;
const PETITE = 700;
const N_DEFAUT = 8;
// 20 appels par minute en anonyme : la recherche plus 15 miniatures laisse de quoi prendre.
const N_MAX = 15;

const NOMS_SOURCE = {
  wikimedia: 'Wikimedia Commons',
  flickr: 'Flickr',
  stocksnap: 'StockSnap',
  rawpixel: 'rawpixel',
  nappy: 'nappy',
};

/**
 * Arret propre : une exception rattrapee par le point d'entree, qui pose
 * `process.exitCode`.
 *
 * ⚠️ Pas de `process.exit()` ici. Appele juste apres un `fetch`, il ferme le
 * processus pendant que la connexion se referme, et Node sous Windows plante
 * dans libuv (`UV_HANDLE_CLOSING`, code 127) au lieu de rendre le code voulu.
 */
class Arret extends Error {
  constructor(message, code = 1) {
    super(message);
    this.code = code;
  }
}
const arreter = (message, code = 1) => {
  throw new Arret(message, code);
};

async function appelJson(url) {
  const r = await requete(url, { headers: { Accept: 'application/json' } }, 30000);
  if (r.status === 429) arreter('Limite atteinte (Openverse anonyme : 20 appels par minute, 200 par jour). Reessayer plus tard.');
  if (!r.ok) throw new Error(`${r.status} sur ${new URL(url).host}${new URL(url).pathname}`);
  return r.json();
}

async function appelOctets(url) {
  const r = await requete(url, {}, 60000);
  if (r.status === 429) arreter('Limite atteinte sur le telechargement. Reessayer plus tard.');
  if (!r.ok) throw new Error(`${r.status} sur ${new URL(url).host}${new URL(url).pathname}`);
  return { octets: Buffer.from(await r.arrayBuffer()), type: r.headers.get('content-type') ?? '' };
}

/** Nom de dossier sur pour une requete libre : « Sticky notes, desk! » donne « sticky-notes-desk ». */
function nomDossier(texte) {
  return (
    texte
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'requete'
  );
}

/**
 * Le texte d'un champ HTML de Commons (`Artist`), sans balises.
 *
 * Commons double souvent l'auteur dans un element cache
 * (`Unknown author<span style="display: none;">Unknown author</span>`) : on
 * retire ce qui ne s'affiche pas avant de garder le texte.
 */
function sansHtml(html) {
  return String(html ?? '')
    .replace(/<(\w+)[^>]*display:\s*none[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---------------------------------------------------------------- credits */

/**
 * Le libelle de licence, dans chaque langue, a partir du code et de la
 * version. Le domaine public se dit, CC0 et les CC BY s'ecrivent.
 */
function libelleLicence(code, version) {
  const v = version ? ` ${version}` : '';
  if (code === 'cc0') return { fr: 'CC0', en: 'CC0' };
  if (code === 'pdm' || code === 'pd') return { fr: 'domaine public', en: 'public domain' };
  if (code === 'by') return { fr: `CC BY${v}`, en: `CC BY${v}` };
  if (code === 'by-sa') return { fr: `CC BY-SA${v}`, en: `CC BY-SA${v}` };
  return null;
}

/** Le credit, a la forme des images deja publiees : auteur, licence, provenance. */
function credits({ auteur, licence, via }) {
  const inconnu = !auteur || /^(unknown|unknown author|anonymous|anonyme|auteur inconnu)$/i.test(auteur);
  return {
    fr: `${inconnu ? 'Auteur inconnu' : auteur}, ${licence.fr}, via ${via}`,
    en: `${inconnu ? 'Unknown author' : auteur}, ${licence.en}, via ${via}`,
  };
}

/** Le nom de fichier Commons d'une adresse `upload.wikimedia.org/.../Nom.jpg`, ou `null`. */
function fichierCommons(url) {
  const m = String(url ?? '').match(/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Une miniature, d'ou qu'elle vienne.
 *
 * Openverse ne sait pas toujours servir celle d'une image de Wikimedia (il
 * repond 424) : on la demande alors a Commons lui-meme, a 600 px. En dernier
 * recours, l'original est telecharge et reduit ici.
 */
async function miniature(r) {
  try {
    return await appelOctets(`${API}/${r.id}/thumb/`);
  } catch (e) {
    if (e instanceof Arret) throw e;
    const nom = fichierCommons(r.url);
    if (nom) return appelOctets(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(nom)}?width=600`);
    const { octets } = await appelOctets(r.url);
    const sharp = (await import('sharp')).default;
    return { octets: await sharp(octets).rotate().resize({ width: 600, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer(), type: 'image/jpeg' };
  }
}

/* -------------------------------------------------------------- recherche */

async function chercher(q, n, source) {
  const url =
    `${API}/?q=${encodeURIComponent(q)}&license=${LICENCES_OPENVERSE.join(',')}` +
    `${source ? `&source=${encodeURIComponent(source)}` : ''}&page_size=${n}&mature=false`;
  const corps = await appelJson(url);
  const resultats = corps.results ?? [];

  const dossier = path.join(CANDIDATES, nomDossier(q));
  // Une nouvelle recherche remplace la precedente : des miniatures perimees melangees aux neuves tromperaient le choix.
  fs.rmSync(dossier, { recursive: true, force: true });
  fs.mkdirSync(dossier, { recursive: true });
  const ignore = path.join(CANDIDATES, '.gitignore');
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, '# Brouillons du robot SEO, jamais commites.\n*\n', 'utf8');

  const candidates = [];
  for (const [i, r] of resultats.entries()) {
    const licence = libelleLicence(r.license, r.license_version);
    const entree = {
      rang: i + 1,
      id: r.id,
      titre: r.title ?? null,
      auteur: r.creator ?? null,
      licence: licence?.fr ?? r.license,
      source: NOMS_SOURCE[r.source] ?? r.source,
      largeur: r.width ?? null,
      hauteur: r.height ?? null,
      page: r.foreign_landing_url,
      miniature: null,
    };
    try {
      const { octets, type } = await miniature(r);
      const ext = type.includes('webp') ? 'webp' : type.includes('png') ? 'png' : 'jpg';
      const fichier = path.join(dossier, `${String(i + 1).padStart(2, '0')}-${r.id}.${ext}`);
      fs.writeFileSync(fichier, octets);
      entree.miniature = relatif(fichier);
    } catch (e) {
      entree.miniature_erreur = messageErreur(e);
    }
    candidates.push(entree);
  }
  ecrireJson(path.join(dossier, 'candidates.json'), { requete: q, source: source ?? 'toutes', total_disponible: corps.result_count, candidates });

  console.log(
    `# Photos « ${q} » : ${candidates.length} sur ${corps.result_count ?? '?'} disponibles` +
      ` (${source ? NOMS_SOURCE[source] ?? source : 'toutes sources'} ; CC0, domaine public, CC BY, CC BY-SA)`,
  );
  console.log(`Miniatures : ${relatif(dossier)}/`);
  for (const c of candidates) {
    const petite = c.largeur && c.largeur < 1000 ? ` (petite : ${c.largeur} px de large)` : '';
    console.log(
      `\n${c.rang}. ${c.id}\n   ${c.titre ?? '(sans titre)'} par ${c.auteur ?? '?'}, ${c.licence}, ${c.source}, ${c.largeur}x${c.hauteur}${petite}` +
        `\n   ${c.page}\n   ${c.miniature ?? `miniature en echec : ${c.miniature_erreur}`}`,
    );
  }
  console.log('\nPour en prendre une : npm run seo:photo -- --prendre <id> --slug <nom>');
}

/* ------------------------------------------------------------- les fiches */

/** La fiche d'une image Openverse, licence relue. */
async function ficheOpenverse(id) {
  const fiche = await appelJson(`${API}/${id}/`);
  if (fiche.mature) arreter('Refuse : image marquee sensible par Openverse.');
  // Une image de Wikimedia : Commons fait foi (auteur, licence) et sert une taille utile.
  const nom = fiche.source === 'wikimedia' ? fichierCommons(fiche.url) : null;
  if (nom) return ficheCommons(`File:${nom}`);
  const licence = libelleLicence(fiche.license, fiche.license_version);
  if (!licence) {
    arreter(`Refuse : licence « ${fiche.license} ${fiche.license_version ?? ''} ». Seules CC0, domaine public, CC BY et CC BY-SA sont acceptees.`);
  }
  return {
    auteur: fiche.creator || null,
    licence,
    licenceUrl: fiche.license_url ?? null,
    via: NOMS_SOURCE[fiche.source] ?? fiche.source,
    page: fiche.foreign_landing_url,
    telechargements: [`${API}/${id}/thumb/?full_size=true&compressed=false`, fiche.url].filter(Boolean),
  };
}

/** La fiche d'un fichier de Wikimedia Commons, licence relue. */
async function ficheCommons(titre) {
  const url =
    `${COMMONS}?action=query&format=json&formatversion=2&prop=imageinfo` +
    `&iiprop=url|size|mime|extmetadata&iiurlwidth=${GRANDE}&titles=${encodeURIComponent(titre)}`;
  const corps = await appelJson(url);
  const page = corps.query?.pages?.[0];
  const info = page?.imageinfo?.[0];
  if (!info) arreter(`Introuvable sur Wikimedia Commons : ${titre}`);
  const meta = info.extmetadata ?? {};
  const code = String(meta.License?.value ?? '').toLowerCase();
  const nom = sansHtml(meta.LicenseShortName?.value);
  let licence = null;
  if (/^cc0/.test(code)) licence = libelleLicence('cc0');
  else if (/^pd/.test(code) || /^public domain$/i.test(nom)) licence = libelleLicence('pd');
  else if (/^cc-by-sa-[\d.]+$/.test(code)) licence = libelleLicence('by-sa', code.replace('cc-by-sa-', ''));
  else if (/^cc-by-[\d.]+$/.test(code)) licence = libelleLicence('by', code.replace('cc-by-', ''));
  if (!licence) {
    arreter(`Refuse : licence « ${nom || code || 'inconnue'} ». Seules CC0, domaine public, CC BY et CC BY-SA sont acceptees.`);
  }
  return {
    auteur: sansHtml(meta.Artist?.value) || null,
    licence,
    licenceUrl: meta.LicenseUrl?.value ?? null,
    via: 'Wikimedia Commons',
    page: info.descriptionurl,
    telechargements: [info.thumburl, info.url].filter(Boolean),
  };
}

/* ---------------------------------------------------------------- prendre */

const chaine = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

async function prendre(cible, nom, remplacer) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(nom ?? '')) {
    arreter('--slug attend des minuscules, chiffres et tirets, par exemple post-it-bureau', 2);
  }
  const grand = path.join(IMAGES, `${nom}.webp`);
  const petit = path.join(IMAGES, `${nom}-s.webp`);
  if ((fs.existsSync(grand) || fs.existsSync(petit)) && !remplacer) {
    arreter(`${relatif(grand)} existe deja. Ajouter --remplacer pour l'ecraser.`);
  }

  const commons = cible.match(/^https?:\/\/commons\.wikimedia\.org\/wiki\/((?:File|Fichier):.+)$/i);
  let fiche;
  if (commons) fiche = await ficheCommons(decodeURIComponent(commons[1]).replace(/^Fichier:/i, 'File:'));
  else if (/^(File|Fichier):/i.test(cible)) fiche = await ficheCommons(cible.replace(/^Fichier:/i, 'File:'));
  else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cible)) fiche = await ficheOpenverse(cible);
  else arreter(`--prendre attend un identifiant Openverse, une adresse commons.wikimedia.org/wiki/File:... ou File:... (recu : ${cible})`, 2);

  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    arreter('sharp est introuvable : il arrive avec Next (dependance facultative). Lancer `npm install` dans le depot.');
  }

  let octets;
  let derniere;
  for (const url of fiche.telechargements) {
    try {
      ({ octets } = await appelOctets(url));
      break;
    } catch (e) {
      if (e instanceof Arret) throw e;
      derniere = e;
    }
  }
  if (!octets) throw derniere ?? new Error('aucune adresse de telechargement');

  fs.mkdirSync(IMAGES, { recursive: true });
  // `rotate()` applique l'orientation EXIF avant de la jeter, sinon une photo de telephone sortirait couchee.
  const ecrire = (largeur, fichier) =>
    sharp(octets)
      .rotate()
      .resize({ width: largeur, withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toFile(fichier);
  const g = await ecrire(GRANDE, grand);
  const p = await ecrire(PETITE, petit);

  // Cosme Check separe l'auteur et la licence (type `Credit` de `contenu/articles.ts`).
  const inconnu = !fiche.auteur || /^(unknown|unknown author|anonymous|anonyme|auteur inconnu)$/i.test(fiche.auteur);
  const auteur = `${inconnu ? 'Auteur inconnu' : fiche.auteur}, via ${fiche.via}`;
  const licence = fiche.licence.fr;
  console.error(
    `${relatif(grand)} : ${g.width}x${g.height}, ${Math.round(g.size / 1024)} Ko` +
      (g.width < GRANDE ? ` (source de ${g.width} px, non agrandie)` : '') +
      `\n${relatif(petit)} : ${p.width}x${p.height}, ${Math.round(p.size / 1024)} Ko` +
      `\nLicence : ${auteur}, ${licence}${fiche.licenceUrl ? ` (${fiche.licenceUrl})` : ''}` +
      (g.width < 1000 ? '\n⚠️ Moins de 1000 px de large : elle sera floue en pleine colonne. En chercher une plus grande si possible.' : ''),
  );

  const src = `/image/blog/${nom}.webp`;
  console.log('// Bloc image, a coller dans contenu/articles/<slug>.ts :');
  console.log(
    [
      '{',
      '  type: "image",',
      `  src: "${src}",`,
      '  alt: "<À ÉCRIRE>",',
      '  legende: "<À ÉCRIRE>",',
      `  credit: ${JSON.stringify(auteur)},`,
      `  licence: ${JSON.stringify(licence)},`,
      `  source: ${JSON.stringify(fiche.page)},`,
      `  largeur: ${g.width},`,
      `  hauteur: ${g.height},`,
      '},',
    ].join('\n'),
  );
  console.log('\n// Si elle sert de couverture :');
  console.log(
    `couverture: { src: "${src}", alt: "<À ÉCRIRE>", largeur: ${g.width}, hauteur: ${g.height}, credit: ${JSON.stringify(auteur)}, licence: ${JSON.stringify(licence)}, source: ${JSON.stringify(fiche.page)} },`,
  );
}

/* ------------------------------------------------------------------- main */

const args = process.argv.slice(2);
const pris = option(args, 'prendre', null);

try {
  if (pris) {
    await prendre(pris, option(args, 'slug', null), args.includes('--remplacer'));
  } else {
    const [q] = positionnels(args, ['n', 'source']);
    if (!q) {
      arreter(
        'Usage : photo.mjs "<requete en anglais>" [--n 8] [--source wikimedia]  |  photo.mjs --prendre <id | File:...> --slug <nom> [--remplacer]',
        2,
      );
    }
    const n = Number.parseInt(option(args, 'n', String(N_DEFAUT)), 10);
    if (!Number.isInteger(n) || n < 1 || n > N_MAX) arreter(`--n attend un entier entre 1 et ${N_MAX}`, 2);
    await chercher(q, n, option(args, 'source', null));
  }
} catch (e) {
  console.error(e instanceof Arret ? e.message : `Echec : ${messageErreur(e)}`);
  process.exitCode = e instanceof Arret ? e.code : 1;
}
