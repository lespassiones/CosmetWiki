/**
 * Les garde-fous du robot SEO, avant toute publication.
 *
 *   npm run seo:verifier            verifie tous les articles
 *   npm run seo:verifier -- --tous  idem, et traite chaque avertissement comme bloquant
 *   npm run seo:verifier -- --hors-ligne   sans comparer les notes a la base
 *
 * Porte depuis `Memory-Pilot-Web/scripts/seo/verifier.mjs`, meme sortie
 * (`ERREUR` bloque, `avert.` signale), adapte a Cosme Check : un seul fichier
 * par article (le site est en francais seulement), et des regles propres a la
 * cosmetique.
 *
 * ## Pourquoi ce script existe
 *
 * Le robot publie sans relecture humaine. Ce script **est** la relecture du
 * fond : il sort 1 a la premiere regle cassee, et la doctrine du robot
 * (`docs/seo/ROBOT.md`, section 5) lui interdit de pousser tant qu'il ne sort
 * pas 0.
 *
 * ## Ce qu'il ne refait pas
 *
 * `npm run seo:banc` relit les pages **construites** : canoniques, JSON-LD,
 * plan du site, les cinq appels, `/dl`. Ce script-ci tourne **avant** le
 * build, sans serveur, sur les fichiers source : ce qu'il controle est ce
 * qu'un texte peut casser.
 *
 * ## Bloquant ou simple avertissement
 *
 * Les regles de fond bloquent sur **tous** les articles, anciens compris :
 * une allegation therapeutique ou un lien casse n'est pas plus acceptable dans
 * un article d'il y a trois mois.
 *
 * | bloque | avertit (bloque avec `--tous`) |
 * |---|---|
 * | soigner, guerir, traiter une maladie de peau ; « anti-cancer » ; un diagnostic pose sur le lecteur | une longueur hors bornes (titre, resume, mots) |
 * | un ingredient presente comme dangereux sans source officielle dans l'article | une lisibilite trop basse, des phrases trop longues |
 * | un prix ; une note de produit absente de la base ou differente | un terme technique jamais explique |
 * | une celebrite presentee comme utilisatrice de Cosme Check | le vouvoiement, un adjectif qui presume le genre du lecteur |
 * | le tiret cadratin ; un lien interne casse ; une image sans credit ni licence | moins de 3 liens internes, de 3 h2, pas de FAQ, pas de source |
 *
 * Les articles modifies depuis le dernier commit sont marques `*` : ce sont
 * ceux du jour. Les fichiers d'articles sont du TypeScript sans autre import
 * que des types : Node 24 les execute tel quel. Aucune compilation.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/*
  Node avertit, une fois par fichier, qu'il relit un `.ts` comme module ES
  faute de `"type": "module"` dans package.json. C'est attendu ici, et ce bruit
  noierait la sortie que lit le robot : on ne tait que cet avertissement-la.
*/
const avertirNode = process.emitWarning;
process.emitWarning = (alerte, ...reste) => {
  const code = typeof reste[0] === 'object' ? reste[0]?.code : reste[1];
  if (code === 'MODULE_TYPELESS_PACKAGE_JSON' || /MODULE_TYPELESS_PACKAGE_JSON/.test(String(alerte))) return;
  avertirNode.call(process, alerte, ...reste);
};

/*
  L'alias `@/` de Next (la racine du depot ici, pas `src/`) et les imports
  sans extension n'existent pas pour Node. Ce crochet traduit les deux, et ne
  transforme aucun code.
*/
const RACINE_URL = pathToFileURL(racine + path.sep).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    let s = specifier.startsWith('@/') ? RACINE_URL + specifier.slice(2) : specifier;
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

const site = (chemin) => import(pathToFileURL(path.join(racine, chemin)).href);
const toutBloquant = process.argv.includes('--tous');
const horsLigne = process.argv.includes('--hors-ligne');

const DOSSIER = path.join(racine, 'contenu', 'articles');

const REGLAGES = (() => {
  try {
    return JSON.parse(readFileSync(path.join(racine, 'docs', 'seo', 'REGLAGES.json'), 'utf8'));
  } catch {
    return {};
  }
})();
const LIENS_MIN = REGLAGES.liens_internes_minimum ?? 3;
const [MOTS_MIN, MOTS_MAX] = REGLAGES.mots_par_article ?? [600, 1200];
const MOTS_PAR_PHRASE_MAX = REGLAGES.mots_par_phrase_moyenne_max ?? 20;
const PHRASE_LONGUE = REGLAGES.phrase_longue_mots ?? 35;
const LISIBILITE_MIN = REGLAGES.lisibilite_min ?? 60;
const TITRE_SEO_MAX = REGLAGES.titre_seo_max ?? 47;

/* ------------------------------------------------------------------ regles */

/**
 * Les allegations therapeutiques et les diagnostics poses sur le lecteur.
 *
 * Un cosmetique nettoie, protege, parfume, entretient (reglement (CE)
 * 1223/2009, article 2) : il ne soigne pas. Un article decrit des gestes et des
 * compositions ; il ne promet jamais de soigner une maladie de peau, et ne
 * pose jamais d'etiquette medicale sur celui qui le lit (`docs/seo/ROBOT.md`,
 * section 5).
 *
 * Chaque motif se lit dans un seul morceau de texte (un paragraphe, un element
 * de liste, une reponse de FAQ). Il est **tolere** quand ce morceau renvoie
 * lui-meme a un professionnel de sante ou dit qu'un cosmetique ne soigne pas :
 * c'est le cas du paragraphe « une acne severe se traite chez le
 * dermatologue ». Partout ailleurs, il bloque.
 */
const MALADIES =
  "acn[ée]\\w*|ecz[ée]ma\\w*|psoriasis|ros[ae]c[ée]e|dermatite\\w*|dermatose\\w*|mycose\\w*|cancers?|m[ée]lanome\\w*|vitiligo|herp[èe]s|verrues?|infections?|allergies?|cicatrices? ch[ée]lo[iï]des?|alop[ée]cie|calvitie";
const MEDICAL = [
  [new RegExp(`\\b(gu[ée]ri\\w*|soign\\w*|trait(e|es|ent|er|ez|ons|ement|ements)|soulag\\w*|r[ée]par\\w* d[ée]finitivement)\\b[^.!?]{0,50}\\b(${MALADIES})`, 'i'), 'allegation therapeutique'],
  [new RegExp(`\\b(${MALADIES})\\b[^.!?]{0,30}\\b(dispara[iî]t\\w*|gu[ée]ri\\w*|soign[ée]\\w*|en finir)\\b`, 'i'), 'allegation therapeutique'],
  [/\banti-?(cancer|cancéreux|cancereux|tumeur|tumoral)\w*/i, 'allegation therapeutique'],
  [/\b(pr[ée]vien\w*|pr[ée]ven\w*|prot[èeé]g\w*|r[ée]dui\w* (le |les )?risques?)\b[^.!?]{0,40}\b(du |le |les |d['’]un |contre le )?(cancer|m[ée]lanome)/i, 'promesse de prevention'],
  [new RegExp(`\\btu (as|aurais|souffres? d[e'’]|fais|ferais) (s[ûu]rement |probablement |peut-[êe]tre |s[ûu]rement )?(un |une |de l['’]|de la |d['’]|l['’]|la |le |des )?\\s?(${MALADIES}|trouble\\w*)`, 'i'), 'diagnostic pose sur le lecteur'],
  [/\b(ta peau est|t['’]as une peau|tu as une peau) (s[ûu]rement |probablement )?(malade|atopique|ros[ae]c[ée]e|ecz[ée]mateuse)/i, 'diagnostic pose sur le lecteur'],
];

/** Ce qui rend un motif medical tolerable dans son morceau de texte. */
const TOLERANCE =
  /dermatolog|m[ée]decin|pharmacien|professionnel de sant[ée]|diagnosti|consult(e|er|ez)\b|avis m[ée]dical|ordonnance|ne soigne pas|ne traite pas|pas un m[ée]dicament|n['’]est pas un m[ée]dicament|m[ée]dicament/i;

/**
 * Les mots qui font peur sur un ingredient. Un article qui les emploie cite au
 * moins une source officielle : la doctrine interdit l'alarmisme non source
 * (perturbateurs endocriniens, parabenes, aluminium), et c'est le seul moyen
 * verifiable d'en etre sur.
 */
const ALARME =
  /perturbateurs? endocriniens?|parab[èe]nes?|sels? d['’]aluminium|cancérog[èe]ne|cancérig[èe]ne|canc[ée]rog[èe]ne|canc[ée]rig[èe]ne|toxiques?|neurotoxi\w*|reprotoxi\w*|\bCMR\b/i;
const SOURCES_OFFICIELLES =
  /(ansm\.sante\.fr|anses\.fr|health\.ec\.europa\.eu|ec\.europa\.eu|europa\.eu|eur-lex\.europa\.eu|echa\.europa\.eu|efsa\.europa\.eu|legifrance\.gouv\.fr|sante\.gouv\.fr|who\.int|iarc\.who\.int|cancer\.fr|inserm\.fr|has-sante\.fr)/i;

/**
 * Aucune celebrite (ni personne) ne doit sembler utiliser ou recommander
 * Cosme Check. Le site ne le sait pas, et l'ecrire serait faux et trompeur.
 */
/*
  Un sujet a la troisieme personne (un nom propre, « il », « elle », « la
  star »...) suivi d'un verbe d'usage ou de recommandation, puis Cosme Check
  dans la meme phrase ; ou Cosme Check « recommande par ». L'imperatif adresse
  au lecteur (« Scanne ton produit avec Cosme Check », « Telecharge Cosme
  Check ») est le registre normal du site et ne doit pas tomber : il n'a pas
  de sujet, et « Tu », « Je », « Nous » sont exclus.
*/
const ENDOSSEMENT = new RegExp(
  "(?<![\\p{L}])(?!(?:Tu|Je|Nous|Vous|On|Ou|Et|Puis|Alors|Donc|Mais|Si|Ensuite|Sinon|Bref|Enfin|Ici|Pour|Avec|Le|La|Les|Un|Une|Ton|Ta|Tes|Ce|Cette|Chaque|Toujours|Pense|Fais)\\b)([Ii]l|[Ee]lle|[Ii]ls|[Ee]lles|[Ll]a star|[Ll]e joueur|[Ll]a joueuse|l['’]actrice|l['’]acteur|la chanteuse|le chanteur|l['’]influenceuse|l['’]influenceur|\\p{Lu}[\\p{L}'’-]+(?: \\p{Lu}[\\p{L}'’-]+)?) (?:aussi |m[êe]me |d[ée]j[àa] |elle-m[êe]me |lui-m[êe]me |toujours )?(utilise|utilisent|utilisait|recommande|recommandent|adore|adorent|scanne|scannent|conseille|conseillent|valide|valident|approuve|approuvent|t[ée]l[ée]charge)\\b[^.!?]{0,30}\\bCosme ?Check\\b|\\bCosme ?Check\\b[^.!?]{0,25}\\b(recommand[ée]e?s? par|utilis[ée]e?s? par|valid[ée]e?s? par|approuv[ée]e?s? par)\\b",
  "u",
);

/** Un prix ecrit en dur. Les prix vivent chez les magasins et changent selon le pays. */
const PRIX = /\d+([.,]\d+)?\s?(€|euros?\b|EUR\b|\$|USD\b|dollars?\b|£)|(€|\$|£)\s?\d+([.,]\d+)?/i;

/** Une note de produit sur 20 : elle doit venir de la base (champ `notes`). */
const NOTE_SUR_20 = /\b(\d{1,2}(?:[.,]\d)?)\s?\/\s?20\b/g;

/** Ce que l'outil photo laisse a ecrire, et qu'il ne faut jamais publier. */
const A_ECRIRE = /<(À ÉCRIRE|A ECRIRE)>/i;

/** Le vouvoiement, que le site n'emploie pas. */
const VOUVOIEMENT = /\b(vous|votre|vos)\b/i;

/**
 * Les adjectifs que le tutoiement accorde au masculin sans y penser : « tu es
 * sur ». La doctrine dit de tourner la phrase autrement (« tu en es certain »
 * ne vaut pas mieux : « c'est certain »).
 */
const GENRE =
  /\b(tu es|t['’]es|tu seras|tu te sens|tu te sentiras|si tu es) (s[ûu]r|certain|pr[êe]t|fatigu[ée]|perdu|convaincu|tent[ée]|oblig[ée]|habitu[ée]|press[ée]|stress[ée]|d[ée][çc]u|content|heureux|ravi|curieux|gên[ée]|complex[ée]|s[ée]duit|accro|fan|d[ée]butant|motiv[ée])\b/i;

/**
 * Les termes techniques qu'un lecteur de 15 ans ne connait pas. La premiere
 * fois qu'un article en emploie un, le meme morceau de texte l'explique (une
 * parenthese, un deux-points, « c'est », « qui », « autrement dit »).
 */
const TERMES = [
  'INCI', 'comédogène', 'non comédogène', 'pH', 'SPF', 'UVA', 'UVB', 'BHA', 'AHA', 'PHA', 'rétinol', 'rétinoïde',
  'niacinamide', 'céramides', 'humectant', 'émollient', 'occlusif', 'sébum', 'exfoliant', 'acide hyaluronique',
  'perturbateur endocrinien', 'filtre minéral', 'filtre chimique', 'microbiome', 'barrière cutanée', 'kératine',
  'tensioactif', 'conservateur', 'allergène',
];
const EXPLIQUE = /\(|:|c['’]est |qui |autrement dit|signifie|veut dire|désigne|soit |= /i;

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;
const IMAGE = /^\/image\/(blog|landing)\/[A-Za-z0-9/_-]+\.webp$/;

/* ---------------------------------------------------------------- lecture */

function modifies() {
  try {
    const sortie = execSync('git status --porcelain -- contenu public/image/blog', { cwd: racine, encoding: 'utf8' });
    return new Set(
      sortie
        .split('\n')
        .filter(Boolean)
        .map((ligne) => ligne.slice(3).trim().replace(/^"|"$/g, '').replace(/\\/g, '/')),
    );
  } catch {
    return new Set();
  }
}

/** Chaque morceau de texte d'un article, avec ce qu'il est : c'est l'unite des regles de fond. */
function morceaux(a) {
  const m = [
    ['titre', a.titre],
    ['titreSeo', a.titreSeo],
    ['resume', a.resume],
    ['chapo', a.chapo],
    ['theme', a.theme],
    ['couverture.alt', a.couverture?.alt],
  ];
  for (const [i, b] of (a.blocs ?? []).entries()) {
    const ou = `bloc ${i + 1} (${b.type})`;
    if (b.type === 'liste') for (const item of b.items ?? []) m.push([ou, item]);
    else if (b.type === 'encadre') m.push([ou, b.titre], [ou, b.texte]);
    else if (b.type === 'image') m.push([`${ou} alt`, b.alt], [ou, b.legende], [`${ou} credit`, b.credit]);
    else if (b.type === 'citation') m.push([ou, b.texte], [ou, b.source]);
    else if (b.type === 'tableau') for (const c of [...(b.entetes ?? []), ...(b.lignes ?? []).flat(), b.legende]) m.push([ou, c]);
    else if (b.type === 'fiche') m.push([ou, b.titre], [ou, b.effet], [ou, b.statut]);
    else m.push([ou, b.texte]);
  }
  for (const [i, q] of (a.faq ?? []).entries()) m.push([`faq ${i + 1}`, q.question], [`faq ${i + 1}`, q.reponse]);
  return m.filter(([, t]) => typeof t === 'string' && t !== '');
}

/** Les cibles des liens `[libelle](cible)` d'un texte. */
const liens = (t) => [...t.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]);
/** Le texte sans balisage. */
const brut = (t) => t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*|==|\+\+/g, '').replace(/\*([^*]+)\*/g, '$1');

/** Syllabes approximatives d'un mot francais : les groupes de voyelles, moins le e muet final. */
function syllabes(mot) {
  const m = mot.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let n = (m.match(/[aeiouy]+/g) ?? []).length;
  if (n > 1 && /[^aeiouy]e?s?$/.test(m) && /e(s|nt)?$/.test(m)) n -= 1;
  return Math.max(1, n);
}

/**
 * La lisibilite du texte courant (chapeau, paragraphes, listes, FAQ) : nombre
 * moyen de mots par phrase, phrases trop longues, et l'indice de Kandel et
 * Moles (1958), l'adaptation francaise de Flesch :
 * 207 - 1,015 x (mots / phrases) - 73,6 x (syllabes / mots). Au-dessus de 60,
 * un texte se lit sans effort a 15 ans ; c'est une mesure grossiere, d'ou un
 * simple avertissement.
 */
function lisibilite(textes) {
  const phrases = textes
    .map(brut)
    .join(' ')
    .split(/(?<=[.!?…])\s+|\s*\n+\s*/)
    .map((p) => p.trim())
    .filter((p) => p.split(/\s+/).length >= 3);
  const motsDe = (p) => p.split(/\s+/).filter((x) => /[a-zà-ÿ0-9]/i.test(x));
  const mots = phrases.flatMap(motsDe);
  if (!phrases.length || !mots.length) return null;
  const moyenne = mots.length / phrases.length;
  const syl = mots.reduce((s, m) => s + syllabes(m), 0) / mots.length;
  return {
    moyenne,
    longues: phrases.filter((p) => motsDe(p).length > PHRASE_LONGUE).length,
    indice: 207 - 1.015 * moyenne - 73.6 * syl,
  };
}

/** Charge un module ; rend `{ module }` ou `{ erreur }`, jamais d'exception. */
async function charger(fichier) {
  try {
    return { module: await import(pathToFileURL(fichier).href) };
  } catch (e) {
    return { erreur: e?.message ?? String(e) };
  }
}

/** Le `.env` du depot, lu sans dependance (meme parseur que `lib.mjs`). */
function env() {
  const f = path.join(racine, '.env');
  if (!existsSync(f)) return {};
  return Object.fromEntries(
    readFileSync(f, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
      .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]),
  );
}

/**
 * Les notes de la base pour une liste de codes-barres, en lecture seule (un
 * GET PostgREST, schema `cosme_check`). `null` si la base ne repond pas : la
 * regle devient alors un avertissement, pas un faux echec.
 */
async function notesDeLaBase(eans) {
  if (horsLigne || !eans.length) return null;
  const e = env();
  const url = e.NEXT_PUBLIC_SUPABASE_URL || e.SUPABASE_URL;
  const cle = e.SUPABASE_SERVICE_ROLE_KEY || e.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !cle) return null;
  try {
    const r = await fetch(`${url.replace(/\/$/, '')}/rest/v1/catalog_export?select=code_barre,nom,note_affichee_sur_20&code_barre=in.(${eans.join(',')})`, {
      headers: { apikey: cle, Authorization: `Bearer ${cle}`, 'Accept-Profile': 'cosme_check' },
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return null;
    return new Map((await r.json()).map((l) => [String(l.code_barre), l]));
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------- execution */

const ecarts = [];
const dejaDits = new Set();
const signaler = (qui, message) => ecarts.push({ qui, message, bloquant: true });
const avertir = (qui, message) => ecarts.push({ qui, message, bloquant: toutBloquant });

const { CATEGORIES } = await site('contenu/rubriques.ts');
const { ancres } = await site('lib/article.ts');

/* Les articles, lus fichier par fichier : un fichier oublie du registre doit se voir. */
const articles = [];
for (const nom of readdirSync(DOSSIER).filter((f) => f.endsWith('.ts')).sort()) {
  const fichier = path.join(DOSSIER, nom);
  const qui = nom.replace(/\.ts$/, '');
  const { module, erreur } = await charger(fichier);
  if (erreur) {
    signaler(qui, `le fichier ne s'execute pas : ${erreur}`);
    continue;
  }
  if (!module.default || typeof module.default !== 'object') {
    signaler(qui, "pas d'export par defaut (`export default article;`)");
    continue;
  }
  articles.push({ qui, nom, fichier, source: readFileSync(fichier, 'utf8'), a: module.default });
}

/* Le registre : il se charge, et il liste chaque fichier. */
{
  const { module, erreur } = await charger(path.join(racine, 'contenu', 'articles.ts'));
  if (erreur) signaler('registre', `contenu/articles.ts refuse de se charger : ${erreur}`);
  else {
    const inscrits = new Set((module.ARTICLES ?? []).map((a) => a.slug));
    for (const { qui, a } of articles) {
      if (!inscrits.has(a.slug)) signaler(qui, 'absent de contenu/articles.ts (ligne import et entree du tableau ARTICLES)');
    }
  }
}

const slugs = new Set(articles.map((x) => x.a.slug));

/* Les pages connues, pour les liens internes : les dossiers de `app/` qui ont une page. */
const PAGES_CONNUES = new Set(['/', '/blog']);
(function parcourir(dossier, chemin) {
  for (const e of readdirSync(dossier, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (e.name.startsWith('(') || e.name.startsWith('[') || e.name.startsWith('_') || e.name === 'api') continue;
    const sous = path.join(dossier, e.name);
    const c = `${chemin}/${e.name}`;
    if (existsSync(path.join(sous, 'page.tsx'))) PAGES_CONNUES.add(c);
    parcourir(sous, c);
  }
})(path.join(racine, 'app'), '');
const ancresDe = new Map(
  articles.map(({ a }) => [`/blog/${a.slug}`, new Set([...ancres(a.blocs ?? []).filter(Boolean), 'questions-frequentes'])]),
);

/* Les notes citees, comparees a la base en une seule requete. */
const eans = [...new Set(articles.flatMap(({ a }) => (a.notes ?? []).map((n) => String(n.ean))))].filter((x) => /^\d{6,14}$/.test(x));
const base = await notesDeLaBase(eans);

const aJour = modifies();

for (const { qui, nom, fichier, source, a } of articles) {
  /* ---- enregistrement ---- */
  if (!SLUG.test(a.slug ?? '') || a.slug.length > 60) signaler(qui, `slug invalide : « ${a.slug} » ([a-z0-9-], 60 caracteres au plus)`);
  else if (a.slug.length > 40) avertir(qui, `slug de ${a.slug.length} caracteres : Apple ne garde que les 40 premiers dans la campagne (ct=)`);
  if (`${a.slug}.ts` !== nom) signaler(qui, `le fichier doit s'appeler ${a.slug}.ts, comme son slug`);
  if (!CATEGORIES.includes(a.categorie)) signaler(qui, `rubrique inconnue : « ${a.categorie} » (${CATEGORIES.join(', ')})`);
  if (!DATE_ISO.test(a.publieLe ?? '')) signaler(qui, 'publieLe absent ou pas au format AAAA-MM-JJ');
  if (!DATE_ISO.test(a.modifieLe ?? '')) signaler(qui, 'modifieLe absent ou pas au format AAAA-MM-JJ');
  else if (a.modifieLe < a.publieLe) signaler(qui, 'modifieLe anterieur a publieLe');
  if (!a.chapo?.trim()) signaler(qui, 'pas de chapo');
  if (!Array.isArray(a.blocs) || a.blocs.length === 0) signaler(qui, 'aucun bloc');

  /* ---- typographie, sur le fichier brut ---- */
  const tirets = [...source.matchAll(/[\u2013\u2014]/g)];
  if (tirets.length) {
    const ligne = source.slice(0, tirets[0].index).split('\n').length;
    signaler(qui, `${tirets.length} tiret(s) cadratin ou demi-cadratin, le premier ligne ${ligne} : couper la phrase, ou une virgule, un deux-points, une parenthese`);
  }

  /* ---- fond ---- */
  const textes = morceaux(a);
  let alarme = null;
  for (const [ou, texte] of textes) {
    const tolere = TOLERANCE.test(texte);
    for (const [motif, nature] of MEDICAL) {
      const m = texte.match(motif);
      const deja = `${qui}|${nature}|${ou}|${texte}`;
      if (!m || tolere || dejaDits.has(deja)) continue;
      dejaDits.add(deja);
      signaler(qui, `${nature}, ${ou} : « ${m[0]} » (tolere seulement dans un morceau qui renvoie a un dermatologue, un medecin ou un pharmacien, ou dit qu'un cosmetique ne soigne pas)`);
    }
    const e = texte.match(ENDOSSEMENT);
    if (e) signaler(qui, `${ou} : « ${e[0]} » laisse croire que quelqu'un utilise ou recommande Cosme Check`);
    const prix = texte.match(PRIX);
    if (prix) signaler(qui, `prix ecrit en dur, ${ou} : « ${prix[0]} » (les prix vivent chez les magasins)`);
    const trou = texte.match(A_ECRIRE);
    if (trou) signaler(qui, `texte laisse a ecrire, ${ou} : « ${trou[0]} »`);
    if (!alarme) {
      const m = texte.match(ALARME);
      if (m) alarme = [ou, m[0]];
    }
    if (!/ (alt|credit)$/.test(ou)) {
      const v = texte.match(VOUVOIEMENT);
      if (v) avertir(qui, `vouvoiement, ${ou} : « ${v[0]} » (le site tutoie)`);
      const g = texte.match(GENRE);
      if (g) avertir(qui, `genre presume, ${ou} : « ${g[0]} » (tourner la phrase sans accorder au lecteur)`);
    }
    for (const n of texte.matchAll(NOTE_SUR_20)) {
      const valeur = Number(n[1].replace(',', '.'));
      if (!(a.notes ?? []).some((x) => x.note === valeur)) {
        signaler(qui, `note « ${n[0]} », ${ou} : elle n'est declaree dans aucun releve \`notes\` (une note de produit vient de la base, jamais de memoire)`);
      }
    }
  }

  /* ---- sources ---- */
  const tousLiens = textes.flatMap(([, t]) => liens(t));
  const externes = tousLiens.filter((c) => /^https?:\/\//.test(c));
  if (alarme && !externes.some((c) => SOURCES_OFFICIELLES.test(c))) {
    signaler(qui, `parle de « ${alarme[1]} » (${alarme[0]}) sans aucune source officielle en lien (ANSM, SCCS / Commission europeenne, reglement 1223/2009, ECHA, Anses, EFSA...)`);
  }
  if (a.categorie === 'Célébrités' && externes.length < 2) {
    signaler(qui, `article Celebrites avec ${externes.length} source(s) : chaque affirmation sur une personnalite renvoie a ce qu'elle a dit ou montre elle-meme (interview, video, post), avec le lien`);
  }

  /* ---- notes de produits ---- */
  for (const n of a.notes ?? []) {
    if (!/^\d{6,14}$/.test(String(n.ean))) signaler(qui, `note de « ${n.produit} » : code-barres invalide (${n.ean})`);
    if (!DATE_ISO.test(n.releveeLe ?? '')) signaler(qui, `note de « ${n.produit} » : releveeLe absent`);
    if (base === null) {
      avertir(qui, `note de « ${n.produit} » non comparee a la base (hors ligne ou base injoignable)`);
      continue;
    }
    const l = base.get(String(n.ean));
    if (!l) signaler(qui, `note de « ${n.produit} » : le code-barres ${n.ean} est absent de la base`);
    else if (Number(l.note_affichee_sur_20) !== n.note) {
      signaler(qui, `note de « ${n.produit} » : l'article dit ${n.note}/20, la base dit ${l.note_affichee_sur_20}/20`);
    }
  }

  /* ---- liens ---- */
  const versArticles = new Set();
  for (const cible of tousLiens) {
    if (/^https?:\/\//.test(cible)) {
      if (/^https?:\/\/(www\.)?cosme-check\.com/i.test(cible)) avertir(qui, `lien absolu vers le site : ${cible} (ecrire le chemin, /blog/...)`);
      continue;
    }
    if (!cible.startsWith('/')) {
      signaler(qui, `lien ni externe ni interne : ${cible}`);
      continue;
    }
    const [chemin, ancre] = cible.split('#');
    const art = chemin.match(/^\/blog\/([^/]+)$/);
    if (art) {
      if (!slugs.has(art[1])) {
        signaler(qui, `lien casse vers un article inexistant : ${cible}`);
        continue;
      }
      if (art[1] === a.slug) avertir(qui, `l'article se cite lui-meme : ${cible}`);
      else versArticles.add(chemin);
      if (ancre && !ancresDe.get(chemin)?.has(ancre)) signaler(qui, `ancre inconnue dans ${chemin} : #${ancre}`);
      continue;
    }
    // Les fiches ingredient existent par milliers, en base : leur format suffit ici.
    if (/^\/i\/[a-z0-9-]+$/.test(chemin)) continue;
    const page = chemin.replace(/\/$/, '') || '/';
    if (!PAGES_CONNUES.has(page)) signaler(qui, `lien interne vers une page inconnue : ${cible}`);
  }

  /* ---- images : le credit est une obligation de licence ---- */
  const images = (a.blocs ?? []).filter((b) => b.type === 'image');
  if (!a.couverture?.src) signaler(qui, 'pas de couverture');
  for (const img of [a.couverture, ...images].filter(Boolean)) {
    const src = img.src;
    if (!IMAGE.test(src ?? '')) {
      signaler(qui, `image hors format : ${src} (attendu /image/blog/<nom>.webp)`);
      continue;
    }
    if (!existsSync(path.join(racine, 'public', src))) signaler(qui, `image absente du disque : public${src}`);
    const petite = src.replace(/\.webp$/, '-s.webp');
    if (!existsSync(path.join(racine, 'public', petite))) signaler(qui, `petite taille absente : public${petite} (700 px)`);
    if (!img.credit?.trim()) signaler(qui, `image ${src} sans credit`);
    if (!img.licence?.trim()) signaler(qui, `image ${src} sans licence`);
    if (img.credit?.trim() && img.credit.trim() !== 'Cosme Check' && !img.source?.trim()) {
      signaler(qui, `image ${src} sans source (la page d'origine est obligatoire pour une image qui n'est pas une illustration maison)`);
    }
    if (!img.alt?.trim()) avertir(qui, `image ${src} sans texte alternatif`);
    if (!(img.largeur > 0 && img.hauteur > 0)) signaler(qui, `image ${src} sans largeur ni hauteur`);
  }

  /* ---- forme : avertissements ---- */
  if ((a.titreSeo ?? '').length > TITRE_SEO_MAX) avertir(qui, `titreSeo de ${a.titreSeo.length} caracteres (${TITRE_SEO_MAX} au plus : le site ajoute « · Cosme Check »)`);
  const r = (a.resume ?? '').length;
  if (r < 50 || r > 160) avertir(qui, `resume de ${r} caracteres (50 a 160 : il est repris tel quel par Google et les IA)`);
  if (versArticles.size < LIENS_MIN) avertir(qui, `${versArticles.size} lien(s) vers d'autres articles (${LIENS_MIN} au moins)`);
  const h2 = (a.blocs ?? []).filter((b) => b.type === 'h2').length;
  if (h2 < 3) avertir(qui, `${h2} section(s) h2 (3 au moins : le sommaire et l'appel du milieu en ont besoin)`);
  if (externes.length === 0) avertir(qui, 'aucune source externe (un lien https vers une etude, un texte officiel, une interview)');
  if (!a.faq?.length) avertir(qui, 'pas de FAQ (3 ou 4 questions, reprises des suggestions Google)');
  else if (a.faq.length < 3) avertir(qui, `FAQ de ${a.faq.length} question(s) (3 ou 4)`);
  const ctas = (a.blocs ?? []).filter((b) => b.type === 'cta').length;
  if (ctas > 1) avertir(qui, `${ctas} blocs cta (un au plus : la page place deja les autres appels)`);

  // Le texte qu'on lit : chapeau, blocs et FAQ, sans textes alternatifs ni credits.
  const courant = textes
    .filter(([ou]) => (ou === 'chapo' || ou.startsWith('bloc') || ou.startsWith('faq')) && !/ (alt|credit)$/.test(ou))
    .map(([, t]) => t);
  const mots = courant.map(brut).join(' ').split(/\s+/).filter(Boolean).length;
  if (mots < MOTS_MIN || mots > MOTS_MAX) avertir(qui, `${mots} mots (${MOTS_MIN} a ${MOTS_MAX})`);
  const minutes = Math.max(1, Math.round(mots / 200));
  if (Math.abs((a.minutes ?? 0) - minutes) > 1) avertir(qui, `minutes: ${a.minutes}, le texte en demande environ ${minutes} (mots / 200)`);

  /* ---- lisibilite : un ado de 15 ans doit suivre ---- */
  const lis = lisibilite(courant.filter((t) => !/^\s*\|/.test(t)));
  if (lis) {
    if (lis.moyenne > MOTS_PAR_PHRASE_MAX) avertir(qui, `phrases de ${lis.moyenne.toFixed(1)} mots en moyenne (${MOTS_PAR_PHRASE_MAX} au plus : couper)`);
    if (lis.longues > 0) avertir(qui, `${lis.longues} phrase(s) de plus de ${PHRASE_LONGUE} mots`);
    if (lis.indice < LISIBILITE_MIN) avertir(qui, `lisibilite ${lis.indice.toFixed(0)} (Kandel-Moles, ${LISIBILITE_MIN} au moins : mots plus courts, phrases plus courtes)`);
  }
  for (const terme of TERMES) {
    const motif = new RegExp(`(^|[^\\p{L}])${terme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'u');
    const premier = courant.find((t) => motif.test(brut(t)));
    if (premier && !EXPLIQUE.test(brut(premier))) avertir(qui, `terme « ${terme} » jamais explique la premiere fois qu'il apparait`);
  }

  const relatif = path.relative(racine, fichier).split(path.sep).join('/');
  if (aJour.has(relatif) || [...aJour].some((m) => m.endsWith('/') && relatif.startsWith(m))) ecarts.push({ qui, marque: true });
}

/* ------------------------------------------------------------------ sortie */

const marques = new Set(ecarts.filter((e) => e.marque).map((e) => e.qui));
let erreurs = 0;
let avertissements = 0;
for (const e of ecarts.filter((x) => !x.marque)) {
  const nom = `${e.qui}${marques.has(e.qui) ? ' *' : ''}`;
  if (e.bloquant) {
    erreurs += 1;
    console.log(`ERREUR  ${nom} : ${e.message}`);
  } else {
    avertissements += 1;
    console.log(`avert.  ${nom} : ${e.message}`);
  }
}

console.log(
  `\n${articles.length} articles, ${marques.size} modifie(s) depuis le dernier commit (*) : ` +
    `${erreurs} erreur(s), ${avertissements} avertissement(s).` +
    (base === null && eans.length ? '\n(notes non comparees a la base)' : '') +
    (erreurs ? '\nBLOQUE : corriger chaque ERREUR avant de publier.' : '\nOK : rien ne bloque la publication.'),
);
process.exitCode = erreurs > 0 ? 1 : 0;
