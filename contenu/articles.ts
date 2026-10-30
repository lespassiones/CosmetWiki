/**
 * Les articles du blog : le registre, et le format d'un article.
 *
 * Le contenu vit en données, pas en JSX : c'est ce qui permet à une seule
 * source d'alimenter la page de l'article, la liste du blog, le carrousel de
 * l'accueil, le plan du site, le flux RSS et le JSON-LD. Un article rédigé
 * directement dans une page serait invisible pour tous les autres, et c'est
 * ce qui se passait avant le 19/10/2026 : douze pages écrites à la main, douze
 * façons d'écrire un encadré.
 *
 * Le site est **en français seulement** (l'app n'existe qu'en français) : pas
 * de traduction, pas de `hreflang`, pas de table de clés entre deux langues.
 *
 * # Publier un article, pas à pas
 *
 * 1. **Choisir le slug** : `[a-z0-9-]`, **40 caractères au plus** de préférence
 *    (60 au maximum), choisi sur la requête visée et pas sur le titre. Il ne
 *    change plus jamais une fois publié : l'adresse est `/blog/<slug>`, et le
 *    slug sert aussi de campagne jusqu'aux magasins (`/dl?c=<slug>`), où Apple
 *    ne garde que les 40 premiers caractères.
 * 2. **Écrire le fichier** `contenu/articles/<slug>.ts`, sur le modèle d'un
 *    article voisin :
 *
 *    ```ts
 *    import type { Article } from "@/contenu/articles";
 *
 *    const article: Article = {
 *      slug: "le-slug",
 *      // … les champs décrits plus bas, dans le type `Article`
 *    };
 *
 *    export default article;
 *    ```
 * 3. **L'inscrire ici** : une ligne `import` et une entrée dans `ARTICLES`.
 *    L'ordre du tableau ne compte pas, la liste se trie par date.
 * 4. **Vérifier** : `npm run seo:verifier`, `npx tsc --noEmit`,
 *    `npm run build`, puis `npm run seo:banc`.
 *
 * Rien d'autre à toucher : la liste du blog, l'accueil, le plan du site, le
 * flux, le sommaire, les cinq appels à télécharger, la FAQ en données
 * structurées et la colonne « À lire ensuite » se déduisent de ces fichiers.
 *
 * # Les règles que les vérificateurs tiennent, et celles qu'ils ne voient pas
 *
 * - ⚠️ **Aucun tiret cadratin ni demi-cadratin**, nulle part : coupe la
 *   phrase, ou mets une virgule, un deux-points, une parenthèse.
 * - ⚠️ **`resume` est repris tel quel** dans la balise `description`, le
 *   JSON-LD et le flux : **entre 50 et 160 caractères**, et il tient debout
 *   seul.
 * - **`titreSeo` fait 47 caractères au plus** : le gabarit du site y ajoute
 *   « · Cosme Check » (15 caractères), et Google coupe au-delà d'environ 62.
 * - **Au moins trois `h2`** : le sommaire en a besoin, et l'appel du milieu se
 *   pose avant le `h2` qui tombe à la moitié des titres.
 * - **Des sources** : au moins un lien externe `https://`. Un article qui
 *   parle de perturbateurs endocriniens, de parabènes, d'aluminium ou de
 *   cancer cite une source officielle (ANSM, SCCS, règlement européen
 *   1223/2009, ECHA, Anses, EFSA), avec l'année.
 * - **Aucune allégation thérapeutique**, aucun diagnostic posé sur le lecteur,
 *   aucun prix, aucune note de produit qui ne vienne pas de la vraie base
 *   (champ `notes`).
 * - Le texte **tutoie**, sans présumer le genre du lecteur, et se lit
 *   facilement à 15 ans : phrases courtes, chaque terme technique expliqué la
 *   première fois.
 * - Quand un ingrédient précis est cité, le lien vers sa fiche (`/i/<slug>`)
 *   aide le lecteur : ces fiches attirent déjà de la recherche.
 *
 * # Le balisage du texte
 *
 * Rendu par `components/blog/TexteRiche.tsx`, qui construit des éléments
 * React et jamais du HTML : un article ne peut pas devenir du code.
 *
 * | écrit | rendu |
 * |---|---|
 * | `[le libellé](la cible)` | un lien (interne si la cible commence par `/`) |
 * | `**gras**` | du gras |
 * | `*italique*` | de l'italique (un nom de produit, une image) |
 * | `==surligné==` | le surligneur jaune du site, pour le chiffre ou la règle à retenir |
 * | `++souligné++` | le soulignement rose, pour l'idée qui retourne la phrase |
 *
 * Ils valent dans `chapo`, `p`, `liste`, `encadre`, `citation`, `tableau`,
 * `fiche`, `cta` et les réponses de la FAQ ; pas dans les titres.
 *
 * # Les images
 *
 * Une image vit dans `public/image/blog/…` (ou `public/image/landing/…`), en
 * WebP et **en deux tailles** : `<nom>.webp` (1200 px de large au plus) et
 * `<nom>-s.webp` (700 px), que le navigateur choisit selon l'écran.
 * `npm run seo:photo` fabrique les deux. `largeur` et `hauteur` sont celles
 * du grand fichier. **`credit` et `licence` sont obligatoires**, au niveau du
 * type : une image sans eux ne compile pas.
 */
import type { Categorie } from "@/contenu/rubriques";

import analyseComposition from "./articles/analyse-composition-cosmetique";
import bakuchiol from "./articles/bakuchiol";
import ceraveCremeHydratante from "./articles/cerave-creme-hydratante";
import calendrierAvent from "./articles/calendrier-avent-beaute";
import comedogene from "./articles/comedogene";
import cosmetiqueFaitPourToi from "./articles/cosmetique-fait-pour-toi";
import cremeNivea from "./articles/creme-nivea-composition";
import cremeSolaireCoreenne from "./articles/creme-solaire-coreenne-k-beauty";
import cremesHydratantesReparatrices from "./articles/cremes-hydratantes-reparatrices";
import deodorantAluminium from "./articles/deodorant-sels-aluminium-verite";
import lipOils from "./articles/lip-oils-huiles-levres";
import masqueBiodance from "./articles/masque-biodance";
import masqueLed from "./articles/masque-led-visage";
import meilleuresCremesHydratantes from "./articles/meilleures-cremes-hydratantes-visage";
import antiImperfections from "./articles/meilleurs-produits-anti-imperfections";
import niacinamide from "./articles/niacinamide";
import pdrn from "./articles/pdrn";
import peauSecheVisage from "./articles/peau-seche-visage";
import perturbateursEndocriniens from "./articles/perturbateurs-endocriniens-cosmetiques-2026";
import routineFoot from "./articles/routine-peau-joueurs-foot";
import routineSkincare from "./articles/routine-skincare";
import serums from "./articles/serums-visage-guide";
import spf50 from "./articles/spf-50-visage-7-erreurs";

export { CATEGORIES, type Categorie } from "@/contenu/rubriques";

/**
 * Le crédit d'une image : qui l'a faite, sous quelle licence, d'où elle vient.
 *
 * ⚠️ **Ce n'est pas décoratif.** Une photo sous licence Creative Commons
 * **oblige** à nommer l'auteur et la licence, et à pointer vers l'original.
 * Une image dont le crédit manque n'est pas une image mal légendée, c'est une
 * image utilisée sans droit. Le type l'exige donc, plutôt que de compter sur
 * la relecture.
 *
 * Les nouvelles images viennent de banques libres (`npm run seo:photo` :
 * Openverse, Wikimedia Commons ; CC0, domaine public, CC BY, CC BY-SA) et
 * portent toutes `source`, l'adresse de leur page d'origine. Jamais la photo
 * d'une célébrité : une photo d'ambiance libre à la place.
 *
 * Les illustrations des douze premiers articles (avant le 19/10/2026) sont
 * marquées `credit: "Cosme Check"`, `licence: "illustration générée par IA
 * pour Cosme Check"`, sans `source` : leurs fichiers ne portent aucune
 * métadonnée, et `docs/blog-idees/` garde les prompts de génération de ce
 * lot. C'est une déduction, pas une preuve : une image dont l'origine serait
 * autre se remplace par une photo libre.
 */
export type Credit = {
  /** L'auteur, ou « Cosme Check » pour une illustration maison. */
  credit: string;
  /** La licence telle qu'on l'écrit : « CC BY 2.0 », « CC0 », « domaine public », « illustration générée par IA pour Cosme Check ». */
  licence: string;
  /** La page d'origine. Obligatoire pour toute image qui n'est pas une illustration maison. */
  source?: string;
};

export type Image = Credit & {
  /** `/image/blog/<nom>.webp` : le fichier `<nom>-s.webp` (700 px) doit exister à côté. */
  src: string;
  /** Ce que montre l'image, pour qui ne la voit pas. */
  alt: string;
  largeur: number;
  hauteur: number;
  /**
   * Le cadrage de la couverture dans le bandeau de l'article, facultatif :
   * deux pourcentages, horizontal puis vertical (`"50% 40%"`), comme
   * `object-position` en CSS. Le bandeau fait toute la largeur de l'écran et
   * 420 à 520 px de haut : une image carrée ou en hauteur y est recadrée, et
   * le centre (`"50% 50%"`, la valeur par défaut) peut couper le sujet.
   * `"50% 30%"` remonte le cadre vers le haut de l'image, `"50% 70%"` le
   * descend. Ignoré ailleurs (cartes, colonne « À lire ensuite »). À vérifier
   * sur une capture, à 1440 px et à 390 px de large.
   */
  position?: string;
};

/** Le ton d'un encadré : la couleur de sa bordure et de son titre. */
export type TonEncadre = "emeraude" | "rose" | "indigo" | "ambre" | "violet";

/**
 * Un bloc d'article, dans l'ordre où il s'affiche.
 *
 * | `type` | ce qu'il rend |
 * |---|---|
 * | `p` | un paragraphe |
 * | `h2` | un titre de section : il entre au sommaire et reçoit une ancre |
 * | `h3` | un sous-titre, hors du sommaire |
 * | `liste` | une liste ; `style` : `puces` (défaut), `coches` (✓ vert), `alertes` (! rose), `numeros` (1, 2, 3) |
 * | `citation` | une citation en exergue, avec sa source facultative |
 * | `encadre` | un encadré à bordure de couleur : un titre court (« À retenir », « La solution ») et un texte |
 * | `tableau` | un tableau : une ligne d'en-têtes, puis les lignes |
 * | `fiche` | la carte d'une substance : nom, nom INCI, niveau de preuve, effet documenté, statut européen |
 * | `image` | une illustration, avec son crédit |
 * | `cta` | l'appel à télécharger du milieu, voir plus bas |
 */
export type Bloc =
  | { type: "p"; texte: string }
  | { type: "h2"; texte: string }
  | { type: "h3"; texte: string }
  | {
      type: "liste";
      items: readonly string[];
      style?: "puces" | "coches" | "alertes" | "numeros";
    }
  | { type: "citation"; texte: string; source?: string }
  | { type: "encadre"; titre: string; texte: string; ton?: TonEncadre }
  | {
      type: "tableau";
      entetes: readonly string[];
      lignes: readonly (readonly string[])[];
      /** Une phrase sous le tableau, facultative. */
      legende?: string;
    }
  | {
      type: "fiche";
      titre: string;
      inci: string;
      niveau: "prouve" | "suspecte" | "incertain";
      effet: string;
      statut: string;
    }
  | (Image & {
      type: "image";
      /** Une phrase sous l'image, facultative. Le crédit s'affiche toujours. */
      legende?: string;
    })
  /**
   * L'appel à télécharger du milieu de l'article, à l'endroit choisi.
   *
   * Sans bloc `cta`, la page en pose un d'office avant le `h2` qui tombe à la
   * moitié des titres, avec une phrase générique. En écrire un sert à choisir
   * l'endroit **et** la phrase : `texte` est l'accroche au-dessus du bouton,
   * liée à ce que l'article vient de dire (« Ta crème solaire, scanne-la : tu
   * sauras en dix secondes quels filtres elle contient »). Un seul par
   * article. Le bouton, lui, est toujours le même.
   */
  | { type: "cta"; texte?: string; bouton?: string };

/** Une question de la FAQ : la phrase qu'on taperait dans Google, et une réponse directe. */
export type QuestionArticle = { question: string; reponse: string };

/**
 * Une note de produit citée dans l'article, relevée dans la vraie base.
 *
 * ⚠️ **Un article ne cite jamais une note « Cosme Check » de mémoire.** Une
 * note écrite dans un texte est une affirmation sur un produit et sa marque :
 * si elle ne correspond pas à ce que l'app affiche, elle est fausse, et elle
 * l'est publiquement. Chaque note citée (« 16/20 ») est donc déclarée ici avec
 * le code-barres du produit et la date du relevé, et `seo:verifier` la
 * compare à la base (`cosme_check.catalog`). Sans relevé, on ne cite pas de
 * note.
 */
export type NoteReleve = {
  produit: string;
  /** Le code-barres (EAN) du produit dans le catalogue. */
  ean: string;
  /** La note sur 20, telle que l'app l'affiche. */
  note: number;
  /** AAAA-MM-JJ. */
  releveeLe: string;
};

export type Article = {
  /** L'adresse, sans `/blog/` : `[a-z0-9-]`, définitive. */
  slug: string;
  /** Le titre affiché en `h1`. Il peut accrocher fort, il n'est pas le titre de l'onglet. */
  titre: string;
  /** Le titre de l'onglet et des résultats Google : 47 caractères au plus, la requête au début. */
  titreSeo: string;
  /** La description : entre 50 et 160 caractères, et elle tient debout seule. */
  resume: string;
  /**
   * Le chapeau, en tête de l'article et en plus grand : la réponse est dans
   * la première phrase. Deux ou trois phrases au plus.
   */
  chapo: string;
  /** Format ISO (`2026-10-19`) : la date que Google affiche. Elle ne bouge plus. */
  publieLe: string;
  /** Format ISO. La date de la dernière retouche réelle ; égale à `publieLe` le jour de la publication. */
  modifieLe: string;
  /** La durée de lecture annoncée, en minutes : le nombre de mots divisé par 200, arrondi. */
  minutes: number;
  /** Le mot-clé principal, écrit une fois pour être relu, pas pour être bourré. */
  theme: string;
  /** Quelques requêtes voisines, reprises dans `keywords`. Facultatif. */
  motsCles?: readonly string[];
  /** La rubrique, affichée sur la carte et servant de filtre. */
  categorie: Categorie;
  /**
   * L'image de la carte, de l'en-tête de l'article, de la colonne « À lire
   * ensuite » et des aperçus de lien. Obligatoire, avec son crédit.
   */
  couverture: Image;
  blocs: readonly Bloc[];
  /** Les questions fréquentes, en bas de l'article et en `FAQPage`. */
  faq?: readonly QuestionArticle[];
  /** Les notes de produits citées dans le texte, relevées dans la base. Voir `NoteReleve`. */
  notes?: readonly NoteReleve[];
};

export const ARTICLES: readonly Article[] = [
  spf50,
  cremeSolaireCoreenne,
  cremesHydratantesReparatrices,
  lipOils,
  perturbateursEndocriniens,
  masqueLed,
  serums,
  routineFoot,
  deodorantAluminium,
  antiImperfections,
  cosmetiqueFaitPourToi,
  meilleuresCremesHydratantes,
  cremeNivea,
  niacinamide,
  analyseComposition,
  calendrierAvent,
  comedogene,
  masqueBiodance,
  bakuchiol,
  peauSecheVisage,
  routineSkincare,
  ceraveCremeHydratante,
  pdrn,
];

controlerRegistre(ARTICLES);

/**
 * Arrête le build sur un registre incohérent : deux articles au même slug, ou
 * un slug hors format. Appelée au chargement, donc par `next build`.
 */
function controlerRegistre(liste: readonly Article[]): void {
  const vus = new Set<string>();
  for (const a of liste) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(a.slug) || a.slug.length > 60) {
      throw new Error(`Article « ${a.slug} » : slug hors format ([a-z0-9-], 60 caractères au plus).`);
    }
    if (vus.has(a.slug)) throw new Error(`Deux articles portent le slug « ${a.slug} ».`);
    vus.add(a.slug);
  }
}

export function articleParSlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

/** Du plus récent au plus ancien : l'ordre de la liste, de l'accueil, du plan du site et du flux. */
export const ARTICLES_RECENTS: readonly Article[] = [...ARTICLES].sort(
  (a, b) => b.publieLe.localeCompare(a.publieLe) || b.modifieLe.localeCompare(a.modifieLe),
);
