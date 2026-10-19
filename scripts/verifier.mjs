/**
 * Le banc du blog, contre un site construit qui tourne.
 *
 *   npm run build && npm run seo:banc        (lance le site sur 3210, joue le banc, l'arrete)
 *   BASE_VERIF=http://127.0.0.1:3000 node scripts/verifier.mjs   (contre un site deja lance)
 *
 * Porte de `Memory-Pilot-Web/scripts/verifier.mjs`, reduit a ce que le robot
 * editorial peut casser en publiant un article : il ne teste pas du texte, il
 * teste des regles, celles qu'une relecture ne rattrape pas parce qu'elles
 * portent sur toutes les pages a la fois. Aucun navigateur : tout se lit dans
 * le HTML rendu et dans les reponses brutes.
 *
 * | section | ce qui est verifie |
 * |---|---|
 * | pages | chaque article et chaque page du blog repond 200, y compris les douze adresses d'avant la migration |
 * | referencement | titre (62 caracteres au plus), description, canonique absolue, un seul h1, pas de tiret cadratin visible |
 * | donnees structurees | JSON-LD valide ; `Article` et `BreadcrumbList` ; `FAQPage` avec autant de questions que l'article |
 * | appels | les cinq emplacements, chacun vers `/dl?c=<slug>&m=blog&e=<emplacement>` |
 * | plan du site, flux | chaque article dans `/sitemap.xml` et dans `/blog/flux.xml` |
 * | /dl | Android vers Google Play (referrer), iPhone vers l'App Store (pt, ct), ordinateur vers le site, jamais en cache |
 * | mesure | PostHog sans cookie sans consentement, evenements `cta_clic` et `section_atteinte` branches |
 */

import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE_VERIF ?? 'http://127.0.0.1:3210';
/** Le middleware refuse une requete sans User-Agent : on se presente en navigateur. */
const NAVIGATEUR = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const SITE = 'https://www.cosme-check.com';

/*
  Le code du site, lu par Node sans compilateur : l'alias `@/` (la racine du
  depot) et les imports sans extension sont traduits ici, rien d'autre.
  Tous les modules du site sont importes apres ce crochet.
*/
const RACINE = new URL('../', import.meta.url).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    let s = specifier.startsWith('@/') ? RACINE + specifier.slice(2) : specifier;
    const relatif = s.startsWith('.') || s.startsWith('file:');
    if (relatif && !/\.(?:[cm]?[jt]sx?|json)$/.test(s)) {
      const base = new URL(s, context.parentURL);
      const chemin = fileURLToPath(base);
      if (existsSync(`${chemin}.ts`)) s = `${base.href}.ts`;
      else if (existsSync(`${chemin}/index.ts`)) s = `${base.href}/index.ts`;
    }
    return nextResolve(s, context);
  },
});
const avertirNode = process.emitWarning;
process.emitWarning = (alerte, ...reste) => {
  if (/MODULE_TYPELESS_PACKAGE_JSON/.test(String(alerte)) || reste.some((r) => r?.code === 'MODULE_TYPELESS_PACKAGE_JSON' || r === 'MODULE_TYPELESS_PACKAGE_JSON')) return;
  avertirNode.call(process, alerte, ...reste);
};
const site = (chemin) => import(new URL(chemin, RACINE).href);
const { ARTICLES } = await site('contenu/articles.ts');
const { placesDesAppels, ancres, sommaire, petiteImage } = await site('lib/article.ts');
const { APP_STORE_ID, ANDROID_PACKAGE, APPLE_PROVIDER_TOKEN } = await site('lib/storeLink.ts');

/** Les douze adresses publiees avant la migration du 19/10/2026 : elles ne doivent jamais casser. */
const ANCIENNES = [
  'spf-50-visage-7-erreurs',
  'creme-solaire-coreenne-k-beauty',
  'cremes-hydratantes-reparatrices',
  'lip-oils-huiles-levres',
  'perturbateurs-endocriniens-cosmetiques-2026',
  'masque-led-visage',
  'serums-visage-guide',
  'routine-peau-joueurs-foot',
  'deodorant-sels-aluminium-verite',
  'meilleurs-produits-anti-imperfections',
  'cosmetique-fait-pour-toi',
  'meilleures-cremes-hydratantes-visage',
].map((s) => `/blog/${s}`);

let echecs = 0;
let verifs = 0;
function verifier(nom, condition, detail = '') {
  verifs += 1;
  if (!condition) {
    echecs += 1;
    console.log(`  ECHEC  ${nom}${detail ? ' : ' + detail : ''}`);
  }
}
const lire = (chemin, init = {}) => fetch(BASE + chemin, { ...init, headers: { 'User-Agent': NAVIGATEUR, ...(init.headers ?? {}) } });
const texteVisible = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
const decoder = (t) => t.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');

/* ------------------------------------------------------------------ pages */
console.log('pages');
const CHEMINS = [...new Set(['/', '/blog', ...ARTICLES.map((a) => `/blog/${a.slug}`), ...ANCIENNES])];
const pages = new Map();
for (const chemin of CHEMINS) {
  const r = await lire(chemin, { redirect: 'manual' });
  verifier(`${chemin} repond 200`, r.status === 200, `HTTP ${r.status}`);
  if (r.ok) pages.set(chemin, await r.text());
}
for (const chemin of ANCIENNES) verifier(`l'ancienne adresse ${chemin} est toujours un article`, ARTICLES.some((a) => `/blog/${a.slug}` === chemin));
console.log(`  ${pages.size} pages lues sur ${CHEMINS.length}`);

/* -------------------------------------------------------- referencement */
console.log('\nreferencement');
for (const [chemin, html] of pages) {
  const titre = decoder(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  const canon = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? '';
  verifier(`${chemin} a un titre`, titre.length > 10, `« ${titre} »`);
  if (chemin !== '/') verifier(`${chemin} titre sous 62 caracteres`, titre.length <= 62, `${titre.length} : « ${titre} »`);
  verifier(`${chemin} a une description`, desc.length >= 50, `${desc.length} caracteres`);
  verifier(`${chemin} a une canonique absolue sur cosme-check.com`, canon === `${SITE}${chemin === '/' ? '' : chemin}` || (chemin === '/' && canon === SITE), canon);
  if (chemin.startsWith('/blog')) {
    // L'accueil porte deux h1 (le titre du hero, rendu deux fois selon l'ecran) :
    // ecart anterieur au blog, hors du perimetre du robot, signale au 19/10/2026.
    const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
    verifier(`${chemin} a exactement un h1`, h1 === 1, `${h1} trouve(s)`);
    const tirets = (texteVisible(html).match(/[\u2013\u2014]/g) ?? []).length;
    verifier(`${chemin} sans tiret cadratin`, tirets === 0, `${tirets} occurrence(s)`);
  }
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  verifier(`${chemin} toutes les images ont un alt`, imgs.every((i) => /\balt=/.test(i)));
}

/* ------------------------------------------------ donnees structurees et article */
console.log('\npages d\'article');
for (const a of ARTICLES) {
  const chemin = `/blog/${a.slug}`;
  const html = pages.get(chemin) ?? '';
  const blocs = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(([, b]) => b);
  const noeuds = [];
  let valide = true;
  for (const b of blocs) {
    try {
      const d = JSON.parse(b);
      if (d['@context'] !== 'https://schema.org') valide = false;
      noeuds.push(...(d['@graph'] ?? [d]));
    } catch {
      valide = false;
    }
  }
  verifier(`${chemin} JSON-LD valide`, blocs.length > 0 && valide);
  const article = noeuds.find((n) => n['@type'] === 'Article');
  verifier(`${chemin} declare un Article`, !!article);
  verifier(`${chemin} Article date du ${a.publieLe}`, article?.datePublished === a.publieLe && article?.dateModified === a.modifieLe);
  verifier(`${chemin} Article porte son image`, article?.image?.url === `${SITE}${a.couverture.src}`);
  verifier(`${chemin} declare son fil d'Ariane`, noeuds.some((n) => n['@type'] === 'BreadcrumbList'));
  const faq = noeuds.find((n) => n['@type'] === 'FAQPage');
  if (a.faq?.length) {
    verifier(`${chemin} declare sa FAQ`, faq?.mainEntity?.length === a.faq.length, `${faq?.mainEntity?.length ?? 0} question(s)`);
    verifier(`${chemin} affiche sa FAQ`, html.includes('id="questions-frequentes"'));
  } else verifier(`${chemin} ne declare pas de FAQ qu'il n'affiche pas`, !faq);

  // Les cinq appels, chacun vers `/dl?c=<slug>&m=blog&e=<emplacement>`.
  const places = placesDesAppels(a.blocs);
  const attendus = ['haut', 'colonne', 'fin', 'barre'];
  if (places.milieu !== null || a.blocs.some((b) => b.type === 'cta')) attendus.push('milieu');
  for (const e of attendus) {
    verifier(
      `${chemin} porte l'appel « ${e} »`,
      new RegExp(`href="/dl\\?c=${a.slug}&amp;m=blog&amp;e=${e}"[^>]*data-appel="${e}"`).test(html),
    );
  }
  verifier(`${chemin} a au moins trois h2`, a.blocs.filter((b) => b.type === 'h2').length >= 3);
  for (const id of ancres(a.blocs).filter(Boolean)) verifier(`${chemin} porte l'ancre #${id}`, html.includes(`id="${id}"`));
  verifier(`${chemin} a son sommaire`, sommaire(a.blocs).every((e) => html.includes(`href="#${e.id}"`)));
  verifier(`${chemin} suit la lecture section par section`, html.includes('data-corps'));

  // Les images : les deux tailles existent, et le credit est rempli.
  for (const img of [a.couverture, ...a.blocs.filter((b) => b.type === 'image')]) {
    verifier(`${img.src} est servie (${a.slug})`, existsSync(new URL(`public${img.src}`, RACINE)));
    verifier(`${img.src} a sa petite taille (${a.slug})`, existsSync(new URL(`public${petiteImage(img.src)}`, RACINE)));
    verifier(`${img.src} porte credit et licence (${a.slug})`, !!img.credit?.trim() && !!img.licence?.trim());
  }
}

/* ------------------------------------------------- liste, accueil, plan, flux */
console.log('\nliste, accueil, plan du site, flux');
{
  const blog = pages.get('/blog') ?? '';
  const accueil = pages.get('/') ?? '';
  for (const a of ARTICLES) verifier(`/blog liste ${a.slug}`, blog.includes(`href="/blog/${a.slug}"`));
  const recents = [...ARTICLES].sort((x, y) => y.publieLe.localeCompare(x.publieLe)).slice(0, 3);
  for (const a of recents) verifier(`l'accueil montre l'article recent ${a.slug}`, accueil.includes(`href="/blog/${a.slug}"`));
  verifier('/blog annonce le flux RSS', /type="application\/rss\+xml"[^>]*href="[^"]*\/blog\/flux\.xml"|href="[^"]*\/blog\/flux\.xml"[^>]*type="application\/rss\+xml"/.test(blog));

  const plan = await (await lire('/sitemap.xml')).text();
  for (const a of ARTICLES) {
    verifier(
      `/sitemap.xml porte ${a.slug} et sa date`,
      plan.includes(`<loc>${SITE}/blog/${a.slug}</loc>`) && new RegExp(`<loc>${SITE}/blog/${a.slug}</loc>\\s*<lastmod>${a.modifieLe}`).test(plan),
    );
  }
  const r = await lire('/blog/flux.xml');
  const flux = await r.text();
  verifier('/blog/flux.xml repond en RSS', r.ok && /application\/rss\+xml/.test(r.headers.get('content-type') ?? '') && flux.includes('<rss '));
  verifier('/blog/flux.xml est en francais', flux.includes('<language>fr-FR</language>'));
  for (const a of ARTICLES) verifier(`/blog/flux.xml porte ${a.slug}`, flux.includes(`<link>${SITE}/blog/${a.slug}</link>`));
}

/* ----------------------------------------------------------------- /dl */
/**
 * `/dl` est le lien des QR codes imprimes et des appels des articles. On lit
 * la reponse **brute** (`redirect: 'manual'`) : c'est elle que recoit le
 * navigateur integre d'Instagram ou de TikTok.
 */
console.log('\nle lien intelligent /dl');
{
  const agents = {
    Android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
    iPhone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    Windows: NAVIGATEUR,
  };
  const slug = ARTICLES[0].slug;
  const ct = slug.slice(0, 40);
  const cas = [
    ['Android', `?c=${slug}&m=blog&e=milieu`, (l) => l.startsWith(`https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&referrer=`) && decodeURIComponent(l.split('referrer=')[1]) === `utm_source=${slug}&utm_medium=blog&utm_campaign=${slug}&utm_content=milieu`],
    ['iPhone', `?c=${slug}&m=blog&e=haut`, (l) => l === `https://apps.apple.com/app/id${APP_STORE_ID}?pt=${APPLE_PROVIDER_TOKEN}&ct=${ct}&mt=8`],
    ['Windows', `?c=${slug}&m=blog&e=fin`, (l) => l === `${SITE}/`],
    ['Android', '', (l) => decodeURIComponent(l.split('referrer=')[1] ?? '') === 'utm_source=qr&utm_medium=qr_code&utm_campaign=qr'],
    ['iPhone', '?c=%3Cscript%3E', (l) => l.endsWith('&ct=qr&mt=8')],
    ['Android', '?c=ok&e=a%26b', (l) => !decodeURIComponent(l).includes('utm_content')],
  ];
  for (const [appareil, requete, attendu] of cas) {
    const r = await fetch(`${BASE}/dl${requete}`, { redirect: 'manual', headers: { 'User-Agent': agents[appareil] } });
    const lieu = r.headers.get('location') ?? '';
    verifier(`/dl${requete || ' (nu)'} sur ${appareil}`, r.status === 302 && attendu(lieu), `HTTP ${r.status}, Location ${lieu}`);
    verifier(`/dl${requete.slice(0, 25)} sur ${appareil} : jamais mis en cache`, /no-store/.test(r.headers.get('cache-control') ?? ''));
    verifier(`/dl${requete.slice(0, 25)} sur ${appareil} : varie avec l'appareil`, /user-agent/i.test(r.headers.get('vary') ?? ''));
  }
}

/* --------------------------------------------------------------- mesure */
console.log('\nla mesure');
{
  const init = readFileSync(new URL('components/PostHogInit.tsx', RACINE), 'utf8');
  const mesure = readFileSync(new URL('lib/mesure.ts', RACINE), 'utf8');
  const appel = readFileSync(new URL('components/blog/AppelTelecharger.tsx', RACINE), 'utf8');
  const lecture = readFileSync(new URL('components/blog/ArticleInteractif.tsx', RACINE), 'utf8');
  verifier('sans consentement, PostHog tourne sans cookie', /cookieless_mode:\s*"always"/.test(init) && /consentementMesure\(\) === "accepte"/.test(init));
  verifier('sans consentement, pas de session replay', /disable_session_recording:\s*true/.test(init));
  verifier('les appels envoient cta_clic avec source et destination', /"cta_clic"/.test(appel) && /source: `\$\{slug\}-\$\{emplacement\}`/.test(appel));
  verifier('la lecture envoie section_atteinte', /"section_atteinte"/.test(lecture));
  verifier('lib/mesure ne parle a PostHog que s\'il est charge', /__loaded/.test(mesure));
}

/* ------------------------------------------------------ liens de boutique */
/**
 * Les deux fiches sont appelees pour de vrai. Une panne de reseau n'est pas
 * un echec ; seule une reponse qui dit non fait tomber le banc. Apple limite
 * parfois (HTTP 429) : seul echec tolere par la doctrine.
 */
console.log('\nfiches des magasins');
for (const [nom, url] of [
  ['App Store', `https://apps.apple.com/fr/app/id${APP_STORE_ID}`],
  ['Google Play', `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`],
]) {
  try {
    const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(12000), headers: { 'User-Agent': NAVIGATEUR } });
    if (r.status === 429) console.log(`  (${nom} limite les requetes, HTTP 429 : non bloquant)`);
    else verifier(`${nom} repond`, r.status < 400, `HTTP ${r.status} sur ${url}`);
  } catch {
    console.log(`  (${nom} injoignable d'ici, non bloquant)`);
  }
}

console.log(`\n${verifs - echecs}/${verifs} verifications passees` + (echecs ? `, ${echecs} en echec\n` : '\n'));
process.exitCode = echecs ? 1 : 0;
