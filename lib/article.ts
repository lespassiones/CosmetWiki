import type { Article, Bloc } from "@/contenu/articles";

/**
 * Ce qui se calcule sur un article, une fois pour toutes les sorties.
 *
 * La page, le JSON-LD, le flux, la liste et les vérificateurs lisent tous le
 * texte d'un article : tout passe par ici, pour qu'un bloc ajouté demain soit
 * lu partout de la même façon. Rien dans ce fichier ne touche au DOM ni à
 * React : les scripts du robot le jouent tel quel avec Node.
 *
 * Porté de MemoryPilot (`src/lib/article.ts`), en français seulement.
 */

/** Tous les textes d'un bloc, dans l'ordre. Un bloc sans texte rend une liste vide. */
export function textesDuBloc(b: Bloc): string[] {
  switch (b.type) {
    case "liste":
      return [...b.items];
    case "encadre":
      return [b.titre, b.texte];
    case "image":
      return b.legende ? [b.legende] : [];
    case "citation":
      return b.source ? [b.texte, b.source] : [b.texte];
    case "tableau":
      return [...b.entetes, ...b.lignes.flat(), ...(b.legende ? [b.legende] : [])];
    case "fiche":
      return [b.titre, b.inci, b.effet, b.statut];
    case "cta":
      return b.texte ? [b.texte] : [];
    default:
      return [b.texte];
  }
}

/** Le texte entier d'un article (chapeau, blocs, FAQ) : ce qu'on compte et ce qu'on fouille. */
export function textesDeLArticle(a: Article): string[] {
  return [
    a.chapo,
    ...a.blocs.flatMap(textesDuBloc),
    ...(a.faq ?? []).flatMap((q) => [q.question, q.reponse]),
  ];
}

/** Le texte sans son balisage : `**gras**` perd ses étoiles, `[lien](cible)` garde son libellé. */
export function texteBrut(texte: string): string {
  return texte
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*|==|\+\+/g, "")
    .replace(/\*([^*]+)\*/g, "$1")
    .trim();
}

/** Le nombre de mots, pour `wordCount` et pour contrôler la durée annoncée. */
export function nombreDeMots(a: Article): number {
  return textesDeLArticle(a).map(texteBrut).join(" ").split(/\s+/).filter(Boolean).length;
}

/**
 * Les adresses externes citées par un article, une par domaine : ce que le
 * JSON-LD déclare en `citation`.
 */
export function sourcesCitees(a: Article): string[] {
  const vues = new Map<string, string>();
  for (const t of textesDeLArticle(a)) {
    for (const m of t.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) {
      const hote = new URL(m[1]).hostname.replace(/^www\./, "");
      if (!vues.has(hote)) vues.set(hote, m[1]);
    }
  }
  return [...vues.values()];
}

/**
 * Les identifiants déjà pris sur la page, qu'un titre ne doit pas reprendre :
 * deux éléments de même `id`, et l'ancre mène au premier.
 */
const RESERVES = ["contenu", "cta-fin", "article", "sommaire"];

/** L'ancre de la section « Questions fréquentes », quand l'article en a une. */
export const ANCRE_FAQ = "questions-frequentes";

/** L'ancre d'un titre : sans accents, sans balisage, en minuscules et tirets. */
export function idTitre(texte: string): string {
  return (
    texteBrut(texte)
      .normalize("NFD")
      // Les accents séparés par `NFD`, écrits en points de code : ce sont des
      // caractères combinants, invisibles dans un éditeur qui les recollerait.
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      .replace(/-+$/, "") || "section"
  );
}

/**
 * Une ancre par titre (`h2`, `h3`, `fiche`), alignée sur les blocs :
 * `ancres[i]` est celle du bloc `i`, `undefined` s'il n'est pas un titre. Deux
 * titres identiques reçoivent `-2`, `-3`. Un seul calcul, lu par le rendu
 * **et** par le sommaire, pour que les deux désignent les mêmes ancres.
 */
export function ancres(blocs: readonly Bloc[]): (string | undefined)[] {
  const prises = new Set<string>([...RESERVES, ANCRE_FAQ]);
  return blocs.map((b) => {
    if (b.type !== "h2" && b.type !== "h3" && b.type !== "fiche") return undefined;
    const base = idTitre(b.type === "fiche" ? b.titre : b.texte);
    let id = base;
    for (let n = 2; prises.has(id); n += 1) id = `${base}-${n}`;
    prises.add(id);
    return id;
  });
}

/** Le sommaire : les titres de niveau 2, dans l'ordre, avec leur ancre. */
export function sommaire(blocs: readonly Bloc[]): { id: string; texte: string }[] {
  const ids = ancres(blocs);
  return blocs.flatMap((b, i) =>
    b.type === "h2" ? [{ id: ids[i] as string, texte: texteBrut(b.texte) }] : [],
  );
}

/**
 * Où poser les deux appels à télécharger qui vivent dans le texte.
 *
 * - **haut** : juste avant le premier `h2`, c'est-à-dire après le chapeau et
 *   l'introduction. Le lecteur sait de quoi on parle, et c'est là qu'il
 *   décide s'il reste.
 * - **milieu** : avant le `h2` qui tombe à la moitié des titres. Jamais avant
 *   le premier (le haut y est déjà), jamais au milieu d'une section.
 *
 * Un bloc `cta` écrit dans l'article remplace le milieu calculé. Les indices
 * rendus sont ceux du bloc **avant lequel** poser l'appel ; `null` quand il
 * n'y a pas de place.
 */
export function placesDesAppels(blocs: readonly Bloc[]): { haut: number | null; milieu: number | null } {
  const titres = blocs.flatMap((b, i) => (b.type === "h2" ? [i] : []));
  const haut = titres[0] ?? null;
  if (blocs.some((b) => b.type === "cta")) return { haut, milieu: null };
  const rang = Math.floor(titres.length / 2);
  return { haut, milieu: rang > 0 ? titres[rang] : null };
}

/**
 * Les articles à proposer à côté d'un article : d'abord la même rubrique, puis
 * les autres, du plus récent au plus ancien.
 *
 * ⚠️ **La dernière place revient toujours à l'article le plus récent du
 * blog.** Sans elle, un article publié ce matin n'apparaîtrait sous aucun
 * autre tant qu'il n'est pas le plus récent de sa rubrique ; avec elle, chaque
 * publication reçoit un lien depuis toutes les pages d'article le jour même,
 * ce qui fait explorer une page neuve. Règle reprise de RevealChat et de
 * MemoryPilot.
 */
export function suggestions(article: Article, liste: readonly Article[], combien = 3): Article[] {
  const autres = liste.filter((a) => a.slug !== article.slug);
  const recent = autres[0];
  if (!recent) return [];
  const ordre = [...autres.filter((a) => a.categorie === article.categorie), ...autres];
  const vus = new Set<string>([recent.slug]);
  const choix: Article[] = [];
  for (const a of ordre) {
    if (choix.length >= combien - 1) break;
    if (vus.has(a.slug)) continue;
    vus.add(a.slug);
    choix.push(a);
  }
  return [...choix, recent];
}

/** Ce que la liste du blog et l'accueil lisent d'un article : tout, sauf son corps. */
export type FicheArticle = Pick<
  Article,
  "slug" | "titre" | "resume" | "categorie" | "publieLe" | "minutes"
> & { image: string; imagePetite: string; alt: string; date: string };

/**
 * Les fiches d'une liste d'articles, sans leur corps.
 *
 * La liste du blog et le carrousel de l'accueil sont des composants client :
 * tout ce qu'on leur passe voyage dans la page. Leur donner les articles
 * entiers enverrait chaque texte complet au navigateur pour afficher une carte.
 */
export function fichesDe(articles: readonly Article[]): FicheArticle[] {
  return articles.map((a) => ({
    slug: a.slug,
    titre: a.titre,
    resume: a.resume,
    categorie: a.categorie,
    publieLe: a.publieLe,
    minutes: a.minutes,
    image: a.couverture.src,
    imagePetite: petiteImage(a.couverture.src),
    alt: a.couverture.alt,
    date: dateLongue(a.publieLe),
  }));
}

/** La petite taille d'une image (700 px) : `<nom>-s.webp` à côté de `<nom>.webp`. */
export function petiteImage(src: string): string {
  return src.replace(/\.webp$/, "-s.webp");
}

const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/**
 * « 2026-04-15 » devient « 15 avril 2026 ». Écrit à la main plutôt que par
 * `Intl` : le serveur de build et le navigateur rendent le même texte, et
 * l'hydratation ne voit jamais deux dates différentes.
 */
export function dateLongue(iso: string): string {
  const [a, m, j] = iso.split("-").map(Number);
  return `${j === 1 ? "1er" : j} ${MOIS[m - 1]} ${a}`;
}

/**
 * Les espaces insécables du français, posées au rendu.
 *
 * Le français met une espace avant `:`, `;`, `!`, `?` et `»`, et après `«`.
 * Écrite ordinaire, elle laisse le navigateur couper la ligne juste avant le
 * signe : sur un téléphone, un titre commençait sa deuxième ligne par un
 * deux-points. Les articles s'écrivent avec des espaces ordinaires (c'est ce
 * que tape un rédacteur, humain ou robot), et la page les rend insécables.
 */
export function insecables(texte: string): string {
  return texte.replace(/ ([:;!?»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");
}
