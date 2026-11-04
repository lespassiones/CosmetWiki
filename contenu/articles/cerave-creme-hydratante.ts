import type { Article } from "@/contenu/articles";

/**
 * Publié le 28/10/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « comparatif honnête » (`meilleures-cremes-hydratantes-visage` sortait de la
 * fenêtre des dix derniers) : « cerave crème hydratante » pèse 10 k à 100 k
 * recherches par mois (+900 % sur un an), « crème cerave » 1 k à 10 k
 * (`docs/seo/VOLUMES.md`, 28/10/2026). Les premiers résultats sont des
 * pharmacies en ligne : aucune ne compare les formules de la marque entre
 * elles. Listes INCI, couleurs et notes relevées dans la base Cosme Check le
 * 28/10/2026 (`cosme_check.catalog_export` et `cosme_check.ingredients`) ;
 * les huit notes sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "cerave-creme-hydratante",
  titre: "Crème CeraVe : laquelle choisir ? On a lu 8 formules, et les « Intensif » perdent 4 points",
  titreSeo: "CeraVe crème hydratante : laquelle choisir ?",
  resume:
    "8 crèmes CeraVe lues et notées, et ce que disent les tests de Que Choisir et Test-Achats : la SPF 50 mesurée autour de SPF 20 en 2026.",
  chapo:
    "La meilleure crème CeraVe dépend de ta peau. Mais les formules les plus simples sont les mieux notées : le **Gel-crème Oil Control**, la **Crème hydratante visage** et le **Lait Hydratant**, de 12,12 à 12,34 sur 20. Les versions « Intensif » et celles avec SPF tombent sous 8. On a lu les huit listes pour te dire pourquoi, et ++quand le moins bien noté reste le bon choix++.",
  publieLe: "2026-10-28",
  modifieLe: "2026-11-04",
  minutes: 7,
  theme: "cerave crème hydratante",
  motsCles: [
    "cerave crème hydratante",
    "crème cerave",
    "cerave baume hydratant",
    "cerave crème hydratante visage",
    "cerave crème hydratante peau grasse",
    "cerave baume hydratant intensif",
    "cerave crème hydratante spf 50",
    "cerave avis",
  ],
  categorie: "Marques",
  couverture: {
    src: "/image/blog/cerave-creme-hydratante.webp",
    alt: "Une noisette de crème blanche posée sur un verre de montre transparent, sur un fond bleu vif.",
    largeur: 1200,
    hauteur: 900,
    credit: "Benff, via Wikimedia Commons",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Lotion_02.jpg",
  },
  blocs: [
    { type: "h2", texte: "Quelle crème hydratante CeraVe choisir ?" },
    {
      type: "p",
      texte:
        "Celle qui va à ta peau, et de préférence l'une des quatre formules de base. Toutes les crèmes hydratantes CeraVe reposent sur le même trio : de la glycérine, trois céramides et de l'acide hyaluronique. Ce qui change, c'est tout ce qu'on ajoute autour. Voici les huit crèmes les plus vendues, lues dans notre base.",
    },
    {
      type: "tableau",
      entetes: ["Crème", "Pour qui, selon la marque", "Ingrédients", "Note Cosme Check"],
      lignes: [
        ["Gel-crème Hydratant Oil Control (52 ml).", "Peaux mixtes à grasses.", "28, dont 1 orange.", "12,34 sur 20."],
        ["Crème Hydratante Visage (52 ml).", "Peaux normales à sèches.", "24, dont 2 orange.", "12,17 sur 20."],
        ["Lait Hydratant (473 ml).", "Visage et corps, peaux sèches.", "25, dont 3 orange.", "12,12 sur 20."],
        ["Baume Hydratant (454 g).", "Visage et corps, peaux sèches à très sèches.", "24, dont 3 orange.", "12,09 sur 20."],
        ["Baume Hydratant Intensif (340 g).", "Peaux très sèches.", "36, dont 6 orange.", "7,98 sur 20."],
        ["Crème Hydratante Visage SPF 30 (52 ml).", "Visage, le matin.", "36, dont 7 orange.", "7,87 sur 20."],
        ["Lait Hydratant Intensif (236 ml).", "Peaux très sèches.", "45, dont 8 orange.", "7,86 sur 20."],
        ["Crème Hydratante Visage SPF 50 (52 ml).", "Visage, le matin.", "39, dont 8 orange.", "7,85 sur 20."],
      ],
      legende:
        "Listes, couleurs et notes relevées dans la base Cosme Check le 28/10/2026. [Comment l'app classe les ingrédients](/comment-ca-marche).",
    },
    {
      type: "p",
      texte:
        "La règle saute aux yeux : ==plus la liste s'allonge, plus la note baisse==. Les quatre premières tiennent en 24 à 28 ingrédients. Les quatre dernières en comptent de 36 à 45, et chaque ajout amène son lot d'orange.",
    },

    { type: "h2", texte: "Qu'est-ce qu'il y a dans une crème CeraVe ?" },
    {
      type: "p",
      texte:
        "De l'eau, de la [glycérine](/i/glycerin) et des céramides. La liste INCI, c'est la liste officielle des ingrédients, écrite du plus dosé au moins dosé. Dans la Crème Hydratante Visage, on lit d'abord l'eau, la glycérine et une huile légère. Puis vient la [niacinamide](/blog/niacinamide) en 4e place : c'est la vitamine B3, qui aide la peau à garder son eau.",
    },
    {
      type: "p",
      texte:
        "Viennent ensuite les trois céramides : [Ceramide NP](/i/ceramide-np), [Ceramide AP](/i/ceramide-ap) et [Ceramide EOP](/i/ceramide-eop). Les céramides sont des graisses que ta peau fabrique elle-même. Avec le [cholestérol](/i/cholesterol) et des acides gras, elles forment le « ciment » entre les cellules de surface, qui retient l'eau.",
    },
    {
      type: "fiche",
      titre: "Céramide NP",
      inci: "CERAMIDE NP",
      niveau: "prouve",
      effet:
        "Une graisse identique à celles de la couche de surface de la peau. Elle renforce le film qui limite la perte d'eau.",
      statut: "Autorisée dans l'Union européenne comme ingrédient cosmétique.",
    },
    {
      type: "p",
      texte:
        "L'idée vient d'une étude ancienne. Chez l'animal, la barrière de la peau se répare mieux avec ++les trois familles de graisses ensemble++ qu'avec une seule ([Man et al., *Journal of Investigative Dermatology*, 1996](https://doi.org/10.1111/1523-1747.ep12340135)).",
    },
    {
      type: "p",
      texte:
        "Une précision : les céramides arrivent juste avant le [phénoxyéthanol](/i/phenoxyethanol), un conservateur plafonné à 1 % ([règlement (CE) 1223/2009](https://eur-lex.europa.eu/eli/reg/2009/1223/oj)). Elles sont donc peu dosées : ce sont des renforts. ++Le gros du travail, c'est la glycérine++, en 2e place.",
    },

    { type: "h2", texte: "Pourquoi les versions « Intensif » ont une moins bonne note ?" },
    {
      type: "p",
      texte:
        "Parce que leur liste est presque deux fois plus longue. Le Lait Hydratant Intensif passe de 25 à 45 ingrédients. Il gagne du beurre de karité et des humectants, des ingrédients qui attirent l'eau et la gardent dans la peau.",
    },
    {
      type: "p",
      texte:
        "Mais il gagne aussi des émulsifiants de la famille des PEG, comme le [PEG-100 Stearate](/i/peg-100-stearate). Un émulsifiant mélange l'eau et l'huile. Les PEG sont fabriqués par un procédé polluant appelé éthoxylation, et la base les classe orange pour ça. S'y ajoutent des polymères de synthèse et un dérivé de l'urée, l'[Hydroxyethyl Urea](/i/hydroxyethyl-urea), lui aussi orange.",
    },
    {
      type: "p",
      texte:
        "Résultat : 4 points de moins. ++Ça ne veut pas dire qu'ils hydratent moins++. Pour une peau du corps très sèche en plein hiver, à Montréal comme à Lausanne, leur texture riche peut être la bonne. La note lit la formule, pas le confort.",
    },

    { type: "h2", texte: "Et les crèmes CeraVe avec SPF, elles protègent vraiment ?" },
    {
      type: "p",
      texte:
        "Pas toujours autant que promis. En octobre 2026, Test-Achats a mesuré la Crème hydratante visage SPF 50 en laboratoire. ==Sa protection correspond plutôt à un SPF 20==, et le test la déconseille ([Test-Achats, 08/10/2026](https://www.test-achats.be/sante/sante-au-quotidien/creme-de-jour/news/test-cremes-hydratantes-de-jour-spf)). Un autre lot peut faire mieux, mais ++une crème de jour ne remplace pas une crème solaire++ au soleil.",
    },
    {
      type: "p",
      texte:
        "Côté note Cosme Check, leurs points perdus viennent surtout des filtres solaires. La SPF 50 contient quatre filtres organiques, dont l'[avobenzone](/i/butyl-methoxydibenzoylmethane) (nom INCI : Butyl Methoxydibenzoylmethane), classés orange par la base. Tous sont autorisés en Europe, à des doses plafonnées par l'annexe VI du règlement 1223/2009.",
    },
    {
      type: "p",
      texte:
        "Le SPF, c'est l'indice de protection contre les coups de soleil. On en met souvent trop peu pour l'atteindre : les [7 erreurs qui divisent ton SPF](/blog/spf-50-visage-7-erreurs) donnent la bonne dose.",
    },
    {
      type: "cta",
      texte:
        "**Ta crème CeraVe, c'est laquelle ?** Scanne son code-barres avec Cosme Check : tu vois sa liste, la couleur de chaque ingrédient et sa note en dix secondes.",
    },

    { type: "h2", texte: "Le baume CeraVe, on peut le mettre sur le visage ?" },
    {
      type: "p",
      texte:
        "Oui, la marque le vend pour le visage et le corps. Mais le Baume Hydratant contient de la vaseline ([Petrolatum](/i/petrolatum)) en 7e place. C'est un occlusif : il couvre la peau et l'empêche de perdre son eau. Une revue scientifique en fait l'un des plus efficaces ([Purnamawati et al., 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5849435/)).",
    },
    {
      type: "liste",
      style: "coches",
      items: [
        "Peau sèche qui tire en hiver : le Baume, en fine couche le soir. Le [guide de la peau sèche](/blog/peau-seche-visage) explique comment l'ajouter à ta routine.",
        "Peau normale à sèche, le jour : la Crème Hydratante Visage, plus légère, avec la niacinamide.",
        "Peau qui brille vite : le Gel-crème Oil Control, la mieux notée des huit, sans vaseline.",
        "Corps : le Lait Hydratant fait le même travail que le Baume, en plus fluide.",
      ],
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Peau à boutons : évite le Baume sur le visage, un occlusif épais ne va pas à toutes les peaux. Lis ce que veut dire [« comédogène »](/blog/comedogene).",
        "Ne superpose pas deux crèmes CeraVe le même matin : une seule suffit, puis la crème solaire. L'[ordre de la routine](/blog/routine-skincare) tient en quatre gestes.",
        "Rougeurs, brûlures ou plaques qui ne partent pas : arrête et demande conseil à ton pharmacien ou à un dermatologue.",
      ],
    },

    { type: "h2", texte: "Que disent les tests de Que Choisir et de Test-Achats ?" },
    {
      type: "p",
      texte:
        "Les deux associations ont testé des CeraVe, mais leurs notes complètes sont réservées aux abonnés. Voici ce qu'on peut lire librement.",
    },
    {
      type: "liste",
      style: "puces",
      items: [
        "**Que Choisir** a testé le Lait Hydratant parmi 16 laits pour le corps, en mars 2025. Sa note n'est pas publique ([Que Choisir, 2025](https://www.quechoisir.org/comparatif-laits-corporels-n613/cerave-lait-hydratant-p277956/)).",
        "**Test-Achats** place la Lotion hydratante visage 5e sur 13 pour l'avis des testeuses. C'est la seule crème du test qui imprime sa liste INCI sur le tube.",
        "Le même test juge la mention « non comédogène » sans fondement clinique. Voir [ce que veut dire « comédogène »](/blog/comedogene).",
      ],
    },
    {
      type: "p",
      texte:
        "La note Cosme Check, elle, est gratuite et lit la liste de ton pot : un regard différent, qui complète ces tests.",
    },

    { type: "h2", texte: "CeraVe, c'est une bonne marque ?" },
    {
      type: "p",
      texte:
        "Sur la composition, plutôt oui, et un chiffre le montre. Notre base compte ==343 produits CeraVe, et un seul contient du parfum==. Pour comparer : parmi les produits « peau sèche » de toutes marques, [trois sur quatre sont parfumés](/blog/peau-seche-visage). Et 337 des 343 contiennent des céramides : la promesse du nom est tenue.",
    },
    {
      type: "p",
      texte:
        "CeraVe est une marque américaine, rachetée par le groupe français L'Oréal en 2017 ([communiqué de L'Oréal](https://www.loreal-finance.com/eng/news-release/loreal-signs-agreement-valeant-acquire-cerave-and-two-other-brands)). Elle est vendue en pharmacie en France, en Belgique et en Suisse, et chez Jean Coutu ou Pharmaprix au Québec.",
    },
    {
      type: "p",
      texte:
        "Le geste à garder pour la fin : ++devant le rayon, lis le mot « Intensif » comme un signal++. Il annonce une liste plus longue, pas une formule meilleure. Si ta peau n'est pas très sèche, la version de base fait le travail avec moins d'ingrédients. Pour aller plus loin, compare avec [les meilleures crèmes hydratantes visage](/blog/meilleures-cremes-hydratantes-visage) ou les [crèmes réparatrices](/blog/cremes-hydratantes-reparatrices).",
    },
  ],
  faq: [
    {
      question: "CeraVe est-il un bon produit ?",
      reponse:
        "Sur la composition, oui pour les formules de base : la Crème Hydratante Visage, le Lait et le Baume Hydratant ont entre 12,09 et 12,17 sur 20 dans Cosme Check. Sur 343 produits CeraVe de notre base, un seul contient du parfum. Les versions Intensif et avec SPF descendent sous 8, à cause de listes plus longues.",
    },
    {
      question: "Quelle crème CeraVe pour peau grasse ?",
      reponse:
        "Le Gel-crème Hydratant Oil Control, pensé pour les peaux mixtes à grasses. C'est aussi la crème hydratante CeraVe la mieux notée de notre relevé, à 12,34 sur 20, avec la niacinamide en 2e place et sans vaseline. Évite le Baume Hydratant sur le visage si ta peau brille vite ou fait des boutons.",
    },
    {
      question: "Peut-on mettre le baume hydratant CeraVe sur le visage ?",
      reponse:
        "Oui, la marque le vend pour le visage et le corps. Il contient de la vaseline, qui couvre la peau et garde son eau : c'est utile pour une peau sèche qui tire, surtout le soir en hiver. Sur une peau grasse ou à boutons, préfère le Gel-crème Oil Control, plus léger.",
    },
    {
      question: "Que dit Que Choisir de CeraVe ?",
      reponse:
        "Que Choisir a testé le Lait Hydratant CeraVe parmi 16 laits pour le corps en mars 2025, mais sa note est réservée aux abonnés. En Belgique, Test-Achats a mesuré en octobre 2026 la crème visage SPF 50 autour d'un SPF 20 et l'a déconseillée. Les notes Cosme Check des huit crèmes, elles, sont dans cet article.",
    },
  ],
  notes: [
    {
      produit: "CeraVe, Gel-crème Hydratant Oil Control (52 ml)",
      ean: "3337875904513",
      note: 12.34,
      releveeLe: "2026-10-28",
    },
    {
      produit: "CeraVe, Crème hydratante visage peaux normales à sèches (52 ml)",
      ean: "3337875597449",
      note: 12.17,
      releveeLe: "2026-10-28",
    },
    {
      produit: "CeraVe, Lait Hydratant peaux sèches à très sèches (473 ml)",
      ean: "3337875879224",
      note: 12.12,
      releveeLe: "2026-10-28",
    },
    {
      produit: "CeraVe, Baume Hydratant peaux sèches à très sèches (454 g)",
      ean: "3337875597388",
      note: 12.09,
      releveeLe: "2026-10-28",
    },
    {
      produit: "CeraVe, Baume Hydratant Intensif (340 g)",
      ean: "3337875923897",
      note: 7.98,
      releveeLe: "2026-10-28",
    },
    {
      produit: "CeraVe, Crème Hydratante Visage SPF 30 (52 ml)",
      ean: "3337875877053",
      note: 7.87,
      releveeLe: "2026-10-28",
    },
    {
      produit: "CeraVe, Lait Hydratant Intensif (236 ml)",
      ean: "3337875904278",
      note: 7.86,
      releveeLe: "2026-10-28",
    },
    {
      produit: "CeraVe, Crème Hydratante Visage SPF 50 (52 ml)",
      ean: "3337875813815",
      note: 7.85,
      releveeLe: "2026-10-28",
    },
  ],
};

export default article;
